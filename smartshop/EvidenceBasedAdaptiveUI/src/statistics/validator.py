"""Statistical validation pipeline for predictor × UI relationships."""

from __future__ import annotations

import logging
from itertools import product
from typing import Iterable

import numpy as np
import pandas as pd
from statsmodels.stats.multitest import multipletests

from src.statistics.chi_square import build_contingency_table, run_chi_square_test
from src.statistics.effect_size import cramers_v, interpret_cramers_v

logger = logging.getLogger(__name__)

SIGNIFICANCE_ALPHA = 0.05
EVIDENCE_V_WEIGHT = 0.6
EVIDENCE_P_WEIGHT = 0.4


def generate_predictor_ui_pairs(
    predictors: Iterable[str],
    ui_elements: Iterable[str],
) -> list[tuple[str, str]]:
    """Generate all valid predictor × UI element combinations."""
    return list(product(predictors, ui_elements))


def compute_evidence_strength(cramers_v_value: float, adjusted_p: float) -> float:
    """Compute preliminary evidence strength on a 0–1 scale."""
    strength = (
        EVIDENCE_V_WEIGHT * cramers_v_value
        + EVIDENCE_P_WEIGHT * (1.0 - adjusted_p)
    )
    return float(np.clip(strength, 0.0, 1.0))


def apply_multiple_testing_correction(results: pd.DataFrame) -> pd.DataFrame:
    """Apply global and per-predictor Benjamini-Hochberg FDR correction."""
    corrected = results.copy()

    global_reject, global_adjusted, _, _ = multipletests(
        corrected["P_Value"].to_numpy(),
        alpha=SIGNIFICANCE_ALPHA,
        method="fdr_bh",
    )
    corrected["Adjusted_P"] = global_adjusted
    corrected["Significant"] = global_reject
    corrected["Significant_Nominal"] = corrected["P_Value"] < SIGNIFICANCE_ALPHA

    per_predictor_adjusted = np.full(len(corrected), np.nan)
    per_predictor_significant = np.zeros(len(corrected), dtype=bool)

    for predictor, indices in corrected.groupby("Predictor").groups.items():
        p_values = corrected.loc[indices, "P_Value"].to_numpy()
        reject, adjusted, _, _ = multipletests(
            p_values,
            alpha=SIGNIFICANCE_ALPHA,
            method="fdr_bh",
        )
        per_predictor_adjusted[list(indices)] = adjusted
        per_predictor_significant[list(indices)] = reject

    corrected["Adjusted_P_Per_Predictor"] = per_predictor_adjusted
    corrected["Significant_Per_Predictor"] = per_predictor_significant

    return corrected.sort_values(
        ["Significant", "Significant_Per_Predictor", "Cramers_V"],
        ascending=[False, False, False],
    ).reset_index(drop=True)


def run_pairwise_validation(
    df: pd.DataFrame,
    predictors: Iterable[str],
    ui_elements: Iterable[str],
) -> pd.DataFrame:
    """Run chi-square tests for every predictor × UI element pair."""
    rows: list[dict[str, object]] = []

    for predictor, ui_element in generate_predictor_ui_pairs(predictors, ui_elements):
        table = build_contingency_table(df, predictor, ui_element)
        if table is None:
            continue

        test_result = run_chi_square_test(table)
        if test_result is None:
            continue

        v_value = cramers_v(
            test_result["ChiSquare"],
            test_result["Sample_Size"],
            test_result["Table_Shape"],
        )

        rows.append(
            {
                "Predictor": predictor,
                "UI_Element": ui_element,
                "ChiSquare": test_result["ChiSquare"],
                "DOF": test_result["DOF"],
                "P_Value": test_result["P_Value"],
                "Cramers_V": v_value,
                "Effect_Size": interpret_cramers_v(v_value),
                "Sample_Size": test_result["Sample_Size"],
            }
        )

    if not rows:
        return pd.DataFrame(
            columns=[
                "Predictor",
                "UI_Element",
                "ChiSquare",
                "DOF",
                "P_Value",
                "Adjusted_P",
                "Adjusted_P_Per_Predictor",
                "Cramers_V",
                "Effect_Size",
                "Significant",
                "Significant_Nominal",
                "Significant_Per_Predictor",
                "Evidence_Strength",
            ]
        )

    return apply_multiple_testing_correction(pd.DataFrame(rows))


def filter_validated_relationships(results: pd.DataFrame) -> pd.DataFrame:
    """Return relationships significant after global FDR correction."""
    if results.empty:
        return results.copy()

    return results[results["Significant"]].copy()


def filter_exploratory_candidates(
    results: pd.DataFrame,
    *,
    nominal_alpha: float = SIGNIFICANCE_ALPHA,
    min_cramers_v: float = 0.2,
) -> pd.DataFrame:
    """Return medium-or-strong associations with nominal p below alpha."""
    if results.empty:
        return results.copy()

    return results[
        (results["P_Value"] < nominal_alpha)
        & (results["Cramers_V"] >= min_cramers_v)
    ].copy()


def summarize_validation(results: pd.DataFrame) -> dict[str, object]:
    """Compute high-level summary metrics for the validation run."""
    if results.empty:
        return {
            "total_tests": 0,
            "significant_tests": 0,
            "significant_nominal": 0,
            "significant_per_predictor": 0,
            "exploratory_candidates": 0,
            "strongest_association": None,
            "average_cramers_v": 0.0,
        }

    significant = results[results["Significant"]]
    strongest = results.loc[results["Cramers_V"].idxmax()]
    exploratory = filter_exploratory_candidates(results)

    return {
        "total_tests": int(len(results)),
        "significant_tests": int(len(significant)),
        "significant_nominal": int(results["Significant_Nominal"].sum()),
        "significant_per_predictor": int(results["Significant_Per_Predictor"].sum()),
        "exploratory_candidates": int(len(exploratory)),
        "strongest_association": {
            "Predictor": strongest["Predictor"],
            "UI_Element": strongest["UI_Element"],
            "Cramers_V": float(strongest["Cramers_V"]),
            "P_Value": float(strongest["P_Value"]),
            "Adjusted_P": float(strongest["Adjusted_P"]),
            "Evidence_Strength": float(strongest["Evidence_Strength"]),
        },
        "average_cramers_v": float(results["Cramers_V"].mean()),
    }
