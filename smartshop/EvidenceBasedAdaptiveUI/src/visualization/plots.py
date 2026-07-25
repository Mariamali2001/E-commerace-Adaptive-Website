"""Plotting utilities for exploratory analysis."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def plot_categorical_bar(
    df: pd.DataFrame,
    column: str,
    output_dir: Path,
    *,
    dpi: int = 300,
    figsize: tuple[float, float] = (8, 5),
) -> Path:
    """Plot and save a bar chart for a categorical column."""
    counts = df[column].value_counts(dropna=False)
    output_dir.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=figsize)
    plt.bar(counts.index.astype(str), counts.values)
    plt.title(column.replace("_", " ").title())
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()

    figure_path = output_dir / f"{column}.png"
    plt.savefig(figure_path, dpi=dpi)
    plt.show()
    plt.close()

    return figure_path


def plot_frequency(
    df: pd.DataFrame,
    column: str,
    figure_dir: Path,
    table_dir: Path,
    *,
    dpi: int = 300,
) -> pd.DataFrame:
    """Plot frequency distribution and export count/percent table."""
    values = df[column].value_counts(dropna=False)
    table = pd.DataFrame(
        {
            "Count": values,
            "Percent": (values / len(df) * 100).round(2),
        }
    )

    figure_dir.mkdir(parents=True, exist_ok=True)
    table_dir.mkdir(parents=True, exist_ok=True)
    table.to_excel(table_dir / f"{column}.xlsx")

    ax = values.plot(kind="bar", figsize=(8, 5))
    ax.set_title(column.replace("_", " ").title())
    plt.xticks(rotation=35, ha="right")
    plt.tight_layout()
    plt.savefig(figure_dir / f"{column}.png", dpi=dpi)
    plt.show()
    plt.close()

    return table


def cross_analysis(
    df: pd.DataFrame,
    row_var: str,
    col_var: str,
    figure_dir: Path,
    table_dir: Path,
    *,
    dpi: int = 300,
) -> pd.DataFrame:
    """Create cross-tabulation table, bar chart, and exports."""
    table = pd.crosstab(df[row_var], df[col_var])

    table_dir.mkdir(parents=True, exist_ok=True)
    figure_dir.mkdir(parents=True, exist_ok=True)
    table.to_excel(table_dir / f"{row_var}_vs_{col_var}.xlsx")

    ax = table.plot(kind="bar", stacked=True, figsize=(9, 5))
    ax.set_title(f"{row_var} vs {col_var}")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(figure_dir / f"{row_var}_vs_{col_var}.png", dpi=dpi)
    plt.show()
    plt.close()

    return table
