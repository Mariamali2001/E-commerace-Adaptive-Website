"""Validate adaptive engine inputs and outputs."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from src.adaptive_engine.repository_loader import REPOSITORY_FILES, RepositoryBundle
from src.preprocessing.columns import ALL_UI_COLUMNS, GLOBAL_UI_COLUMNS


@dataclass
class ValidationReport:
    ok: bool = True
    checks: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def add_check(self, name: str, passed: bool, detail: str = "") -> None:
        self.checks.append({"check": name, "passed": passed, "detail": detail})
        if not passed:
            self.ok = False
            self.errors.append(f"{name}: {detail}")


def validate_repository_bundle(bundle: RepositoryBundle | None, report: Any) -> ValidationReport:
    """Verify all repository JSON files loaded successfully."""
    validation = ValidationReport()
    validation.add_check(
        "All JSON files successfully loaded",
        bundle is not None and report.ok,
        report.summary() if report else "Repository bundle is missing.",
    )
    if bundle is None:
        return validation

    for filename in REPOSITORY_FILES:
        validation.add_check(
            f"File exists: {filename}",
            filename in report.loaded_files,
            "missing" if filename not in report.loaded_files else "ok",
        )
    return validation


def validate_ui_configuration(
    raw_config: dict[str, str],
    device: str,
) -> ValidationReport:
    """Verify final UI configuration integrity."""
    validation = ValidationReport()

    keys = list(raw_config.keys())
    validation.add_check(
        "No duplicate properties",
        len(keys) == len(set(keys)),
        f"{len(keys)} keys, {len(set(keys))} unique",
    )
    validation.add_check(
        "No missing UI property values",
        all(value not in (None, "") for value in raw_config.values()),
        f"{sum(1 for v in raw_config.values() if not v)} empty values",
    )

    required_global = set(GLOBAL_UI_COLUMNS)
    missing_global = sorted(required_global - set(raw_config))
    validation.add_check(
        "All required global UI elements exist",
        len(missing_global) == 0,
        ", ".join(missing_global) if missing_global else "all present",
    )

    device_prefix = "mobile_" if device == "Smartphone" else "desktop_"
    device_columns = [c for c in ALL_UI_COLUMNS if c.startswith(device_prefix)]
    missing_device = sorted(set(device_columns) - set(raw_config))
    validation.add_check(
        f"All required {device} UI elements exist",
        len(missing_device) == 0,
        ", ".join(missing_device[:5]) + ("..." if len(missing_device) > 5 else "")
        if missing_device
        else "all present",
    )

    return validation
