"""Column group definitions for exploratory analysis."""

from __future__ import annotations

VARIABLE_GROUPS: dict[str, list[str]] = {
    "demographics": ["age_group", "gender", "education_level"],
    "shopping": [
        "shopping_motivation",
        "decision_speed",
        "price_sensitivity",
        "review_importance",
        "brand_loyalty",
        "social_proof_influence",
    ],
    "context": ["current_mood", "primary_persona", "primary_device"],
}

BIG_FIVE_TRAITS: list[str] = [
    "Extraversion",
    "Agreeableness",
    "Conscientiousness",
    "Neuroticism",
    "Openness",
]

GLOBAL_UI_COLUMNS: list[str] = [
    "font_style_pref",
    "font_size_pref",
    "color_theme_pref",
    "accent_color_pref",
    "background_pref",
    "whitespace_pref",
    "button_style_pref",
    "hero_banner_size",
    "recommendation_type",
    "social_proof_display",
    "urgency_pref",
    "checkout_style",
    "form_field_style",
    "product_desc_length",
]

DESKTOP_UI_COLUMNS: list[str] = [
    "desktop_grid_pref",
    "desktop_info_density",
    "desktop_image_text_ratio",
    "desktop_whitespace",
    "desktop_navigation",
    "desktop_search_visibility",
    "desktop_category_display",
    "desktop_product_card",
    "desktop_price_display",
    "desktop_filter_location",
    "desktop_persistent_filters",
    "desktop_quick_view",
    "desktop_review_display",
]

MOBILE_UI_COLUMNS: list[str] = [
    "mobile_grid_pref",
    "mobile_info_density",
    "mobile_image_text_ratio",
    "mobile_whitespace",
    "mobile_navigation",
    "mobile_search_visibility",
    "mobile_category_display",
    "mobile_product_card",
    "mobile_price_display",
    "mobile_filter_location",
    "mobile_quick_view",
    "mobile_review_display",
    "mobile_sticky_header",
    "mobile_touch_size",
]

ADAPTATION_COLUMNS: list[str] = [
    "expects_device_adaptation",
    "adaptation_comfort",
]

CONTEXT_FEATURE_COLUMNS: list[str] = [
    "primary_persona",
    "current_mood",
    "primary_device",
]

BIG_FIVE_LEVEL_COLUMNS: list[str] = [
    "Extraversion_Level",
    "Agreeableness_Level",
    "Conscientiousness_Level",
    "Neuroticism_Level",
    "Openness_Level",
]

SHOPPING_BEHAVIOUR_COLUMNS: list[str] = VARIABLE_GROUPS["shopping"]

ALL_UI_COLUMNS: list[str] = (
    GLOBAL_UI_COLUMNS + DESKTOP_UI_COLUMNS + MOBILE_UI_COLUMNS
)

UI_TARGET_GROUPS: dict[str, list[str]] = {
    "Global_UI": GLOBAL_UI_COLUMNS,
    "Desktop_UI": DESKTOP_UI_COLUMNS,
    "Mobile_UI": MOBILE_UI_COLUMNS,
}


def get_ui_target_groups() -> dict[str, list[str]]:
    """Return UI target groups for Notebook 04."""
    return UI_TARGET_GROUPS.copy()


def get_context_predictor_columns() -> list[str]:
    """Return all context, personality, and shopping predictor columns."""
    return (
        CONTEXT_FEATURE_COLUMNS
        + BIG_FIVE_LEVEL_COLUMNS
        + SHOPPING_BEHAVIOUR_COLUMNS
    )


def get_statistical_predictor_columns() -> list[str]:
    """Return predictors for Notebook 03 (context + Big Five levels only)."""
    return CONTEXT_FEATURE_COLUMNS + BIG_FIVE_LEVEL_COLUMNS


def get_ml_feature_columns() -> list[str]:
    """Return predictor columns for Notebook 04 (context + continuous Big Five)."""
    return CONTEXT_FEATURE_COLUMNS + BIG_FIVE_TRAITS


def get_association_context_columns() -> list[str]:
    """Return context columns encoded as association-rule transaction items."""
    return CONTEXT_FEATURE_COLUMNS + BIG_FIVE_LEVEL_COLUMNS

