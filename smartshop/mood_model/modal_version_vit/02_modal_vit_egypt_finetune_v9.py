import math
"""
02_modal_vit_egypt_finetune.py

Modal version of 02_colab_vit_egypt_finetune.ipynb.

Training methodology is intentionally preserved:
- person-level 70/15/15 split
- ViT-base loaded from the saved local/Hugging Face folder
- balanced class weights
- Stage 1: classifier head only, 8 epochs, 3e-4 LR
- Stage 2: last 4 ViT blocks + classifier, 12 epochs, 3e-5 LR
- batch size 16, gradient accumulation 2
- cosine scheduler, 10% warmup, weight decay 0.01
- best model selected by validation macro-F1
- FP16 when CUDA is available
- person-level test evaluation
- final Hugging Face model + metrics saved to the Modal Volume

Run:
    modal run 02_modal_vit_egypt_finetune.py

The original Colab notebook is left unchanged.
"""

import modal

# ---------------------------------------------------------------------------
# Modal configuration
# ---------------------------------------------------------------------------

APP_NAME = "vit-egypt-finetune-v9"
VOLUME_NAME = "egypt-vit-data"

DATA_DIR = "/data/egypt_modalink_frames"
BASE_DIR = "/data/models/hugging/vit_base_fer"
OUT_DIR = "/data/models/hugging"
SAVE_DIR = f"{OUT_DIR}/vit_egypt_ft_v9"

# L4 is a good first choice for this ViT-base experiment.
# Change to "T4" if you want to mirror the original Colab hardware.
GPU = "L4"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "torchvision",
        "transformers==4.44.2",
        "accelerate",
        "evaluate",
        "scikit-learn",
        "pandas",
        "pillow",
        "matplotlib",
        "seaborn",
    )
)

app = modal.App(APP_NAME)
volume = modal.Volume.from_name(VOLUME_NAME)

# ---------------------------------------------------------------------------
# Preflight check (no GPU)
# ---------------------------------------------------------------------------

@app.function(
    image=image,
    cpu=2,
    memory=4096,
    timeout=60 * 10,
    volumes={"/data": volume},
)
def preflight():
    import pandas as pd
    from pathlib import Path
    import torch
    import torchvision
    import transformers
    from transformers import AutoModelForImageClassification

    frames_root = Path(DATA_DIR)
    base_dir = Path(BASE_DIR)

    print("=" * 80)
    print("Modal preflight check (no GPU)")
    print("V9 COMPATIBILITY SCRIPT: Transformers 4.44.2 + ViT layout checks")
    print("=" * 80)

    assert frames_root.exists(), f"Missing dataset directory: {frames_root}"
    manifest_path = frames_root / "manifest.csv"
    assert manifest_path.exists(), f"Missing manifest: {manifest_path}"

    assert base_dir.exists(), f"Missing model directory: {base_dir}"
    assert (base_dir / "config.json").exists(), "Missing config.json"
    assert (base_dir / "model.safetensors").exists(), "Missing model.safetensors"
    assert (base_dir / "preprocessor_config.json").exists(), (
        "Missing preprocessor_config.json"
    )

    print(f"PyTorch version: {torch.__version__}")
    print(f"Torchvision version: {torchvision.__version__}")
    print(f"Transformers version: {transformers.__version__}")
    assert transformers.__version__.startswith("4.44."), (
        "v9 requires Transformers 4.44.x; got " + transformers.__version__
    )

    # CPU-only checkpoint compatibility test. This catches architecture or
    # weight-loading problems before a GPU training job is started.
    _, loading_info = AutoModelForImageClassification.from_pretrained(
        str(base_dir),
        output_loading_info=True,
    )
    missing_keys = list(loading_info.get("missing_keys", []))
    backbone_missing = [
        k for k in missing_keys
        if k.startswith("vit.") and not k.startswith("vit.classifier")
    ]
    print("preflight backbone missing keys:", len(backbone_missing))
    if backbone_missing:
        print("First missing backbone keys:")
        for k in backbone_missing[:10]:
            print(" -", k)
        raise RuntimeError(
            "Base ViT checkpoint does not load completely under Transformers "
            "4.44.2. Stop here and re-export/fix the base model rather than "
            "starting a GPU run with random backbone weights."
        )
    print("preflight model weight check: PASSED")

    manifest = pd.read_csv(manifest_path)
    print("manifest rows:", len(manifest))
    print("columns:", list(manifest.columns))

    path_col = next(
        (
            c for c in
            ["image_path", "rel_path", "frame_path", "path", "filepath"]
            if c in manifest.columns
        ),
        None,
    )
    assert path_col is not None, (
        "Could not find an image-path column in manifest.csv"
    )

    # Build a filename index once. This provides a safe fallback if the
    # directory portion in the old Colab manifest differs from the extracted
    # directory names stored in the Modal Volume.
    file_index = {}
    for fp in frames_root.rglob("*"):
        if fp.is_file():
            file_index.setdefault(fp.name, []).append(fp)

    # The manifest encodes each image_path as:
    #   <dataset>/<emotion>/<video-folder>/<video-prefix>_|<image-suffix>
    #
    # The extracted Modal dataset uses the actual image filename:
    #   <video-prefix>__<speaker>__<emotion>__<segment>__<frame>.jpg
    #
    # Example:
    #   manifest:
    #     .../disgust/videoplayback (141)__SPEAKER_01/videoplayback_141_|SPEAKER_01__disgust__seg4__f000.jpg
    #   actual:
    #     .../disgust/videoplayback (141)__SPEAKER_01/videoplayback_141__SPEAKER_01__disgust__seg4__f000.jpg
    #
    # We therefore reconstruct the actual extracted filename from the two
    # pieces in the manifest. A filename index remains as a final fallback.

    file_index = {}
    for fp in frames_root.rglob("*"):
        if fp.is_file():
            file_index.setdefault(fp.name, []).append(fp)

    def resolve_path(p):
        raw = str(p).replace("\\", "/")

        if "|" in raw:
            folder_part, suffix = raw.rsplit("|", 1)
            folder_part = folder_part.rstrip("/")
            suffix = suffix.lstrip("/")

            # Old Colab prefix -> relative dataset path.
            marker = "/egypt_modalink_frames_v3/"
            if marker in folder_part:
                relative_folder = folder_part.split(marker, 1)[1]
            else:
                old1 = "/content/drive/MyDrive/MasterData/egypt_modalink_frames_v3/"
                old2 = "/content/drive/My Drive/MasterData/egypt_modalink_frames_v3/"
                if folder_part.startswith(old1):
                    relative_folder = folder_part[len(old1):]
                elif folder_part.startswith(old2):
                    relative_folder = folder_part[len(old2):]
                else:
                    relative_folder = folder_part.lstrip("/")

            # The last component is the prefix ending in "_", e.g.
            # videoplayback_141_. Remove that delimiter and join with "__".
            prefix = Path(relative_folder).name
            parent_folder = Path(relative_folder).parent
            if prefix.endswith("_"):
                actual_name = prefix[:-1] + "__" + suffix
                candidate = frames_root / parent_folder / actual_name
            else:
                candidate = frames_root / relative_folder / suffix

            if candidate.exists():
                return candidate

            # Also try the literal reconstructed form in case the uploaded
            # filename uses a single underscore.
            candidate2 = frames_root / parent_folder / (prefix + suffix)
            if candidate2.exists():
                return candidate2

            # Final fallback by unique filename.
            matches = file_index.get(actual_name, [])
            if len(matches) == 1:
                return matches[0]

            return candidate

        # Non-pipe paths: translate old Drive prefix normally.
        old = "/content/drive/MyDrive/MasterData/egypt_modalink_frames_v3/"
        old2 = "/content/drive/My Drive/MasterData/egypt_modalink_frames_v3/"
        if raw.startswith(old):
            return frames_root / raw[len(old):]
        if raw.startswith(old2):
            return frames_root / raw[len(old2):]
        if "/egypt_modalink_frames_v3/" in raw:
            return frames_root / raw.split("/egypt_modalink_frames_v3/", 1)[1]
        return frames_root / raw.lstrip("/")

    resolved = manifest[path_col].map(resolve_path)
    existing = resolved.map(lambda p: p.exists())

    print("image path column:", path_col)
    print("existing image files:", int(existing.sum()), "/", len(existing))
    print("missing image files:", int((~existing).sum()))
    print("example manifest path:", manifest[path_col].iloc[0])
    print("example resolved path:", resolved.iloc[0])
    print("example resolved exists:", resolved.iloc[0].exists())

    if (~existing).any():
        print("First missing paths:")
        for p in manifest.loc[~existing, path_col].head(10):
            print(" -", p)

    print("model files: OK")
    print("dataset: OK" if existing.all() else "dataset: PATH CHECK NEEDED")

    if not existing.all():
        print("\nUnique filename fallback diagnostics:")
        missing_rows = manifest.loc[~existing, path_col].head(10)
        for raw_path in missing_rows:
            filename = str(raw_path).rsplit("|", 1)[-1]
            matches = file_index.get(filename, [])
            print(f" - {filename!r}: {len(matches)} match(es)")
        raise RuntimeError(
            "Some manifest image paths do not resolve inside the Modal Volume."
        )

    print("=" * 80)
    print("PREFLIGHT PASSED")
    print("=" * 80)


# ---------------------------------------------------------------------------
# Training function
# ---------------------------------------------------------------------------

@app.function(
    image=image,
    gpu=GPU,
    cpu=4,
    memory=16384,
    timeout=60 * 60 * 12,
    volumes={"/data": volume},
)
def train():
    import json
    import random
    from collections import Counter
    from pathlib import Path

    import matplotlib.pyplot as plt
    import numpy as np
    import pandas as pd
    import seaborn as sns
    import torch
    from PIL import Image
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
        confusion_matrix,
        f1_score,
    )
    from sklearn.model_selection import train_test_split
    from sklearn.utils.class_weight import compute_class_weight
    from torch.utils.data import Dataset
    from transformers import (
        AutoImageProcessor,
        AutoModelForImageClassification,
        Trainer,
        TrainingArguments,
        set_seed,
    )

    # -----------------------------------------------------------------------
    # Original notebook configuration
    # -----------------------------------------------------------------------

    FRAMES_ROOT = Path(DATA_DIR)
    BASE_DIR_PATH = Path(BASE_DIR)
    OUT_DIR_PATH = Path(OUT_DIR)
    SAVE_DIR_PATH = Path(SAVE_DIR)

    BATCH_SIZE = 16
    GRAD_ACCUM = 2
    SEED = 42
    TRAIN_RATIO, VAL_RATIO = 0.70, 0.15

    STAGE1_EPOCHS = 8
    STAGE2_EPOCHS = 12
    LR_HEAD = 3e-4
    LR_FT = 3e-5
    WARMUP_RATIO = 0.1
    UNFREEZE_LAST_N_BLOCKS = 4

    USE_BALANCED_CLASS_WEIGHT = True

    # -----------------------------------------------------------------------
    # Basic checks
    # -----------------------------------------------------------------------

    print("=" * 80)
    print("Modal ViT Egypt fine-tuning")
    print("=" * 80)
    print("GPU:", GPU)
    print("CUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("CUDA device:", torch.cuda.get_device_name(0))
        print("CUDA capability:", torch.cuda.get_device_capability(0))

    print("FRAMES_ROOT:", FRAMES_ROOT)
    print("BASE_DIR:", BASE_DIR_PATH)
    print("SAVE_DIR:", SAVE_DIR_PATH)

    assert FRAMES_ROOT.exists(), f"Frames folder not found: {FRAMES_ROOT}"
    assert (FRAMES_ROOT / "manifest.csv").exists(), (
        f"Missing manifest.csv under {FRAMES_ROOT}"
    )
    assert BASE_DIR_PATH.exists(), f"Missing saved model: {BASE_DIR_PATH}"
    assert (BASE_DIR_PATH / "config.json").exists(), (
        f"Incomplete model folder: {BASE_DIR_PATH}"
    )

    OUT_DIR_PATH.mkdir(parents=True, exist_ok=True)

    set_seed(SEED)
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(SEED)

    # -----------------------------------------------------------------------
    # Load manifest + person-level split
    # -----------------------------------------------------------------------

    manifest = pd.read_csv(FRAMES_ROOT / "manifest.csv")
    print("manifest rows:", len(manifest))
    print("columns:", list(manifest.columns))
    print(manifest.head(3))

    def pick_col(df, options):
        for c in options:
            if c in df.columns:
                return c
        raise KeyError(
            f"None of {options} in columns={list(df.columns)}"
        )

    EMOTION_COL = pick_col(manifest, ["emotion", "label", "class"])
    PATH_COL = pick_col(
        manifest,
        ["image_path", "rel_path", "frame_path", "path", "filepath"],
    )
    PERSON_COL = pick_col(
        manifest,
        ["person_id", "person_key", "person"],
    )

    df = manifest.copy()
    df["emotion"] = (
        df[EMOTION_COL].astype(str).str.strip().str.lower()
    )
    df = df[
        ~df["emotion"].isin(
            ["nan", "none", "", "ambiguous", "unknown"]
        )
    ].copy()

    ALIAS = {
        "anger": "anger",
        "angry": "anger",
        "disgust": "disgust",
        "fear": "fear",
        "happiness": "happy",
        "happy": "happy",
        "neutral": "neutral",
        "sadness": "sad",
        "sad": "sad",
        "surprise": "surprise",
    }

    df["emotion"] = df["emotion"].map(lambda x: ALIAS.get(x, x))

    # Build a filename index once for robust fallback resolution.
    file_index = {}
    for fp in FRAMES_ROOT.rglob("*"):
        if fp.is_file():
            file_index.setdefault(fp.name, []).append(fp)

    # Reconstruct the actual extracted image filename from the manifest's
    # pipe-delimited folder/prefix + suffix representation.
    file_index = {}
    for fp in FRAMES_ROOT.rglob("*"):
        if fp.is_file():
            file_index.setdefault(fp.name, []).append(fp)

    def resolve_path(p):
        raw = str(p).replace("\\", "/")

        if "|" in raw:
            folder_part, suffix = raw.rsplit("|", 1)
            folder_part = folder_part.rstrip("/")
            suffix = suffix.lstrip("/")

            marker = "/egypt_modalink_frames_v3/"
            if marker in folder_part:
                relative_folder = folder_part.split(marker, 1)[1]
            else:
                old = "/content/drive/MyDrive/MasterData/egypt_modalink_frames_v3/"
                old2 = "/content/drive/My Drive/MasterData/egypt_modalink_frames_v3/"
                if folder_part.startswith(old):
                    relative_folder = folder_part[len(old):]
                elif folder_part.startswith(old2):
                    relative_folder = folder_part[len(old2):]
                else:
                    relative_folder = folder_part.lstrip("/")

            prefix = Path(relative_folder).name
            parent_folder = Path(relative_folder).parent

            if prefix.endswith("_"):
                actual_name = prefix[:-1] + "__" + suffix
                candidate = FRAMES_ROOT / parent_folder / actual_name
            else:
                actual_name = prefix + suffix
                candidate = FRAMES_ROOT / relative_folder / suffix

            if candidate.exists():
                return candidate

            candidate2 = FRAMES_ROOT / parent_folder / (prefix + suffix)
            if candidate2.exists():
                return candidate2

            matches = file_index.get(actual_name, [])
            if len(matches) == 1:
                return matches[0]

            return candidate

        old = "/content/drive/MyDrive/MasterData/egypt_modalink_frames_v3/"
        old2 = "/content/drive/My Drive/MasterData/egypt_modalink_frames_v3/"
        if raw.startswith(old):
            return FRAMES_ROOT / raw[len(old):]
        if raw.startswith(old2):
            return FRAMES_ROOT / raw[len(old2):]
        if "/egypt_modalink_frames_v3/" in raw:
            return FRAMES_ROOT / raw.split("/egypt_modalink_frames_v3/", 1)[1]
        return FRAMES_ROOT / raw.lstrip("/")

    df["abs_path"] = df[PATH_COL].map(resolve_path)

    missing = ~df["abs_path"].map(lambda p: Path(p).exists())
    missing_count = int(missing.sum())
    if missing_count:
        print(f"Warning: dropping {missing_count} manifest rows with missing files")
        print(df.loc[missing, [PATH_COL]].head(10).to_string(index=False))

    df = df[~missing].copy()

    print("usable frames:", len(df))
    print("class counts:\n", df["emotion"].value_counts())
    print("unique persons:", df[PERSON_COL].nunique())

    # Convert Arrow-backed pandas values to a plain NumPy/object array before
    # passing them to sklearn. With pandas dtype_backend="pyarrow", .unique()
    # can return an ArrowExtensionArray, which sklearn cannot index with its
    # NumPy train/test index arrays.
    persons = df[PERSON_COL].astype("string").dropna().unique().tolist()
    persons = np.asarray(persons, dtype=object)

    train_p, temp_p = train_test_split(
        persons,
        train_size=TRAIN_RATIO,
        random_state=SEED,
    )
    val_frac = VAL_RATIO / (1 - TRAIN_RATIO)
    val_p, test_p = train_test_split(
        temp_p,
        train_size=val_frac,
        random_state=SEED,
    )

    split_map = {
        **{p: "train" for p in train_p},
        **{p: "val" for p in val_p},
        **{p: "test" for p in test_p},
    }
    df["split"] = df[PERSON_COL].astype("string").map(split_map)

    for s in ["train", "val", "test"]:
        sub = df[df["split"] == s]
        print(
            f"{s}: frames={len(sub)} "
            f"persons={sub[PERSON_COL].nunique()} "
            f"classes={sub['emotion'].value_counts().to_dict()}"
        )

    assert set(
        df.loc[df.split == "train", PERSON_COL]
    ).isdisjoint(
        df.loc[df.split == "test", PERSON_COL]
    )
    print("Person leakage check: OK")

    # Save the exact split used for this run for reproducibility.
    split_path = OUT_DIR_PATH / "egypt_ft_split_manifest.csv"
    df.to_csv(split_path, index=False)
    print("Saved split manifest:", split_path)

    # -----------------------------------------------------------------------
    # Load saved ViT + processor
    # -----------------------------------------------------------------------

    print("Loading saved starting model from:", BASE_DIR_PATH)
    import torchvision
    print(f"PyTorch version: {torch.__version__}")
    print(f"Torchvision version: {torchvision.__version__}")
    import transformers
    print(f"Transformers version: {transformers.__version__}")
    if not transformers.__version__.startswith("4.44."):
        raise RuntimeError(
            f"Unexpected Transformers version {transformers.__version__}; "
            "v9 requires 4.44.x for the saved ViT checkpoint layout."
        )

    processor = AutoImageProcessor.from_pretrained(str(BASE_DIR_PATH))
    loaded = AutoModelForImageClassification.from_pretrained(
        str(BASE_DIR_PATH),
        output_loading_info=True,
    )
    if not isinstance(loaded, tuple) or len(loaded) != 2:
        raise RuntimeError(
            "Unexpected output from from_pretrained(output_loading_info=True)."
        )
    model, loading_info = loaded

    missing_keys = list(loading_info.get("missing_keys", []))
    unexpected_keys = list(loading_info.get("unexpected_keys", []))
    error_msgs = list(loading_info.get("error_msgs", []))
    backbone_missing = [
        k for k in missing_keys
        if k.startswith("vit.") and not k.startswith("vit.classifier")
    ]

    print("Model loading diagnostics:")
    print("  missing keys:", len(missing_keys))
    print("  unexpected keys:", len(unexpected_keys))
    print("  backbone missing keys:", len(backbone_missing))
    if backbone_missing:
        for k in backbone_missing[:10]:
            print("   -", k)
    if error_msgs:
        for msg in error_msgs[:10]:
            print("   LOAD ERROR:", msg)

    if backbone_missing:
        raise RuntimeError(
            "ViT backbone weights did not load from the saved starting model. "
            "Training would otherwise use a random backbone. The v9 image pins "
            "Transformers 4.44.2 to match the standard ViT checkpoint layout. "
            "If this persists, the saved base model must be re-exported with "
            "compatible Hugging Face weights."
        )

    print("ViT backbone weight check: PASSED")

    id2label = {int(k): v for k, v in model.config.id2label.items()}
    label2id = {v: int(k) for k, v in id2label.items()}
    CLASS_NAMES = [id2label[i] for i in range(len(id2label))]

    print("CLASS_NAMES (from saved config):", CLASS_NAMES)

    df = df[df["emotion"].isin(CLASS_NAMES)].copy()
    df["y"] = df["emotion"].map(label2id)
    assert df["y"].notna().all()

    y_train = df.loc[df["split"] == "train", "y"].values
    counts = Counter(y_train.tolist())

    print("Train class counts:")
    for i, name in enumerate(CLASS_NAMES):
        print(f"  {name:10s}: {counts.get(i, 0)}")

    CLASS_WEIGHT = None
    class_weight_tensor = None

    if USE_BALANCED_CLASS_WEIGHT:
        base = compute_class_weight(
            "balanced",
            classes=np.arange(len(CLASS_NAMES)),
            y=y_train,
        )
        CLASS_WEIGHT = {
            int(i): float(w) for i, w in enumerate(base)
        }
        class_weight_tensor = torch.tensor(
            [CLASS_WEIGHT[i] for i in range(len(CLASS_NAMES))],
            dtype=torch.float,
        )
        print("Using sklearn balanced CLASS_WEIGHT:", CLASS_WEIGHT)
    else:
        print("No class_weight")

    # -----------------------------------------------------------------------
    # Dataset
    # -----------------------------------------------------------------------

    class FrameDataset(Dataset):
        def __init__(self, frame_df, processor, augment=False):
            self.paths = frame_df["abs_path"].astype(str).tolist()
            self.ys = frame_df["y"].astype(int).tolist()
            self.processor = processor
            self.augment = augment

        def __len__(self):
            return len(self.paths)

        def __getitem__(self, idx):
            img = Image.open(self.paths[idx]).convert("RGB")

            if self.augment:
                if random.random() < 0.5:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)

                if random.random() < 0.5:
                    from PIL import ImageEnhance
                    img = ImageEnhance.Brightness(img).enhance(
                        random.uniform(0.85, 1.15)
                    )

                if random.random() < 0.5:
                    from PIL import ImageEnhance
                    img = ImageEnhance.Contrast(img).enhance(
                        random.uniform(0.85, 1.15)
                    )

            enc = self.processor(
                images=img,
                return_tensors="pt",
            )

            return {
                "pixel_values": enc["pixel_values"].squeeze(0),
                "labels": self.ys[idx],
            }

    train_ds = FrameDataset(
        df[df.split == "train"],
        processor,
        augment=True,
    )
    val_ds = FrameDataset(
        df[df.split == "val"],
        processor,
        augment=False,
    )
    test_ds = FrameDataset(
        df[df.split == "test"],
        processor,
        augment=False,
    )

    print(
        "sizes:",
        len(train_ds),
        len(val_ds),
        len(test_ds),
    )

    # -----------------------------------------------------------------------
    # Metrics + weighted Trainer + freeze/unfreeze
    # -----------------------------------------------------------------------

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": float(
                accuracy_score(labels, preds)
            ),
            "macro_f1": float(
                f1_score(
                    labels,
                    preds,
                    average="macro",
                    zero_division=0,
                )
            ),
        }

    class WeightedTrainer(Trainer):
        def __init__(self, class_weights=None, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.class_weights = class_weights

        def compute_loss(
            self,
            model,
            inputs,
            return_outputs=False,
            **kwargs,
        ):
            labels = inputs.pop("labels")
            outputs = model(**inputs)
            logits = outputs.logits

            if self.class_weights is not None:
                weight = self.class_weights.to(logits.device)
                loss_fct = torch.nn.CrossEntropyLoss(weight=weight)
            else:
                loss_fct = torch.nn.CrossEntropyLoss()

            loss = loss_fct(
                logits.view(-1, model.config.num_labels),
                labels.view(-1),
            )
            return (
                (loss, outputs)
                if return_outputs
                else loss
            )

    def freeze_backbone(m):
        for name, param in m.named_parameters():
            param.requires_grad = (
                name.startswith("classifier")
                or ".classifier." in name
            )

        for p in m.classifier.parameters():
            p.requires_grad = True

    def get_vit_blocks(m):
        """Return transformer blocks for old and new Hugging Face ViT layouts."""
        vit = getattr(m, "vit", None)
        if vit is None:
            raise RuntimeError(
                "Loaded model has no .vit backbone; "
                f"model type is {type(m).__name__}."
            )

        encoder = getattr(vit, "encoder", None)
        if encoder is not None and hasattr(encoder, "layer"):
            return encoder.layer, "vit.encoder.layer"

        layers = getattr(vit, "layers", None)
        if layers is not None:
            return layers, "vit.layers"

        raise RuntimeError(
            "Unsupported ViT backbone layout. Expected vit.encoder.layer or vit.layers."
        )

    def unfreeze_last_n_blocks(m, n_blocks=4):
        freeze_backbone(m)
        blocks, block_path = get_vit_blocks(m)
        n_layers = len(blocks)
        if n_layers == 0:
            raise RuntimeError("ViT backbone contains zero transformer blocks.")

        n_blocks = min(int(n_blocks), n_layers)
        start = n_layers - n_blocks
        for i in range(start, n_layers):
            for p in blocks[i].parameters():
                p.requires_grad = True

        for norm_name in ("layernorm", "layer_norm", "post_layernorm"):
            norm = getattr(m.vit, norm_name, None)
            if norm is not None:
                for p in norm.parameters():
                    p.requires_grad = True
                print(f"Unfroze final norm: vit.{norm_name}")

        print(
            f"ViT compatibility: using {block_path}; "
            f"unfroze last {n_blocks} of {n_layers} blocks + classifier"
        )

    def count_trainable(m):
        trainable = sum(
            p.numel()
            for p in m.parameters()
            if p.requires_grad
        )
        all_params = sum(p.numel() for p in m.parameters())
        print(
            f"trainable params: {trainable:,} / "
            f"{all_params:,}"
        )

    def make_training_args(output_dir, epochs, lr, train_size):
        # Build TrainingArguments in a version-compatible way.
        # Some Transformers releases do not expose warmup_ratio and/or
        # use evaluation_strategy instead of eval_strategy.
        import inspect

        supported = set(inspect.signature(TrainingArguments.__init__).parameters)

        common = dict(
            output_dir=str(output_dir),
            per_device_train_batch_size=BATCH_SIZE,
            per_device_eval_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUM,
            num_train_epochs=epochs,
            learning_rate=lr,
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="macro_f1",
            greater_is_better=True,
            logging_steps=20,
            report_to="none",
            fp16=torch.cuda.is_available(),
            seed=SEED,
            remove_unused_columns=False,
        )

        # Prefer warmup_ratio when the installed Transformers supports it.
        # Otherwise convert the requested ratio to an explicit warmup_steps.
        if "warmup_ratio" in supported:
            common["warmup_ratio"] = WARMUP_RATIO
        elif "warmup_steps" in supported:
            steps_per_epoch = max(
                1,
                math.ceil(
                    train_size
                    / max(1, BATCH_SIZE * GRAD_ACCUM)
                ),
            )
            common["warmup_steps"] = max(
                1,
                int(round(steps_per_epoch * epochs * WARMUP_RATIO)),
            )

        # Evaluation argument name changed across Transformers versions.
        if "eval_strategy" in supported:
            common["eval_strategy"] = "epoch"
        elif "evaluation_strategy" in supported:
            common["evaluation_strategy"] = "epoch"

        # Keep only arguments accepted by the installed version.
        filtered = {
            key: value
            for key, value in common.items()
            if key in supported
        }

        print(
            "TrainingArguments compatibility: "
            f"warmup={'warmup_ratio' if 'warmup_ratio' in filtered else 'warmup_steps' if 'warmup_steps' in filtered else 'disabled'}, "
            f"evaluation={'eval_strategy' if 'eval_strategy' in filtered else 'evaluation_strategy' if 'evaluation_strategy' in filtered else 'disabled'}"
        )

        return TrainingArguments(**filtered)

    def latest_checkpoint(output_dir):
        output_dir = Path(output_dir)
        checkpoints = sorted(
            output_dir.glob("checkpoint-*"),
            key=lambda p: int(p.name.split("-")[-1]),
        )
        return checkpoints[-1] if checkpoints else None

    # -----------------------------------------------------------------------
    # Stage 1 — freeze backbone, train classifier head
    # -----------------------------------------------------------------------

    stage1_dir = OUT_DIR_PATH / "ckpt_stage1_v9"
    freeze_backbone(model)
    count_trainable(model)

    args1 = make_training_args(
        stage1_dir,
        STAGE1_EPOCHS,
        LR_HEAD,
        len(train_ds),
    )

    trainer1 = WeightedTrainer(
        class_weights=class_weight_tensor,
        model=model,
        args=args1,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    print("Stage 1: head only")

    ckpt1 = latest_checkpoint(stage1_dir)
    if ckpt1 is not None:
        print("Resuming Stage 1 from:", ckpt1)
        trainer1.train(resume_from_checkpoint=str(ckpt1))
    else:
        trainer1.train()

    print("Stage 1 val:", trainer1.evaluate())

    # -----------------------------------------------------------------------
    # Stage 2 — unfreeze last N ViT blocks
    # -----------------------------------------------------------------------

    unfreeze_last_n_blocks(
        model,
        UNFREEZE_LAST_N_BLOCKS,
    )
    count_trainable(model)

    stage2_dir = OUT_DIR_PATH / "ckpt_stage2_v9"
    args2 = make_training_args(
        stage2_dir,
        STAGE2_EPOCHS,
        LR_FT,
        len(train_ds),
    )

    trainer2 = WeightedTrainer(
        class_weights=class_weight_tensor,
        model=model,
        args=args2,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics,
    )

    print("Stage 2: fine-tune last blocks")

    ckpt2 = latest_checkpoint(stage2_dir)
    if ckpt2 is not None:
        print("Resuming Stage 2 from:", ckpt2)
        trainer2.train(resume_from_checkpoint=str(ckpt2))
    else:
        trainer2.train()

    print("Stage 2 val:", trainer2.evaluate())

    # -----------------------------------------------------------------------
    # Person-level TEST evaluation
    # -----------------------------------------------------------------------

    pred_out = trainer2.predict(test_ds)
    y_pred = np.argmax(pred_out.predictions, axis=-1)
    y_true = pred_out.label_ids

    acc = float((y_true == y_pred).mean())
    macro_f1 = float(
        f1_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        )
    )

    report = classification_report(
        y_true,
        y_pred,
        target_names=CLASS_NAMES,
        zero_division=0,
    )

    print(f"TEST accuracy: {acc:.4f}")
    print(f"TEST macro-F1: {macro_f1:.4f}")
    print(report)

    # Save confusion matrix rather than only displaying it.
    cm = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(CLASS_NAMES))),
    )

    cm_path = OUT_DIR_PATH / "egypt_ft_confusion_matrix.png"
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
    )
    plt.title("HF ViT Egypt FT — person-level TEST")
    plt.ylabel("true")
    plt.xlabel("pred")
    plt.tight_layout()
    plt.savefig(cm_path, dpi=200)
    plt.close()

    report_path = OUT_DIR_PATH / "egypt_ft_classification_report.txt"
    report_path.write_text(report)

    # -----------------------------------------------------------------------
    # Save Egypt fine-tuned model + metrics
    # -----------------------------------------------------------------------

    SAVE_DIR_PATH.mkdir(parents=True, exist_ok=True)

    model.save_pretrained(str(SAVE_DIR_PATH))
    processor.save_pretrained(str(SAVE_DIR_PATH))

    print("Saved Egypt FT model →", SAVE_DIR_PATH)

    metrics = {
        "backbone": "ViT-base",
        "stage": "egypt_finetune",
        "format": "huggingface_transformers_pytorch",
        "loaded_from": str(BASE_DIR_PATH),
        "save_dir": str(SAVE_DIR_PATH),
        "image_size": int(
            getattr(model.config, "image_size", 224)
        ),
        "class_names": CLASS_NAMES,
        "frames_root": str(FRAMES_ROOT),
        "test_accuracy": acc,
        "test_macro_f1": macro_f1,
        "class_weight": CLASS_WEIGHT,
        "stage1_epochs": STAGE1_EPOCHS,
        "stage2_epochs": STAGE2_EPOCHS,
        "lr_head": LR_HEAD,
        "lr_ft": LR_FT,
        "unfreeze_last_n_blocks": UNFREEZE_LAST_N_BLOCKS,
        "n_train": int((df.split == "train").sum()),
        "n_val": int((df.split == "val").sum()),
        "n_test": int((df.split == "test").sum()),
        "n_persons_train": int(
            df.loc[df.split == "train", PERSON_COL].nunique()
        ),
        "n_persons_val": int(
            df.loc[df.split == "val", PERSON_COL].nunique()
        ),
        "n_persons_test": int(
            df.loc[df.split == "test", PERSON_COL].nunique()
        ),
        "gpu": GPU,
        "modal_volume": VOLUME_NAME,
        "confusion_matrix": str(cm_path),
        "classification_report": str(report_path),
        "note": (
            "Not a Keras .h5. Compare to EfficientNet Egypt FT; "
            "then wire mood_api if ViT wins."
        ),
    }

    metrics_path = OUT_DIR_PATH / "egypt_ft_metrics.json"
    metrics_path.write_text(
        json.dumps(metrics, indent=2)
    )

    print("Saved:", metrics_path)
    print(json.dumps(metrics, indent=2))

    # Explicit commit so the final model/metrics are durable immediately.
    volume.commit()

    print("=" * 80)
    print("TRAINING COMPLETE")
    print("=" * 80)


@app.local_entrypoint()
def main(check_only: bool = False):
    if check_only:
        print("Running preflight check (no GPU)...")
        preflight.remote()
    else:
        print(f"Starting Modal GPU training on {GPU}...")
        train.remote()
