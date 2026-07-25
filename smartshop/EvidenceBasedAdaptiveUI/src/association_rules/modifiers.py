"""Derive Big Five personality modifiers as ordinal UI nudges.

Personality traits do not define a separate interface. Instead, each Big Five
trait level nudges a small set of configurable UI properties up or down. Nudges
are derived from the survey data where evidence is sufficient (``data-driven``)
and fall back to theory-informed priors otherwise (``theory``). Every row records
its provenance so the origin of each adaptation is explicit.
"""

from __future__ import annotations

import pandas as pd

from src.preprocessing.columns import BIG_FIVE_TRAITS

TRAIT_LEVELS: tuple[str, ...] = ("Low", "Medium", "High")

MIN_GROUP_SIZE = 15
NUDGE_THRESHOLD = 0.05

# Ordered category keywords (low → high) for each survey column.
COLUMN_ORDER: dict[str, list[str]] = {
    "desktop_info_density": ["Minimal", "Moderate", "Detailed"],
    "mobile_info_density": ["Minimal", "Moderate", "Detailed"],
    "whitespace_pref": ["Compact", "Balanced", "Spacious"],
    "desktop_whitespace": ["Compact", "Balanced", "Spacious"],
    "mobile_whitespace": ["Compact", "Balanced", "Spacious"],
    "desktop_image_text_ratio": ["Text-focused", "Balanced", "Image-focused"],
    "mobile_image_text_ratio": ["Text-focused", "Balanced", "Image-focused"],
    "hero_banner_size": ["None", "Small", "Medium", "Large"],
    "social_proof_display": [
        "None",
        "Ratings Only",
        "Bestseller",
        "Customer Reviews",
        "User Photos",
    ],
}

# Configurable UI properties personality is allowed to nudge, mapped to the
# survey columns that measure them.
PROPERTY_COLUMNS: dict[str, list[str]] = {
    "information_density": ["desktop_info_density", "mobile_info_density"],
    "whitespace": ["whitespace_pref", "desktop_whitespace", "mobile_whitespace"],
    "visual_richness": [
        "desktop_image_text_ratio",
        "mobile_image_text_ratio",
        "hero_banner_size",
    ],
    "recommendation_emphasis": ["social_proof_display"],
}

# Properties with no direct survey measurement: theory-only.
THEORY_ONLY_PROPERTIES: tuple[str, ...] = ("animation_level",)

# Theory-informed priors (Big Five UI literature). Used only when survey
# evidence is insufficient, or for theory-only properties.
THEORY_PRIORS: dict[tuple[str, str], dict[str, int]] = {
    ("Openness", "High"): {"visual_richness": 1, "animation_level": 1},
    ("Openness", "Low"): {"visual_richness": -1, "animation_level": -1},
    ("Conscientiousness", "High"): {"information_density": 1},
    ("Conscientiousness", "Low"): {"information_density": -1},
    ("Extraversion", "High"): {"recommendation_emphasis": 1, "animation_level": 1},
    ("Extraversion", "Low"): {"recommendation_emphasis": -1},
    ("Neuroticism", "High"): {
        "whitespace": 1,
        "information_density": -1,
        "animation_level": -1,
    },
    ("Agreeableness", "High"): {"recommendation_emphasis": 1},
}

MODIFIER_COLUMNS: list[str] = [
    "Trait",
    "Level",
    "Property",
    "Nudge",
    "Direction",
    "Delta",
    "Group_N",
    "Baseline_Score",
    "Group_Score",
    "Provenance",
]


def _value_to_ordinal(column: str, value: object) -> float | None:
    """Map a raw survey value to a normalized ordinal position in [0, 1]."""
    if not isinstance(value, str):
        return None
    order = COLUMN_ORDER.get(column)
    if not order:
        return None
    text = value.strip()
    for index, keyword in enumerate(order):
        if text.lower().startswith(keyword.lower()):
            return index / (len(order) - 1)
    return None


def _property_scores(df: pd.DataFrame, prop: str) -> pd.Series:
    """Return a per-respondent [0, 1] score for one UI property."""
    columns = [c for c in PROPERTY_COLUMNS[prop] if c in df.columns]
    if not columns:
        return pd.Series(dtype=float)

    normalized = pd.DataFrame(
        {column: df[column].map(lambda v, c=column: _value_to_ordinal(c, v)) for column in columns}
    )
    return normalized.mean(axis=1, skipna=True)


def _direction(nudge: int) -> str:
    if nudge > 0:
        return "increase"
    if nudge < 0:
        return "decrease"
    return "neutral"


def build_trait_modifiers(df: pd.DataFrame) -> pd.DataFrame:
    """Build the trait-modifier table keyed by Big Five level."""
    scores = {prop: _property_scores(df, prop) for prop in PROPERTY_COLUMNS}
    baselines = {prop: float(series.mean()) for prop, series in scores.items()}

    rows: list[dict[str, object]] = []
    for trait in BIG_FIVE_TRAITS:
        level_column = f"{trait}_Level"
        if level_column not in df.columns:
            continue

        for level in TRAIT_LEVELS:
            mask = df[level_column] == level
            group_size = int(mask.sum())
            priors = THEORY_PRIORS.get((trait, level), {})

            for prop in PROPERTY_COLUMNS:
                group_score = float(scores[prop][mask].mean()) if group_size else float("nan")
                baseline = baselines[prop]
                delta = group_score - baseline if group_size else float("nan")

                if group_size >= MIN_GROUP_SIZE and abs(delta) >= NUDGE_THRESHOLD:
                    nudge = 1 if delta > 0 else -1
                    rows.append(
                        {
                            "Trait": trait,
                            "Level": level,
                            "Property": prop,
                            "Nudge": nudge,
                            "Direction": _direction(nudge),
                            "Delta": round(delta, 4),
                            "Group_N": group_size,
                            "Baseline_Score": round(baseline, 4),
                            "Group_Score": round(group_score, 4),
                            "Provenance": "data-driven",
                        }
                    )
                elif prop in priors:
                    nudge = priors[prop]
                    rows.append(
                        {
                            "Trait": trait,
                            "Level": level,
                            "Property": prop,
                            "Nudge": nudge,
                            "Direction": _direction(nudge),
                            "Delta": None,
                            "Group_N": group_size,
                            "Baseline_Score": round(baseline, 4),
                            "Group_Score": round(group_score, 4) if group_size else None,
                            "Provenance": "theory",
                        }
                    )

            for prop in THEORY_ONLY_PROPERTIES:
                if prop in priors:
                    nudge = priors[prop]
                    rows.append(
                        {
                            "Trait": trait,
                            "Level": level,
                            "Property": prop,
                            "Nudge": nudge,
                            "Direction": _direction(nudge),
                            "Delta": None,
                            "Group_N": group_size,
                            "Baseline_Score": None,
                            "Group_Score": None,
                            "Provenance": "theory",
                        }
                    )

    modifiers = pd.DataFrame(rows, columns=MODIFIER_COLUMNS)
    return modifiers.sort_values(
        ["Trait", "Level", "Property"],
    ).reset_index(drop=True)
