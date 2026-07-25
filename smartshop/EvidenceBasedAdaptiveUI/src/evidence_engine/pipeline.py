"""End-to-end guideline validation and scoring pipeline for Notebook 06."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from src.evidence_engine.scoring import (
    GUIDELINE_SCORE_WEIGHTS,
    build_guideline_scores,
    select_validated_guidelines,
)

logger = logging.getLogger(__name__)

DEFAULT_STATISTICAL_PATH = (
    Path("reports")
    / "Statistical_Validation"
    / "tables"
    / "statistical_results.csv"
)
DEFAULT_IMPORTANCE_PATH = Path("reports") / "Feature_Importance" / "feature_importance.csv"
DEFAULT_SHAP_PATH = Path("reports") / "Feature_Importance" / "shap_summary.csv"
DEFAULT_RULES_PATH = Path("reports") / "AssociationRules" / "association_rules.csv"


@dataclass
class GuidelineScoringResult:
    """Outputs from the Notebook 06 evidence-scoring pipeline."""

    all_scores: pd.DataFrame
    validated_guidelines: pd.DataFrame
    export_paths: dict[str, Path]


def _load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Required input not found: {path}")
    return pd.read_csv(path)


def load_evidence_inputs(
    project_root: Path,
    *,
    statistical_path: Path | None = None,
    importance_path: Path | None = None,
    shap_path: Path | None = None,
    rules_path: Path | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load Notebook 03–05 report tables from disk."""
    statistical = _load_csv(project_root / (statistical_path or DEFAULT_STATISTICAL_PATH))
    importance = _load_csv(project_root / (importance_path or DEFAULT_IMPORTANCE_PATH))
    shap = _load_csv(project_root / (shap_path or DEFAULT_SHAP_PATH))
    rules = _load_csv(project_root / (rules_path or DEFAULT_RULES_PATH))
    return statistical, importance, shap, rules


def build_guideline_summary(
    all_scores: pd.DataFrame,
    validated: pd.DataFrame,
    *,
    top_n: int = 100,
) -> str:
    """Render a markdown summary for notebook reporting."""
    strength_counts = all_scores["Guideline_Strength"].value_counts()
    top_row = validated.iloc[0] if not validated.empty else None

    lines = [
        "# Guideline Validation and Scoring Summary",
        "",
        "## Inputs",
        "- Notebook 03: statistical validation (Cramér's V)",
        "- Notebook 04: Random Forest importance + SHAP",
        "- Notebook 05: association rules (support, confidence, lift)",
        "",
        "## Scoring Weights",
    ]
    for component, weight in GUIDELINE_SCORE_WEIGHTS.items():
        lines.append(f"- {component.replace('_', ' ')}: {weight:.0%}")

    lines.extend(
        [
            "",
            "## Results",
            f"- Total predictor × UI pairs scored: {len(all_scores)}",
            f"- Validated (Strong + Very Strong): {int(all_scores['Is_Validated'].sum())}",
            f"- Top {top_n} exported: {len(validated)}",
            "",
            "## Strength Distribution",
        ]
    )
    for strength in ["Very Strong", "Strong", "Moderate", "Weak"]:
        lines.append(f"- {strength}: {int(strength_counts.get(strength, 0))}")

    if top_row is not None:
        lines.extend(
            [
                "",
                "## Top Guideline",
                (
                    f"- **{top_row['Predictor']} → {top_row['UI_Element']}** "
                    f"(score={top_row['Guideline_Confidence_Score']:.3f}, "
                    f"{top_row['Guideline_Strength']})"
                ),
            ]
        )

    lines.extend(
        [
            "",
            "## Next Step",
            "Notebook 07 converts validated guidelines into structured JSON for the adaptive UI engine.",
        ]
    )
    return "\n".join(lines)


def export_guideline_outputs(
    all_scores: pd.DataFrame,
    validated: pd.DataFrame,
    reports_dir: Path,
    *,
    top_n: int = 100,
) -> dict[str, Path]:
    """Export validated guidelines and full score tables."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    validated_csv = reports_dir / "validated_guidelines.csv"
    validated.to_csv(validated_csv, index=False)
    export_paths["validated_guidelines_csv"] = validated_csv

    scores_xlsx = reports_dir / "guideline_scores.xlsx"
    with pd.ExcelWriter(scores_xlsx, engine="openpyxl") as writer:
        all_scores.to_excel(writer, sheet_name="All_Scores", index=False)
        validated.to_excel(writer, sheet_name="Top_Validated", index=False)
        strength_summary = (
            all_scores.groupby("Guideline_Strength", as_index=False)
            .size()
            .rename(columns={"size": "Count"})
            .sort_values("Guideline_Strength")
        )
        strength_summary.to_excel(writer, sheet_name="Strength_Summary", index=False)
    export_paths["guideline_scores_xlsx"] = scores_xlsx

    summary_md = reports_dir / "guideline_summary.md"
    summary_md.write_text(
        build_guideline_summary(all_scores, validated, top_n=top_n),
        encoding="utf-8",
    )
    export_paths["guideline_summary_md"] = summary_md

    logger.info("Exported guideline scoring outputs to %s", reports_dir)
    return export_paths


def run_guideline_scoring_pipeline(
    project_root: Path,
    reports_dir: Path,
    *,
    top_n: int = 100,
    statistical_path: Path | None = None,
    importance_path: Path | None = None,
    shap_path: Path | None = None,
    rules_path: Path | None = None,
) -> GuidelineScoringResult:
    """Load upstream evidence, score guidelines, and export validated results."""
    statistical, importance, shap, rules = load_evidence_inputs(
        project_root,
        statistical_path=statistical_path,
        importance_path=importance_path,
        shap_path=shap_path,
        rules_path=rules_path,
    )

    all_scores = build_guideline_scores(statistical, importance, shap, rules)
    validated = select_validated_guidelines(all_scores, top_n=top_n)
    export_paths = export_guideline_outputs(
        all_scores,
        validated,
        reports_dir,
        top_n=top_n,
    )

    return GuidelineScoringResult(
        all_scores=all_scores,
        validated_guidelines=validated,
        export_paths=export_paths,
    )
