"""Candidate pattern discovery pipeline for Notebook 05.

Notebook 05 produces two separate outputs:

1. **Base candidate profiles** keyed by Persona + Mood + Device. These define
   the main UI configuration. Rules are mined per UI category (Global, Desktop,
   Mobile) with context restricted to Persona/Mood/Device, then rules sharing an
   identical antecedent are merged into one candidate profile.
2. **Trait modifiers** keyed by Big Five levels. Personality does not define a
   separate interface; each trait level nudges configurable UI properties up or
   down (data-driven where evidence exists, theory-informed otherwise).

This stage performs pattern discovery only: no scoring, no confidence-based
quality filtering, and no JSON generation. Notebook 06 merges and consolidates;
Notebook 07 exports the repositories.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from src.association_rules.filtering import deduplicate_rules
from src.association_rules.mining import (
    DEFAULT_MIN_CONFIDENCE,
    MiningResult,
    encode_transactions,
    mine_stage,
)
from src.association_rules.modifiers import build_trait_modifiers
from src.association_rules.profiles import (
    BASE_CONTEXT_LABELS,
    build_candidate_profiles,
    build_candidate_rules,
)
from src.association_rules.transactions import build_transactions
from src.association_rules.visualization import generate_rule_visualizations
from src.preprocessing.columns import CONTEXT_FEATURE_COLUMNS, get_ui_target_groups

logger = logging.getLogger(__name__)

RULE_SORT_COLUMNS = ["Confidence", "Lift", "Support"]
SUPPORT_LADDER = (0.05, 0.06, 0.08, 0.10, 0.12, 0.15)
TARGET_MAX_PROFILES = 500


@dataclass
class CandidatePatternResult:
    """Outputs from the Notebook 05 candidate-pattern discovery pipeline."""

    transactions: list[list[str]]
    stage_results: dict[str, MiningResult]
    base_rules: pd.DataFrame
    base_profiles: pd.DataFrame
    trait_modifiers: pd.DataFrame
    export_paths: dict[str, Path]
    summary: dict[str, float | int]
    min_support: float
    stage_summary: pd.DataFrame = field(default_factory=pd.DataFrame)


def _mine_all_stages(
    encoded_by_category: dict[str, pd.DataFrame],
    *,
    min_support: float,
    min_confidence: float,
) -> tuple[pd.DataFrame, dict[str, MiningResult]]:
    """Mine each UI category at one support and concatenate context→UI rules."""
    stage_results: dict[str, MiningResult] = {}
    stage_frames: list[pd.DataFrame] = []

    for category, encoded_df in encoded_by_category.items():
        result = mine_stage(
            encoded_df,
            min_support=min_support,
            min_confidence=min_confidence,
            label=category,
        )
        stage_results[category] = result
        if not result.rules.empty:
            frame = result.rules.copy()
            frame.insert(0, "UI_Category", category)
            stage_frames.append(frame)

    if not stage_frames:
        return pd.DataFrame(), stage_results

    combined = pd.concat(stage_frames, ignore_index=True)
    combined = deduplicate_rules(combined)
    return combined, stage_results


def discover_base_profiles(
    df: pd.DataFrame,
    *,
    min_confidence: float = DEFAULT_MIN_CONFIDENCE,
    ui_groups: dict[str, list[str]] | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, MiningResult], float]:
    """Mine Persona/Mood/Device → UI rules, raising support until manageable."""
    ui_groups = ui_groups or get_ui_target_groups()
    encoded_by_category = {
        category: encode_transactions(
            build_transactions(
                df,
                context_columns=list(CONTEXT_FEATURE_COLUMNS),
                ui_columns=columns,
            )
        )
        for category, columns in ui_groups.items()
    }

    chosen = None
    for support in SUPPORT_LADDER:
        combined, stage_results = _mine_all_stages(
            encoded_by_category,
            min_support=support,
            min_confidence=min_confidence,
        )
        profiles = build_candidate_profiles(combined, context_labels=BASE_CONTEXT_LABELS)
        logger.info(
            "support=%.2f -> %s base rules, %s base profiles",
            support,
            len(combined),
            len(profiles),
        )
        chosen = (support, combined, profiles, stage_results)
        if len(profiles) <= TARGET_MAX_PROFILES:
            break

    support, combined, profiles, stage_results = chosen
    combined = combined.sort_values(RULE_SORT_COLUMNS, ascending=False).reset_index(drop=True)
    return combined, profiles, stage_results, support


def export_candidate_patterns(
    base_rules: pd.DataFrame,
    base_profiles: pd.DataFrame,
    trait_modifiers: pd.DataFrame,
    reports_dir: Path,
) -> dict[str, Path]:
    """Export base candidate profiles, trait modifiers, and base rules."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    profiles_csv = reports_dir / "candidate_base_profiles.csv"
    base_profiles.to_csv(profiles_csv, index=False)
    export_paths["candidate_base_profiles_csv"] = profiles_csv

    profiles_xlsx = reports_dir / "candidate_base_profiles.xlsx"
    base_profiles.to_excel(profiles_xlsx, index=False)
    export_paths["candidate_base_profiles_xlsx"] = profiles_xlsx

    modifiers_csv = reports_dir / "trait_modifiers.csv"
    trait_modifiers.to_csv(modifiers_csv, index=False)
    export_paths["trait_modifiers_csv"] = modifiers_csv

    modifiers_xlsx = reports_dir / "trait_modifiers.xlsx"
    trait_modifiers.to_excel(modifiers_xlsx, index=False)
    export_paths["trait_modifiers_xlsx"] = modifiers_xlsx

    rules_export = build_candidate_rules(base_rules)
    rules_csv = reports_dir / "base_candidate_rules.csv"
    rules_export.to_csv(rules_csv, index=False)
    export_paths["base_candidate_rules_csv"] = rules_csv

    return export_paths


def build_stage_summary(
    stage_results: dict[str, MiningResult],
    base_rules: pd.DataFrame,
) -> pd.DataFrame:
    """Summarize per-category mining results and final base-rule counts."""
    if "UI_Category" in base_rules.columns:
        final_counts = base_rules["UI_Category"].value_counts().to_dict()
    else:
        final_counts = {}

    rows = [
        {
            "UI_Category": category,
            "Min_Support": result.parameters.get("min_support"),
            "Min_Confidence": result.parameters.get("min_confidence"),
            "Frequent_Itemsets": len(result.frequent_itemsets),
            "Raw_Rules": result.raw_rule_count,
            "Base_Rules": final_counts.get(category, 0),
        }
        for category, result in stage_results.items()
    ]
    return pd.DataFrame(rows)


def build_summary(
    transactions: list[list[str]],
    stage_results: dict[str, MiningResult],
    base_rules: pd.DataFrame,
    base_profiles: pd.DataFrame,
    trait_modifiers: pd.DataFrame,
) -> dict[str, float | int]:
    """Build overall summary statistics for notebook display."""
    total_itemsets = sum(len(result.frequent_itemsets) for result in stage_results.values())
    data_driven = int((trait_modifiers["Provenance"] == "data-driven").sum()) if not trait_modifiers.empty else 0
    theory = int((trait_modifiers["Provenance"] == "theory").sum()) if not trait_modifiers.empty else 0

    if base_rules.empty:
        return {
            "total_transactions": len(transactions),
            "frequent_itemsets": total_itemsets,
            "base_rules": 0,
            "base_profiles": 0,
            "trait_modifiers": len(trait_modifiers),
            "modifiers_data_driven": data_driven,
            "modifiers_theory": theory,
            "average_support": 0.0,
            "average_confidence": 0.0,
            "average_lift": 0.0,
        }

    return {
        "total_transactions": len(transactions),
        "frequent_itemsets": total_itemsets,
        "base_rules": len(base_rules),
        "base_profiles": len(base_profiles),
        "trait_modifiers": len(trait_modifiers),
        "modifiers_data_driven": data_driven,
        "modifiers_theory": theory,
        "average_support": float(base_rules["Support"].mean()),
        "average_confidence": float(base_rules["Confidence"].mean()),
        "average_lift": float(base_rules["Lift"].mean()),
    }


def run_candidate_patterns_pipeline(
    df: pd.DataFrame,
    reports_dir: Path,
) -> CandidatePatternResult:
    """Discover base candidate profiles and trait modifiers, and export them."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    figures_dir = reports_dir / "figures"

    transactions = build_transactions(df)
    logger.info("Built %s full transactions", len(transactions))

    base_rules, base_profiles, stage_results, min_support = discover_base_profiles(df)
    trait_modifiers = build_trait_modifiers(df)

    export_paths = export_candidate_patterns(
        base_rules,
        base_profiles,
        trait_modifiers,
        reports_dir,
    )
    export_paths.update(generate_rule_visualizations(base_rules, figures_dir))

    stage_summary = build_stage_summary(stage_results, base_rules)
    summary = build_summary(
        transactions,
        stage_results,
        base_rules,
        base_profiles,
        trait_modifiers,
    )

    summary_path = reports_dir / "candidate_patterns_summary.md"
    stage_lines = [
        f"- **{row.UI_Category}**: {row.Base_Rules} base rules (itemsets={row.Frequent_Itemsets})"
        for row in stage_summary.itertuples()
    ]
    summary_path.write_text(
        "\n".join(
            [
                "# Candidate Patterns Summary",
                "",
                f"- Transactions: {summary['total_transactions']}",
                f"- Chosen min_support: {min_support}",
                f"- Base candidate rules: {summary['base_rules']}",
                f"- Base candidate profiles (Persona+Mood+Device): {summary['base_profiles']}",
                f"- Trait modifiers: {summary['trait_modifiers']} "
                f"({summary['modifiers_data_driven']} data-driven, "
                f"{summary['modifiers_theory']} theory)",
                f"- Average support: {summary['average_support']:.4f}",
                f"- Average confidence: {summary['average_confidence']:.4f}",
                f"- Average lift: {summary['average_lift']:.4f}",
                "",
                "## Base Rules by UI Category",
                "",
                *stage_lines,
            ]
        ),
        encoding="utf-8",
    )
    export_paths["summary_md"] = summary_path

    return CandidatePatternResult(
        transactions=transactions,
        stage_results=stage_results,
        base_rules=base_rules,
        base_profiles=base_profiles,
        trait_modifiers=trait_modifiers,
        export_paths=export_paths,
        summary=summary,
        min_support=min_support,
        stage_summary=stage_summary,
    )
