"""Combine default, persona, mood, and trait repositories for the website."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.adaptive_repository.validator import RepositoryValidationReport, validate_adaptive_repository
from src.preprocessing.columns import BIG_FIVE_TRAITS

logger = logging.getLogger(__name__)

REPOSITORY_VERSION = "1.0"

INPUT_FILES = {
    "global_defaults": "global_defaults.json",
    "desktop_defaults": "desktop_defaults.json",
    "mobile_defaults": "mobile_defaults.json",
    "persona_overrides": "persona_overrides.json",
    "mood_overrides": "mood_overrides.json",
    "trait_modifiers": "trait_modifiers.json",
}


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"Required input not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_repository_inputs(input_dir: Path) -> dict[str, Any]:
    """Load all six repository JSON files from the outputs directory."""
    return {name: _load_json(input_dir / filename) for name, filename in INPUT_FILES.items()}


def build_persona_lookup(persona_overrides: list[dict[str, Any]]) -> dict[str, Any]:
    """Index persona overrides by persona name."""
    lookup: dict[str, Any] = {}
    for entry in persona_overrides:
        persona = entry.get("persona")
        if not persona:
            continue
        overrides = entry.get("overrides", {})
        lookup[persona] = {
            "n_overrides": len(overrides),
            "ui_elements": sorted(overrides.keys()),
            "overrides": overrides,
        }
    return dict(sorted(lookup.items()))


def build_mood_lookup(mood_overrides: list[dict[str, Any]]) -> dict[str, Any]:
    """Index mood overrides by mood name."""
    lookup: dict[str, Any] = {}
    for entry in mood_overrides:
        mood = entry.get("mood")
        if not mood:
            continue
        overrides = entry.get("overrides", {})
        lookup[mood] = {
            "n_overrides": len(overrides),
            "ui_elements": sorted(overrides.keys()),
            "overrides": overrides,
        }
    return dict(sorted(lookup.items()))


def build_trait_lookup(trait_modifiers: dict[str, Any]) -> dict[str, Any]:
    """Index trait modifiers by trait → level."""
    lookup: dict[str, Any] = {trait: {} for trait in BIG_FIVE_TRAITS}
    for entry in trait_modifiers.get("modifiers", []):
        trait = entry.get("trait")
        level = entry.get("level")
        if not trait or not level:
            continue
        nudges = entry.get("nudges", {})
        lookup.setdefault(trait, {})[level] = {
            "nudges": nudges,
            "nudge_properties": sorted(nudges.keys()),
            "confidence": entry.get("confidence"),
        }

    return {
        trait: dict(sorted(levels.items()))
        for trait, levels in lookup.items()
        if levels
    }


def build_lookup_indexes(
    persona_overrides: list[dict[str, Any]],
    mood_overrides: list[dict[str, Any]],
    trait_modifiers: dict[str, Any],
) -> dict[str, Any]:
    """Combined lookup index for persona, mood, and trait."""
    return {
        "version": REPOSITORY_VERSION,
        "persona": build_persona_lookup(persona_overrides),
        "mood": build_mood_lookup(mood_overrides),
        "trait": build_trait_lookup(trait_modifiers),
    }


def build_repository_statistics(
    global_defaults: dict[str, Any],
    desktop_defaults: dict[str, Any],
    mobile_defaults: dict[str, Any],
    persona_overrides: list[dict[str, Any]],
    mood_overrides: list[dict[str, Any]],
    trait_modifiers: dict[str, Any],
) -> dict[str, Any]:
    """Compute summary counts for the adaptive repository."""
    persona_count = sum(len(entry.get("overrides", {})) for entry in persona_overrides)
    mood_count = sum(len(entry.get("overrides", {})) for entry in mood_overrides)
    trait_entries = trait_modifiers.get("modifiers", [])
    trait_nudge_count = sum(len(entry.get("nudges", {})) for entry in trait_entries)

    return {
        "version": REPOSITORY_VERSION,
        "defaults": {
            "global": len(global_defaults.get("defaults", {})),
            "desktop": len(desktop_defaults.get("defaults", {})),
            "mobile": len(mobile_defaults.get("defaults", {})),
            "total": (
                len(global_defaults.get("defaults", {}))
                + len(desktop_defaults.get("defaults", {}))
                + len(mobile_defaults.get("defaults", {}))
            ),
        },
        "persona_overrides": {
            "personas": len(persona_overrides),
            "total_overrides": persona_count,
            "by_persona": {
                entry["persona"]: entry.get("n_overrides", len(entry.get("overrides", {})))
                for entry in persona_overrides
                if entry.get("persona")
            },
        },
        "mood_overrides": {
            "moods": len(mood_overrides),
            "total_overrides": mood_count,
            "by_mood": {
                entry["mood"]: entry.get("n_overrides", len(entry.get("overrides", {})))
                for entry in mood_overrides
                if entry.get("mood")
            },
        },
        "trait_modifiers": {
            "entries": len(trait_entries),
            "total_nudges": trait_nudge_count,
            "by_trait": {
                trait: sum(
                    len(entry.get("nudges", {}))
                    for entry in trait_entries
                    if entry.get("trait") == trait
                )
                for trait in BIG_FIVE_TRAITS
            },
        },
    }


def build_repository_summary_table(statistics: dict[str, Any]) -> pd.DataFrame:
    """Flatten repository statistics into rows for Excel export."""
    rows: list[dict[str, Any]] = [
        {"Category": "Defaults", "Subcategory": "Global", "Count": statistics["defaults"]["global"]},
        {"Category": "Defaults", "Subcategory": "Desktop", "Count": statistics["defaults"]["desktop"]},
        {"Category": "Defaults", "Subcategory": "Mobile", "Count": statistics["defaults"]["mobile"]},
        {
            "Category": "Persona Overrides",
            "Subcategory": "Total",
            "Count": statistics["persona_overrides"]["total_overrides"],
        },
        {
            "Category": "Mood Overrides",
            "Subcategory": "Total",
            "Count": statistics["mood_overrides"]["total_overrides"],
        },
        {
            "Category": "Trait Modifiers",
            "Subcategory": "Total nudges",
            "Count": statistics["trait_modifiers"]["total_nudges"],
        },
    ]

    for persona, count in statistics["persona_overrides"]["by_persona"].items():
        rows.append({"Category": "Persona", "Subcategory": persona, "Count": count})
    for mood, count in statistics["mood_overrides"]["by_mood"].items():
        rows.append({"Category": "Mood", "Subcategory": mood, "Count": count})
    for trait, count in statistics["trait_modifiers"]["by_trait"].items():
        if count:
            rows.append({"Category": "Trait", "Subcategory": trait, "Count": count})

    return pd.DataFrame(rows)


@dataclass
class AdaptiveRepositoryResult:
    """Outputs from the adaptive repository assembly pipeline."""

    bundle: dict[str, Any]
    lookup_indexes: dict[str, Any]
    statistics: dict[str, Any]
    validation: RepositoryValidationReport
    export_paths: dict[str, Path]
    summary: dict[str, Any]


def export_adaptive_repository(
    bundle: dict[str, Any],
    lookup_indexes: dict[str, Any],
    statistics: dict[str, Any],
    summary_table: pd.DataFrame,
    repository_dir: Path,
    reports_dir: Path,
) -> dict[str, Path]:
    """Write the adaptive repository folder, lookups, and summary exports."""
    repository_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    for name, payload in bundle.items():
        path = repository_dir / INPUT_FILES[name]
        _write_json(path, payload)
        export_paths[f"{name}_json"] = path

    lookup_combined = repository_dir / "lookup_indexes.json"
    _write_json(lookup_combined, lookup_indexes)
    export_paths["lookup_indexes_json"] = lookup_combined

    persona_lookup = repository_dir / "persona_lookup.json"
    _write_json(persona_lookup, lookup_indexes["persona"])
    export_paths["persona_lookup_json"] = persona_lookup

    mood_lookup = repository_dir / "mood_lookup.json"
    _write_json(mood_lookup, lookup_indexes["mood"])
    export_paths["mood_lookup_json"] = mood_lookup

    trait_lookup = repository_dir / "trait_lookup.json"
    _write_json(trait_lookup, lookup_indexes["trait"])
    export_paths["trait_lookup_json"] = trait_lookup

    stats_path = repository_dir / "repository_statistics.json"
    _write_json(stats_path, statistics)
    export_paths["repository_statistics_json"] = stats_path

    summary_xlsx = reports_dir / "repository_summary.xlsx"
    with pd.ExcelWriter(summary_xlsx, engine="openpyxl") as writer:
        summary_table.to_excel(writer, sheet_name="Summary", index=False)
        stats_df = pd.json_normalize(statistics, sep="_")
        stats_df.to_excel(writer, sheet_name="Statistics", index=False)
    export_paths["repository_summary_xlsx"] = summary_xlsx

    summary_md = reports_dir / "repository_summary.md"
    lines = [
        "# Adaptive Repository Summary",
        "",
        f"- Global defaults: {statistics['defaults']['global']}",
        f"- Desktop defaults: {statistics['defaults']['desktop']}",
        f"- Mobile defaults: {statistics['defaults']['mobile']}",
        f"- Persona overrides: {statistics['persona_overrides']['total_overrides']} "
        f"({statistics['persona_overrides']['personas']} personas)",
        f"- Mood overrides: {statistics['mood_overrides']['total_overrides']} "
        f"({statistics['mood_overrides']['moods']} moods)",
        f"- Trait modifier nudges: {statistics['trait_modifiers']['total_nudges']} "
        f"({statistics['trait_modifiers']['entries']} entries)",
    ]
    summary_md.write_text("\n".join(lines), encoding="utf-8")
    export_paths["repository_summary_md"] = summary_md

    logger.info("Exported adaptive repository to %s", repository_dir)
    return export_paths


def run_adaptive_repository_pipeline(
    input_dir: Path,
    repository_dir: Path,
    reports_dir: Path,
) -> AdaptiveRepositoryResult:
    """Load, validate, combine, and export the final adaptive repository."""
    bundle = load_repository_inputs(input_dir)

    validation = validate_adaptive_repository(
        bundle["global_defaults"],
        bundle["desktop_defaults"],
        bundle["mobile_defaults"],
        bundle["persona_overrides"],
        bundle["mood_overrides"],
        bundle["trait_modifiers"],
    )

    lookup_indexes = build_lookup_indexes(
        bundle["persona_overrides"],
        bundle["mood_overrides"],
        bundle["trait_modifiers"],
    )
    statistics = build_repository_statistics(
        bundle["global_defaults"],
        bundle["desktop_defaults"],
        bundle["mobile_defaults"],
        bundle["persona_overrides"],
        bundle["mood_overrides"],
        bundle["trait_modifiers"],
    )
    summary_table = build_repository_summary_table(statistics)

    export_paths = export_adaptive_repository(
        bundle,
        lookup_indexes,
        statistics,
        summary_table,
        repository_dir,
        reports_dir,
    )

    summary = {
        "validation_passed": validation.is_valid,
        "repository_location": str(repository_dir),
        "statistics": statistics,
    }

    return AdaptiveRepositoryResult(
        bundle=bundle,
        lookup_indexes=lookup_indexes,
        statistics=statistics,
        validation=validation,
        export_paths=export_paths,
        summary=summary,
    )
