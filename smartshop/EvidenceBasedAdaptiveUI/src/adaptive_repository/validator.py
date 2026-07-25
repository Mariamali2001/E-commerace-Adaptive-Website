"""Validation for the combined adaptive repository."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from src.preprocessing.columns import ALL_UI_COLUMNS, BIG_FIVE_TRAITS

TRAIT_LEVELS = ("Low", "Medium", "High")

VALID_MODIFIER_PROPERTIES = {
    "visual_richness",
    "information_density",
    "whitespace",
    "animation",
    "recommendation_strength",
    "animation_level",
    "recommendation_emphasis",
}


@dataclass
class RepositoryValidationReport:
    """Results from validating the adaptive repository bundle."""

    is_valid: bool
    missing_values: list[str] = field(default_factory=list)
    duplicate_keys: list[str] = field(default_factory=list)
    invalid_ui_names: list[str] = field(default_factory=list)
    invalid_categories: list[str] = field(default_factory=list)


def _check_defaults(name: str, payload: dict[str, Any], report: RepositoryValidationReport) -> int:
    defaults = payload.get("defaults", {})
    if not defaults:
        report.missing_values.append(f"{name}: empty defaults block")
        return 0

    count = 0
    for element, meta in defaults.items():
        count += 1
        if element not in ALL_UI_COLUMNS:
            report.invalid_ui_names.append(f"{name}: unknown UI element {element!r}")
        if not isinstance(meta, dict):
            report.missing_values.append(f"{name}.{element}: metadata is not an object")
            continue
        if not meta.get("value"):
            report.missing_values.append(f"{name}.{element}: missing value")
        if meta.get("percentage") is None:
            report.missing_values.append(f"{name}.{element}: missing percentage")
        if meta.get("count") is None:
            report.missing_values.append(f"{name}.{element}: missing count")
    return count


def _check_context_overrides(
    label: str,
    entries: list[dict[str, Any]],
    key_field: str,
    report: RepositoryValidationReport,
) -> tuple[int, int]:
    """Validate persona or mood override lists."""
    if not entries:
        report.missing_values.append(f"{label}: empty override list")
        return 0, 0

    seen: set[str] = set()
    total_overrides = 0

    for entry in entries:
        category = entry.get(key_field)
        if not category:
            report.invalid_categories.append(f"{label}: entry missing {key_field}")
            continue
        if category in seen:
            report.duplicate_keys.append(f"{label}: duplicate {key_field}={category!r}")
        seen.add(str(category))

        overrides = entry.get("overrides", {})
        if not isinstance(overrides, dict):
            report.missing_values.append(f"{label}/{category}: overrides is not an object")
            continue

        for ui_element, meta in overrides.items():
            total_overrides += 1
            if ui_element not in ALL_UI_COLUMNS:
                report.invalid_ui_names.append(
                    f"{label}/{category}: invalid UI element {ui_element!r}"
                )
            if not isinstance(meta, dict):
                report.missing_values.append(f"{label}/{category}/{ui_element}: invalid override")
                continue
            if not meta.get("value"):
                report.missing_values.append(f"{label}/{category}/{ui_element}: missing value")
            if meta.get("confidence") is None:
                report.missing_values.append(f"{label}/{category}/{ui_element}: missing confidence")
            if meta.get("support") is None:
                report.missing_values.append(f"{label}/{category}/{ui_element}: missing support")
            if not meta.get("evidence"):
                report.missing_values.append(f"{label}/{category}/{ui_element}: missing evidence")

    return len(seen), total_overrides


def _check_trait_modifiers(payload: dict[str, Any], report: RepositoryValidationReport) -> tuple[int, int]:
    modifiers = payload.get("modifiers", [])
    if not modifiers:
        report.missing_values.append("trait_modifiers: empty modifiers list")
        return 0, 0

    seen: set[tuple[str, str]] = set()
    total_nudges = 0

    for entry in modifiers:
        trait = entry.get("trait")
        level = entry.get("level")
        if trait not in BIG_FIVE_TRAITS:
            report.invalid_categories.append(f"trait_modifiers: invalid trait {trait!r}")
        if level not in TRAIT_LEVELS:
            report.invalid_categories.append(f"trait_modifiers: invalid level {level!r}")
        if trait and level:
            key = (trait, level)
            if key in seen:
                report.duplicate_keys.append(f"trait_modifiers: duplicate {trait}/{level}")
            seen.add(key)

        nudges = entry.get("nudges", {})
        if not isinstance(nudges, dict) or not nudges:
            report.missing_values.append(f"trait_modifiers/{trait}/{level}: empty nudges")
            continue
        if entry.get("confidence") is None:
            report.missing_values.append(f"trait_modifiers/{trait}/{level}: missing confidence")

        for prop, nudge in nudges.items():
            total_nudges += 1
            if prop not in VALID_MODIFIER_PROPERTIES:
                report.invalid_ui_names.append(
                    f"trait_modifiers/{trait}/{level}: invalid property {prop!r}"
                )
            if nudge not in (-1, 1):
                report.invalid_categories.append(
                    f"trait_modifiers/{trait}/{level}/{prop}: nudge must be -1 or +1"
                )

    return len(seen), total_nudges


def validate_adaptive_repository(
    global_defaults: dict[str, Any],
    desktop_defaults: dict[str, Any],
    mobile_defaults: dict[str, Any],
    persona_overrides: list[dict[str, Any]],
    mood_overrides: list[dict[str, Any]],
    trait_modifiers: dict[str, Any],
) -> RepositoryValidationReport:
    """Validate all repository components before export."""
    report = RepositoryValidationReport(is_valid=True)

    _check_defaults("global_defaults", global_defaults, report)
    _check_defaults("desktop_defaults", desktop_defaults, report)
    _check_defaults("mobile_defaults", mobile_defaults, report)
    _check_context_overrides("persona_overrides", persona_overrides, "persona", report)
    _check_context_overrides("mood_overrides", mood_overrides, "mood", report)
    _check_trait_modifiers(trait_modifiers, report)

    report.is_valid = not (
        report.missing_values
        or report.duplicate_keys
        or report.invalid_ui_names
        or report.invalid_categories
    )
    return report
