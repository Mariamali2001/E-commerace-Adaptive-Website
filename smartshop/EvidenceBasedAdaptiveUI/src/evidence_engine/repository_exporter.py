"""Export the two adaptive-UI repositories consumed by the website (Notebook 07).

Two JSON repositories are produced from Notebook 06's outputs:

- ``candidate_base_profile.json`` — base UI configurations keyed by
  Persona/Mood/Device, each with a ``ui_profile`` and an ``evidence`` block.
- ``trait_modifiers.json`` — Big Five ordinal nudges nested by trait → level.

A ``profile_lookup.json`` index (persona → mood → device → profile_id) is also
written so the website can resolve a base profile from live context in O(1).
The LLM never decides adaptations; it only renders the selected profile plus the
applicable trait nudges.
"""

from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.association_rules.modifiers import PROPERTY_COLUMNS, THEORY_ONLY_PROPERTIES
from src.evidence_engine.profile_vectors import parse_ui_profile
from src.preprocessing.columns import BIG_FIVE_TRAITS
from src.statistics.evidence import min_max_normalize

logger = logging.getLogger(__name__)

REPOSITORY_VERSION = "2.0"

DEFAULT_BASE_PROFILES_PATH = Path("reports") / "AdaptiveProfiles" / "merged_base_profiles.xlsx"
DEFAULT_MODIFIERS_PATH = Path("reports") / "AdaptiveProfiles" / "scored_trait_modifiers.csv"

MODIFIABLE_PROPERTIES = [*PROPERTY_COLUMNS.keys(), *THEORY_ONLY_PROPERTIES]
TRAIT_LEVEL_ORDER = {"Low": 0, "Medium": 1, "High": 2}


def _load_table(path: Path) -> pd.DataFrame:
    if path.exists():
        return pd.read_excel(path) if path.suffix.lower() == ".xlsx" else pd.read_csv(path)
    sibling = path.with_suffix(".csv" if path.suffix.lower() == ".xlsx" else ".xlsx")
    if sibling.exists():
        return pd.read_excel(sibling) if sibling.suffix.lower() == ".xlsx" else pd.read_csv(sibling)
    raise FileNotFoundError(f"Required input not found: {path} (also checked {sibling})")


def _optional_str(value: object) -> str | None:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    return text


def _safe_float(value: object, default: float = 0.0) -> float:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return default
    try:
        return round(float(value), 6)
    except (TypeError, ValueError):
        return default


def assign_base_ids(n: int) -> list[str]:
    width = max(3, len(str(n)))
    return [f"base_{index:0{width}d}" for index in range(1, n + 1)]


def build_base_profile_repository(profiles: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert merged base profiles into ordered JSON objects."""
    if profiles.empty:
        return []

    ordered = profiles.sort_values("Base_Profile_Score", ascending=False).reset_index(drop=True)
    statistical_norm = min_max_normalize(ordered["Avg_Cramers_V"].fillna(0.0))
    importance_norm = min_max_normalize(ordered["Avg_RF_Importance"].fillna(0.0))
    shap_norm = min_max_normalize(ordered["Avg_SHAP"].fillna(0.0))
    ids = assign_base_ids(len(ordered))

    repository: list[dict[str, Any]] = []
    for index, row in ordered.iterrows():
        ui_profile = parse_ui_profile(str(row.get("UI_Adaptations", "")))
        repository.append(
            {
                "profile_id": ids[index],
                "context": {
                    "persona": _optional_str(row.get("Persona")),
                    "mood": _optional_str(row.get("Mood")),
                    "device": _optional_str(row.get("Device")),
                },
                "ui_profile": ui_profile,
                "evidence": {
                    "profile_score": _safe_float(row.get("Base_Profile_Score")),
                    "strength": _optional_str(row.get("Strength")) or "Weak",
                    "participants": int(_safe_float(row.get("Participants"), default=1)),
                    "average_support": _safe_float(row.get("Avg_Support")),
                    "average_confidence": _safe_float(row.get("Avg_Confidence")),
                    "average_lift": _safe_float(row.get("Avg_Lift"), default=1.0),
                    "statistical_score": round(float(statistical_norm.iloc[index]), 6),
                    "feature_importance": round(float(importance_norm.iloc[index]), 6),
                    "shap_score": round(float(shap_norm.iloc[index]), 6),
                },
                "metadata": {
                    "merged_count": int(_safe_float(row.get("Merged_Count"), default=1)),
                    "num_ui_adaptations": len(ui_profile),
                    "created_from": "Adaptive Builder",
                    "version": REPOSITORY_VERSION,
                },
            }
        )
    return repository


def build_trait_modifier_repository(modifiers: pd.DataFrame) -> dict[str, Any]:
    """Nest scored trait modifiers by trait → level → list of nudges."""
    nested: dict[str, Any] = {}
    for trait in BIG_FIVE_TRAITS:
        trait_rows = modifiers[modifiers["Trait"] == trait]
        if trait_rows.empty:
            continue
        levels: dict[str, list[dict[str, Any]]] = {}
        for level, level_rows in trait_rows.groupby("Level"):
            nudges = [
                {
                    "property": str(row.Property),
                    "nudge": int(row.Nudge),
                    "direction": str(row.Direction),
                    "provenance": str(row.Provenance),
                    "evidence_score": _safe_float(getattr(row, "Modifier_Evidence_Score", 0.0)),
                    "strength": str(getattr(row, "Strength", "Weak")),
                }
                for row in level_rows.sort_values(
                    "Modifier_Evidence_Score", ascending=False
                ).itertuples()
            ]
            levels[str(level)] = nudges
        ordered_levels = dict(
            sorted(levels.items(), key=lambda item: TRAIT_LEVEL_ORDER.get(item[0], 99))
        )
        nested[trait] = ordered_levels

    data_driven = int((modifiers["Provenance"] == "data-driven").sum()) if not modifiers.empty else 0
    theory = int((modifiers["Provenance"] == "theory").sum()) if not modifiers.empty else 0

    return {
        "version": REPOSITORY_VERSION,
        "modifiable_properties": MODIFIABLE_PROPERTIES,
        "conflict_rule": (
            "Base profile takes precedence. Nudges adjust configurable properties "
            "within limits or fill unspecified values; they never replace base decisions."
        ),
        "metadata": {
            "total_modifiers": int(len(modifiers)),
            "data_driven": data_driven,
            "theory": theory,
        },
        "modifiers": nested,
    }


def build_profile_lookup(profiles: list[dict[str, Any]]) -> dict[str, Any]:
    """Nested persona → mood → device → profile_id lookup index."""
    lookup: dict[str, Any] = {}
    for profile in profiles:
        context = profile["context"]
        persona = context.get("persona") or "_any"
        mood = context.get("mood") or "_any"
        device = context.get("device") or "_any"
        bucket = lookup.setdefault(persona, {}).setdefault(mood, {})
        bucket.setdefault(device, profile["profile_id"])
    return lookup


@dataclass
class RepositoryValidationReport:
    """Validation results for the two-repository export."""

    is_valid: bool
    issues: list[str]


def validate_repositories(
    base_profiles: list[dict[str, Any]],
    trait_modifiers: dict[str, Any],
) -> RepositoryValidationReport:
    """Lightweight structural validation of both repositories."""
    issues: list[str] = []

    ids = [profile["profile_id"] for profile in base_profiles]
    if len(ids) != len(set(ids)):
        issues.append("Duplicate base profile_id values found.")
    for profile in base_profiles:
        if not profile["ui_profile"]:
            issues.append(f"{profile['profile_id']} has an empty ui_profile.")
        context = profile["context"]
        if not any(context.get(key) for key in ("persona", "mood", "device")):
            issues.append(f"{profile['profile_id']} has no context conditions.")

    valid_props = set(MODIFIABLE_PROPERTIES)
    for trait, levels in trait_modifiers.get("modifiers", {}).items():
        for level, nudges in levels.items():
            for nudge in nudges:
                if nudge["nudge"] not in (-1, 1):
                    issues.append(f"{trait}/{level}/{nudge['property']} has non-ordinal nudge.")
                if nudge["property"] not in valid_props:
                    issues.append(f"{trait}/{level} references unknown property {nudge['property']}.")
                if nudge["provenance"] not in ("data-driven", "theory"):
                    issues.append(f"{trait}/{level}/{nudge['property']} has invalid provenance.")

    return RepositoryValidationReport(is_valid=not issues, issues=issues)


def build_base_catalog(profiles: list[dict[str, Any]]) -> pd.DataFrame:
    """Flatten base profiles into a tabular catalog."""
    rows: list[dict[str, Any]] = []
    for profile in profiles:
        context = profile["context"]
        evidence = profile["evidence"]
        rows.append(
            {
                "profile_id": profile["profile_id"],
                "persona": context.get("persona"),
                "mood": context.get("mood"),
                "device": context.get("device"),
                "ui_profile": json.dumps(profile["ui_profile"], ensure_ascii=False),
                "profile_score": evidence["profile_score"],
                "strength": evidence["strength"],
                "participants": evidence["participants"],
                "average_confidence": evidence["average_confidence"],
                "average_lift": evidence["average_lift"],
                "merged_count": profile["metadata"]["merged_count"],
            }
        )
    return pd.DataFrame(rows)


def build_repository_summary_markdown(
    base_profiles: list[dict[str, Any]],
    trait_modifiers: dict[str, Any],
    validation: RepositoryValidationReport,
) -> str:
    """Render the repository summary markdown."""
    meta = trait_modifiers.get("metadata", {})
    lines = [
        "# Adaptive Profile Repository Summary (Notebook 07)",
        "",
        "## Repositories",
        f"- Base profiles: {len(base_profiles)} (candidate_base_profile.json)",
        f"- Trait modifiers: {meta.get('total_modifiers', 0)} "
        f"({meta.get('data_driven', 0)} data-driven, {meta.get('theory', 0)} theory) "
        "(trait_modifiers.json)",
        f"- Validation: {'PASS' if validation.is_valid else 'FAIL'}",
        "",
        "## Top Base Profiles",
    ]
    for profile in base_profiles[:10]:
        context = profile["context"]
        lines.append(
            f"- **{profile['profile_id']}** — persona={context.get('persona')}, "
            f"mood={context.get('mood')}, device={context.get('device')}, "
            f"score={profile['evidence']['profile_score']:.3f} ({profile['evidence']['strength']})"
        )

    if not validation.is_valid:
        lines.extend(["", "## Validation Issues"])
        lines.extend(f"- {issue}" for issue in validation.issues[:20])

    return "\n".join(lines)


@dataclass
class RepositoryResult:
    """Outputs from the two-repository export pipeline."""

    base_profiles: list[dict[str, Any]]
    trait_modifiers: dict[str, Any]
    lookup: dict[str, Any]
    validation: RepositoryValidationReport
    export_paths: dict[str, Path]
    summary: dict[str, object]


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run_repository_pipeline(
    project_root: Path,
    output_dir: Path,
    reports_dir: Path,
    *,
    base_profiles_path: Path | None = None,
    modifiers_path: Path | None = None,
) -> RepositoryResult:
    """Load Notebook 06 outputs and export the two website-ready JSON repositories."""
    base_df = _load_table(project_root / (base_profiles_path or DEFAULT_BASE_PROFILES_PATH))
    modifiers_df = _load_table(project_root / (modifiers_path or DEFAULT_MODIFIERS_PATH))

    base_profiles = build_base_profile_repository(base_df)
    trait_modifiers = build_trait_modifier_repository(modifiers_df)
    lookup = build_profile_lookup(base_profiles)
    validation = validate_repositories(base_profiles, trait_modifiers)

    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    base_json = output_dir / "candidate_base_profile.json"
    _write_json(base_json, base_profiles)
    export_paths["candidate_base_profile_json"] = base_json

    modifiers_json = output_dir / "trait_modifiers.json"
    _write_json(modifiers_json, trait_modifiers)
    export_paths["trait_modifiers_json"] = modifiers_json

    lookup_json = output_dir / "profile_lookup.json"
    _write_json(lookup_json, lookup)
    export_paths["profile_lookup_json"] = lookup_json

    catalog_xlsx = reports_dir / "base_profile_catalog.xlsx"
    build_base_catalog(base_profiles).to_excel(catalog_xlsx, index=False)
    export_paths["base_profile_catalog_xlsx"] = catalog_xlsx

    summary_md = reports_dir / "repository_summary.md"
    summary_md.write_text(
        build_repository_summary_markdown(base_profiles, trait_modifiers, validation),
        encoding="utf-8",
    )
    export_paths["repository_summary_md"] = summary_md

    summary = {
        "base_profiles_exported": len(base_profiles),
        "trait_modifiers_exported": trait_modifiers.get("metadata", {}).get("total_modifiers", 0),
        "validation_passed": validation.is_valid,
        "repository_location": str(output_dir),
    }

    logger.info("Exported two-repository knowledge base to %s", output_dir)

    return RepositoryResult(
        base_profiles=base_profiles,
        trait_modifiers=trait_modifiers,
        lookup=lookup,
        validation=validation,
        export_paths=export_paths,
        summary=summary,
    )
