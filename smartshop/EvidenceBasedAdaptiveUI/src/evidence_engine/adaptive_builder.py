"""Notebook 06 pipeline: merge and score base profiles and trait modifiers.

Consumes Notebook 05's two outputs (base candidate profiles + trait modifiers)
plus the statistical (NB03) and ML (NB04) evidence, then produces:

- ``merged_base_profiles`` — near-duplicate base profiles merged and scored.
- ``scored_trait_modifiers`` — one evidence-scored nudge per (Trait, Level,
  Property).

Notebook 07 converts these into the two JSON repositories.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from src.evidence_engine.base_profiles import (
    build_base_profile_evidence,
    merge_similar_base_profiles,
)
from src.evidence_engine.modifier_scoring import (
    MODIFIER_SCORE_WEIGHTS,
    merge_trait_modifiers,
    score_trait_modifiers,
)

logger = logging.getLogger(__name__)

DEFAULT_STATISTICAL_PATH = (
    Path("reports") / "Statistical_Validation" / "tables" / "statistical_results.xlsx"
)
DEFAULT_IMPORTANCE_PATH = Path("reports") / "Feature_Importance" / "feature_importance.xlsx"
DEFAULT_SHAP_PATH = Path("reports") / "Feature_Importance" / "shap_summary.csv"
DEFAULT_BASE_PROFILES_PATH = Path("reports") / "AssociationRules" / "candidate_base_profiles.xlsx"
DEFAULT_BASE_RULES_PATH = Path("reports") / "AssociationRules" / "base_candidate_rules.csv"
DEFAULT_MODIFIERS_PATH = Path("reports") / "AssociationRules" / "trait_modifiers.csv"


@dataclass
class AdaptiveBuilderResult:
    """Outputs from the Notebook 06 adaptive builder pipeline."""

    base_profiles_raw: pd.DataFrame
    merged_base_profiles: pd.DataFrame
    scored_trait_modifiers: pd.DataFrame
    export_paths: dict[str, Path]
    summary: dict[str, object]


def _load_table(path: Path) -> pd.DataFrame:
    if path.exists():
        return pd.read_excel(path) if path.suffix.lower() == ".xlsx" else pd.read_csv(path)
    sibling = path.with_suffix(".csv" if path.suffix.lower() == ".xlsx" else ".xlsx")
    if sibling.exists():
        return pd.read_excel(sibling) if sibling.suffix.lower() == ".xlsx" else pd.read_csv(sibling)
    raise FileNotFoundError(f"Required input not found: {path} (also checked {sibling})")


def _plot_score_distribution(scores: pd.Series, title: str, xlabel: str, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 5))
    plt.hist(scores.dropna(), bins=15, color="#4C72B0", edgecolor="white")
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(path, dpi=200)
    plt.close()
    return path


def _plot_provenance_counts(modifiers: pd.DataFrame, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    counts = modifiers["Provenance"].value_counts()
    plt.figure(figsize=(6, 4))
    plt.bar(counts.index, counts.values, color=["#55A868", "#C44E52"][: len(counts)])
    plt.title("Trait Modifiers by Provenance")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(path, dpi=200)
    plt.close()
    return path


def export_builder_outputs(
    merged_base_profiles: pd.DataFrame,
    scored_trait_modifiers: pd.DataFrame,
    reports_dir: Path,
) -> dict[str, Path]:
    """Export merged base profiles and scored trait modifiers."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    figures_dir = reports_dir / "figures"
    export_paths: dict[str, Path] = {}

    base_csv = reports_dir / "merged_base_profiles.csv"
    merged_base_profiles.to_csv(base_csv, index=False)
    export_paths["merged_base_profiles_csv"] = base_csv

    base_xlsx = reports_dir / "merged_base_profiles.xlsx"
    merged_base_profiles.to_excel(base_xlsx, index=False)
    export_paths["merged_base_profiles_xlsx"] = base_xlsx

    mod_csv = reports_dir / "scored_trait_modifiers.csv"
    scored_trait_modifiers.to_csv(mod_csv, index=False)
    export_paths["scored_trait_modifiers_csv"] = mod_csv

    mod_xlsx = reports_dir / "scored_trait_modifiers.xlsx"
    scored_trait_modifiers.to_excel(mod_xlsx, index=False)
    export_paths["scored_trait_modifiers_xlsx"] = mod_xlsx

    if not merged_base_profiles.empty:
        export_paths["base_score_png"] = _plot_score_distribution(
            merged_base_profiles["Base_Profile_Score"],
            "Base Profile Score Distribution",
            "Base Profile Score",
            figures_dir / "base_profile_score_distribution.png",
        )
    if not scored_trait_modifiers.empty:
        export_paths["modifier_score_png"] = _plot_score_distribution(
            scored_trait_modifiers["Modifier_Evidence_Score"],
            "Trait Modifier Evidence Distribution",
            "Modifier Evidence Score",
            figures_dir / "modifier_evidence_distribution.png",
        )
        export_paths["provenance_png"] = _plot_provenance_counts(
            scored_trait_modifiers,
            figures_dir / "modifier_provenance_counts.png",
        )

    return export_paths


def run_adaptive_builder_pipeline(
    project_root: Path,
    reports_dir: Path,
) -> AdaptiveBuilderResult:
    """Merge and score base profiles and trait modifiers, then export them."""
    statistical = _load_table(project_root / DEFAULT_STATISTICAL_PATH)
    importance = _load_table(project_root / DEFAULT_IMPORTANCE_PATH)
    shap = _load_table(project_root / DEFAULT_SHAP_PATH)
    base_profiles = _load_table(project_root / DEFAULT_BASE_PROFILES_PATH)
    base_rules = _load_table(project_root / DEFAULT_BASE_RULES_PATH)
    modifiers = _load_table(project_root / DEFAULT_MODIFIERS_PATH)

    scored_base = build_base_profile_evidence(
        base_profiles, statistical, importance, shap, base_rules
    )
    merged_base_profiles = merge_similar_base_profiles(scored_base)

    merged_modifiers = merge_trait_modifiers(modifiers)
    scored_trait_modifiers = score_trait_modifiers(
        merged_modifiers, statistical, importance, shap
    )

    export_paths = export_builder_outputs(
        merged_base_profiles, scored_trait_modifiers, reports_dir
    )

    original_base = len(scored_base)
    merged_base = len(merged_base_profiles)
    reduction = (1.0 - merged_base / original_base) * 100.0 if original_base else 0.0

    summary = {
        "original_base_profiles": original_base,
        "merged_base_profiles": merged_base,
        "base_reduction_percent": round(reduction, 2),
        "average_base_profile_score": float(merged_base_profiles["Base_Profile_Score"].mean())
        if not merged_base_profiles.empty
        else 0.0,
        "trait_modifiers": len(scored_trait_modifiers),
        "modifiers_data_driven": int(
            (scored_trait_modifiers["Provenance"] == "data-driven").sum()
        )
        if not scored_trait_modifiers.empty
        else 0,
        "modifiers_theory": int((scored_trait_modifiers["Provenance"] == "theory").sum())
        if not scored_trait_modifiers.empty
        else 0,
        "average_modifier_score": float(
            scored_trait_modifiers["Modifier_Evidence_Score"].mean()
        )
        if not scored_trait_modifiers.empty
        else 0.0,
        "modifier_score_weights": MODIFIER_SCORE_WEIGHTS,
    }

    summary_md = reports_dir / "adaptive_builder_summary.md"
    summary_md.write_text(
        "\n".join(
            [
                "# Adaptive Builder Summary (Notebook 06)",
                "",
                "## Base Profiles",
                f"- Original base profiles: {summary['original_base_profiles']}",
                f"- Merged base profiles: {summary['merged_base_profiles']}",
                f"- Reduction: {summary['base_reduction_percent']:.1f}%",
                f"- Average base profile score: {summary['average_base_profile_score']:.4f}",
                "",
                "## Trait Modifiers",
                f"- Modifiers: {summary['trait_modifiers']} "
                f"({summary['modifiers_data_driven']} data-driven, "
                f"{summary['modifiers_theory']} theory)",
                f"- Average modifier evidence score: {summary['average_modifier_score']:.4f}",
            ]
        ),
        encoding="utf-8",
    )
    export_paths["summary_md"] = summary_md

    logger.info(
        "Adaptive builder: %s base profiles -> %s merged; %s trait modifiers scored",
        original_base,
        merged_base,
        len(scored_trait_modifiers),
    )

    return AdaptiveBuilderResult(
        base_profiles_raw=scored_base,
        merged_base_profiles=merged_base_profiles,
        scored_trait_modifiers=scored_trait_modifiers,
        export_paths=export_paths,
        summary=summary,
    )
