"""Export representative adaptive UI profiles to the website-ready JSON repository."""

from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.evidence_engine.json_builder import ui_element_to_adaptation_key
from src.evidence_engine.mapping import rule_item_to_ui_element
from src.evidence_engine.validator import (
    REQUIRED_UI_ELEMENTS,
    ProfileValidationReport,
    validate_profile_repository,
)
from src.preprocessing.columns import BIG_FIVE_TRAITS
from src.statistics.evidence import min_max_normalize

logger = logging.getLogger(__name__)

DEFAULT_PROFILES_PATH = Path("reports") / "AdaptiveProfiles" / "representative_profiles.xlsx"
REPOSITORY_VERSION = "1.0"
SURVEY_SAMPLE_SIZE = 200

PERSONALITY_COLUMNS = list(BIG_FIVE_TRAITS)

CANONICAL_UI_ALIASES: dict[str, tuple[str, ...]] = {
    "navigation": ("navigation", "desktop_navigation", "mobile_navigation"),
    "product_card": ("product_card", "desktop_product_card", "mobile_product_card"),
    "hero_banner": ("hero_banner", "hero_banner_size"),
    "button_style": ("button_style", "button_style_pref"),
    "price_display": ("price_display", "desktop_price_display", "mobile_price_display"),
    "recommendation": ("recommendation", "recommendation_type"),
    "filters": ("filters", "persistent_filters", "filter_location", "desktop_persistent_filters"),
    "review_display": ("review_display", "desktop_review_display", "mobile_review_display"),
    "checkout": ("checkout", "checkout_style"),
    "whitespace": ("whitespace", "whitespace_pref", "desktop_whitespace", "mobile_whitespace"),
    "typography": ("typography", "font_style", "font_style_pref", "font_size", "font_size_pref"),
}


def _load_profiles(path: Path) -> pd.DataFrame:
    if not path.exists():
        sibling = path.with_suffix(".csv")
        if sibling.exists():
            return pd.read_csv(sibling)
        raise FileNotFoundError(f"Required input not found: {path}")
    if path.suffix.lower() == ".xlsx":
        return pd.read_excel(path)
    return pd.read_csv(path)


def _safe_float(value: object, default: float = 0.0) -> float:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return default
    if isinstance(value, str) and not value.strip():
        return default
    return float(value)


def _clean_ui_value(raw: str) -> str:
    value = raw.strip()
    if "(" in value:
        value = value.split("(", maxsplit=1)[0].strip()
    return value


def _ui_item_priority(label: str, device: str | None) -> int:
    device_text = (device or "").lower()
    if label.startswith("Mobile_") or label.startswith("mobile_"):
        if "smartphone" in device_text or "mobile" in device_text:
            return 3
        return 1
    if label.startswith("Desktop_") or label.startswith("desktop_"):
        if "desktop" in device_text or "laptop" in device_text:
            return 3
        return 1
    return 2


def _parse_ui_adaptations(text: str) -> list[str]:
    if not text or not isinstance(text, str):
        return []
    return [part.strip() for part in text.split(" | ") if part.strip()]


def _raw_key_to_canonical(raw_key: str) -> str | None:
    key = raw_key.strip()
    for canonical, aliases in CANONICAL_UI_ALIASES.items():
        if key in aliases:
            return canonical
    mapped = ui_element_to_adaptation_key(key)
    for canonical, aliases in CANONICAL_UI_ALIASES.items():
        if mapped in aliases:
            return canonical
    return mapped if mapped in REQUIRED_UI_ELEMENTS else None


def _enrich_ui_adaptations(row: pd.Series, candidates: pd.DataFrame | None) -> str:
    """Union UI adaptations from all merged candidate profiles for a fuller ui_profile."""
    parts: list[str] = []
    seen: set[str] = set()

    def _add(text: str) -> None:
        for item in _parse_ui_adaptations(text):
            key = item.split("=", maxsplit=1)[0].strip() if "=" in item else item
            if key not in seen:
                seen.add(key)
                parts.append(item)

    _add(str(row.get("UI_Adaptations", "")))
    if candidates is None or "Merged_Profile_IDs" not in row:
        return " | ".join(parts)

    merged_ids = [
        int(token.strip())
        for token in str(row.get("Merged_Profile_IDs", "")).split(",")
        if token.strip().isdigit()
    ]
    if not merged_ids:
        return " | ".join(parts)

    subset = candidates[candidates["Profile_ID"].isin(merged_ids)]
    for _, candidate in subset.iterrows():
        _add(str(candidate.get("UI_Adaptations", "")))

    return " | ".join(parts)


def parse_ui_profile(
    ui_adaptations: str,
    device: str | None = None,
    *,
    row: pd.Series | None = None,
    candidates: pd.DataFrame | None = None,
) -> dict[str, str]:
    """Convert UI adaptation text into canonical ui_profile keys."""
    if row is not None:
        ui_adaptations = _enrich_ui_adaptations(row, candidates)

    resolved: dict[str, tuple[str, int]] = {}

    for item in _parse_ui_adaptations(ui_adaptations):
        if "=" not in item:
            continue
        label, raw_value = item.split("=", maxsplit=1)
        label = label.strip()
        value = _clean_ui_value(raw_value)

        canonical = _raw_key_to_canonical(label)
        if canonical is None:
            ui_element = rule_item_to_ui_element(f"{label}={raw_value.strip()}")
            if ui_element is not None:
                canonical = _raw_key_to_canonical(ui_element_to_adaptation_key(ui_element))
        if canonical is None:
            continue

        priority = _ui_item_priority(label, device)
        current = resolved.get(canonical)
        if current is None or priority >= current[1]:
            resolved[canonical] = (value, priority)

    return {key: value for key, (value, _) in resolved.items()}


def _is_missing(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    text = str(value).strip()
    return not text or text.lower() == "nan"


def _optional_str(value: object) -> str | None:
    if _is_missing(value):
        return None
    return str(value).strip()


def build_context(row: pd.Series) -> dict[str, Any]:
    """Build the context block from a profile row."""
    personality: dict[str, str] = {}
    for trait in PERSONALITY_COLUMNS:
        trait_value = _optional_str(row.get(trait))
        if trait_value:
            personality[trait] = trait_value

    return {
        "persona": _optional_str(row.get("Persona")),
        "mood": _optional_str(row.get("Mood")),
        "device": _optional_str(row.get("Device")),
        "personality": personality,
    }


def _normalize_series(values: pd.Series) -> pd.Series:
    return min_max_normalize(values.fillna(0.0))


def prepare_evidence_normalization(profiles: pd.DataFrame) -> pd.DataFrame:
    """Add normalized evidence columns used when building JSON evidence blocks."""
    enriched = profiles.copy()
    score_col = "Representative_Profile_Score" if "Representative_Profile_Score" in enriched else "Overall_Profile_Score"
    enriched["Profile_Score_Raw"] = enriched[score_col].fillna(0.0)

    enriched["Norm_Feature_Importance"] = _normalize_series(enriched["Avg_RF_Importance"])
    enriched["Norm_SHAP"] = _normalize_series(enriched["Avg_SHAP"])

    if "Norm_Statistical_Evidence" in enriched.columns:
        enriched["Norm_Statistical_Score"] = enriched["Norm_Statistical_Evidence"].fillna(0.0)
    elif "Avg_Cramers_V" in enriched.columns:
        enriched["Norm_Statistical_Score"] = _normalize_series(enriched["Avg_Cramers_V"])
    else:
        enriched["Norm_Statistical_Score"] = 0.0

    if "Avg_Support" not in enriched.columns:
        enriched["Avg_Support"] = 0.0

    return enriched


def build_evidence(row: pd.Series) -> dict[str, float | int]:
    """Build the evidence block for one representative profile."""
    support = _safe_float(row.get("Avg_Support"))
    participants = max(1, round(support * SURVEY_SAMPLE_SIZE))
    if "Participant_Coverage" in row and not _is_missing(row.get("Participant_Coverage")):
        merged = max(int(_safe_float(row.get("Merged_Candidate_Count"), default=1)), 1)
        participants = max(1, round(_safe_float(row["Participant_Coverage"]) / merged))

    return {
        "profile_score": round(_safe_float(row.get("Profile_Score_Raw")), 6),
        "participants": int(participants),
        "average_support": round(support, 6),
        "average_confidence": round(_safe_float(row.get("Avg_Confidence")), 6),
        "average_lift": round(_safe_float(row.get("Avg_Lift"), default=1.0), 6),
        "statistical_score": round(_safe_float(row.get("Norm_Statistical_Score")), 6),
        "feature_importance": round(_safe_float(row.get("Norm_Feature_Importance")), 6),
        "shap_score": round(_safe_float(row.get("Norm_SHAP")), 6),
    }


def build_metadata(row: pd.Series) -> dict[str, Any]:
    """Build metadata for one representative profile."""
    return {
        "cluster_size": int(_safe_float(row.get("Merged_Candidate_Count"), default=1)),
        "created_from": "Representative Profile Builder",
        "version": REPOSITORY_VERSION,
    }


def assign_profile_ids(n_profiles: int) -> list[str]:
    """Return stable profile identifiers Profile_001 … Profile_N."""
    width = max(3, len(str(n_profiles)))
    return [f"Profile_{index:0{width}d}" for index in range(1, n_profiles + 1)]


def profile_row_to_json(
    row: pd.Series,
    profile_id: str,
    *,
    candidates: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Convert one representative profile row into a repository JSON object."""
    context = build_context(row)
    ui_profile = parse_ui_profile(
        str(row.get("UI_Adaptations", "")),
        context.get("device"),
        row=row,
        candidates=candidates,
    )

    return {
        "profile_id": profile_id,
        "context": context,
        "ui_profile": ui_profile,
        "evidence": build_evidence(row),
        "metadata": build_metadata(row),
    }


def build_profile_repository(
    profiles: pd.DataFrame,
    *,
    candidates: pd.DataFrame | None = None,
) -> list[dict[str, Any]]:
    """Convert representative profile rows into ordered JSON profile objects."""
    score_col = (
        "Representative_Profile_Score"
        if "Representative_Profile_Score" in profiles.columns
        else "Overall_Profile_Score"
    )
    sort_cols = [score_col, "Antecedent"] if "Antecedent" in profiles.columns else [score_col]
    enriched = prepare_evidence_normalization(profiles)
    ordered = enriched.sort_values(sort_cols, ascending=[False, True]).reset_index(drop=True)

    profile_ids = assign_profile_ids(len(ordered))
    return [
        profile_row_to_json(ordered.iloc[index], profile_ids[index], candidates=candidates)
        for index in range(len(ordered))
    ]


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


def deduplicate_profiles_by_context(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep the highest-scoring profile when multiple share an identical context."""
    best_by_context: dict[str, dict[str, Any]] = {}
    for profile in profiles:
        signature = _context_signature(profile)
        current = best_by_context.get(signature)
        if current is None or profile["evidence"]["profile_score"] > current["evidence"]["profile_score"]:
            best_by_context[signature] = profile

    deduped = sorted(
        best_by_context.values(),
        key=lambda item: (-item["evidence"]["profile_score"], item["profile_id"]),
    )
    new_ids = assign_profile_ids(len(deduped))
    for index, profile in enumerate(deduped):
        profile["profile_id"] = new_ids[index]
    return deduped


def _fill_missing_ui_from_repository(profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Fill missing required UI keys using repository-wide weighted defaults."""
    from collections import Counter

    global_votes: dict[str, Counter[str]] = {key: Counter() for key in REQUIRED_UI_ELEMENTS}
    for profile in profiles:
        for key, value in profile["ui_profile"].items():
            if key in global_votes and value:
                global_votes[key][value] += 1

    defaults = {
        key: counter.most_common(1)[0][0]
        for key, counter in global_votes.items()
        if counter
    }

    completed: list[dict[str, Any]] = []
    for profile in profiles:
        ui_profile = dict(profile["ui_profile"])
        for key in REQUIRED_UI_ELEMENTS:
            if key not in ui_profile and key in defaults:
                ui_profile[key] = defaults[key]
        completed.append({**profile, "ui_profile": ui_profile})
    return completed


def build_profile_lookup(profiles: list[dict[str, Any]]) -> dict[str, Any]:
    """Build a nested persona → mood → device lookup index."""
    lookup: dict[str, Any] = {}

    for profile in profiles:
        context = profile["context"]
        persona = context.get("persona") or "_any"
        mood = context.get("mood") or "_any"
        device = context.get("device") or "_any"

        bucket = lookup.setdefault(persona, {}).setdefault(mood, {})
        if device not in bucket:
            bucket[device] = profile["profile_id"]

    return lookup


def build_repository_statistics(profiles: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute repository-level statistics for summary reporting."""
    if not profiles:
        return {
            "average_profile_score": 0.0,
            "average_participants": 0.0,
            "persona_distribution": {},
            "mood_distribution": {},
            "device_distribution": {},
        }

    persona_counts: dict[str, int] = {}
    mood_counts: dict[str, int] = {}
    device_counts: dict[str, int] = {}

    for profile in profiles:
        context = profile["context"]
        persona = context.get("persona") or "Unspecified"
        mood = context.get("mood") or "Unspecified"
        device = context.get("device") or "Unspecified"
        persona_counts[persona] = persona_counts.get(persona, 0) + 1
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
        device_counts[device] = device_counts.get(device, 0) + 1

    return {
        "average_profile_score": round(
            sum(profile["evidence"]["profile_score"] for profile in profiles) / len(profiles),
            6,
        ),
        "average_participants": round(
            sum(profile["evidence"]["participants"] for profile in profiles) / len(profiles),
            2,
        ),
        "persona_distribution": dict(sorted(persona_counts.items(), key=lambda item: (-item[1], item[0]))),
        "mood_distribution": dict(sorted(mood_counts.items(), key=lambda item: (-item[1], item[0]))),
        "device_distribution": dict(sorted(device_counts.items(), key=lambda item: (-item[1], item[0]))),
    }


def build_repository_summary_markdown(
    profiles: list[dict[str, Any]],
    validation: ProfileValidationReport,
    statistics: dict[str, Any],
) -> str:
    """Render repository summary markdown."""
    lines = [
        "# Adaptive Profile Repository Summary",
        "",
        "## Overview",
        f"- Profiles exported: {len(profiles)}",
        f"- Average profile score: {statistics['average_profile_score']:.3f}",
        f"- Average participants: {statistics['average_participants']:.1f}",
        f"- Validation status: {'PASS' if validation.is_valid else 'FAIL'}",
        "",
        "## Profile Distribution by Persona",
    ]
    for persona, count in statistics["persona_distribution"].items():
        lines.append(f"- {persona}: {count}")

    lines.extend(["", "## Profile Distribution by Mood"])
    for mood, count in statistics["mood_distribution"].items():
        lines.append(f"- {mood}: {count}")

    lines.extend(["", "## Profile Distribution by Device"])
    for device, count in statistics["device_distribution"].items():
        lines.append(f"- {device}: {count}")

    lines.extend(["", "## Top Profiles"])
    for profile in profiles[:10]:
        context = profile["context"]
        lines.append(
            f"- **{profile['profile_id']}** — persona={context.get('persona')}, "
            f"mood={context.get('mood')}, device={context.get('device')}, "
            f"score={profile['evidence']['profile_score']:.3f}"
        )

    if not validation.is_valid:
        lines.extend(["", "## Validation Issues"])
        for issue_type, issues in [
            ("Duplicate IDs", validation.duplicate_profile_ids),
            ("Duplicate contexts", validation.duplicate_contexts[:10]),
            ("Missing UI", validation.missing_ui_elements[:10]),
            ("Missing context", validation.missing_context[:10]),
            ("Missing evidence", validation.missing_evidence[:10]),
            ("Invalid values", validation.invalid_values[:10]),
            ("Invalid categorical", validation.invalid_categorical_values[:10]),
        ]:
            if issues:
                lines.append(f"### {issue_type}")
                for issue in issues:
                    lines.append(f"- {issue}")

    return "\n".join(lines)


def build_catalog_dataframe(profiles: list[dict[str, Any]]) -> pd.DataFrame:
    """Flatten repository profiles into a tabular catalog."""
    rows: list[dict[str, Any]] = []
    for profile in profiles:
        context = profile["context"]
        evidence = profile["evidence"]
        metadata = profile["metadata"]
        rows.append(
            {
                "profile_id": profile["profile_id"],
                "persona": context.get("persona"),
                "mood": context.get("mood"),
                "device": context.get("device"),
                "personality": json.dumps(context.get("personality", {}), ensure_ascii=False),
                "ui_profile": json.dumps(profile["ui_profile"], ensure_ascii=False),
                "profile_score": evidence["profile_score"],
                "participants": evidence["participants"],
                "average_support": evidence["average_support"],
                "average_confidence": evidence["average_confidence"],
                "average_lift": evidence["average_lift"],
                "statistical_score": evidence["statistical_score"],
                "feature_importance": evidence["feature_importance"],
                "shap_score": evidence["shap_score"],
                "cluster_size": metadata["cluster_size"],
                "created_from": metadata["created_from"],
                "version": metadata["version"],
            }
        )
    return pd.DataFrame(rows)


@dataclass
class ProfileRepositoryResult:
    """Outputs from the adaptive profile repository pipeline."""

    profiles: list[dict[str, Any]]
    lookup: dict[str, Any]
    validation: ProfileValidationReport
    statistics: dict[str, Any]
    export_paths: dict[str, Path]
    summary: dict[str, object]


def export_profile_repository(
    profiles: list[dict[str, Any]],
    lookup: dict[str, Any],
    validation: ProfileValidationReport,
    statistics: dict[str, Any],
    output_dir: Path,
    reports_dir: Path,
) -> dict[str, Path]:
    """Write JSON repository files, catalog exports, and summary markdown."""
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    json_path = output_dir / "adaptive_profiles.json"
    json_path.write_text(
        json.dumps(profiles, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    export_paths["adaptive_profiles_json"] = json_path

    lookup_path = output_dir / "profile_lookup.json"
    lookup_path.write_text(
        json.dumps(lookup, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    export_paths["profile_lookup_json"] = lookup_path

    catalog_df = build_catalog_dataframe(profiles)
    catalog_xlsx = reports_dir / "adaptive_profile_catalog.xlsx"
    catalog_df.to_excel(catalog_xlsx, index=False)
    export_paths["adaptive_profile_catalog_xlsx"] = catalog_xlsx

    summary_md = reports_dir / "repository_summary.md"
    summary_md.write_text(
        build_repository_summary_markdown(profiles, validation, statistics),
        encoding="utf-8",
    )
    export_paths["repository_summary_md"] = summary_md

    logger.info("Exported adaptive profile repository to %s", output_dir)
    return export_paths


def run_profile_repository_pipeline(
    project_root: Path,
    output_dir: Path,
    reports_dir: Path,
    *,
    profiles_path: Path | None = None,
    candidates_path: Path | None = None,
) -> ProfileRepositoryResult:
    """Load representative profiles and export the website-ready JSON repository."""
    profiles_df = _load_profiles(project_root / (profiles_path or DEFAULT_PROFILES_PATH))

    candidates_file = candidates_path or (
        Path("reports") / "AssociationRules" / "candidate_profiles.csv"
    )
    candidates_full = project_root / candidates_file
    candidates = _load_profiles(candidates_full) if candidates_full.exists() else None

    profiles = build_profile_repository(profiles_df, candidates=candidates)
    profiles = _fill_missing_ui_from_repository(profiles)
    profiles = deduplicate_profiles_by_context(profiles)
    lookup = build_profile_lookup(profiles)
    validation = validate_profile_repository(profiles)
    statistics = build_repository_statistics(profiles)
    export_paths = export_profile_repository(
        profiles,
        lookup,
        validation,
        statistics,
        output_dir,
        reports_dir,
    )

    summary = {
        "profiles_exported": len(profiles),
        "average_profile_score": statistics["average_profile_score"],
        "average_participants": statistics["average_participants"],
        "repository_location": str(output_dir),
        "validation_passed": validation.is_valid,
        "statistics": statistics,
    }

    return ProfileRepositoryResult(
        profiles=profiles,
        lookup=lookup,
        validation=validation,
        statistics=statistics,
        export_paths=export_paths,
        summary=summary,
    )
