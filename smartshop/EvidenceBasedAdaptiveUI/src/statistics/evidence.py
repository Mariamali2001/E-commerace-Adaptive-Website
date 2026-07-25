"""Evidence scoring and tiered export utilities for statistical validation."""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

EVIDENCE_SCORE_V_WEIGHT = 0.35
EVIDENCE_SCORE_RAW_P_WEIGHT = 0.35
EVIDENCE_SCORE_ADJ_P_WEIGHT = 0.30

STRONG_ADJUSTED_P_THRESHOLD = 0.05
MODERATE_RAW_P_THRESHOLD = 0.05
MODERATE_CRAMERS_V_THRESHOLD = 0.20
EXPLORATORY_RAW_P_THRESHOLD = 0.10

RESULT_COLUMNS = [
    "Predictor",
    "UI_Element",
    "ChiSquare",
    "DOF",
    "Raw_P",
    "Adjusted_P",
    "Adjusted_P_Per_Predictor",
    "Cramers_V",
    "Effect_Size",
    "Sample_Size",
    "Significant",
    "Significant_Nominal",
    "Significant_Per_Predictor",
    "Evidence_Score",
    "Evidence_Level",
    "Is_Strong_Evidence",
    "Is_Moderate_Evidence",
    "Is_Exploratory_Evidence",
]


def min_max_normalize(values: pd.Series) -> pd.Series:
    """Scale a numeric series to the 0–1 range."""
    minimum = values.min()
    maximum = values.max()
    if maximum == minimum:
        return pd.Series(0.0, index=values.index)
    return (values - minimum) / (maximum - minimum)


def compute_evidence_score(results: pd.DataFrame) -> pd.Series:
    """Compute normalized evidence score for each predictor × UI relationship."""
    cramers_v_normalized = min_max_normalize(results["Cramers_V"])
    raw_p_component = 1.0 - results["Raw_P"]
    adjusted_p_component = 1.0 - results["Adjusted_P_Per_Predictor"]

    weighted_score = (
        EVIDENCE_SCORE_V_WEIGHT * cramers_v_normalized
        + EVIDENCE_SCORE_RAW_P_WEIGHT * raw_p_component
        + EVIDENCE_SCORE_ADJ_P_WEIGHT * adjusted_p_component
    )
    return min_max_normalize(weighted_score).clip(0.0, 1.0)


def assign_evidence_level(row: pd.Series) -> str:
    """Assign the highest evidence tier met by a relationship."""
    if row["Is_Strong_Evidence"]:
        return "Strong Statistical Evidence"
    if row["Is_Moderate_Evidence"]:
        return "Moderate Statistical Evidence"
    if row["Is_Exploratory_Evidence"]:
        return "Exploratory Evidence"
    return "Not Classified"


def enrich_results_with_evidence(results: pd.DataFrame) -> pd.DataFrame:
    """Add evidence tiers, labels, and evidence score to statistical results."""
    enriched = results.copy()
    enriched["Raw_P"] = enriched["P_Value"]

    enriched["Is_Strong_Evidence"] = enriched["Adjusted_P"] < STRONG_ADJUSTED_P_THRESHOLD
    enriched["Is_Moderate_Evidence"] = (
        (enriched["Raw_P"] < MODERATE_RAW_P_THRESHOLD)
        & (enriched["Cramers_V"] >= MODERATE_CRAMERS_V_THRESHOLD)
    )
    enriched["Is_Exploratory_Evidence"] = (
        enriched["Raw_P"] < EXPLORATORY_RAW_P_THRESHOLD
    )
    enriched["Evidence_Score"] = compute_evidence_score(enriched)
    enriched["Evidence_Level"] = enriched.apply(assign_evidence_level, axis=1)

    available_columns = [column for column in RESULT_COLUMNS if column in enriched.columns]
    remaining_columns = [column for column in enriched.columns if column not in available_columns]
    return enriched[available_columns + remaining_columns]


def split_evidence_levels(results: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """Split results into strong, moderate, and exploratory evidence tables."""
    return {
        "strong": results[results["Is_Strong_Evidence"]].copy(),
        "moderate": results[results["Is_Moderate_Evidence"]].copy(),
        "exploratory": results[results["Is_Exploratory_Evidence"]].copy(),
    }


def build_top_evidence_tables(
    results: pd.DataFrame,
    *,
    top_n: int = 30,
) -> dict[str, pd.DataFrame]:
    """Build top-N tables ranked by Cramér's V and Evidence Score."""
    return {
        "Top30_Cramers_V": results.sort_values("Cramers_V", ascending=False).head(top_n),
        "Top30_Evidence_Score": results.sort_values(
            "Evidence_Score",
            ascending=False,
        ).head(top_n),
    }


def _export_table(df: pd.DataFrame, base_path: Path) -> dict[str, Path]:
    """Export a dataframe to CSV and Excel."""
    base_path.parent.mkdir(parents=True, exist_ok=True)
    csv_path = base_path.with_suffix(".csv")
    xlsx_path = base_path.with_suffix(".xlsx")
    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False)
    return {"csv": csv_path, "xlsx": xlsx_path}


def export_statistical_outputs(
    results: pd.DataFrame,
    tables_dir: Path,
    *,
    top_n: int = 30,
) -> dict[str, Path]:
    """Export full results and tiered evidence tables for downstream notebooks."""
    tables_dir.mkdir(parents=True, exist_ok=True)
    exported: dict[str, Path] = {}

    full_results = enrich_results_with_evidence(results)
    exported.update(_export_table(full_results, tables_dir / "statistical_results"))

    for level_name, level_df in split_evidence_levels(full_results).items():
        exported.update(_export_table(level_df, tables_dir / f"{level_name}_evidence"))

    top_tables = build_top_evidence_tables(full_results, top_n=top_n)
    top_xlsx_path = tables_dir / "top_evidence.xlsx"
    top_csv_cramers = tables_dir / "top30_cramers_v.csv"
    top_csv_score = tables_dir / "top30_evidence_score.csv"

    with pd.ExcelWriter(top_xlsx_path, engine="openpyxl") as writer:
        for sheet_name, table in top_tables.items():
            table.to_excel(writer, sheet_name=sheet_name, index=False)

    top_tables["Top30_Cramers_V"].to_csv(top_csv_cramers, index=False)
    top_tables["Top30_Evidence_Score"].to_csv(top_csv_score, index=False)

    exported["top_evidence_xlsx"] = top_xlsx_path
    exported["top30_cramers_v_csv"] = top_csv_cramers
    exported["top30_evidence_score_csv"] = top_csv_score

    logger.info("Exported statistical outputs to %s", tables_dir)
    return exported


def summarize_evidence_statistics(
    results: pd.DataFrame,
    *,
    top_n: int = 30,
) -> dict[str, object]:
    """Compute summary statistics for notebook reporting."""
    enriched = enrich_results_with_evidence(results)
    levels = split_evidence_levels(enriched)
    top_tables = build_top_evidence_tables(enriched, top_n=top_n)

    strongest_cramers = enriched.loc[enriched["Cramers_V"].idxmax()]
    strongest_score = enriched.loc[enriched["Evidence_Score"].idxmax()]

    return {
        "total_tests": int(len(enriched)),
        "significant_nominal": int(enriched["Significant_Nominal"].sum()),
        "significant_global_fdr": int(enriched["Significant"].sum()),
        "significant_per_predictor_fdr": int(enriched["Significant_Per_Predictor"].sum()),
        "medium_effect_sizes": int((enriched["Effect_Size"] == "Medium").sum()),
        "large_effect_sizes": int((enriched["Effect_Size"] == "Large").sum()),
        "strong_evidence_count": int(len(levels["strong"])),
        "moderate_evidence_count": int(len(levels["moderate"])),
        "exploratory_evidence_count": int(len(levels["exploratory"])),
        "top30_cramers_v": top_tables["Top30_Cramers_V"],
        "top30_evidence_score": top_tables["Top30_Evidence_Score"],
        "strongest_cramers_v": {
            "Predictor": strongest_cramers["Predictor"],
            "UI_Element": strongest_cramers["UI_Element"],
            "Cramers_V": float(strongest_cramers["Cramers_V"]),
            "Raw_P": float(strongest_cramers["Raw_P"]),
            "Evidence_Score": float(strongest_cramers["Evidence_Score"]),
        },
        "strongest_evidence_score": {
            "Predictor": strongest_score["Predictor"],
            "UI_Element": strongest_score["UI_Element"],
            "Cramers_V": float(strongest_score["Cramers_V"]),
            "Raw_P": float(strongest_score["Raw_P"]),
            "Evidence_Score": float(strongest_score["Evidence_Score"]),
        },
        "average_cramers_v": float(enriched["Cramers_V"].mean()),
        "average_evidence_score": float(enriched["Evidence_Score"].mean()),
        "enriched_results": enriched,
    }
