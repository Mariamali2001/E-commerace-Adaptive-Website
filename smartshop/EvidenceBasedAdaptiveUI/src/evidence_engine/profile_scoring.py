"""Evidence scoring for adaptive UI profiles (Notebook 06)."""

from __future__ import annotations

import pandas as pd

from src.statistics.evidence import min_max_normalize

ADAPTATION_EVIDENCE_WEIGHTS: dict[str, float] = {
    "Statistical_Evidence": 0.20,
    "Feature_Importance": 0.25,
    "SHAP": 0.20,
    "Confidence": 0.20,
    "Lift": 0.15,
}

REPRESENTATIVE_PROFILE_WEIGHTS: dict[str, float] = {
    "Statistical_Evidence": 0.20,
    "Feature_Importance": 0.20,
    "SHAP": 0.15,
    "Confidence": 0.20,
    "Lift": 0.15,
    "Participant_Coverage": 0.10,
}

PROFILE_STRENGTH_THRESHOLDS: dict[str, float] = {
    "Very Strong": 0.85,
    "Strong": 0.70,
    "Moderate": 0.55,
}


def classify_profile_strength(score: float) -> str:
    """Assign a qualitative strength label from a 0–1 profile score."""
    if score >= PROFILE_STRENGTH_THRESHOLDS["Very Strong"]:
        return "Very Strong"
    if score >= PROFILE_STRENGTH_THRESHOLDS["Strong"]:
        return "Strong"
    if score >= PROFILE_STRENGTH_THRESHOLDS["Moderate"]:
        return "Moderate"
    return "Weak"


def normalize_adaptation_metrics(adaptations: pd.DataFrame) -> pd.DataFrame:
    """Min-max normalize raw evidence metrics to 0–1 on the adaptation table."""
    scored = adaptations.copy()
    scored["Norm_Cramers_V"] = min_max_normalize(scored["Cramers_V"].fillna(0))
    scored["Norm_RF_Importance"] = min_max_normalize(scored["RF_Importance"].fillna(0))
    scored["Norm_Mean_SHAP"] = min_max_normalize(scored["Mean_SHAP"].fillna(0))
    scored["Norm_Support"] = min_max_normalize(scored["Rule_Support"].fillna(0))
    scored["Norm_Confidence"] = min_max_normalize(scored["Rule_Confidence"].fillna(0))
    scored["Norm_Lift"] = min_max_normalize(scored["Rule_Lift"].fillna(0))
    return scored


def compute_adaptation_evidence_score(adaptations: pd.DataFrame) -> pd.Series:
    """Weighted evidence score for each UI adaptation."""
    return (
        ADAPTATION_EVIDENCE_WEIGHTS["Statistical_Evidence"] * adaptations["Norm_Cramers_V"]
        + ADAPTATION_EVIDENCE_WEIGHTS["Feature_Importance"] * adaptations["Norm_RF_Importance"]
        + ADAPTATION_EVIDENCE_WEIGHTS["SHAP"] * adaptations["Norm_Mean_SHAP"]
        + ADAPTATION_EVIDENCE_WEIGHTS["Confidence"] * adaptations["Norm_Confidence"]
        + ADAPTATION_EVIDENCE_WEIGHTS["Lift"] * adaptations["Norm_Lift"]
    ).clip(0.0, 1.0)


def aggregate_profile_scores(adaptations: pd.DataFrame) -> pd.DataFrame:
    """Roll adaptation-level evidence up to profile-level summary metrics."""
    profile_cols = [
        "Antecedent",
        "Persona",
        "Mood",
        "Device",
        "Extraversion",
        "Agreeableness",
        "Conscientiousness",
        "Neuroticism",
        "Openness",
        "Num_Context_Conditions",
        "Num_UI_Adaptations",
        "Num_Supporting_Rules",
        "Avg_Support",
        "Avg_Confidence",
        "Avg_Lift",
    ]
    available_profile_cols = [column for column in profile_cols if column in adaptations.columns]

    metadata = (
        adaptations.groupby("Profile_ID", as_index=False)[available_profile_cols].first()
        if available_profile_cols
        else adaptations[["Profile_ID"]].drop_duplicates()
    )

    metrics = adaptations.groupby("Profile_ID", as_index=False).agg(
        Overall_Profile_Score=("Evidence_Score", "mean"),
        Num_Statistically_Significant=("Is_Statistically_Significant", "sum"),
        Avg_Cramers_V=("Cramers_V", "mean"),
        Avg_RF_Importance=("RF_Importance", "mean"),
        Avg_SHAP=("Mean_SHAP", "mean"),
        Avg_Support=("Rule_Support", "mean"),
        Avg_Confidence=("Rule_Confidence", "mean"),
        Avg_Lift=("Rule_Lift", "mean"),
    )
    metrics["Avg_Evidence_Score"] = metrics["Overall_Profile_Score"]

    ui_lists = (
        adaptations.groupby("Profile_ID")["UI_Adaptation"]
        .apply(lambda items: " | ".join(sorted(set(items))))
        .reset_index(name="UI_Adaptations")
    )

    profiles = metadata.merge(metrics, on="Profile_ID", how="left").merge(
        ui_lists,
        on="Profile_ID",
        how="left",
    )
    return profiles.sort_values("Overall_Profile_Score", ascending=False).reset_index(drop=True)


def score_representative_profiles(representatives: pd.DataFrame) -> pd.DataFrame:
    """Normalize evidence columns and compute representative profile scores."""
    scored = representatives.copy()
    scored["Norm_Statistical_Evidence"] = min_max_normalize(scored["Avg_Cramers_V"].fillna(0))
    scored["Norm_Feature_Importance"] = min_max_normalize(scored["Avg_RF_Importance"].fillna(0))
    scored["Norm_SHAP"] = min_max_normalize(scored["Avg_SHAP"].fillna(0))
    scored["Norm_Confidence"] = min_max_normalize(scored["Avg_Confidence"].fillna(0))
    scored["Norm_Lift"] = min_max_normalize(scored["Avg_Lift"].fillna(0))
    scored["Norm_Participant_Coverage"] = min_max_normalize(
        scored["Participant_Coverage"].fillna(0)
    )

    scored["Representative_Profile_Score"] = (
        REPRESENTATIVE_PROFILE_WEIGHTS["Statistical_Evidence"] * scored["Norm_Statistical_Evidence"]
        + REPRESENTATIVE_PROFILE_WEIGHTS["Feature_Importance"] * scored["Norm_Feature_Importance"]
        + REPRESENTATIVE_PROFILE_WEIGHTS["SHAP"] * scored["Norm_SHAP"]
        + REPRESENTATIVE_PROFILE_WEIGHTS["Confidence"] * scored["Norm_Confidence"]
        + REPRESENTATIVE_PROFILE_WEIGHTS["Lift"] * scored["Norm_Lift"]
        + REPRESENTATIVE_PROFILE_WEIGHTS["Participant_Coverage"] * scored["Norm_Participant_Coverage"]
    ).clip(0.0, 1.0)

    return scored.sort_values("Representative_Profile_Score", ascending=False).reset_index(drop=True)
