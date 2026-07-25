"""Chi-square test utilities for categorical association analysis."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency

logger = logging.getLogger(__name__)


def build_contingency_table(
    df: pd.DataFrame,
    predictor: str,
    ui_element: str,
) -> pd.DataFrame | None:
    """Build a contingency table for two categorical variables."""
    if predictor not in df.columns or ui_element not in df.columns:
        logger.warning("Missing column(s): %s, %s", predictor, ui_element)
        return None

    subset = df[[predictor, ui_element]].dropna()
    if subset.empty:
        return None

    table = pd.crosstab(subset[predictor], subset[ui_element])
    if table.shape[0] < 2 or table.shape[1] < 2:
        return None

    return table


def run_chi_square_test(table: pd.DataFrame) -> dict[str, Any] | None:
    """Run a chi-square independence test on a contingency table."""
    if table is None or table.empty:
        return None

    try:
        chi2, p_value, dof, expected = chi2_contingency(table)
    except ValueError as exc:
        logger.debug("Chi-square test failed: %s", exc)
        return None

    return {
        "ChiSquare": float(chi2),
        "DOF": int(dof),
        "P_Value": float(p_value),
        "Expected_Frequencies": expected,
        "Sample_Size": int(table.to_numpy().sum()),
        "Table_Shape": table.shape,
    }
