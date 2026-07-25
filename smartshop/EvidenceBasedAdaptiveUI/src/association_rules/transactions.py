"""Convert survey rows into association-rule transaction format."""

from __future__ import annotations

import re

import pandas as pd

from src.preprocessing.columns import (
    ALL_UI_COLUMNS,
    get_association_context_columns,
)

ITEM_LABELS: dict[str, str] = {
    "primary_persona": "Persona",
    "current_mood": "Mood",
    "primary_device": "Device",
    "Extraversion_Level": "Extraversion",
    "Agreeableness_Level": "Agreeableness",
    "Conscientiousness_Level": "Conscientiousness",
    "Neuroticism_Level": "Neuroticism",
    "Openness_Level": "Openness",
}


def _compact_value(value: object) -> str:
    """Return a compact string representation for rule items."""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) > 48:
        text = text[:45] + "..."
    return text


def _format_persona(value: object) -> str:
    """Shorten long persona labels for readable rules."""
    text = str(value).strip()
    if "(" in text:
        text = text.split("(", maxsplit=1)[0]
    return text.replace("The ", "").strip()


def _ui_item_label(column: str) -> str:
    """Map a UI column name to a readable transaction label."""
    if column.startswith("desktop_"):
        return f"Desktop_{column.removeprefix('desktop_')}"
    if column.startswith("mobile_"):
        return f"Mobile_{column.removeprefix('mobile_')}"
    return f"Global_{column}"


def format_transaction_item(column: str, value: object) -> str:
    """Format one survey field as ``Label=Value`` for association mining."""
    if pd.isna(value):
        return ""

    if column in ITEM_LABELS:
        label = ITEM_LABELS[column]
        item_value = _format_persona(value) if column == "primary_persona" else _compact_value(value)
        return f"{label}={item_value}"

    if column in ALL_UI_COLUMNS:
        return f"{_ui_item_label(column)}={_compact_value(value)}"

    return f"{column}={_compact_value(value)}"


def build_transactions(
    df: pd.DataFrame,
    *,
    context_columns: list[str] | None = None,
    ui_columns: list[str] | None = None,
) -> list[list[str]]:
    """Convert each participant row into a transaction of context and UI items."""
    context_columns = context_columns or get_association_context_columns()
    ui_columns = ui_columns or ALL_UI_COLUMNS
    use_columns = [column for column in context_columns + ui_columns if column in df.columns]

    transactions: list[list[str]] = []
    for _, row in df[use_columns].iterrows():
        items = [
            format_transaction_item(column, row[column])
            for column in use_columns
            if not pd.isna(row[column])
        ]
        items = [item for item in items if item]
        if items:
            transactions.append(items)

    return transactions
