"""Load and validate adaptive repository JSON files."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

REPOSITORY_FILES: tuple[str, ...] = (
    "global_defaults.json",
    "desktop_defaults.json",
    "mobile_defaults.json",
    "persona_overrides.json",
    "mood_overrides.json",
    "trait_modifiers.json",
)


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


@dataclass
class RepositoryLoadReport:
    input_dir: Path
    loaded_files: list[str] = field(default_factory=list)
    missing_files: list[str] = field(default_factory=list)
    ok: bool = False

    def summary(self) -> str:
        if self.ok:
            return f"All {len(REPOSITORY_FILES)} repository files loaded from {self.input_dir}"
        return f"Missing {len(self.missing_files)} file(s): {', '.join(self.missing_files)}"


@dataclass
class RepositoryBundle:
    input_dir: Path
    global_defaults: dict[str, Any]
    desktop_defaults: dict[str, Any]
    mobile_defaults: dict[str, Any]
    persona_overrides: list[dict[str, Any]]
    mood_overrides: list[dict[str, Any]]
    trait_modifiers: dict[str, Any]
    persona_lookup: dict[str, dict[str, Any]]
    mood_lookup: dict[str, dict[str, Any]]
    trait_lookup: dict[str, dict[str, dict[str, Any]]]
    load_report: RepositoryLoadReport
    survey_path: Path | None = None


def _build_persona_lookup(persona_overrides: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for entry in persona_overrides:
        persona = entry.get("persona")
        if persona:
            lookup[str(persona)] = entry
    return lookup


def _build_mood_lookup(mood_overrides: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for entry in mood_overrides:
        mood = entry.get("mood")
        if mood:
            lookup[str(mood)] = entry
    return lookup


def _build_trait_lookup(trait_modifiers: dict[str, Any]) -> dict[str, dict[str, dict[str, Any]]]:
    lookup: dict[str, dict[str, dict[str, Any]]] = {}
    for entry in trait_modifiers.get("modifiers", []):
        trait = entry.get("trait")
        level = entry.get("level")
        if trait and level:
            lookup.setdefault(str(trait), {})[str(level)] = entry
    return lookup


def load_repositories(input_dir: Path) -> tuple[RepositoryBundle | None, RepositoryLoadReport]:
    """Read all repository JSON files and report any that are missing."""
    input_dir = Path(input_dir)
    report = RepositoryLoadReport(input_dir=input_dir)

    payloads: dict[str, Any] = {}
    for filename in REPOSITORY_FILES:
        path = input_dir / filename
        if not path.exists():
            report.missing_files.append(filename)
            continue
        payloads[filename] = _load_json(path)
        report.loaded_files.append(filename)

    report.ok = len(report.missing_files) == 0
    if not report.ok:
        return None, report

    persona_overrides = payloads["persona_overrides.json"]
    mood_overrides = payloads["mood_overrides.json"]
    trait_modifiers = payloads["trait_modifiers.json"]
    survey_path = input_dir.parent / "processed" / "clean_dataset.csv"

    bundle = RepositoryBundle(
        input_dir=input_dir,
        global_defaults=payloads["global_defaults.json"],
        desktop_defaults=payloads["desktop_defaults.json"],
        mobile_defaults=payloads["mobile_defaults.json"],
        persona_overrides=persona_overrides,
        mood_overrides=mood_overrides,
        trait_modifiers=trait_modifiers,
        persona_lookup=_build_persona_lookup(persona_overrides),
        mood_lookup=_build_mood_lookup(mood_overrides),
        trait_lookup=_build_trait_lookup(trait_modifiers),
        load_report=report,
        survey_path=survey_path if survey_path.exists() else None,
    )
    return bundle, report
