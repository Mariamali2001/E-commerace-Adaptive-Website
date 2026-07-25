"""Merge and score Big Five trait modifiers.

Trait modifiers are ordinal UI nudges keyed by ``(Trait, Level, Property)``. This
module consolidates duplicate/conflicting nudges into one per key and attaches an
evidence score built from statistical association (Cramér's V), ML importance
(Random Forest + SHAP), the observed ordinal effect size, and group coverage.
Theory-sourced nudges are discounted so data-driven adaptations rank higher.
"""

from __future__ import annotations

import pandas as pd

from src.association_rules.modifiers import PROPERTY_COLUMNS
from src.evidence_engine.scoring import prepare_ml_evidence
from src.statistics.evidence import min_max_normalize

SURVEY_SAMPLE_SIZE = 200

MODIFIER_SCORE_WEIGHTS: dict[str, float] = {
    "Statistical_Evidence": 0.30,
    "Feature_Importance": 0.25,
    "SHAP": 0.15,
    "Effect_Size": 0.15,
    "Coverage": 0.15,
}

PROVENANCE_FACTORS: dict[str, float] = {
    "data-driven": 1.0,
    "theory": 0.6,
}

MODIFIER_STRENGTH_THRESHOLDS: dict[str, float] = {
    "Very Strong": 0.70,
    "Strong": 0.50,
    "Moderate": 0.30,
}


def classify_modifier_strength(score: float) -> str:
    """Assign a qualitative strength label from a 0–1 modifier evidence score."""
    if score >= MODIFIER_STRENGTH_THRESHOLDS["Very Strong"]:
        return "Very Strong"
    if score >= MODIFIER_STRENGTH_THRESHOLDS["Strong"]:
        return "Strong"
    if score >= MODIFIER_STRENGTH_THRESHOLDS["Moderate"]:
        return "Moderate"
    return "Weak"


def merge_trait_modifiers(modifiers: pd.DataFrame) -> pd.DataFrame:
    """Keep one nudge per (Trait, Level, Property), dropping neutral nudges.

    On conflict, a data-driven nudge beats a theory nudge; among equals, the
    larger absolute effect wins.
    """
    if modifiers.empty:
        return modifiers.copy()

    active = modifiers[modifiers["Nudge"] != 0].copy()
    active["_provenance_rank"] = (active["Provenance"] == "data-driven").astype(int)
    active["_effect"] = active["Delta"].abs().fillna(0.0)

    active = active.sort_values(
        ["Trait", "Level", "Property", "_provenance_rank", "_effect"],
        ascending=[True, True, True, False, False],
    )
    merged = active.drop_duplicates(subset=["Trait", "Level", "Property"], keep="first")
    return merged.drop(columns=["_provenance_rank", "_effect"]).reset_index(drop=True)


def _stat_lookup(statistical_index: pd.DataFrame, trait: str, prop: str) -> float:
    columns = PROPERTY_COLUMNS.get(prop, [])
    if not columns:
        return 0.0
    predictor = f"{trait}_Level"
    matches = statistical_index.loc[
        (statistical_index.index.get_level_values("Predictor") == predictor)
        & (statistical_index.index.get_level_values("UI_Element").isin(columns))
    ]
    if matches.empty:
        return 0.0
    return float(matches["Cramers_V"].max())


def _ml_lookup(ml_index: pd.DataFrame, trait: str, prop: str) -> dict[str, float]:
    columns = PROPERTY_COLUMNS.get(prop, [])
    if not columns:
        return {"RF_Importance": 0.0, "Mean_SHAP": 0.0}
    predictor = f"{trait}_Level"
    matches = ml_index.loc[
        (ml_index.index.get_level_values("Predictor") == predictor)
        & (ml_index.index.get_level_values("UI_Element").isin(columns))
    ]
    if matches.empty:
        return {"RF_Importance": 0.0, "Mean_SHAP": 0.0}
    return {
        "RF_Importance": float(matches["RF_Importance"].fillna(0.0).max()),
        "Mean_SHAP": float(matches["Mean_SHAP"].fillna(0.0).max()),
    }


def score_trait_modifiers(
    modifiers: pd.DataFrame,
    statistical: pd.DataFrame,
    importance: pd.DataFrame,
    shap: pd.DataFrame,
) -> pd.DataFrame:
    """Attach an evidence score and strength label to each merged trait modifier."""
    if modifiers.empty:
        return modifiers.copy()

    statistical_index = statistical.set_index(["Predictor", "UI_Element"])
    ml_index = prepare_ml_evidence(importance, shap).set_index(["Predictor", "UI_Element"])

    scored = modifiers.copy()
    scored["Cramers_V"] = [
        _stat_lookup(statistical_index, row.Trait, row.Property) for row in scored.itertuples()
    ]
    ml_values = [_ml_lookup(ml_index, row.Trait, row.Property) for row in scored.itertuples()]
    scored["RF_Importance"] = [value["RF_Importance"] for value in ml_values]
    scored["Mean_SHAP"] = [value["Mean_SHAP"] for value in ml_values]
    scored["Effect_Size"] = scored["Delta"].abs().fillna(0.0)
    scored["Coverage"] = (scored["Group_N"].fillna(0) / SURVEY_SAMPLE_SIZE).clip(0.0, 1.0)

    norm_stat = min_max_normalize(scored["Cramers_V"])
    norm_rf = min_max_normalize(scored["RF_Importance"])
    norm_shap = min_max_normalize(scored["Mean_SHAP"])
    norm_effect = min_max_normalize(scored["Effect_Size"])
    provenance_factor = scored["Provenance"].map(PROVENANCE_FACTORS).fillna(0.6)

    scored["Modifier_Evidence_Score"] = (
        provenance_factor
        * (
            MODIFIER_SCORE_WEIGHTS["Statistical_Evidence"] * norm_stat
            + MODIFIER_SCORE_WEIGHTS["Feature_Importance"] * norm_rf
            + MODIFIER_SCORE_WEIGHTS["SHAP"] * norm_shap
            + MODIFIER_SCORE_WEIGHTS["Effect_Size"] * norm_effect
            + MODIFIER_SCORE_WEIGHTS["Coverage"] * scored["Coverage"]
        )
    ).clip(0.0, 1.0)
    scored["Modifier_Evidence_Score"] = scored["Modifier_Evidence_Score"].round(6)
    scored["Strength"] = scored["Modifier_Evidence_Score"].map(classify_modifier_strength)

    scored["Cramers_V"] = scored["Cramers_V"].round(6)
    scored["RF_Importance"] = scored["RF_Importance"].round(6)
    scored["Mean_SHAP"] = scored["Mean_SHAP"].round(6)

    return scored.sort_values(
        ["Trait", "Level", "Modifier_Evidence_Score"],
        ascending=[True, True, False],
    ).reset_index(drop=True)
