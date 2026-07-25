"""Apply Big Five personality nudges as ordinal style adjustments."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from src.association_rules.modifiers import COLUMN_ORDER, PROPERTY_COLUMNS
from src.preprocessing.columns import BIG_FIVE_TRAITS

NUDGE_PROPERTY_MAP: dict[str, str] = {
    "visual_richness": "visual_richness",
    "information_density": "information_density",
    "whitespace": "whitespace",
    "animation": "animation_level",
    "recommendation_strength": "recommendation_emphasis",
}

MODIFIABLE_PROPERTIES: tuple[str, ...] = (
    "visual_richness",
    "information_density",
    "whitespace",
    "animation",
    "recommendation_strength",
)


@dataclass
class NudgeApplicationResult:
    config: dict[str, str]
    nudges_applied: list[dict[str, Any]] = field(default_factory=list)
    nudge_summary: dict[str, int] = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def _find_ordinal_index(column: str, value: str) -> int | None:
    order = COLUMN_ORDER.get(column)
    if not order:
        return None
    text = value.strip()
    for index, keyword in enumerate(order):
        if text.lower().startswith(keyword.lower()):
            return index
    return None


def _resolve_full_value(column: str, keyword: str, value_catalog: dict[str, list[str]]) -> str:
    for candidate in value_catalog.get(column, []):
        if candidate.lower().startswith(keyword.lower()):
            return candidate
    keyword_lower = keyword.lower()
    for candidate in value_catalog.get(column, []):
        if keyword_lower in candidate.lower():
            return candidate
    return keyword


def _build_value_catalog(*default_maps: dict[str, str]) -> dict[str, list[str]]:
    catalog: dict[str, list[str]] = {}
    for default_map in default_maps:
        for column, value in default_map.items():
            catalog.setdefault(column, [])
            if value not in catalog[column]:
                catalog[column].append(value)
    return catalog


def _enrich_catalog_from_overrides(
    catalog: dict[str, list[str]],
    *lookups: dict[str, Any],
) -> dict[str, list[str]]:
    for lookup in lookups:
        for entry in lookup.values():
            overrides = entry.get("overrides", {})
            if not isinstance(overrides, dict):
                continue
            for element, payload in overrides.items():
                value = payload.get("value") if isinstance(payload, dict) else None
                if not value:
                    continue
                catalog.setdefault(element, [])
                text = str(value)
                if text not in catalog[element]:
                    catalog[element].append(text)
    return catalog


def _enrich_catalog_from_survey(
    catalog: dict[str, list[str]],
    survey_path: Any,
) -> dict[str, list[str]]:
    if survey_path is None or not survey_path.exists():
        return catalog
    columns = [column for column in COLUMN_ORDER if column in pd.read_csv(survey_path, nrows=0).columns]
    if not columns:
        return catalog
    df = pd.read_csv(survey_path, usecols=columns)
    for column in columns:
        for value in df[column].dropna().astype(str).unique():
            catalog.setdefault(column, [])
            if value not in catalog[column]:
                catalog[column].append(value)
    return catalog


def build_value_catalog(
    global_values: dict[str, str],
    desktop_values: dict[str, str],
    mobile_values: dict[str, str],
    persona_lookup: dict[str, Any],
    mood_lookup: dict[str, Any],
    survey_path: Any = None,
) -> dict[str, list[str]]:
    catalog = _build_value_catalog(global_values, desktop_values, mobile_values)
    catalog = _enrich_catalog_from_overrides(catalog, persona_lookup, mood_lookup)
    return _enrich_catalog_from_survey(catalog, survey_path)


def _columns_for_property(export_property: str, device_defaults_key: str) -> list[str]:
    internal = NUDGE_PROPERTY_MAP.get(export_property, export_property)
    columns = PROPERTY_COLUMNS.get(internal, [])
    if internal == "animation_level":
        return []
    if device_defaults_key == "mobile_defaults":
        return [
            c
            for c in columns
            if c.startswith("mobile_")
            or c in {"whitespace_pref", "hero_banner_size", "social_proof_display"}
        ]
    return [
        c
        for c in columns
        if c.startswith("desktop_")
        or c in {"whitespace_pref", "hero_banner_size", "social_proof_display"}
    ]


def apply_personality_nudges(
    config: dict[str, str],
    personality: dict[str, str],
    trait_lookup: dict[str, dict[str, dict[str, Any]]],
    device_defaults_key: str,
    value_catalog: dict[str, list[str]],
) -> NudgeApplicationResult:
    """Adjust supported style properties without replacing categorical UI decisions."""
    updated = dict(config)
    applied: list[dict[str, Any]] = []
    summary: dict[str, int] = {prop: 0 for prop in MODIFIABLE_PROPERTIES}
    warnings: list[str] = []

    for trait in BIG_FIVE_TRAITS:
        level = (personality or {}).get(trait)
        if not level:
            continue
        normalized_level = level.strip().title()
        if normalized_level == "Medium":
            continue

        trait_entry = trait_lookup.get(trait, {}).get(normalized_level)
        if not trait_entry:
            warnings.append(f"No trait nudges found for {trait} = {level!r}.")
            continue

        nudges = trait_entry.get("nudges", {})
        for export_property, delta in nudges.items():
            if not isinstance(delta, int) or delta == 0:
                continue

            summary[export_property] = summary.get(export_property, 0) + delta
            columns = _columns_for_property(export_property, device_defaults_key)
            if not columns:
                applied.append(
                    {
                        "trait": trait,
                        "level": normalized_level,
                        "property": export_property,
                        "delta": delta,
                        "status": "skipped",
                        "reason": "No measurable columns for this device/property.",
                    }
                )
                continue

            for column in columns:
                if column not in updated:
                    continue
                order = COLUMN_ORDER.get(column)
                if not order:
                    continue
                current_value = updated[column]
                current_index = _find_ordinal_index(column, current_value)
                if current_index is None:
                    warnings.append(
                        f"Could not nudge {column}: value {current_value!r} is not ordinal."
                    )
                    continue
                previous_index = current_index
                new_index = max(0, min(len(order) - 1, current_index + delta))
                keyword = order[new_index]
                new_value = _resolve_full_value(column, keyword, value_catalog)
                previous = updated[column]
                updated[column] = new_value
                applied.append(
                    {
                        "trait": trait,
                        "level": normalized_level,
                        "property": export_property,
                        "ui_element": column,
                        "delta": delta,
                        "previous": previous,
                        "previous_index": previous_index,
                        "new_index": new_index,
                        "value": new_value,
                        "confidence": trait_entry.get("confidence"),
                    }
                )

    return NudgeApplicationResult(
        config=updated,
        nudges_applied=applied,
        nudge_summary=summary,
        warnings=warnings,
    )


def format_nudge_summary(nudge_summary: dict[str, int]) -> dict[str, str]:
    """Convert numeric nudge totals to ``+1`` / ``-1`` strings for export."""
    formatted: dict[str, str] = {}
    for prop in MODIFIABLE_PROPERTIES:
        total = nudge_summary.get(prop, 0)
        if total > 0:
            formatted[prop] = f"+{total}"
        elif total < 0:
            formatted[prop] = str(total)
        else:
            formatted[prop] = "0"
    return formatted
