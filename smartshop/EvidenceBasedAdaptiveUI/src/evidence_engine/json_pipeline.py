"""Validation and export for the verified guideline JSON repository."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd

from src.evidence_engine.json_builder import (
    REQUIRED_RULE_FIELDS,
    build_guideline_repository,
)

logger = logging.getLogger(__name__)

DEFAULT_VALIDATED_PATH = (
    Path("reports") / "Guideline_Validation" / "validated_guidelines.csv"
)
DEFAULT_RULES_PATH = Path("reports") / "AssociationRules" / "association_rules.csv"


@dataclass
class ValidationReport:
    """Results from validating the generated guideline repository."""

    is_valid: bool
    duplicate_rule_ids: list[int] = field(default_factory=list)
    missing_fields: list[str] = field(default_factory=list)
    invalid_values: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


@dataclass
class GuidelineJsonResult:
    """Outputs from the Notebook 07 JSON pipeline."""

    rules: list[dict[str, Any]]
    validation: ValidationReport
    export_paths: dict[str, Path]
    summary: dict[str, float | int]


def _load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Required input not found: {path}")
    return pd.read_csv(path)


def validate_guideline_repository(rules: list[dict[str, Any]]) -> ValidationReport:
    """Check duplicate IDs, missing fields, and invalid metric values."""
    duplicate_rule_ids: list[int] = []
    missing_fields: list[str] = []
    invalid_values: list[str] = []
    warnings: list[str] = []

    seen_ids: set[int] = set()
    for rule in rules:
        rule_id = rule.get("rule_id")
        if rule_id in seen_ids:
            duplicate_rule_ids.append(int(rule_id))
        seen_ids.add(rule_id)

        for field_name in REQUIRED_RULE_FIELDS:
            if field_name not in rule:
                missing_fields.append(f"rule {rule_id}: missing {field_name}")

        conditions = rule.get("conditions", {})
        for key in ("persona", "emotion", "device", "personality"):
            if key not in conditions:
                missing_fields.append(f"rule {rule_id}: conditions.{key}")

        for metric in ("support", "confidence", "lift", "guideline_score"):
            value = rule.get(metric)
            if value is None:
                invalid_values.append(f"rule {rule_id}: {metric} is null")
                continue
            if not isinstance(value, (int, float)):
                invalid_values.append(f"rule {rule_id}: {metric} is not numeric")
                continue
            if metric != "lift" and not 0.0 <= float(value) <= 1.0:
                invalid_values.append(f"rule {rule_id}: {metric}={value} outside 0–1")
            if metric == "lift" and float(value) < 0.0:
                invalid_values.append(f"rule {rule_id}: lift={value} is negative")

        if not rule.get("adaptations"):
            warnings.append(f"rule {rule_id}: empty adaptations block")
        if not rule.get("feature_importance"):
            warnings.append(f"rule {rule_id}: empty feature_importance block")

    is_valid = not duplicate_rule_ids and not missing_fields and not invalid_values
    return ValidationReport(
        is_valid=is_valid,
        duplicate_rule_ids=sorted(set(duplicate_rule_ids)),
        missing_fields=missing_fields,
        invalid_values=invalid_values,
        warnings=warnings,
    )


def build_repository_summary(rules: list[dict[str, Any]]) -> dict[str, float | int]:
    """Compute aggregate statistics for notebook reporting."""
    if not rules:
        return {
            "total_guidelines": 0,
            "average_confidence": 0.0,
            "average_support": 0.0,
            "average_guideline_score": 0.0,
        }

    return {
        "total_guidelines": len(rules),
        "average_confidence": round(
            sum(float(rule["confidence"]) for rule in rules) / len(rules),
            6,
        ),
        "average_support": round(
            sum(float(rule["support"]) for rule in rules) / len(rules),
            6,
        ),
        "average_guideline_score": round(
            sum(float(rule["guideline_score"]) for rule in rules) / len(rules),
            6,
        ),
    }


def export_guideline_repository(
    rules: list[dict[str, Any]],
    output_dir: Path,
    reports_dir: Path,
) -> dict[str, Path]:
    """Write JSON repository files and an Excel catalog."""
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    json_path = output_dir / "verified_guidelines.json"
    json_path.write_text(json.dumps(rules, separators=(",", ":")), encoding="utf-8")
    export_paths["verified_guidelines_json"] = json_path

    pretty_path = output_dir / "verified_guidelines_pretty.json"
    pretty_path.write_text(json.dumps(rules, indent=2), encoding="utf-8")
    export_paths["verified_guidelines_pretty_json"] = pretty_path

    catalog_rows = []
    for rule in rules:
        catalog_rows.append(
            {
                "rule_id": rule["rule_id"],
                "persona": rule["conditions"].get("persona"),
                "emotion": rule["conditions"].get("emotion"),
                "device": rule["conditions"].get("device"),
                "personality": json.dumps(rule["conditions"].get("personality", {})),
                "adaptations": json.dumps(rule["adaptations"]),
                "support": rule["support"],
                "confidence": rule["confidence"],
                "lift": rule["lift"],
                "feature_importance": json.dumps(rule["feature_importance"]),
                "guideline_score": rule["guideline_score"],
            }
        )

    catalog_xlsx = reports_dir / "guideline_catalog.xlsx"
    pd.DataFrame(catalog_rows).to_excel(catalog_xlsx, index=False)
    export_paths["guideline_catalog_xlsx"] = catalog_xlsx

    logger.info("Exported verified guideline repository to %s", output_dir)
    return export_paths


def run_guideline_json_pipeline(
    project_root: Path,
    output_dir: Path,
    reports_dir: Path,
    *,
    validated_path: Path | None = None,
    association_rules_path: Path | None = None,
) -> GuidelineJsonResult:
    """Load validated guidelines and export the deterministic JSON repository."""
    validated = _load_csv(project_root / (validated_path or DEFAULT_VALIDATED_PATH))

    rules_path = project_root / (association_rules_path or DEFAULT_RULES_PATH)
    association_rules = pd.read_csv(rules_path) if rules_path.exists() else None
    if association_rules is None:
        logger.warning("Association rules not found; using structural condition mapping.")

    rules = build_guideline_repository(validated, association_rules=association_rules)
    validation = validate_guideline_repository(rules)
    export_paths = export_guideline_repository(rules, output_dir, reports_dir)
    summary = build_repository_summary(rules)

    return GuidelineJsonResult(
        rules=rules,
        validation=validation,
        export_paths=export_paths,
        summary=summary,
    )
