"""Bootstrap sys.path so notebooks can import the local ``src`` package."""

from __future__ import annotations

import sys
from pathlib import Path


def add_project_root(start: Path | None = None) -> Path:
    """Add the project root directory to ``sys.path`` if needed."""
    search_from = (start or Path.cwd()).resolve()
    candidates: list[Path] = [search_from, *search_from.parents]

    nested_root = search_from / "EvidenceBasedAdaptiveUI"
    if (nested_root / "src" / "config.py").exists():
        candidates.insert(0, nested_root)

    for candidate in candidates:
        if (candidate / "src" / "config.py").exists():
            root = str(candidate)
            if root not in sys.path:
                sys.path.insert(0, root)
            return candidate

    raise FileNotFoundError(
        "Could not find project root containing src/config.py. "
        "Open the project folder EvidenceBasedAdaptiveUI in your IDE and rerun."
    )
