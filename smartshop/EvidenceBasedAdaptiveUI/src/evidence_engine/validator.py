"""Validation for the adaptive profile JSON repository."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

REQUIRED_PROFILE_FIELDS = ("profile_id", "context", "ui_profile", "evidence", "metadata")

REQUIRED_CONTEXT_FIELDS = ("persona", "mood", "device", "personality")

REQUIRED_UI_ELEMENTS = (
    "navigation",
    "product_card",
    "hero_banner",
    "button_style",
    "price_display",
    "recommendation",
    "filters",
    "review_display",
    "checkout",
    "whitespace",
    "typography",
)

REQUIRED_EVIDENCE_FIELDS = (
    "profile_score",
    "participants",
    "average_support",
    "average_confidence",
    "average_lift",
    "statistical_score",
    "feature_importance",
    "shap_score",
)

REQUIRED_METADATA_FIELDS = ("cluster_size", "created_from", "version")

EVIDENCE_METRICS_0_1 = (
    "profile_score",
    "average_support",
    "average_confidence",
    "statistical_score",
    "feature_importance",
    "shap_score",
)


@dataclass
class ProfileValidationReport:
    """Results from validating the adaptive profile repository."""

    is_valid: bool
    duplicate_profile_ids: list[str] = field(default_factory=list)
    duplicate_contexts: list[str] = field(default_factory=list)
    missing_ui_elements: list[str] = field(default_factory=list)
    missing_context: list[str] = field(default_factory=list)
    missing_evidence: list[str] = field(default_factory=list)
    invalid_values: list[str] = field(default_factory=list)
    invalid_categorical_values: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _has_context(profile: dict[str, Any]) -> bool:
    context = profile.get("context", {})
    if context.get("persona") or context.get("mood") or context.get("device"):
        return True
    personality = context.get("personality", {})
    return bool(personality)


def _context_signature(profile: dict[str, Any]) -> str:
    context = profile.get("context", {})
    return json.dumps(
        {
            "persona": context.get("persona"),
            "mood": context.get("mood"),
            "device": context.get("device"),
            "personality": context.get("personality", {}),
        },
        sort_keys=True,
    )


def _is_valid_categorical(value: object) -> bool:
    if value is None:
        return True
    if not isinstance(value, str):
        return False
    text = value.strip()
    if not text:
        return True
    if text.lower() == "nan":
        return False
    if any(char in text for char in "{}[]"):
        return False
    return True


def validate_profile_repository(profiles: list[dict[str, Any]]) -> ProfileValidationReport:
    """Check duplicate IDs, missing fields, duplicate contexts, and invalid values."""
    duplicate_profile_ids: list[str] = []
    duplicate_contexts: list[str] = []
    missing_ui_elements: list[str] = []
    missing_context: list[str] = []
    missing_evidence: list[str] = []
    invalid_values: list[str] = []
    invalid_categorical_values: list[str] = []
    warnings: list[str] = []

    seen_ids: set[str] = set()
    seen_contexts: dict[str, str] = {}

    for profile in profiles:
        profile_id = str(profile.get("profile_id"))
        label = profile_id

        if profile_id in seen_ids:
            duplicate_profile_ids.append(profile_id)
        seen_ids.add(profile_id)

        for field_name in REQUIRED_PROFILE_FIELDS:
            if field_name not in profile:
                missing_evidence.append(f"{label}: missing top-level {field_name}")

        context = profile.get("context", {})
        for field_name in REQUIRED_CONTEXT_FIELDS:
            if field_name not in context:
                missing_context.append(f"{label}: context.{field_name}")

        if not _has_context(profile):
            missing_context.append(f"{label}: no context values defined")

        for field_name in ("persona", "mood", "device"):
            value = context.get(field_name)
            if value is not None and not _is_valid_categorical(value):
                invalid_categorical_values.append(f"{label}: invalid context.{field_name}={value!r}")

        personality = context.get("personality", {})
        if not isinstance(personality, dict):
            invalid_categorical_values.append(f"{label}: context.personality is not an object")
        else:
            for trait, value in personality.items():
                if not _is_valid_categorical(value):
                    invalid_categorical_values.append(
                        f"{label}: invalid personality.{trait}={value!r}"
                    )

        signature = _context_signature(profile)
        if signature in seen_contexts and seen_contexts[signature] != profile_id:
            duplicate_contexts.append(
                f"{label} duplicates context of {seen_contexts[signature]}"
            )
        else:
            seen_contexts[signature] = profile_id

        ui_profile = profile.get("ui_profile", {})
        if not ui_profile:
            missing_ui_elements.append(f"{label}: empty ui_profile")
        else:
            for element in REQUIRED_UI_ELEMENTS:
                if element not in ui_profile or not ui_profile[element]:
                    missing_ui_elements.append(f"{label}: missing ui_profile.{element}")

            for element, value in ui_profile.items():
                if not _is_valid_categorical(value):
                    invalid_categorical_values.append(
                        f"{label}: invalid ui_profile.{element}={value!r}"
                    )

        evidence = profile.get("evidence", {})
        for field_name in REQUIRED_EVIDENCE_FIELDS:
            if field_name not in evidence:
                missing_evidence.append(f"{label}: evidence.{field_name}")
            elif evidence[field_name] is None:
                missing_evidence.append(f"{label}: evidence.{field_name} is null")

        metadata = profile.get("metadata", {})
        for field_name in REQUIRED_METADATA_FIELDS:
            if field_name not in metadata:
                missing_evidence.append(f"{label}: metadata.{field_name}")

        for metric in EVIDENCE_METRICS_0_1:
            value = evidence.get(metric)
            if value is None:
                continue
            if not isinstance(value, (int, float)):
                invalid_values.append(f"{label}: evidence.{metric} is not numeric")
                continue
            if not 0.0 <= float(value) <= 1.0:
                invalid_values.append(f"{label}: evidence.{metric}={value} outside 0–1")

        lift = evidence.get("average_lift")
        if lift is not None:
            if not isinstance(lift, (int, float)):
                invalid_values.append(f"{label}: evidence.average_lift is not numeric")
            elif float(lift) < 0.0:
                invalid_values.append(f"{label}: evidence.average_lift={lift} is negative")

        participants = evidence.get("participants")
        if participants is not None and int(participants) < 1:
            invalid_values.append(f"{label}: evidence.participants={participants} invalid")

        cluster_size = metadata.get("cluster_size")
        if cluster_size is not None and int(cluster_size) < 1:
            invalid_values.append(f"{label}: metadata.cluster_size={cluster_size} invalid")

    is_valid = (
        not duplicate_profile_ids
        and not duplicate_contexts
        and not missing_ui_elements
        and not missing_context
        and not missing_evidence
        and not invalid_values
        and not invalid_categorical_values
    )
    return ProfileValidationReport(
        is_valid=is_valid,
        duplicate_profile_ids=sorted(set(duplicate_profile_ids)),
        duplicate_contexts=duplicate_contexts,
        missing_ui_elements=missing_ui_elements,
        missing_context=missing_context,
        missing_evidence=missing_evidence,
        invalid_values=invalid_values,
        invalid_categorical_values=invalid_categorical_values,
        warnings=warnings,
    )
