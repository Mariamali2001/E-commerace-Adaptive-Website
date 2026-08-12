# 02_modal_vit_mood_api.py

import io
import os
from typing import Dict

import modal


# ============================================================
# 1. Configuration
# ============================================================

APP_NAME = "vit-egypt-mood-dev"

VOLUME_NAME = "egypt-vit-data"

MODEL_DIR = "/data/models/hugging/vit_egypt_ft_v9"

CLASS_NAMES = [
    "anger",
    "disgust",
    "fear",
    "happy",
    "neutral",
    "sad",
    "surprise",
]


# ============================================================
# 2. Modal container image
# ============================================================

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.8.0",
        "torchvision==0.23.0",
        "transformers==4.55.4",
        "pillow>=10.0",
        "numpy>=1.26",
        "safetensors>=0.4",
        "fastapi>=0.115",
    )
)


# ============================================================
# 3. Modal Volume
# ============================================================

volume = modal.Volume.from_name(
    VOLUME_NAME,
    create_if_missing=False,
)


# ============================================================
# 4. Modal App
# ============================================================

app = modal.App(APP_NAME)


# ============================================================
# 5. Model class
# ============================================================

@app.cls(
    image=image,
    gpu="L4",
    volumes={
        "/data": volume,
    },
    timeout=600,
)
class ViTMoodModel:

    @modal.enter()
    def load_model(self):

        # ----------------------------------------------------
        # IMPORTANT:
        # All ML imports happen INSIDE the Modal container.
        # ----------------------------------------------------

        import torch
        import torchvision
        import transformers

        from transformers import (
            AutoImageProcessor,
            AutoModelForImageClassification,
        )

        self.torch = torch

        print("=" * 70)
        print("LOADING EGYPT ViT MOOD MODEL")
        print("=" * 70)

        # ----------------------------------------------------
        # Environment
        # ----------------------------------------------------

        print()
        print("Environment:")
        print(f"PyTorch:      {torch.__version__}")
        print(f"Torchvision:  {torchvision.__version__}")
        print(f"Transformers: {transformers.__version__}")

        print()
        print(
            f"CUDA available: "
            f"{torch.cuda.is_available()}"
        )

        if torch.cuda.is_available():
            print(
                f"GPU: "
                f"{torch.cuda.get_device_name(0)}"
            )

        # ----------------------------------------------------
        # Check model directory
        # ----------------------------------------------------

        print()
        print("Model directory:")
        print(MODEL_DIR)

        if not os.path.isdir(MODEL_DIR):
            raise RuntimeError(
                f"MODEL DIRECTORY DOES NOT EXIST:\n"
                f"{MODEL_DIR}"
            )

        print("✓ Model directory exists")

        # ----------------------------------------------------
        # List model files
        # ----------------------------------------------------

        files = sorted(
            os.listdir(MODEL_DIR)
        )

        print()
        print("Model files:")

        for filename in files:
            print(f"  - {filename}")

        # ----------------------------------------------------
        # Check required files
        # ----------------------------------------------------

        required_files = [
            "config.json",
        ]

        missing = [
            filename
            for filename in required_files
            if not os.path.exists(
                os.path.join(
                    MODEL_DIR,
                    filename,
                )
            )
        ]

        if missing:
            raise RuntimeError(
                f"Missing required model files: "
                f"{missing}"
            )

        # ----------------------------------------------------
        # Load processor
        # ----------------------------------------------------

        print()
        print("Loading AutoImageProcessor...")

        self.processor = (
            AutoImageProcessor.from_pretrained(
                MODEL_DIR
            )
        )

        print(
            "✓ AutoImageProcessor loaded"
        )

        # ----------------------------------------------------
        # Load model
        # ----------------------------------------------------

        print()
        print(
            "Loading "
            "AutoModelForImageClassification..."
        )

        self.model = (
            AutoModelForImageClassification.from_pretrained(
                MODEL_DIR
            )
        )

        print("✓ Model loaded")

        # ----------------------------------------------------
        # Device
        # ----------------------------------------------------

        self.device = torch.device(
            "cuda"
            if torch.cuda.is_available()
            else "cpu"
        )

        print()
        print(
            f"Using device: {self.device}"
        )

        self.model.to(self.device)
        self.model.eval()

        # ----------------------------------------------------
        # Model configuration
        # ----------------------------------------------------

        print()
        print("Model configuration:")

        print(
            "num_labels:",
            self.model.config.num_labels,
        )

        print(
            "id2label:",
            self.model.config.id2label,
        )

        print(
            "label2id:",
            self.model.config.label2id,
        )

        # ----------------------------------------------------
        # Validate classes
        # ----------------------------------------------------

        num_labels = (
            self.model.config.num_labels
        )

        if num_labels != len(CLASS_NAMES):
            raise RuntimeError(
                f"CLASS MISMATCH\n"
                f"Model labels: {num_labels}\n"
                f"API classes: {len(CLASS_NAMES)}"
            )

        self.class_names = CLASS_NAMES

        # ----------------------------------------------------
        # Parameter information
        # ----------------------------------------------------

        total_params = sum(
            p.numel()
            for p in self.model.parameters()
        )

        print()
        print(
            f"Total parameters: "
            f"{total_params:,}"
        )

        # ----------------------------------------------------
        # Warm-up test
        # ----------------------------------------------------

        print()
        print(
            "Running model initialization test..."
        )

        test_tensor = torch.zeros(
            1,
            3,
            224,
            224,
            device=self.device,
        )

        with torch.no_grad():
            self.model(
                pixel_values=test_tensor
            )

        print(
            "✓ Model warm-up successful"
        )

        print()
        print("=" * 70)
        print("✓ ViT MODEL LOADED SUCCESSFULLY")
        print("=" * 70)

    # ========================================================
    # Prediction
    # ========================================================

    @modal.method()
    def predict_image(
        self,
        image_bytes: bytes,
    ) -> Dict:

        import torch
        from PIL import Image

        # ----------------------------------------------------
        # Validate bytes
        # ----------------------------------------------------

        if not image_bytes:
            raise ValueError(
                "No image bytes received."
            )

        # ----------------------------------------------------
        # Decode image
        # ----------------------------------------------------

        try:
            image = Image.open(
                io.BytesIO(image_bytes)
            ).convert("RGB")

        except Exception as exc:
            raise ValueError(
                f"Could not decode image: {exc}"
            )

        print(
            f"Received image: "
            f"{image.width}x{image.height}"
        )

        # ----------------------------------------------------
        # Preprocess
        # ----------------------------------------------------

        inputs = self.processor(
            images=image,
            return_tensors="pt",
        )

        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        # ----------------------------------------------------
        # Inference
        # ----------------------------------------------------

        with torch.no_grad():

            outputs = self.model(
                **inputs
            )

            logits = outputs.logits

            probabilities = torch.softmax(
                logits,
                dim=-1,
            )[0]

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        predicted_index = int(
            torch.argmax(
                probabilities
            ).item()
        )

        confidence = float(
            probabilities[
                predicted_index
            ].item()
        )

        predicted_emotion = (
            self.class_names[
                predicted_index
            ]
        )

        # ----------------------------------------------------
        # All probabilities
        # ----------------------------------------------------

        probability_dict = {}

        for index, emotion in enumerate(
            self.class_names
        ):

            probability_dict[
                emotion
            ] = round(
                float(
                    probabilities[
                        index
                    ].item()
                ),
                6,
            )

        # ----------------------------------------------------
        # Result
        # ----------------------------------------------------

        result = {
            "success": True,
            "emotion": predicted_emotion,
            "class_index": predicted_index,
            "confidence": round(
                confidence,
                6,
            ),
            "probabilities": probability_dict,
            "model": "vit_egypt_ft_v9",
        }

        print()
        print("Prediction:")
        print(result)

        return result


# ============================================================
# 6. HTTP API endpoint
# ============================================================

from fastapi import Request


@app.function(
    image=image,
    gpu="L4",
    volumes={
        "/data": volume,
    },
    timeout=600,
)
@modal.fastapi_endpoint(method="POST")
async def predict(request: Request):

    print("=" * 70)
    print("RECEIVED PREDICTION REQUEST")
    print("=" * 70)

    # --------------------------------------------------------
    # Read raw image bytes
    # --------------------------------------------------------

    image_bytes = await request.body()

    print(
        f"Received {len(image_bytes):,} bytes"
    )

    if not image_bytes:
        return {
            "success": False,
            "error": "Request body is empty.",
        }

    # --------------------------------------------------------
    # Run prediction
    # --------------------------------------------------------

    try:

        model = ViTMoodModel()

        result = model.predict_image.remote(
            image_bytes
        )

        print(
            "Prediction completed successfully."
        )

        return result

    except Exception as exc:

        print("=" * 70)
        print("PREDICTION ERROR")
        print("=" * 70)

        print(repr(exc))

        return {
            "success": False,
            "error": str(exc),
        }


# ============================================================
# 7. Local entrypoint
# ============================================================

@app.local_entrypoint()
def main():

    print()
    print("=" * 70)
    print("ViT EGYPT MOOD API")
    print("=" * 70)

    print()
    print(f"Model: {MODEL_DIR}")
    print(f"Volume: {VOLUME_NAME}")
    print(f"Classes: {CLASS_NAMES}")

    print()
    print("Run the API with:")
    print()
    print(
        "modal serve "
        "02_modal_vit_mood_api.py"
    )

    print()
