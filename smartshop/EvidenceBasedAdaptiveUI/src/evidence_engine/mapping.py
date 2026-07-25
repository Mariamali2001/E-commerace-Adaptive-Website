"""Canonical predictor and UI-element mappings for cross-notebook joins."""

from __future__ import annotations

from src.association_rules.transactions import ITEM_LABELS
from src.preprocessing.columns import BIG_FIVE_TRAITS

LABEL_TO_PREDICTOR: dict[str, str] = {label: column for column, label in ITEM_LABELS.items()}

ML_TO_STATISTICAL_PREDICTOR: dict[str, str] = {
    trait: f"{trait}_Level" for trait in BIG_FIVE_TRAITS
}


def canonical_predictor(name: str) -> str:
    """Map ML trait names to the statistical-validation predictor column."""
    return ML_TO_STATISTICAL_PREDICTOR.get(name, name)


def rule_item_to_predictor(item: str) -> str | None:
    """Parse a context rule item such as ``Mood=Neutral`` into a predictor column."""
    if "=" not in item:
        return None
    label = item.split("=", maxsplit=1)[0].strip()
    return LABEL_TO_PREDICTOR.get(label)


def rule_item_to_ui_element(item: str) -> str | None:
    """Parse a UI rule item such as ``Desktop_navigation=Mega Menu`` into a column name."""
    if "=" not in item:
        return None
    label = item.split("=", maxsplit=1)[0].strip()
    if label.startswith("Desktop_"):
        return f"desktop_{label.removeprefix('Desktop_')}"
    if label.startswith("Mobile_"):
        return f"mobile_{label.removeprefix('Mobile_')}"
    if label.startswith("Global_"):
        return label.removeprefix("Global_")
    return None


def split_rule_items(text: str) -> list[str]:
    """Split a comma-separated antecedent or consequent string into individual items."""
    if not text or not isinstance(text, str):
        return []
    return [part.strip() for part in text.split(",") if part.strip()]
