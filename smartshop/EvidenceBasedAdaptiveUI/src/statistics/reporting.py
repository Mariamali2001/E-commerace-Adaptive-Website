"""Markdown reporting for statistical validation results."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.statistics.evidence import summarize_evidence_statistics


def format_label(column_name: str) -> str:
    """Convert a snake_case column name to a readable label."""
    replacements = {
        "primary_persona": "Primary Persona",
        "current_mood": "Current Mood",
        "primary_device": "Primary Device",
    }
    if column_name in replacements:
        return replacements[column_name]
    return column_name.replace("_", " ")


def _format_relationship(row: pd.Series) -> list[str]:
    predictor = format_label(str(row["Predictor"]))
    ui_element = format_label(str(row["UI_Element"]))
    return [
        f"### {predictor} → {ui_element}",
        "",
        f"- Raw p = {row['Raw_P']:.4f}",
        f"- Adjusted p (global FDR) = {row['Adjusted_P']:.4f}",
        f"- Adjusted p (per-predictor FDR) = {row['Adjusted_P_Per_Predictor']:.4f}",
        f"- Cramér's V = {row['Cramers_V']:.3f}",
        f"- Evidence Score = {row['Evidence_Score']:.3f}",
        f"- Evidence Level = {row['Evidence_Level']}",
        "",
    ]


def generate_statistical_summary(
    results: pd.DataFrame,
    output_path: Path,
    *,
    top_n: int = 30,
) -> Path:
    """Write a markdown summary of statistical validation and evidence tiers."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    summary = summarize_evidence_statistics(results, top_n=top_n)

    lines = [
        "# Statistical Validation Summary",
        "",
        "## Summary Statistics",
        "",
        f"- Total tests: {summary['total_tests']}",
        f"- Nominally significant (Raw p < 0.05): {summary['significant_nominal']}",
        f"- Significant after global FDR: {summary['significant_global_fdr']}",
        f"- Significant after predictor-level FDR: {summary['significant_per_predictor_fdr']}",
        f"- Medium effect sizes: {summary['medium_effect_sizes']}",
        f"- Large effect sizes: {summary['large_effect_sizes']}",
        f"- Strong statistical evidence: {summary['strong_evidence_count']}",
        f"- Moderate statistical evidence: {summary['moderate_evidence_count']}",
        f"- Exploratory evidence: {summary['exploratory_evidence_count']}",
        f"- Average Cramér's V: {summary['average_cramers_v']:.3f}",
        f"- Average Evidence Score: {summary['average_evidence_score']:.3f}",
        "",
        "## Evidence Levels",
        "",
        "1. **Strong Statistical Evidence** — Adjusted p (global FDR) < 0.05",
        "2. **Moderate Statistical Evidence** — Raw p < 0.05 and Cramér's V ≥ 0.20",
        "3. **Exploratory Evidence** — Raw p < 0.10",
        "",
        "All relationships are retained in `statistical_results.xlsx`. "
        "Evidence tiers are exported separately and are not mutually exclusive.",
        "",
        f"## Top {top_n} by Cramér's V",
        "",
    ]

    for _, row in summary["top30_cramers_v"].iterrows():
        lines.extend(_format_relationship(row))

    lines.extend([f"## Top {top_n} by Evidence Score", ""])

    for _, row in summary["top30_evidence_score"].iterrows():
        lines.extend(_format_relationship(row))

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
