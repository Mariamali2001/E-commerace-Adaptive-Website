"""Deterministic guideline confidence scoring from multi-source evidence."""

from __future__ import annotations

import pandas as pd

from src.evidence_engine.mapping import (
    canonical_predictor,
    rule_item_to_predictor,
    rule_item_to_ui_element,
    split_rule_items,
)
from src.statistics.evidence import min_max_normalize

GUIDELINE_SCORE_WEIGHTS: dict[str, float] = {
    "Statistical_Evidence": 0.25,
    "Feature_Importance": 0.25,
    "SHAP": 0.20,
    "Confidence": 0.15,
    "Lift": 0.15,
}

STRENGTH_THRESHOLDS: dict[str, float] = {
    "Very Strong": 0.70,
    "Strong": 0.50,
    "Moderate": 0.30,
}


def classify_guideline_strength(score: float) -> str:
    """Assign a qualitative strength label from a 0–1 confidence score."""
    if score >= STRENGTH_THRESHOLDS["Very Strong"]:
        return "Very Strong"
    if score >= STRENGTH_THRESHOLDS["Strong"]:
        return "Strong"
    if score >= STRENGTH_THRESHOLDS["Moderate"]:
        return "Moderate"
    return "Weak"


def aggregate_association_rules(rules: pd.DataFrame) -> pd.DataFrame:
    """Explode adaptation rules into predictor × UI-element pairs with max metrics."""
    if rules.empty:
        return pd.DataFrame(
            columns=[
                "Predictor",
                "UI_Element",
                "Rule_Support",
                "Rule_Confidence",
                "Rule_Lift",
                "Rule_Count",
            ]
        )

    antecedent_col = "Antecedent" if "Antecedent" in rules.columns else "antecedents"
    consequent_col = "Consequent" if "Consequent" in rules.columns else "consequents"
    support_col = "Support" if "Support" in rules.columns else "support"
    confidence_col = "Confidence" if "Confidence" in rules.columns else "confidence"
    lift_col = "Lift" if "Lift" in rules.columns else "lift"

    pairs: list[dict[str, object]] = []
    for _, row in rules.iterrows():
        antecedents = split_rule_items(str(row[antecedent_col]))
        consequents = split_rule_items(str(row[consequent_col]))
        for antecedent in antecedents:
            predictor = rule_item_to_predictor(antecedent)
            if predictor is None:
                continue
            for consequent in consequents:
                ui_element = rule_item_to_ui_element(consequent)
                if ui_element is None:
                    continue
                pairs.append(
                    {
                        "Predictor": predictor,
                        "UI_Element": ui_element,
                        "Rule_Support": float(row[support_col]),
                        "Rule_Confidence": float(row[confidence_col]),
                        "Rule_Lift": float(row[lift_col]),
                    }
                )

    if not pairs:
        return pd.DataFrame(
            columns=[
                "Predictor",
                "UI_Element",
                "Rule_Support",
                "Rule_Confidence",
                "Rule_Lift",
                "Rule_Count",
            ]
        )

    pair_df = pd.DataFrame(pairs)
    return (
        pair_df.groupby(["Predictor", "UI_Element"], as_index=False)
        .agg(
            Rule_Support=("Rule_Support", "max"),
            Rule_Confidence=("Rule_Confidence", "max"),
            Rule_Lift=("Rule_Lift", "max"),
            Rule_Count=("Rule_Support", "size"),
        )
        .sort_values(["Rule_Lift", "Rule_Confidence"], ascending=False)
    )


def prepare_ml_evidence(
    importance: pd.DataFrame,
    shap: pd.DataFrame,
) -> pd.DataFrame:
    """Aggregate Random Forest importance and SHAP by canonical predictor × UI target."""
    importance = importance.copy()
    shap = shap.copy()
    importance["Predictor"] = importance["Predictor"].map(canonical_predictor)
    shap["Predictor"] = shap["Predictor"].map(canonical_predictor)

    importance_agg = (
        importance.groupby(["Predictor", "UI_Target"], as_index=False)
        .agg(
            RF_Importance=("Importance", "max"),
            RF_Rank=("Rank", "min"),
            UI_Group=("UI_Group", "first"),
        )
        .rename(columns={"UI_Target": "UI_Element"})
    )

    shap_agg = (
        shap.groupby(["Predictor", "UI_Target"], as_index=False)
        .agg(
            Mean_SHAP=("Mean_ABS_SHAP", "max"),
            SHAP_Rank=("SHAP_Rank", "min"),
        )
        .rename(columns={"UI_Target": "UI_Element"})
    )

    return importance_agg.merge(shap_agg, on=["Predictor", "UI_Element"], how="outer")


def build_guideline_scores(
    statistical: pd.DataFrame,
    importance: pd.DataFrame,
    shap: pd.DataFrame,
    rules: pd.DataFrame,
) -> pd.DataFrame:
    """Merge all evidence sources and compute normalized component + final scores."""
    base = statistical[
        ["Predictor", "UI_Element", "Cramers_V", "Raw_P", "Evidence_Score", "Evidence_Level"]
    ].copy()

    ml_evidence = prepare_ml_evidence(importance, shap)
    rule_evidence = aggregate_association_rules(rules)

    scored = (
        base.merge(ml_evidence, on=["Predictor", "UI_Element"], how="left")
        .merge(rule_evidence, on=["Predictor", "UI_Element"], how="left")
    )

    scored["Norm_Cramers_V"] = min_max_normalize(scored["Cramers_V"].fillna(0))
    scored["Norm_RF_Importance"] = min_max_normalize(scored["RF_Importance"].fillna(0))
    scored["Norm_Mean_SHAP"] = min_max_normalize(scored["Mean_SHAP"].fillna(0))
    scored["Norm_Support"] = min_max_normalize(scored["Rule_Support"].fillna(0))
    scored["Norm_Confidence"] = min_max_normalize(scored["Rule_Confidence"].fillna(0))
    scored["Norm_Lift"] = min_max_normalize(scored["Rule_Lift"].fillna(0))

    scored["Guideline_Confidence_Score"] = (
        GUIDELINE_SCORE_WEIGHTS["Statistical_Evidence"] * scored["Norm_Cramers_V"]
        + GUIDELINE_SCORE_WEIGHTS["Feature_Importance"] * scored["Norm_RF_Importance"]
        + GUIDELINE_SCORE_WEIGHTS["SHAP"] * scored["Norm_Mean_SHAP"]
        + GUIDELINE_SCORE_WEIGHTS["Confidence"] * scored["Norm_Confidence"]
        + GUIDELINE_SCORE_WEIGHTS["Lift"] * scored["Norm_Lift"]
    ).clip(0.0, 1.0)

    scored["Guideline_Strength"] = scored["Guideline_Confidence_Score"].map(
        classify_guideline_strength
    )
    scored["Is_Validated"] = scored["Guideline_Strength"].isin(["Strong", "Very Strong"])

    return scored.sort_values("Guideline_Confidence_Score", ascending=False).reset_index(
        drop=True
    )


def select_validated_guidelines(
    scored: pd.DataFrame,
    *,
    top_n: int = 100,
) -> pd.DataFrame:
    """Return the top validated guidelines, falling back to highest scores if none pass."""
    validated = scored[scored["Is_Validated"]].copy()
    if validated.empty:
        validated = scored.copy()
    return validated.head(top_n).reset_index(drop=True)
