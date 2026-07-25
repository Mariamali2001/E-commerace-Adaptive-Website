"""Publication-quality plots for statistical validation."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def _format_axis_label(column_name: str) -> str:
    return column_name.replace("_", " ").title()


def plot_association_heatmap(
    results: pd.DataFrame,
    value_column: str,
    output_path: Path,
    *,
    title: str,
    cmap: str = "viridis",
    fmt: str = ".2f",
) -> Path:
    """Create a predictor × UI element heatmap."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pivot = results.pivot(index="Predictor", columns="UI_Element", values=value_column)
    pivot.index = [_format_axis_label(label) for label in pivot.index]
    pivot.columns = [_format_axis_label(label) for label in pivot.columns]

    height = max(6, len(pivot.index) * 0.35)
    width = max(10, len(pivot.columns) * 0.25)
    plt.figure(figsize=(width, height))
    sns.heatmap(
        pivot,
        cmap=cmap,
        annot=False,
        linewidths=0.2,
        cbar_kws={"label": value_column.replace("_", " ")},
    )
    plt.title(title)
    plt.xlabel("UI Element")
    plt.ylabel("Predictor")
    plt.xticks(rotation=45, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def plot_top_relationships(
    results: pd.DataFrame,
    output_path: Path,
    *,
    top_n: int = 30,
) -> Path:
    """Plot the strongest relationships by Cramér's V."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    subset = results.sort_values("Cramers_V", ascending=False).head(top_n).copy()
    subset["Relationship"] = subset.apply(
        lambda row: f"{_format_axis_label(row['Predictor'])} → "
        f"{_format_axis_label(row['UI_Element'])}",
        axis=1,
    )

    plt.figure(figsize=(12, max(8, top_n * 0.3)))
    sns.barplot(
        data=subset,
        y="Relationship",
        x="Cramers_V",
        hue="Significant",
        dodge=False,
        palette={True: "#2a9d8f", False: "#adb5bd"},
    )
    plt.title(f"Top {top_n} Strongest Relationships (Cramér's V)")
    plt.xlabel("Cramér's V")
    plt.ylabel("")
    plt.legend(title="Significant", loc="lower right")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path
