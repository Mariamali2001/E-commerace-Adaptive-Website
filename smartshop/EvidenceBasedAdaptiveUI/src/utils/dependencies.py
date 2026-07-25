"""Optional dependency checks for notebook execution."""

from __future__ import annotations

import importlib
import subprocess
import sys


def ensure_packages(*packages: str) -> None:
    """Install missing packages into the active Python environment."""
    for package in packages:
        module_name = "sklearn" if package == "scikit-learn" else package
        try:
            importlib.import_module(module_name)
        except ImportError:
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", package],
            )
