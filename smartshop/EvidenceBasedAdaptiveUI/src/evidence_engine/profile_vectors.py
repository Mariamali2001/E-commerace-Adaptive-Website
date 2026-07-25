"""Feature-vector encoding for candidate adaptive UI profiles."""

from __future__ import annotations

import math
from typing import Any

import pandas as pd

from src.evidence_engine.json_builder import ui_element_to_adaptation_key
from src.evidence_engine.mapping import rule_item_to_ui_element
from src.preprocessing.columns import BIG_FIVE_TRAITS

CONTEXT_COLUMNS: list[str] = [
    "Persona",
    "Mood",
    "Device",
    *BIG_FIVE_TRAITS,
]

PERSONALITY_COLUMNS: list[str] = list(BIG_FIVE_TRAITS)


def _is_missing(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    text = str(value).strip()
    return not text or text.lower() == "nan"


def _clean_ui_value(raw: str) -> str:
    value = raw.strip()
    if "(" in value:
        value = value.split("(", maxsplit=1)[0].strip()
    return value


def _parse_ui_adaptations(text: str) -> list[str]:
    if not text or not isinstance(text, str):
        return []
    return [part.strip() for part in text.split(" | ") if part.strip()]


def parse_ui_profile(ui_adaptations: str) -> dict[str, str]:
    """Parse merged UI adaptation text into canonical adaptation-key → value pairs."""
    profile: dict[str, str] = {}
    for item in _parse_ui_adaptations(ui_adaptations):
        if "=" not in item:
            continue
        label, raw_value = item.split("=", maxsplit=1)
        ui_element = rule_item_to_ui_element(f"{label.strip()}={raw_value.strip()}")
        if ui_element is None:
            continue
        key = ui_element_to_adaptation_key(ui_element)
        profile[key] = _clean_ui_value(raw_value)
    return profile


def parse_context_row(row: pd.Series) -> dict[str, str | None]:
    """Extract non-empty context values from a profile row."""
    context: dict[str, str | None] = {}
    for column in CONTEXT_COLUMNS:
        if _is_missing(row.get(column)):
            context[column] = None
        else:
            context[column] = str(row[column]).strip()
    return context


def context_to_tokens(context: dict[str, str | None]) -> set[str]:
    """Encode context as categorical tokens ``Column=Value``."""
    tokens: set[str] = set()
    for column, value in context.items():
        if value:
            tokens.add(f"{column}={value}")
    return tokens


def ui_to_tokens(ui_profile: dict[str, str]) -> set[str]:
    """Encode UI adaptations as categorical tokens ``Key=Value``."""
    return {f"{key}={value}" for key, value in ui_profile.items()}


def build_profile_records(profiles: pd.DataFrame) -> list[dict[str, Any]]:
    """Build structured records with parsed context and UI for every candidate profile."""
    records: list[dict[str, Any]] = []
    for _, row in profiles.iterrows():
        context = parse_context_row(row)
        ui_profile = parse_ui_profile(str(row.get("UI_Adaptations", "")))
        records.append(
            {
                "Profile_ID": int(row["Profile_ID"]),
                "Antecedent": str(row.get("Antecedent", "")),
                "Context": context,
                "Context_Tokens": context_to_tokens(context),
                "UI_Profile": ui_profile,
                "UI_Tokens": ui_to_tokens(ui_profile),
                "Num_UI_Adaptations": int(row.get("Num_UI_Adaptations", len(ui_profile)) or 0),
                "Num_Supporting_Rules": int(row.get("Num_Supporting_Rules", 0) or 0),
                "Avg_Support": float(row.get("Avg_Support", 0.0) or 0.0),
                "Avg_Confidence": float(row.get("Avg_Confidence", 0.0) or 0.0),
                "Avg_Lift": float(row.get("Avg_Lift", 0.0) or 0.0),
            }
        )
    return records


def collect_all_ui_keys(records: list[dict[str, Any]]) -> list[str]:
    """Return sorted union of all UI adaptation keys observed across profiles."""
    keys: set[str] = set()
    for record in records:
        keys.update(record["UI_Profile"].keys())
    return sorted(keys)


def collect_all_context_keys(records: list[dict[str, Any]]) -> list[str]:
    """Return sorted union of all context token prefixes."""
    keys: set[str] = set()
    for record in records:
        for token in record["Context_Tokens"]:
            keys.add(token.split("=", maxsplit=1)[0])
    return sorted(keys)


def records_to_feature_matrix(
    records: list[dict[str, Any]],
) -> tuple[pd.DataFrame, list[str], list[str]]:
    """One-hot encode context + UI tokens into a binary feature matrix."""
    context_keys = collect_all_context_keys(records)
    ui_keys = collect_all_ui_keys(records)

    rows: list[dict[str, int]] = []
    index: list[int] = []
    for record in records:
        row: dict[str, int] = {}
        for column in context_keys:
            value = record["Context"].get(column)
            row[f"ctx_{column}"] = 0
            if value:
                row[f"ctx_{column}={value}"] = 1
        for token in record["Context_Tokens"]:
            row[f"ctx_{token}"] = 1

        for ui_key in ui_keys:
            row[f"ui_{ui_key}"] = 0
            if ui_key in record["UI_Profile"]:
                row[f"ui_{ui_key}={record['UI_Profile'][ui_key]}"] = 1
        for token in record["UI_Tokens"]:
            row[f"ui_{token}"] = 1

        rows.append(row)
        index.append(record["Profile_ID"])

    matrix = pd.DataFrame(rows, index=index).fillna(0).astype(int)
    matrix = matrix.reindex(sorted(matrix.columns), axis=1)
    return matrix, context_keys, ui_keys
