"""Merge and score base candidate profiles (Persona + Mood + Device).

Notebook 05 emits base candidate profiles keyed by an exact Persona/Mood/Device
antecedent. Many of these describe the same adaptive behaviour at different levels
of specificity (e.g. ``Persona=Deal Hunter`` and ``Persona=Deal Hunter,
Device=Smartphone`` with the same UI). This module:

1. Attaches multi-source evidence to every base profile (statistical + ML + rule
   metrics) and rolls it up to a profile-level score.
2. Merges a more specific profile into a more general one when the general
   profile subsumes its context and their UI profiles are near-identical.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd

from src.evidence_engine.profile_builder import build_adaptation_evidence_table
from src.evidence_engine.profile_scoring import (
    aggregate_profile_scores,
    classify_profile_strength,
)
from src.evidence_engine.profile_similarity import ui_profile_similarity
from src.evidence_engine.profile_vectors import parse_ui_profile

SURVEY_SAMPLE_SIZE = 200
UI_MERGE_THRESHOLD = 0.80

CORE_CONTEXT_FIELDS = ("Persona", "Mood", "Device")

MERGED_PROFILE_COLUMNS = [
    "Base_Profile_ID",
    "Persona",
    "Mood",
    "Device",
    "Antecedent",
    "UI_Adaptations",
    "Num_UI_Adaptations",
    "Base_Profile_Score",
    "Strength",
    "Participants",
    "Avg_Support",
    "Avg_Confidence",
    "Avg_Lift",
    "Avg_Cramers_V",
    "Avg_RF_Importance",
    "Avg_SHAP",
    "Num_Statistically_Significant",
    "Num_Supporting_Rules",
    "Merged_Count",
    "Merged_Profile_IDs",
]


@dataclass
class _BaseRecord:
    profile_id: int
    context: dict[str, str]
    ui_profile: dict[str, str]
    score: float
    row: pd.Series
    merged_ids: list[int]


def _clean_value(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return None
    return text


def _core_context(row: pd.Series) -> dict[str, str]:
    context: dict[str, str] = {}
    for field in CORE_CONTEXT_FIELDS:
        value = _clean_value(row.get(field))
        if value:
            context[field] = value
    return context


def _subsumes(general: dict[str, str], specific: dict[str, str]) -> bool:
    """True when ``general`` imposes a subset of ``specific``'s conditions and agrees."""
    if len(general) > len(specific):
        return False
    for field, value in general.items():
        if specific.get(field) != value:
            return False
    return True


def build_base_profile_evidence(
    profiles: pd.DataFrame,
    statistical: pd.DataFrame,
    importance: pd.DataFrame,
    shap: pd.DataFrame,
    rules: pd.DataFrame,
) -> pd.DataFrame:
    """Attach evidence and roll it up to one scored row per base profile."""
    adaptations = build_adaptation_evidence_table(profiles, statistical, importance, shap, rules)
    scored = aggregate_profile_scores(adaptations)

    # aggregate_profile_scores creates Avg_Support_x (profile) / _y (rule) on merge.
    if "Avg_Support_x" in scored.columns:
        scored["Avg_Support"] = scored["Avg_Support_x"].fillna(scored.get("Avg_Support_y", 0.0))
        scored["Avg_Confidence"] = scored["Avg_Confidence_x"].fillna(scored.get("Avg_Confidence_y", 0.0))
        scored["Avg_Lift"] = scored["Avg_Lift_x"].fillna(scored.get("Avg_Lift_y", 1.0))
    return scored


def merge_similar_base_profiles(scored: pd.DataFrame) -> pd.DataFrame:
    """Merge subsumed, near-identical base profiles into the more general profile."""
    records: list[_BaseRecord] = []
    for _, row in scored.iterrows():
        records.append(
            _BaseRecord(
                profile_id=int(row["Profile_ID"]),
                context=_core_context(row),
                ui_profile=parse_ui_profile(str(row.get("UI_Adaptations", ""))),
                score=float(row.get("Overall_Profile_Score", 0.0) or 0.0),
                row=row,
                merged_ids=[int(row["Profile_ID"])],
            )
        )

    # Process the most general, highest-scoring profiles first.
    records.sort(key=lambda record: (len(record.context), -record.score))

    kept: list[_BaseRecord] = []
    for record in records:
        target = None
        for candidate in kept:
            if _subsumes(candidate.context, record.context) and (
                ui_profile_similarity(candidate.ui_profile, record.ui_profile)
                >= UI_MERGE_THRESHOLD
            ):
                target = candidate
                break
        if target is not None:
            target.merged_ids.append(record.profile_id)
        else:
            kept.append(record)

    kept.sort(key=lambda record: -record.score)

    rows: list[dict[str, object]] = []
    for profile_id, record in enumerate(kept, start=1):
        row = record.row
        avg_support = float(row.get("Avg_Support", 0.0) or 0.0)
        score = record.score
        rows.append(
            {
                "Base_Profile_ID": profile_id,
                "Persona": record.context.get("Persona"),
                "Mood": record.context.get("Mood"),
                "Device": record.context.get("Device"),
                "Antecedent": str(row.get("Antecedent", "")),
                "UI_Adaptations": str(row.get("UI_Adaptations", "")),
                "Num_UI_Adaptations": len(record.ui_profile),
                "Base_Profile_Score": round(score, 6),
                "Strength": classify_profile_strength(score),
                "Participants": max(1, round(avg_support * SURVEY_SAMPLE_SIZE)),
                "Avg_Support": round(avg_support, 6),
                "Avg_Confidence": round(float(row.get("Avg_Confidence", 0.0) or 0.0), 6),
                "Avg_Lift": round(float(row.get("Avg_Lift", 1.0) or 1.0), 6),
                "Avg_Cramers_V": round(float(row.get("Avg_Cramers_V", 0.0) or 0.0), 6),
                "Avg_RF_Importance": round(float(row.get("Avg_RF_Importance", 0.0) or 0.0), 6),
                "Avg_SHAP": round(float(row.get("Avg_SHAP", 0.0) or 0.0), 6),
                "Num_Statistically_Significant": int(row.get("Num_Statistically_Significant", 0) or 0),
                "Num_Supporting_Rules": int(row.get("Num_Supporting_Rules", 0) or 0),
                "Merged_Count": len(record.merged_ids),
                "Merged_Profile_IDs": ", ".join(str(pid) for pid in sorted(record.merged_ids)),
            }
        )

    return pd.DataFrame(rows, columns=MERGED_PROFILE_COLUMNS)
