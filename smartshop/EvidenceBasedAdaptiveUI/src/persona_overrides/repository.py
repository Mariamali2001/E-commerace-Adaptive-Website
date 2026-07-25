"""Discover persona-level UI overrides that differ from survey defaults.

This module does not build complete interfaces. For each shopping persona it
compares every UI preference to the corresponding default and keeps an override
only when the persona majority differs from the default and is supported by
multi-source evidence (statistics, Random Forest, SHAP, association rules).
"""

from __future__ import annotations

import json
import logging
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.preprocessing.columns import ALL_UI_COLUMNS

logger = logging.getLogger(__name__)

PERSONA_COLUMN = "primary_persona"
PREDICTOR = "primary_persona"

MIN_EVIDENCE_SOURCES = 2
MIN_PERSONA_SHARE = 0.20
MIN_PERSONA_COUNT = 5
STAT_EVIDENCE_SCORE_MIN = 0.50
RF_RANK_MAX = 5
SHAP_RANK_MAX = 5
RULE_CONFIDENCE_MIN = 0.60

DEFAULT_JSON_FILES = {
    "global": "global_defaults.json",
    "desktop": "desktop_defaults.json",
    "mobile": "mobile_defaults.json",
}


def short_persona_name(raw: object) -> str:
    """Turn ``The Researcher (...)`` into ``Researcher``."""
    text = str(raw).strip()
    if "(" in text:
        text = text.split("(", maxsplit=1)[0].strip()
    if text.startswith("The "):
        text = text[4:]
    return text


def _normalize_value(value: object) -> str:
    """Normalize option text for equality checks against defaults."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    return text.casefold()


def _display_value(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value).strip()


def load_defaults(output_dir: Path) -> dict[str, dict[str, Any]]:
    """Load Global/Desktop/Mobile default repositories into one UI-element map."""
    defaults: dict[str, dict[str, Any]] = {}
    for _, filename in DEFAULT_JSON_FILES.items():
        path = output_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Default UI file not found: {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        for element, meta in payload.get("defaults", {}).items():
            defaults[element] = {
                "value": meta.get("value"),
                "percentage": float(meta.get("percentage", 0.0)),
                "count": int(meta.get("count", 0)),
            }
    return defaults


def _load_table(path: Path) -> pd.DataFrame:
    if not path.exists():
        sibling = path.with_suffix(".csv" if path.suffix.lower() == ".xlsx" else ".xlsx")
        if sibling.exists():
            path = sibling
        else:
            raise FileNotFoundError(f"Required input not found: {path}")
    if path.suffix.lower() == ".xlsx":
        return pd.read_excel(path)
    return pd.read_csv(path)


def _rule_matches_persona(antecedent: str, persona_short: str) -> bool:
    """True when the rule antecedent is persona-only for this persona."""
    parts = [part.strip() for part in str(antecedent).split(",") if part.strip()]
    if len(parts) != 1:
        return False
    item = parts[0]
    if not item.startswith("Persona="):
        return False
    return short_persona_name(item.split("=", maxsplit=1)[1]) == persona_short


def _parse_consequent_items(consequent: str) -> list[tuple[str, str]]:
    """Parse association consequents into (survey_column, value) pairs.

    Values may be truncated with ``...`` and multiple items can appear in one
    cell, so labels are located with a regex rather than naive comma splits.
    """
    items: list[tuple[str, str]] = []
    pattern = re.compile(
        r"(Global_[A-Za-z0-9_]+|Desktop_[A-Za-z0-9_]+|Mobile_[A-Za-z0-9_]+)=(.*?)(?=,\s*(?:Global_|Desktop_|Mobile_)|$)"
    )
    for match in pattern.finditer(str(consequent)):
        label = match.group(1)
        value = match.group(2).strip().rstrip(",")
        if label.startswith("Global_"):
            column = label.removeprefix("Global_")
        elif label.startswith("Desktop_"):
            column = f"desktop_{label.removeprefix('Desktop_')}"
        else:
            column = f"mobile_{label.removeprefix('Mobile_')}"
        items.append((column, value))
    return items


def _values_match(rule_value: str, preferred_value: str) -> bool:
    """Match full survey values to possibly truncated association-rule values."""
    left = _normalize_value(rule_value)
    right = _normalize_value(preferred_value)
    if not left or not right:
        return False
    if left == right:
        return True
    # Association mining truncates long values with "...".
    if left.endswith("..."):
        prefix = left[:-3].rstrip()
        return right.startswith(prefix)
    if right.endswith("..."):
        prefix = right[:-3].rstrip()
        return left.startswith(prefix)
    return left.startswith(right) or right.startswith(left)


def _statistical_supported(stat_row: pd.Series | None) -> bool:
    if stat_row is None:
        return False
    if bool(stat_row.get("Is_Strong_Evidence", False)) or bool(
        stat_row.get("Is_Moderate_Evidence", False)
    ):
        return True
    if bool(stat_row.get("Significant", False)):
        return True
    score = float(stat_row.get("Evidence_Score", 0.0) or 0.0)
    return score >= STAT_EVIDENCE_SCORE_MIN


def _lookup_stat(statistical: pd.DataFrame, ui_element: str) -> pd.Series | None:
    subset = statistical[
        (statistical["Predictor"] == PREDICTOR) & (statistical["UI_Element"] == ui_element)
    ]
    if subset.empty:
        return None
    return subset.sort_values("Evidence_Score", ascending=False).iloc[0]


def _lookup_rf(importance: pd.DataFrame, ui_element: str) -> pd.Series | None:
    subset = importance[
        (importance["Predictor"] == PREDICTOR) & (importance["UI_Target"] == ui_element)
    ]
    if subset.empty:
        return None
    return subset.sort_values(["Rank", "Importance"], ascending=[True, False]).iloc[0]


def _lookup_shap(shap: pd.DataFrame, ui_element: str) -> pd.Series | None:
    subset = shap[(shap["Predictor"] == PREDICTOR) & (shap["UI_Target"] == ui_element)]
    if subset.empty:
        return None
    return subset.sort_values(["SHAP_Rank", "Mean_ABS_SHAP"], ascending=[True, False]).iloc[0]


def _lookup_association(
    rules: pd.DataFrame,
    persona_short: str,
    ui_element: str,
    preferred_value: str,
) -> dict[str, float] | None:
    """Best persona-only association rule matching this UI value."""
    if rules.empty:
        return None

    best: dict[str, float] | None = None
    for _, row in rules.iterrows():
        if not _rule_matches_persona(str(row.get("Antecedent", "")), persona_short):
            continue
        for column, value in _parse_consequent_items(str(row.get("Consequent", ""))):
            if column != ui_element:
                continue
            if not _values_match(value, preferred_value):
                continue
            confidence = float(row.get("Confidence", 0.0) or 0.0)
            support = float(row.get("Support", 0.0) or 0.0)
            if confidence < RULE_CONFIDENCE_MIN:
                continue
            candidate = {"confidence": confidence, "support": support}
            if best is None or candidate["confidence"] > best["confidence"]:
                best = candidate
    return best


def persona_majority(series: pd.Series) -> tuple[str | None, int, float]:
    """Return majority value, count, and share within a persona group."""
    valid = series.dropna()
    total = int(len(valid))
    if total == 0:
        return None, 0, 0.0
    counts = valid.value_counts()
    value = str(counts.index[0])
    count = int(counts.iloc[0])
    return value, count, count / total


def build_persona_overrides(
    df: pd.DataFrame,
    defaults: dict[str, dict[str, Any]],
    statistical: pd.DataFrame,
    importance: pd.DataFrame,
    shap: pd.DataFrame,
    rules: pd.DataFrame,
) -> tuple[list[dict[str, Any]], pd.DataFrame]:
    """Build persona override repositories and a flat export table."""
    n_total = len(df)
    repositories: list[dict[str, Any]] = []
    flat_rows: list[dict[str, Any]] = []

    personas = sorted(df[PERSONA_COLUMN].dropna().unique(), key=short_persona_name)

    for persona_raw in personas:
        persona_short = short_persona_name(persona_raw)
        group = df[df[PERSONA_COLUMN] == persona_raw]
        overrides: dict[str, Any] = {}

        for ui_element in ALL_UI_COLUMNS:
            if ui_element not in df.columns or ui_element not in defaults:
                continue

            default_value = defaults[ui_element]["value"]
            majority_value, count, share = persona_majority(group[ui_element])
            if majority_value is None:
                continue
            if count < MIN_PERSONA_COUNT or share < MIN_PERSONA_SHARE:
                continue
            if _normalize_value(majority_value) == _normalize_value(default_value):
                continue  # do not duplicate defaults

            evidence: list[str] = []
            stat_row = _lookup_stat(statistical, ui_element)
            if _statistical_supported(stat_row):
                evidence.append("Statistics")

            rf_row = _lookup_rf(importance, ui_element)
            if rf_row is not None and int(rf_row.get("Rank", 99)) <= RF_RANK_MAX:
                evidence.append("Random Forest")

            shap_row = _lookup_shap(shap, ui_element)
            if shap_row is not None and int(shap_row.get("SHAP_Rank", 99)) <= SHAP_RANK_MAX:
                evidence.append("SHAP")

            rule_metrics = _lookup_association(
                rules, persona_short, ui_element, majority_value
            )
            if rule_metrics is not None:
                evidence.append("Association Rules")

            if len(evidence) < MIN_EVIDENCE_SOURCES:
                continue

            confidence = (
                float(rule_metrics["confidence"])
                if rule_metrics is not None
                else round(share, 6)
            )
            support = (
                float(rule_metrics["support"])
                if rule_metrics is not None
                else round(count / n_total, 6)
            )

            overrides[ui_element] = {
                "value": _display_value(majority_value),
                "confidence": round(confidence, 6),
                "support": round(support, 6),
                "evidence": evidence,
            }
            flat_rows.append(
                {
                    "Persona": persona_short,
                    "UI_Element": ui_element,
                    "Override_Value": _display_value(majority_value),
                    "Default_Value": _display_value(default_value),
                    "Persona_Count": count,
                    "Persona_Share": round(share, 4),
                    "Confidence": round(confidence, 6),
                    "Support": round(support, 6),
                    "Evidence": ", ".join(evidence),
                    "Evidence_Count": len(evidence),
                }
            )

        repositories.append(
            {
                "persona": persona_short,
                "n_respondents": int(len(group)),
                "n_overrides": len(overrides),
                "overrides": overrides,
            }
        )

    flat = pd.DataFrame(flat_rows)
    if not flat.empty:
        flat = flat.sort_values(
            ["Persona", "Confidence", "Support"],
            ascending=[True, False, False],
        ).reset_index(drop=True)
    return repositories, flat


@dataclass
class PersonaOverrideResult:
    """Outputs from the persona override pipeline."""

    repositories: list[dict[str, Any]]
    table: pd.DataFrame
    export_paths: dict[str, Path]
    summary: dict[str, Any]


def run_persona_override_pipeline(
    project_root: Path,
    output_dir: Path,
    reports_dir: Path,
) -> PersonaOverrideResult:
    """Load inputs, discover evidence-backed persona overrides, and export them."""
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(project_root / "data" / "processed" / "clean_dataset.csv")
    defaults = load_defaults(output_dir)

    statistical = _load_table(
        project_root
        / "reports"
        / "Statistical_Validation"
        / "tables"
        / "statistical_results.xlsx"
    )
    importance = _load_table(
        project_root / "reports" / "Feature_Importance" / "feature_importance.xlsx"
    )
    shap = _load_table(
        project_root / "reports" / "Feature_Importance" / "shap_summary.csv"
    )

    rules_path = project_root / "reports" / "AssociationRules" / "base_candidate_rules.csv"
    rules = _load_table(rules_path) if rules_path.exists() else pd.DataFrame()

    repositories, table = build_persona_overrides(
        df, defaults, statistical, importance, shap, rules
    )

    export_paths: dict[str, Path] = {}

    json_path = output_dir / "persona_overrides.json"
    json_path.write_text(
        json.dumps(repositories, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    export_paths["persona_overrides_json"] = json_path

    xlsx_path = reports_dir / "persona_overrides.xlsx"
    table.to_excel(xlsx_path, index=False)
    export_paths["persona_overrides_xlsx"] = xlsx_path

    csv_path = reports_dir / "persona_overrides.csv"
    table.to_csv(csv_path, index=False)
    export_paths["persona_overrides_csv"] = csv_path

    overrides_per_persona = {
        item["persona"]: item["n_overrides"] for item in repositories
    }
    avg_confidence = float(table["Confidence"].mean()) if not table.empty else 0.0

    summary = {
        "overrides_per_persona": overrides_per_persona,
        "total_overrides": int(len(table)),
        "average_confidence": round(avg_confidence, 6),
        "personas": len(repositories),
    }

    summary_md = reports_dir / "persona_overrides_summary.md"
    lines = [
        "# Persona Overrides Summary",
        "",
        "Only UI elements that differ from defaults and have multi-source evidence.",
        "",
        f"- Personas: {summary['personas']}",
        f"- Total overrides: {summary['total_overrides']}",
        f"- Average confidence: {summary['average_confidence']:.4f}",
        "",
        "## Overrides per persona",
    ]
    for persona, count in overrides_per_persona.items():
        lines.append(f"- {persona}: {count}")
    summary_md.write_text("\n".join(lines), encoding="utf-8")
    export_paths["summary_md"] = summary_md

    logger.info(
        "Persona overrides: %s total across %s personas (avg confidence=%.3f)",
        summary["total_overrides"],
        summary["personas"],
        summary["average_confidence"],
    )
    return PersonaOverrideResult(
        repositories=repositories,
        table=table,
        export_paths=export_paths,
        summary=summary,
    )
