"""Project configuration and path management."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProjectPaths:
    """Centralized paths for the Evidence-Based Adaptive UI project."""

    root: Path
    data_raw: Path
    data_processed: Path
    data_outputs: Path
    reports: Path
    notebooks: Path
    src: Path

    @classmethod
    def from_root(cls, root: Path | None = None) -> ProjectPaths:
        """Resolve paths relative to the project root directory."""
        if root is None:
            root = Path(__file__).resolve().parent.parent

        return cls(
            root=root,
            data_raw=root / "data" / "raw",
            data_processed=root / "data" / "processed",
            data_outputs=root / "data" / "outputs",
            reports=root / "reports",
            notebooks=root / "notebooks",
            src=root / "src",
        )

    def ensure_directories(self) -> None:
        """Create project directories if they do not exist."""
        for path in (
            self.data_raw,
            self.data_processed,
            self.data_outputs,
            self.reports,
        ):
            path.mkdir(parents=True, exist_ok=True)
            logger.debug("Ensured directory exists: %s", path)


PATHS = ProjectPaths.from_root()
