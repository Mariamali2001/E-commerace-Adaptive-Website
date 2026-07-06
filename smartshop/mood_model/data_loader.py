"""FER2013 dataset loading and baseline preparation utilities."""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

import torch
from torch.utils.data import DataLoader, Subset, random_split
from torchvision import datasets, transforms

try:
    from .utils import EMOTION_ORDER
except ImportError:  # pragma: no cover - allows running file as script
    from utils import EMOTION_ORDER


IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_fer2013_transforms(image_size: int = 224) -> tuple[transforms.Compose, transforms.Compose]:
    """Return train/eval transforms for FER2013 baseline."""
    train_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.Grayscale(num_output_channels=3),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
    return train_transform, eval_transform


def _verify_label_mapping(class_to_idx: dict[str, int]) -> None:
    """Ensure FER folder labels match the locked emotion order."""
    expected = set(EMOTION_ORDER)
    found = set(class_to_idx.keys())
    if expected != found:
        missing = sorted(expected - found)
        unexpected = sorted(found - expected)
        raise ValueError(
            f"FER label mismatch. Missing: {missing}, unexpected: {unexpected}."
        )


def _distribution_from_subset(dataset: datasets.ImageFolder, indices: list[int]) -> dict[str, int]:
    """Compute class distribution for a subset."""
    counts: Counter[str] = Counter()
    idx_to_class = {idx: name for name, idx in dataset.class_to_idx.items()}
    for i in indices:
        _, class_idx = dataset.samples[i]
        counts[idx_to_class[class_idx]] += 1
    return {emotion: counts.get(emotion, 0) for emotion in EMOTION_ORDER}


def _distribution_from_imagefolder(dataset: datasets.ImageFolder) -> dict[str, int]:
    """Compute class distribution for full ImageFolder dataset."""
    counts: Counter[str] = Counter()
    idx_to_class = {idx: name for name, idx in dataset.class_to_idx.items()}
    for _, class_idx in dataset.samples:
        counts[idx_to_class[class_idx]] += 1
    return {emotion: counts.get(emotion, 0) for emotion in EMOTION_ORDER}


def verify_fer2013_labels_and_distribution(
    train_dataset: datasets.ImageFolder,
    val_subset: Subset,
    test_dataset: datasets.ImageFolder,
) -> dict[str, Any]:
    """Verify labels and return class distribution summary."""
    _verify_label_mapping(train_dataset.class_to_idx)
    _verify_label_mapping(test_dataset.class_to_idx)

    val_indices = list(val_subset.indices)
    val_idx_set = set(val_indices)
    train_indices = [idx for idx in range(len(train_dataset)) if idx not in val_idx_set]
    summary = {
        "label_order": EMOTION_ORDER,
        "class_to_idx": train_dataset.class_to_idx,
        "distribution": {
            "train": _distribution_from_subset(train_dataset, train_indices),
            "val": _distribution_from_subset(train_dataset, val_indices),
            "test": _distribution_from_imagefolder(test_dataset),
        },
    }
    return summary


def build_fer2013_dataloaders(config: dict[str, Any]) -> dict[str, Any]:
    """Build FER2013 dataloaders with train/val/test and verification summary.

    Expected directory structure:
    data/fer2013/
      train/angry/*.jpg
      ...
      test/angry/*.jpg
      ...
    """
    image_size = int(config["data"].get("image_size", 224))
    batch_size = int(config["training"].get("batch_size", 16))
    num_workers = int(config["training"].get("num_workers", 0))
    val_split = float(config["data"].get("fer2013_val_split", 0.15))
    dataset_root = Path(config["data"].get("fer2013_root", "data/fer2013"))
    train_dir = dataset_root / "train"
    test_dir = dataset_root / "test"

    if not train_dir.exists() or not test_dir.exists():
        raise FileNotFoundError(
            "FER2013 folders not found. Expected "
            f"'{train_dir}' and '{test_dir}'."
        )

    train_transform, eval_transform = get_fer2013_transforms(image_size=image_size)
    train_dataset_full = datasets.ImageFolder(root=str(train_dir), transform=train_transform)
    train_dataset_for_val = datasets.ImageFolder(root=str(train_dir), transform=eval_transform)
    test_dataset = datasets.ImageFolder(root=str(test_dir), transform=eval_transform)

    val_size = int(len(train_dataset_full) * val_split)
    train_size = len(train_dataset_full) - val_size
    if train_size <= 0 or val_size <= 0:
        raise ValueError("Invalid FER2013 train/val split. Check fer2013_val_split.")

    generator = torch.Generator().manual_seed(int(config["project"].get("seed", 42)))
    train_subset, val_subset_indices = random_split(
        range(len(train_dataset_full)),
        lengths=[train_size, val_size],
        generator=generator,
    )

    train_subset = Subset(train_dataset_full, indices=list(train_subset.indices))
    val_subset = Subset(train_dataset_for_val, indices=list(val_subset_indices.indices))

    train_loader = DataLoader(
        train_subset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=False,
    )
    val_loader = DataLoader(
        val_subset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False,
    )

    summary = verify_fer2013_labels_and_distribution(
        train_dataset=train_dataset_for_val,
        val_subset=val_subset,
        test_dataset=test_dataset,
    )

    return {
        "train_loader": train_loader,
        "val_loader": val_loader,
        "test_loader": test_loader,
        "summary": summary,
    }
