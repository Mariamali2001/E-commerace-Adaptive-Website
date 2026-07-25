"""Apply persona and mood overrides on top of base UI defaults."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from src.persona_overrides.repository import short_persona_name

PERSONA_ALIASES: dict[str, str] = {
    "Explorer": "Browser",
}


@dataclass
class OverrideApplicationResult:
    config: dict[str, str]
    persona_applied: list[dict[str, Any]] = field(default_factory=list)
    mood_applied: list[dict[str, Any]] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    resolved_persona: str | None = None
    resolved_mood: str | None = None


def _extract_default_values(defaults_payload: dict[str, Any]) -> dict[str, str]:
    defaults = defaults_payload.get("defaults", {})
    return {
        element: str(entry.get("value", ""))
        for element, entry in defaults.items()
        if isinstance(entry, dict) and entry.get("value") is not None
    }


def build_base_ui(
    global_defaults: dict[str, Any],
    device_defaults: dict[str, Any],
) -> dict[str, str]:
    """Merge global and device defaults into the base UI configuration."""
    global_values = _extract_default_values(global_defaults)
    device_values = _extract_default_values(device_defaults)
    return {**global_values, **device_values}


def resolve_persona(persona: str, persona_lookup: dict[str, Any]) -> tuple[str | None, str | None]:
    if not persona:
        return None, None
    candidates = [
        persona.strip(),
        short_persona_name(persona),
        PERSONA_ALIASES.get(persona.strip()),
        PERSONA_ALIASES.get(short_persona_name(persona)),
    ]
    for candidate in candidates:
        if candidate and candidate in persona_lookup:
            return candidate, None
    return None, f"No persona overrides found for {persona!r}."


def resolve_mood(mood: str, mood_lookup: dict[str, Any]) -> tuple[str | None, str | None]:
    if not mood:
        return None, None
    normalized = mood.strip().title()
    if normalized in mood_lookup:
        return normalized, None
    return None, f"No mood overrides found for {mood!r}."


def apply_persona_overrides(
    config: dict[str, str],
    persona: str | None,
    persona_lookup: dict[str, Any],
) -> tuple[dict[str, str], list[dict[str, Any]], str | None, list[str]]:
    """Replace only UI properties with evidence-backed persona overrides."""
    updated = dict(config)
    applied: list[dict[str, Any]] = []
    warnings: list[str] = []

    persona_name, warning = resolve_persona(persona or "", persona_lookup)
    if warning:
        warnings.append(warning)
        return updated, applied, None, warnings

    if not persona_name:
        return updated, applied, None, warnings

    overrides = persona_lookup[persona_name].get("overrides", {})
    for element, payload in overrides.items():
        previous = updated.get(element)
        new_value = str(payload.get("value", ""))
        updated[element] = new_value
        applied.append(
            {
                "layer": "persona",
                "ui_element": element,
                "previous": previous,
                "value": new_value,
                "confidence": payload.get("confidence"),
            }
        )
    return updated, applied, persona_name, warnings


def apply_mood_overrides(
    config: dict[str, str],
    mood: str | None,
    mood_lookup: dict[str, Any],
) -> tuple[dict[str, str], list[dict[str, Any]], str | None, list[str]]:
    """Apply mood overrides; they overwrite persona values on the same property."""
    updated = dict(config)
    applied: list[dict[str, Any]] = []
    warnings: list[str] = []

    mood_name, warning = resolve_mood(mood or "", mood_lookup)
    if warning:
        warnings.append(warning)
        return updated, applied, None, warnings

    if not mood_name:
        return updated, applied, None, warnings

    overrides = mood_lookup[mood_name].get("overrides", {})
    for element, payload in overrides.items():
        previous = updated.get(element)
        new_value = str(payload.get("value", ""))
        updated[element] = new_value
        applied.append(
            {
                "layer": "mood",
                "ui_element": element,
                "previous": previous,
                "value": new_value,
                "confidence": payload.get("confidence"),
            }
        )
    return updated, applied, mood_name, warnings


def apply_overrides(
    base_config: dict[str, str],
    persona: str | None,
    mood: str | None,
    persona_lookup: dict[str, Any],
    mood_lookup: dict[str, Any],
) -> OverrideApplicationResult:
    """Apply persona then mood overrides in order."""
    config, persona_applied, resolved_persona, warnings = apply_persona_overrides(
        base_config, persona, persona_lookup
    )
    config, mood_applied, resolved_mood, mood_warnings = apply_mood_overrides(
        config, mood, mood_lookup
    )
    warnings.extend(mood_warnings)
    return OverrideApplicationResult(
        config=config,
        persona_applied=persona_applied,
        mood_applied=mood_applied,
        warnings=warnings,
        resolved_persona=resolved_persona,
        resolved_mood=resolved_mood,
    )
