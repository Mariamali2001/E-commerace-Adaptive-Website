"""Helpers for running notebooks against the project layout."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.config import ProjectPaths


def _resolve_project_root() -> Path:
    """Locate project root from the current working directory."""
    search_from = Path.cwd().resolve()
    candidates = [search_from, *search_from.parents]
    nested_root = search_from / "EvidenceBasedAdaptiveUI"
    if (nested_root / "src" / "config.py").exists():
        candidates.insert(0, nested_root)

    for candidate in candidates:
        if (candidate / "src" / "config.py").exists():
            return candidate
    raise FileNotFoundError("Could not locate project root containing src/config.py.")


def setup_notebook(report_subdir: str) -> tuple[ProjectPaths, Path]:
    """Add project root to ``sys.path`` and ensure report directories exist."""
    project_root = _resolve_project_root()
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from src.config import ProjectPaths

    paths = ProjectPaths.from_root(project_root)
    paths.ensure_directories()

    report_dir = paths.reports / report_subdir
    report_dir.mkdir(parents=True, exist_ok=True)
    return paths, report_dir
