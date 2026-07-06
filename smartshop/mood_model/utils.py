"""Shared utilities for preprocessing, runtime, and reproducibility."""

from __future__ import annotations

import os
import random
from pathlib import Path
from typing import Any

import numpy as np
import torch
import yaml


EMOTION_ORDER = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


def load_config(config_path: str) -> dict[str, Any]:
    """Load YAML config and validate minimum required keys."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with path.open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)

    if not isinstance(config, dict):
        raise ValueError("Config must be a YAML dictionary at top level.")

    required_sections = ["project", "data", "model", "training", "artifacts"]
    missing = [section for section in required_sections if section not in config]
    if missing:
        raise ValueError(f"Config missing required sections: {missing}")

    emotions = config["data"].get("emotions", [])
    if emotions != EMOTION_ORDER:
        raise ValueError(
            "Emotion order mismatch. Expected "
            f"{EMOTION_ORDER}, got {emotions}."
        )

    return config


def set_global_seed(seed: int, deterministic: bool = True) -> None:
    """Set global seeds for reproducibility across common libraries."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # Deterministic flags can reduce speed but improve reproducibility.
    if deterministic:
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":16:8"


def get_best_device() -> torch.device:
    """Choose the best available runtime for MacBook or fallback to CPU."""
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def validate_runtime() -> dict[str, Any]:
    """Return runtime information to confirm device availability."""
    device = get_best_device()
    return {
        "selected_device": str(device),
        "torch_version": torch.__version__,
        "mps_available": torch.backends.mps.is_available(),
        "cuda_available": torch.cuda.is_available(),
    }
