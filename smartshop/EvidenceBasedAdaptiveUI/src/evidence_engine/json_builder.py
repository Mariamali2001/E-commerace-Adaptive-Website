"""Map validated guideline rows to the adaptive-UI JSON schema."""

from __future__ import annotations

import math
from typing import Any

import pandas as pd

from src.evidence_engine.mapping import (
    rule_item_to_predictor,
    rule_item_to_ui_element,
    split_rule_items,
)
from src.preprocessing.columns import BIG_FIVE_TRAITS

PREDICTOR_TO_FEATURE_KEY: dict[str, str] = {
    "primary_persona": "persona",
    "current_mood": "mood",
    "primary_device": "device",
}

UI_ELEMENT_TO_ADAPTATION_KEY: dict[str, str] = {
    "desktop_navigation": "navigation",
    "mobile_navigation": "navigation",
    "desktop_product_card": "product_card",
    "mobile_product_card": "product_card",
    "checkout_style": "checkout",
    "desktop_persistent_filters": "persistent_filters",
    "desktop_info_density": "info_density",
    "mobile_info_density": "info_density",
    "desktop_whitespace": "whitespace",
    "mobile_whitespace": "whitespace",
    "whitespace_pref": "whitespace",
    "desktop_image_text_ratio": "image_text_ratio",
    "mobile_image_text_ratio": "image_text_ratio",
    "button_style_pref": "button_style",
    "color_theme_pref": "color_theme",
    "mobile_sticky_header": "sticky_header",
    "font_style_pref": "font_style",
    "font_size_pref": "font_size",
}

REQUIRED_RULE_FIELDS = (
    "rule_id",
    "conditions",
    "adaptations",
    "support",
    "confidence",
    "lift",
    "feature_importance",
    "guideline_score",
)

VALID_PERSONALITY_TRAITS = set(BIG_FIVE_TRAITS)


def ui_element_to_adaptation_key(ui_element: str) -> str:
    """Return a stable adaptation key for a survey UI column."""
    if ui_element in UI_ELEMENT_TO_ADAPTATION_KEY:
        return UI_ELEMENT_TO_ADAPTATION_KEY[ui_element]
    if ui_element.startswith("desktop_"):
        return ui_element.removeprefix("desktop_")
    if ui_element.startswith("mobile_"):
        return ui_element.removeprefix("mobile_")
    return ui_element


def predictor_to_feature_key(predictor: str) -> str:
    """Map a predictor column to a feature-importance key."""
    if predictor in PREDICTOR_TO_FEATURE_KEY:
        return PREDICTOR_TO_FEATURE_KEY[predictor]
    if predictor.endswith("_Level"):
        return predictor.removesuffix("_Level").lower()
    return predictor


def _safe_float(value: object, default: float = 0.0) -> float:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return default
    return round(float(value), 6)


def _parse_context_item(item: str) -> tuple[str, str] | None:
    """Parse ``Mood=Neutral`` or ``Extraversion=High`` into a condition slot."""
    if "=" not in item:
        return None
    label, raw_value = item.split("=", maxsplit=1)
    label = label.strip()
    value = raw_value.strip()
    if label == "Persona":
        return "persona", value
    if label == "Mood":
        return "emotion", value
    if label == "Device":
        return "device", value
    if label in VALID_PERSONALITY_TRAITS:
        return f"personality.{label}", value
    return None


def _parse_ui_item(item: str) -> tuple[str, str] | None:
    """Parse ``Desktop_navigation=Mega Menu`` into adaptation key and value."""
    if "=" not in item:
        return None
    label, raw_value = item.split("=", maxsplit=1)
    ui_element = rule_item_to_ui_element(f"{label}={raw_value}")
    if ui_element is None:
        return None
    return ui_element_to_adaptation_key(ui_element), raw_value.strip()


def _empty_conditions() -> dict[str, Any]:
    return {
        "persona": None,
        "emotion": None,
        "device": None,
        "personality": {},
    }


def _apply_condition(conditions: dict[str, Any], slot: str, value: str) -> None:
    if slot.startswith("personality."):
        trait = slot.split(".", maxsplit=1)[1]
        conditions["personality"][trait] = value
        return
    conditions[slot] = value


def find_best_association_match(
    rules: pd.DataFrame,
    predictor: str,
    ui_element: str,
) -> dict[str, Any] | None:
    """Find the highest-lift association rule matching a predictor × UI pair."""
    if rules.empty:
        return None

    antecedent_col = "Antecedent" if "Antecedent" in rules.columns else None
    consequent_col = "Consequent" if "Consequent" in rules.columns else None
    if antecedent_col is None or consequent_col is None:
        return None

    lift_col = "Lift" if "Lift" in rules.columns else "lift"
    best: dict[str, Any] | None = None
    best_lift = -1.0

    for _, row in rules.iterrows():
        antecedents = split_rule_items(str(row[antecedent_col]))
        consequents = split_rule_items(str(row[consequent_col]))

        antecedent_predictors = {
            rule_item_to_predictor(item)
            for item in antecedents
            if rule_item_to_predictor(item) is not None
        }
        if predictor not in antecedent_predictors:
            continue

        consequent_elements = {
            rule_item_to_ui_element(item)
            for item in consequents
            if rule_item_to_ui_element(item) is not None
        }
        if ui_element not in consequent_elements:
            continue

        lift = float(row[lift_col])
        if lift <= best_lift:
            continue

        conditions = _empty_conditions()
        adaptations: dict[str, str] = {}
        for item in antecedents:
            parsed = _parse_context_item(item)
            if parsed:
                _apply_condition(conditions, parsed[0], parsed[1])
        for item in consequents:
            parsed = _parse_ui_item(item)
            if parsed:
                adaptations[parsed[0]] = parsed[1]

        best_lift = lift
        best = {"conditions": conditions, "adaptations": adaptations}

    return best


def build_conditions(predictor: str, matched: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build the conditions block for one validated guideline."""
    if matched and matched.get("conditions"):
        conditions = _empty_conditions()
        source = matched["conditions"]
        for key in ("persona", "emotion", "device"):
            conditions[key] = source.get(key)
        conditions["personality"] = dict(source.get("personality", {}))
        return conditions

    conditions = _empty_conditions()
    if predictor == "primary_persona":
        conditions["persona"] = "contextual"
    elif predictor == "current_mood":
        conditions["emotion"] = "contextual"
    elif predictor == "primary_device":
        conditions["device"] = "contextual"
    elif predictor.endswith("_Level"):
        trait = predictor.removesuffix("_Level")
        conditions["personality"][trait] = "contextual"
    return conditions


def build_adaptations(
    ui_element: str,
    matched: dict[str, Any] | None = None,
) -> dict[str, str]:
    """Build the adaptations block for one validated guideline."""
    adaptation_key = ui_element_to_adaptation_key(ui_element)
    if matched and matched.get("adaptations"):
        adaptations = dict(matched["adaptations"])
        if adaptation_key not in adaptations:
            adaptations[adaptation_key] = ui_element
        return adaptations
    return {adaptation_key: ui_element}


def build_feature_importance_map(
    guidelines: pd.DataFrame,
    ui_element: str,
) -> dict[str, float]:
    """Aggregate normalized RF importances for all predictors of one UI element."""
    subset = guidelines[guidelines["UI_Element"] == ui_element].copy()
    weights: dict[str, float] = {}
    for _, row in subset.iterrows():
        importance = row.get("RF_Importance")
        if importance is None or (isinstance(importance, float) and math.isnan(importance)):
            continue
        key = predictor_to_feature_key(str(row["Predictor"]))
        weights[key] = max(weights.get(key, 0.0), float(importance))

    total = sum(weights.values())
    if total <= 0:
        return {}
    return {key: round(value / total, 6) for key, value in weights.items()}


def row_to_guideline_rule(
    row: pd.Series,
    *,
    rule_id: int,
    guidelines: pd.DataFrame,
    association_rules: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Convert one validated-guideline row into a JSON rule object."""
    predictor = str(row["Predictor"])
    ui_element = str(row["UI_Element"])

    matched = None
    if association_rules is not None:
        matched = find_best_association_match(association_rules, predictor, ui_element)

    return {
        "rule_id": rule_id,
        "conditions": build_conditions(predictor, matched),
        "adaptations": build_adaptations(ui_element, matched),
        "support": _safe_float(row.get("Rule_Support")),
        "confidence": _safe_float(row.get("Rule_Confidence")),
        "lift": _safe_float(row.get("Rule_Lift"), default=1.0),
        "feature_importance": build_feature_importance_map(guidelines, ui_element),
        "guideline_score": _safe_float(row.get("Guideline_Confidence_Score")),
    }


def build_guideline_repository(
    guidelines: pd.DataFrame,
    *,
    association_rules: pd.DataFrame | None = None,
) -> list[dict[str, Any]]:
    """Convert validated guidelines into ordered JSON rule objects."""
    rules: list[dict[str, Any]] = []
    for index, (_, row) in enumerate(guidelines.iterrows(), start=1):
        rules.append(
            row_to_guideline_rule(
                row,
                rule_id=index,
                guidelines=guidelines,
                association_rules=association_rules,
            )
        )
    return rules
