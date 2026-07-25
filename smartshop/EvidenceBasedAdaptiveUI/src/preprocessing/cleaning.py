"""Data cleaning and validation utilities."""

from __future__ import annotations

import logging
from typing import Iterable

import pandas as pd

logger = logging.getLogger(__name__)

BFI10_RAW_COLUMNS: list[str] = [
    "trait_introversion",
    "trait_trust",
    "trait_low_conscientiousness",
    "trait_emotional_stability",
    "trait_low_openness",
    "trait_extraversion",
    "trait_agreeableness_reverse",
    "trait_conscientiousness",
    "trait_neuroticism",
    "trait_openness",
]

BIG_FIVE_TRAITS: list[str] = [
    "Extraversion",
    "Agreeableness",
    "Conscientiousness",
    "Neuroticism",
    "Openness",
]


def dataset_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Return dtype, missing count, and unique count for each column."""
    return pd.DataFrame(
        {
            "dtype": df.dtypes.astype(str),
            "missing": df.isna().sum(),
            "unique": df.nunique(),
        }
    )


def filter_attention_checks(
    df: pd.DataFrame,
    attention_column: str = "attention_check",
    expected_attention_value: int = 3,
) -> pd.DataFrame:
    """Remove responses that fail attention-check questions."""
    filtered = df.copy()
    initial_rows = len(filtered)

    if attention_column in filtered.columns:
        filtered = filtered[filtered[attention_column] == expected_attention_value]
        logger.info(
            "Removed %s rows via %s filter",
            initial_rows - len(filtered),
            attention_column,
        )
    else:
        logger.warning("Attention column '%s' not found.", attention_column)

    check_columns = ["check1", "check2", "check3", "check4", "check5"]
    if all(column in filtered.columns for column in check_columns):
        before_checks = len(filtered)
        filtered = filtered[
            (filtered["check1"] == 3)
            & (filtered["check2"] == 3)
            & (filtered["check3"] == "Rounded Corners")
            & (filtered["check4"] == 3)
            & (filtered["check5"] == 3)
        ].copy()
        logger.info("Removed %s rows via check1-check5 filters", before_checks - len(filtered))

    return filtered


def standardize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace, lowercase, and replace spaces with underscores."""
    cleaned = df.copy()
    cleaned.columns = (
        cleaned.columns.str.strip().str.lower().str.replace(" ", "_", regex=False)
    )
    return cleaned


def compute_big_five_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Reverse-score negative BFI-10 items and compute Big Five trait scores."""
    scored = df.copy()

    scored["trait_introversion_r"] = 6 - scored["trait_introversion"]
    scored["trait_agreeableness_reverse_r"] = 6 - scored["trait_agreeableness_reverse"]
    scored["trait_low_conscientiousness_r"] = 6 - scored["trait_low_conscientiousness"]
    scored["trait_emotional_stability_r"] = 6 - scored["trait_emotional_stability"]
    scored["trait_low_openness_r"] = 6 - scored["trait_low_openness"]

    scored["Extraversion"] = (
        scored["trait_extraversion"] + scored["trait_introversion_r"]
    ) / 2
    scored["Agreeableness"] = (
        scored["trait_trust"] + scored["trait_agreeableness_reverse_r"]
    ) / 2
    scored["Conscientiousness"] = (
        scored["trait_conscientiousness"] + scored["trait_low_conscientiousness_r"]
    ) / 2
    scored["Neuroticism"] = (
        scored["trait_neuroticism"] + scored["trait_emotional_stability_r"]
    ) / 2
    scored["Openness"] = (
        scored["trait_openness"] + scored["trait_low_openness_r"]
    ) / 2

    return scored


def categorize_trait(score: float) -> str:
    """Map a continuous trait score to Low, Medium, or High."""
    if score <= 2.5:
        return "Low"
    if score <= 3.5:
        return "Medium"
    return "High"


def add_big_five_levels(
    df: pd.DataFrame,
    traits: Iterable[str] = BIG_FIVE_TRAITS,
) -> pd.DataFrame:
    """Add categorical Big Five level columns."""
    leveled = df.copy()
    for trait in traits:
        leveled[f"{trait}_Level"] = leveled[trait].apply(categorize_trait)
    return leveled


def drop_bfi10_raw_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Drop original BFI-10 questionnaire item columns."""
    existing = [column for column in BFI10_RAW_COLUMNS if column in df.columns]
    return df.drop(columns=existing)


def categorical_quality_report(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize unique values and missing counts for object columns."""
    rows = []
    for column in df.select_dtypes(include="object").columns:
        rows.append(
            {
                "column": column,
                "unique_values": df[column].nunique(),
                "missing": df[column].isna().sum(),
            }
        )
    return pd.DataFrame(rows)
