"""Build default UI repositories from survey majority preferences.

No machine learning, association rules, or clustering. Each UI element is
assigned the most frequently selected option in the cleaned survey.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import pandas as pd

from src.preprocessing.columns import (
    DESKTOP_UI_COLUMNS,
    GLOBAL_UI_COLUMNS,
    MOBILE_UI_COLUMNS,
)

logger = logging.getLogger(__name__)

UI_GROUPS: dict[str, list[str]] = {
    "Global": GLOBAL_UI_COLUMNS,
    "Desktop": DESKTOP_UI_COLUMNS,
    "Mobile": MOBILE_UI_COLUMNS,
}

DEFAULT_TABLE_COLUMNS = [
    "UI_Element",
    "Default_Value",
    "Percentage",
    "Count",
    "Total_Responses",
    "Unique_Options",
]


def _clean_value(value: object) -> str:
    """Keep the survey option text; trim whitespace only."""
    return str(value).strip()


def compute_majority_default(series: pd.Series) -> dict[str, Any]:
    """Return the majority option, percentage, and count for one UI column."""
    valid = series.dropna()
    total = int(len(valid))
    if total == 0:
        return {
            "Default_Value": None,
            "Percentage": 0.0,
            "Count": 0,
            "Total_Responses": 0,
            "Unique_Options": 0,
        }

    counts = valid.value_counts()
    top_value = counts.index[0]
    top_count = int(counts.iloc[0])
    return {
        "Default_Value": _clean_value(top_value),
        "Percentage": round(100.0 * top_count / total, 2),
        "Count": top_count,
        "Total_Responses": total,
        "Unique_Options": int(counts.shape[0]),
    }


def build_defaults_table(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """Build a defaults table for one UI group."""
    rows: list[dict[str, Any]] = []
    for column in columns:
        if column not in df.columns:
            logger.warning("UI column missing from dataset: %s", column)
            continue
        stats = compute_majority_default(df[column])
        rows.append({"UI_Element": column, **stats})
    return pd.DataFrame(rows, columns=DEFAULT_TABLE_COLUMNS)


def defaults_table_to_repository(table: pd.DataFrame) -> dict[str, Any]:
    """Convert a defaults table into a website-ready JSON object."""
    elements: dict[str, Any] = {}
    for row in table.itertuples(index=False):
        elements[row.UI_Element] = {
            "value": row.Default_Value,
            "percentage": float(row.Percentage),
            "count": int(row.Count),
        }
    return {
        "version": "1.0",
        "source": "survey_majority",
        "n_elements": len(elements),
        "defaults": elements,
    }


def plot_top_selected_options(
    table: pd.DataFrame,
    title: str,
    output_path: Path,
    *,
    dpi: int = 200,
) -> Path:
    """Horizontal bar chart of majority selection percentages."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plot_df = table.sort_values("Percentage", ascending=True).copy()
    labels = [
        f"{row.UI_Element}: {str(row.Default_Value)[:32]}"
        for row in plot_df.itertuples(index=False)
    ]

    fig, ax = plt.subplots(figsize=(10, max(4.5, 0.35 * len(plot_df))))
    ax.barh(labels, plot_df["Percentage"], color="#4C72B0")
    ax.set_xlabel("Selection percentage (%)")
    ax.set_title(title)
    ax.set_xlim(0, 100)
    fig.tight_layout()
    fig.savefig(output_path, dpi=dpi)
    plt.close(fig)
    return output_path


def plot_preference_distribution(
    df: pd.DataFrame,
    column: str,
    output_path: Path,
    *,
    dpi: int = 200,
) -> Path | None:
    """Bar chart of all options for one UI element."""
    if column not in df.columns:
        return None
    counts = df[column].dropna().value_counts()
    if counts.empty:
        return None

    output_path.parent.mkdir(parents=True, exist_ok=True)
    labels = [str(value)[:40] for value in counts.index]
    fig, ax = plt.subplots(figsize=(9, max(3.5, 0.4 * len(counts))))
    ax.barh(labels[::-1], counts.values[::-1], color="#55A868")
    ax.set_xlabel("Respondents")
    ax.set_title(f"Preference distribution: {column}")
    fig.tight_layout()
    fig.savefig(output_path, dpi=dpi)
    plt.close(fig)
    return output_path


def generate_visualizations(
    df: pd.DataFrame,
    tables: dict[str, pd.DataFrame],
    figures_dir: Path,
) -> dict[str, Path]:
    """Create top-option and sample preference-distribution plots."""
    figures_dir.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    for group_name, table in tables.items():
        slug = group_name.lower()
        paths[f"{slug}_top_options"] = plot_top_selected_options(
            table,
            f"{group_name} UI — Top Selected Defaults",
            figures_dir / f"{slug}_top_selected_options.png",
        )

        # Show distributions for the strongest and weakest majority in the group.
        if table.empty:
            continue
        strongest = table.sort_values("Percentage", ascending=False).iloc[0]["UI_Element"]
        weakest = table.sort_values("Percentage", ascending=True).iloc[0]["UI_Element"]
        for column, tag in ((strongest, "strongest"), (weakest, "weakest")):
            path = plot_preference_distribution(
                df,
                column,
                figures_dir / f"{slug}_{tag}_distribution.png",
            )
            if path is not None:
                paths[f"{slug}_{tag}_distribution"] = path

    return paths


@dataclass
class DefaultUIRepositoryResult:
    """Outputs from the default UI repository pipeline."""

    tables: dict[str, pd.DataFrame]
    repositories: dict[str, dict[str, Any]]
    export_paths: dict[str, Path]
    summary: dict[str, int]


def run_default_ui_repository(
    df: pd.DataFrame,
    output_dir: Path,
    reports_dir: Path,
) -> DefaultUIRepositoryResult:
    """Compute majority defaults and export JSON + Excel repositories."""
    output_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)
    figures_dir = reports_dir / "figures"

    tables: dict[str, pd.DataFrame] = {}
    repositories: dict[str, dict[str, Any]] = {}
    export_paths: dict[str, Path] = {}

    for group_name, columns in UI_GROUPS.items():
        table = build_defaults_table(df, columns)
        tables[group_name] = table
        repository = defaults_table_to_repository(table)
        repositories[group_name] = repository

        slug = group_name.lower()
        json_path = output_dir / f"{slug}_defaults.json"
        json_path.write_text(
            json.dumps(repository, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        export_paths[f"{slug}_defaults_json"] = json_path

        xlsx_path = reports_dir / f"{slug}_defaults.xlsx"
        table.to_excel(xlsx_path, index=False)
        export_paths[f"{slug}_defaults_xlsx"] = xlsx_path

        csv_path = reports_dir / f"{slug}_defaults.csv"
        table.to_csv(csv_path, index=False)
        export_paths[f"{slug}_defaults_csv"] = csv_path

    export_paths.update(generate_visualizations(df, tables, figures_dir))

    summary = {
        "global_variables": len(tables["Global"]),
        "desktop_variables": len(tables["Desktop"]),
        "mobile_variables": len(tables["Mobile"]),
        "total_variables": sum(len(table) for table in tables.values()),
    }

    summary_md = reports_dir / "default_ui_summary.md"
    lines = [
        "# Default UI Repository Summary",
        "",
        "Defaults are the majority survey preference for each UI element.",
        "",
        f"- Global variables: {summary['global_variables']}",
        f"- Desktop variables: {summary['desktop_variables']}",
        f"- Mobile variables: {summary['mobile_variables']}",
        f"- Total variables: {summary['total_variables']}",
        "",
        "## Global Defaults",
    ]
    for row in tables["Global"].itertuples(index=False):
        lines.append(
            f"- `{row.UI_Element}` = {row.Default_Value} "
            f"({row.Percentage:.1f}%, n={row.Count})"
        )
    lines.append("")
    lines.append("## Desktop Defaults")
    for row in tables["Desktop"].itertuples(index=False):
        lines.append(
            f"- `{row.UI_Element}` = {row.Default_Value} "
            f"({row.Percentage:.1f}%, n={row.Count})"
        )
    lines.append("")
    lines.append("## Mobile Defaults")
    for row in tables["Mobile"].itertuples(index=False):
        lines.append(
            f"- `{row.UI_Element}` = {row.Default_Value} "
            f"({row.Percentage:.1f}%, n={row.Count})"
        )
    summary_md.write_text("\n".join(lines), encoding="utf-8")
    export_paths["summary_md"] = summary_md

    logger.info(
        "Default UI repository: Global=%s Desktop=%s Mobile=%s",
        summary["global_variables"],
        summary["desktop_variables"],
        summary["mobile_variables"],
    )
    return DefaultUIRepositoryResult(
        tables=tables,
        repositories=repositories,
        export_paths=export_paths,
        summary=summary,
    )
