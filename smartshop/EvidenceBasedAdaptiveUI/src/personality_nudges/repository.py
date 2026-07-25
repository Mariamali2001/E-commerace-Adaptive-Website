"""Generate evidence-scored Big Five personality nudges for styling refinements.

Personality never replaces the interface — it only adjusts configurable styling
properties (visual richness, information density, whitespace, animation,
recommendation strength) using survey tendencies backed by Notebook 03/04
evidence.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.association_rules.modifiers import TRAIT_LEVELS, build_trait_modifiers
from src.evidence_engine.modifier_scoring import merge_trait_modifiers, score_trait_modifiers
from src.preprocessing.columns import BIG_FIVE_TRAITS

logger = logging.getLogger(__name__)

REPOSITORY_VERSION = "1.0"
MIN_NUDGE_EVIDENCE_SCORE = 0.25

# Export-facing property names (internal → website modifier key).
EXPORT_PROPERTY_NAMES: dict[str, str] = {
    "visual_richness": "visual_richness",
    "information_density": "information_density",
    "whitespace": "whitespace",
    "animation_level": "animation",
    "recommendation_emphasis": "recommendation_strength",
}


def _load_table(path: Path) -> pd.DataFrame:
    if not path.exists():
        sibling = path.with_suffix(".csv" if path.suffix.lower() == ".xlsx" else ".xlsx")
        if sibling.exists():
            path = sibling
        else:
            raise FileNotFoundError(f"Required input not found: {path}")
    if path.suffix.lower() == ".xlsx":
        return pd.read_excel(path)
    return pd.read_csv(path)


def _export_property_name(internal: str) -> str:
    return EXPORT_PROPERTY_NAMES.get(internal, internal)


def build_personality_nudge_entries(scored: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert scored modifiers into trait-level nudge repository entries."""
    if scored.empty:
        return []

    entries: list[dict[str, Any]] = []
    for trait in BIG_FIVE_TRAITS:
        trait_rows = scored[scored["Trait"] == trait]
        if trait_rows.empty:
            continue

        for level in TRAIT_LEVELS:
            level_rows = trait_rows[trait_rows["Level"] == level]
            if level_rows.empty:
                continue

            nudges: dict[str, int] = {}
            scores: list[float] = []
            for row in level_rows.itertuples():
                evidence_score = float(getattr(row, "Modifier_Evidence_Score", 0.0) or 0.0)
                if evidence_score < MIN_NUDGE_EVIDENCE_SCORE:
                    continue
                export_key = _export_property_name(str(row.Property))
                nudges[export_key] = int(row.Nudge)
                scores.append(evidence_score)

            if not nudges:
                continue

            confidence = round(sum(scores) / len(scores), 6)
            entries.append(
                {
                    "trait": trait,
                    "level": level,
                    "nudges": nudges,
                    "confidence": confidence,
                }
            )

    return entries


def build_nudge_export_table(
    scored: pd.DataFrame,
    entries: list[dict[str, Any]],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Flatten scored modifiers and repository entries for Excel export."""
    if scored.empty:
        return pd.DataFrame()

    flat_rows: list[dict[str, Any]] = []
    for row in scored.itertuples():
        flat_rows.append(
            {
                "Trait": row.Trait,
                "Level": row.Level,
                "Property": _export_property_name(str(row.Property)),
                "Internal_Property": row.Property,
                "Nudge": int(row.Nudge),
                "Direction": row.Direction,
                "Provenance": row.Provenance,
                "Modifier_Evidence_Score": float(getattr(row, "Modifier_Evidence_Score", 0.0)),
                "Strength": str(getattr(row, "Strength", "")),
                "Group_N": int(row.Group_N) if row.Group_N is not None else None,
                "Delta": row.Delta,
                "Cramers_V": getattr(row, "Cramers_V", None),
                "RF_Importance": getattr(row, "RF_Importance", None),
                "Mean_SHAP": getattr(row, "Mean_SHAP", None),
            }
        )

    table = pd.DataFrame(flat_rows)
    if not table.empty:
        table = table.sort_values(
            ["Trait", "Level", "Modifier_Evidence_Score"],
            ascending=[True, True, False],
        ).reset_index(drop=True)

    summary_rows: list[dict[str, Any]] = []
    for entry in entries:
        for prop, nudge in entry["nudges"].items():
            summary_rows.append(
                {
                    "Trait": entry["trait"],
                    "Level": entry["level"],
                    "Property": prop,
                    "Nudge": nudge,
                    "Entry_Confidence": entry["confidence"],
                }
            )
    if summary_rows:
        summary = pd.DataFrame(summary_rows)
        return table, summary
    return table, pd.DataFrame()


def modifiers_per_trait(entries: list[dict[str, Any]]) -> dict[str, int]:
    """Count exported nudge properties per trait."""
    counts: dict[str, int] = {trait: 0 for trait in BIG_FIVE_TRAITS}
    for entry in entries:
        counts[entry["trait"]] = counts.get(entry["trait"], 0) + len(entry["nudges"])
    return {trait: counts[trait] for trait in BIG_FIVE_TRAITS if counts[trait] > 0 or trait in counts}


def modifiers_per_trait_level(entries: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    """Count nudge properties per trait and level."""
    result: dict[str, dict[str, int]] = {}
    for entry in entries:
        trait = entry["trait"]
        level = entry["level"]
        result.setdefault(trait, {})[level] = len(entry["nudges"])
    return result


@dataclass
class PersonalityNudgeResult:
    """Outputs from the personality nudge pipeline."""

    raw_modifiers: pd.DataFrame
    scored_modifiers: pd.DataFrame
    entries: list[dict[str, Any]]
    export_paths: dict[str, Path]
    summary: dict[str, Any]


def run_personality_nudge_pipeline(
    project_root: Path,
    output_dir: Path,
    reports_dir: Path,
) -> PersonalityNudgeResult:
    """Discover, score, and export Big Five personality styling nudges."""
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(project_root / "data" / "processed" / "clean_dataset.csv")

    statistical = _load_table(
        project_root
        / "reports"
        / "Statistical_Validation"
        / "tables"
        / "statistical_results.xlsx"
    )
    importance = _load_table(
        project_root / "reports" / "Feature_Importance" / "feature_importance.xlsx"
    )
    shap = _load_table(
        project_root / "reports" / "Feature_Importance" / "shap_summary.csv"
    )

    raw = build_trait_modifiers(df)
    merged = merge_trait_modifiers(raw)
    scored = score_trait_modifiers(merged, statistical, importance, shap)
    entries = build_personality_nudge_entries(scored)

    repository = {
        "version": REPOSITORY_VERSION,
        "description": (
            "Lightweight personality styling nudges. Personality never replaces "
            "the interface — it only adjusts configurable properties within limits."
        ),
        "modifiable_properties": sorted(set(EXPORT_PROPERTY_NAMES.values())),
        "min_evidence_score": MIN_NUDGE_EVIDENCE_SCORE,
        "modifiers": entries,
    }

    export_paths: dict[str, Path] = {}

    json_path = output_dir / "trait_modifiers.json"
    json_path.write_text(
        json.dumps(repository, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    export_paths["trait_modifiers_json"] = json_path

    detail_table, summary_table = build_nudge_export_table(scored, entries)
    xlsx_path = reports_dir / "trait_modifiers.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        summary_table.to_excel(writer, sheet_name="Repository_Entries", index=False)
        detail_table.to_excel(writer, sheet_name="Scored_Modifiers", index=False)
        raw.to_excel(writer, sheet_name="Raw_Modifiers", index=False)
    export_paths["trait_modifiers_xlsx"] = xlsx_path

    csv_path = reports_dir / "trait_modifiers.csv"
    detail_table.to_csv(csv_path, index=False)
    export_paths["trait_modifiers_csv"] = csv_path

    per_trait = modifiers_per_trait(entries)
    per_trait_level = modifiers_per_trait_level(entries)

    summary = {
        "modifiers_per_trait": per_trait,
        "modifiers_per_trait_level": per_trait_level,
        "total_entries": len(entries),
        "total_nudges": sum(len(entry["nudges"]) for entry in entries),
        "average_confidence": round(
            sum(entry["confidence"] for entry in entries) / len(entries),
            6,
        )
        if entries
        else 0.0,
    }

    summary_md = reports_dir / "personality_nudges_summary.md"
    lines = [
        "# Personality Nudges Summary",
        "",
        "Lightweight styling refinements — not complete UI layouts.",
        "",
        f"- Repository entries: {summary['total_entries']}",
        f"- Total nudge properties: {summary['total_nudges']}",
        f"- Average confidence: {summary['average_confidence']:.4f}",
        "",
        "## Modifiers per trait",
    ]
    for trait, count in per_trait.items():
        lines.append(f"- {trait}: {count}")
    summary_md.write_text("\n".join(lines), encoding="utf-8")
    export_paths["summary_md"] = summary_md

    logger.info(
        "Personality nudges: %s entries, %s total nudges",
        summary["total_entries"],
        summary["total_nudges"],
    )

    return PersonalityNudgeResult(
        raw_modifiers=raw,
        scored_modifiers=scored,
        entries=entries,
        export_paths=export_paths,
        summary=summary,
    )
