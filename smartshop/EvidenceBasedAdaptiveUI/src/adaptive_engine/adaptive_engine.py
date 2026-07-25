"""Orchestrate the layered adaptive decision engine pipeline."""

from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd

from src.adaptive_engine.logger import build_adaptation_log, format_log_text, short_label
from src.adaptive_engine.nudge_engine import (
    apply_personality_nudges,
    build_value_catalog,
    format_nudge_summary,
)
from src.adaptive_engine.override_engine import (
    _extract_default_values,
    apply_overrides,
    build_base_ui,
)
from src.adaptive_engine.repository_loader import RepositoryBundle, load_repositories
from src.adaptive_engine.validator import validate_repository_bundle, validate_ui_configuration
from src.preprocessing.columns import BIG_FIVE_TRAITS, GLOBAL_UI_COLUMNS

DEVICE_DEFAULTS_KEY: dict[str, str] = {
    "smartphone": "mobile_defaults",
    "mobile": "mobile_defaults",
    "phone": "mobile_defaults",
    "tablet": "mobile_defaults",
    "desktop": "desktop_defaults",
    "laptop": "desktop_defaults",
    "computer": "desktop_defaults",
    "pc": "desktop_defaults",
}

GLOBAL_DISPLAY_MAP: dict[str, str] = {
    "font_style_pref": "font_style",
    "font_size_pref": "typography_scale",
    "color_theme_pref": "color_theme",
    "accent_color_pref": "accent_color",
    "background_pref": "background",
    "whitespace_pref": "whitespace",
    "button_style_pref": "button_style",
    "hero_banner_size": "hero_banner",
    "recommendation_type": "recommendation",
    "social_proof_display": "social_proof",
    "urgency_pref": "urgency",
    "checkout_style": "checkout",
    "form_field_style": "form_field",
    "product_desc_length": "product_description",
}

DESKTOP_DISPLAY_MAP: dict[str, str] = {
    "desktop_navigation": "navigation",
    "desktop_product_card": "product_card",
    "desktop_price_display": "price_display",
    "desktop_filter_location": "filter_location",
    "desktop_grid_pref": "grid_layout",
    "desktop_info_density": "information_density_level",
    "desktop_image_text_ratio": "visual_balance",
    "desktop_whitespace": "layout_whitespace",
    "desktop_search_visibility": "search_visibility",
    "desktop_category_display": "category_display",
    "desktop_persistent_filters": "persistent_filters",
    "desktop_quick_view": "quick_view",
    "desktop_review_display": "review_display",
}

MOBILE_DISPLAY_MAP: dict[str, str] = {
    "mobile_navigation": "navigation",
    "mobile_product_card": "product_card",
    "mobile_price_display": "price_display",
    "mobile_filter_location": "filter_location",
    "mobile_grid_pref": "grid_layout",
    "mobile_info_density": "information_density_level",
    "mobile_image_text_ratio": "visual_balance",
    "mobile_whitespace": "layout_whitespace",
    "mobile_search_visibility": "search_visibility",
    "mobile_category_display": "category_display",
    "mobile_quick_view": "quick_view",
    "mobile_review_display": "review_display",
    "mobile_sticky_header": "sticky_header",
    "mobile_touch_size": "touch_size",
}


@dataclass
class UserContext:
    persona: str
    mood: str
    device: str
    personality: dict[str, str] = field(default_factory=dict)


@dataclass
class AdaptationResult:
    context: dict[str, Any]
    base_ui: dict[str, str]
    raw_ui_configuration: dict[str, str]
    final_ui_configuration: dict[str, str]
    persona_applied: list[dict[str, Any]]
    mood_applied: list[dict[str, Any]]
    nudges_applied: list[dict[str, Any]]
    nudge_summary: dict[str, str]
    adaptation_log: dict[str, Any]
    adaptation_log_text: str
    warnings: list[str]
    metadata: dict[str, Any]
    validation: dict[str, Any]


def _normalize_device(device: str) -> tuple[str, str, dict[str, Any]]:
    key = device.strip().lower()
    defaults_key = DEVICE_DEFAULTS_KEY.get(key)
    if defaults_key is None:
        raise ValueError(
            f"Unknown device {device!r}. Use 'Desktop' or 'Smartphone'."
        )
    canonical = "Smartphone" if defaults_key == "mobile_defaults" else "Desktop"
    device_defaults_attr = "mobile_defaults" if defaults_key == "mobile_defaults" else "desktop_defaults"
    return canonical, defaults_key, {"attr": device_defaults_attr}


def _build_presentation_config(
    raw_config: dict[str, str],
    device: str,
    nudge_summary: dict[str, str],
) -> dict[str, str]:
    """Map survey columns to friendly component names for export."""
    display_map = dict(GLOBAL_DISPLAY_MAP)
    display_map.update(MOBILE_DISPLAY_MAP if device == "Smartphone" else DESKTOP_DISPLAY_MAP)

    presentation: dict[str, str] = {}
    for column, friendly in display_map.items():
        if column in raw_config:
            presentation[friendly] = short_label(raw_config[column])

    for prop, value in nudge_summary.items():
        presentation[prop] = value

    return dict(sorted(presentation.items()))


def run_adaptive_engine(
    user_context: UserContext,
    bundle: RepositoryBundle,
) -> AdaptationResult:
    """Execute the full layered adaptation pipeline for one user context."""
    device, device_defaults_key, device_info = _normalize_device(user_context.device)
    device_defaults = getattr(bundle, device_info["attr"])

    global_values = _extract_default_values(bundle.global_defaults)
    device_values = _extract_default_values(device_defaults)
    base_ui = build_base_ui(bundle.global_defaults, device_defaults)

    value_catalog = build_value_catalog(
        global_values,
        _extract_default_values(bundle.desktop_defaults),
        _extract_default_values(bundle.mobile_defaults),
        bundle.persona_lookup,
        bundle.mood_lookup,
        bundle.survey_path,
    )

    override_result = apply_overrides(
        base_ui,
        user_context.persona,
        user_context.mood,
        bundle.persona_lookup,
        bundle.mood_lookup,
    )

    nudge_result = apply_personality_nudges(
        override_result.config,
        user_context.personality,
        bundle.trait_lookup,
        device_defaults_key,
        value_catalog,
    )

    nudge_summary = format_nudge_summary(nudge_result.nudge_summary)
    raw_config = dict(sorted(nudge_result.config.items()))
    final_config = _build_presentation_config(raw_config, device, nudge_summary)

    context_payload = {
        "persona": override_result.resolved_persona or user_context.persona,
        "mood": override_result.resolved_mood or user_context.mood,
        "device": device,
        "device_defaults": f"{device_defaults_key}.json",
        "personality": user_context.personality,
    }

    warnings = override_result.warnings + nudge_result.warnings
    metadata = {
        "n_persona_overrides": len(override_result.persona_applied),
        "n_mood_overrides": len(override_result.mood_applied),
        "n_trait_nudges": len(
            [n for n in nudge_result.nudges_applied if n.get("status") != "skipped"]
        ),
        "n_ui_elements": len(raw_config),
    }

    intermediate = {
        "context": context_payload,
        "persona_applied": override_result.persona_applied,
        "mood_applied": override_result.mood_applied,
        "nudges_applied": nudge_result.nudges_applied,
    }
    adaptation_log = build_adaptation_log(intermediate)
    validation_report = validate_ui_configuration(raw_config, device)

    return AdaptationResult(
        context=context_payload,
        base_ui=dict(sorted(base_ui.items())),
        raw_ui_configuration=raw_config,
        final_ui_configuration=final_config,
        persona_applied=override_result.persona_applied,
        mood_applied=override_result.mood_applied,
        nudges_applied=nudge_result.nudges_applied,
        nudge_summary=nudge_summary,
        adaptation_log=adaptation_log,
        adaptation_log_text=format_log_text(adaptation_log),
        warnings=warnings,
        metadata=metadata,
        validation={
            "ok": validation_report.ok,
            "checks": validation_report.checks,
            "errors": validation_report.errors,
        },
    )


def export_results(
    result: AdaptationResult,
    output_dir: Path,
) -> dict[str, Path]:
    """Export final UI configuration and adaptation log JSON files."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    final_path = output_dir / "final_ui_configuration.json"
    log_path = output_dir / "adaptation_log.json"

    final_payload = {
        "context": result.context,
        "final_ui_configuration": result.final_ui_configuration,
        "raw_ui_configuration": result.raw_ui_configuration,
        "metadata": result.metadata,
        "warnings": result.warnings,
    }
    final_path.write_text(
        json.dumps(final_payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    log_path.write_text(
        json.dumps(result.adaptation_log, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return {"final_ui_configuration": final_path, "adaptation_log": log_path}


def generate_random_contexts(
    bundle: RepositoryBundle,
    n: int = 20,
    seed: int = 42,
) -> list[UserContext]:
    """Generate random user contexts from repository-supported values."""
    rng = random.Random(seed)
    personas = list(bundle.persona_lookup.keys())
    moods = list(bundle.mood_lookup.keys())
    devices = ["Desktop", "Smartphone"]
    levels = ["Low", "Medium", "High"]

    contexts: list[UserContext] = []
    for _ in range(n):
        personality = {trait: rng.choice(levels) for trait in BIG_FIVE_TRAITS}
        contexts.append(
            UserContext(
                persona=rng.choice(personas),
                mood=rng.choice(moods),
                device=rng.choice(devices),
                personality=personality,
            )
        )
    return contexts


def run_batch_simulation(
    contexts: list[UserContext],
    bundle: RepositoryBundle,
) -> tuple[list[AdaptationResult], pd.DataFrame]:
    """Simulate multiple user contexts and build a summary DataFrame."""
    results: list[AdaptationResult] = []
    rows: list[dict[str, Any]] = []

    for index, context in enumerate(contexts, start=1):
        result = run_adaptive_engine(context, bundle)
        results.append(result)
        rows.append(
            {
                "simulation_id": index,
                "device": result.context["device"],
                "persona": result.context["persona"],
                "mood": result.context["mood"],
                "personality": json.dumps(result.context["personality"]),
                "n_persona_overrides": result.metadata["n_persona_overrides"],
                "n_mood_overrides": result.metadata["n_mood_overrides"],
                "n_trait_nudges": result.metadata["n_trait_nudges"],
                "n_ui_elements": result.metadata["n_ui_elements"],
                "applied_defaults": "global + device",
                "applied_persona_overrides": result.metadata["n_persona_overrides"],
                "applied_mood_overrides": result.metadata["n_mood_overrides"],
                "applied_trait_nudges": result.metadata["n_trait_nudges"],
                "final_ui_configuration": json.dumps(result.final_ui_configuration),
                "input_context": json.dumps(
                    {
                        "persona": context.persona,
                        "mood": context.mood,
                        "device": context.device,
                        "personality": context.personality,
                    }
                ),
                "validation_ok": result.validation["ok"],
            }
        )

    return results, pd.DataFrame(rows)


def load_and_validate(input_dir: Path) -> tuple[RepositoryBundle | None, Any, Any]:
    """Load repositories and run repository-level validation."""
    bundle, load_report = load_repositories(input_dir)
    validation = validate_repository_bundle(bundle, load_report)
    return bundle, load_report, validation
