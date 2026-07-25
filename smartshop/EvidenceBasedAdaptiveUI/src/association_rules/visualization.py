"""Visualization utilities for association rules."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def plot_support_histogram(rules: pd.DataFrame, output_path: Path) -> Path:
    """Plot the support distribution."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 5))
    sns.histplot(rules["Support"], bins=20, kde=True, color="#1d3557")
    plt.title("Support Distribution")
    plt.xlabel("Support")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def plot_confidence_histogram(rules: pd.DataFrame, output_path: Path) -> Path:
    """Plot the confidence distribution."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 5))
    sns.histplot(rules["Confidence"], bins=20, kde=True, color="#457b9d")
    plt.title("Confidence Distribution")
    plt.xlabel("Confidence")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def plot_top_rules_by_lift(
    rules: pd.DataFrame,
    output_path: Path,
    *,
    top_n: int = 30,
) -> Path:
    """Plot the top rules ranked by lift."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    subset = rules.sort_values("Lift", ascending=False).head(top_n).copy()
    subset["Rule"] = subset["Antecedent"] + " → " + subset["Consequent"]

    plt.figure(figsize=(12, max(8, top_n * 0.35)))
    sns.barplot(data=subset, y="Rule", x="Lift", color="#457b9d")
    plt.title(f"Top {top_n} Association Rules by Lift")
    plt.xlabel("Lift")
    plt.ylabel("")
    plt.subplots_adjust(left=0.45, right=0.98, top=0.95, bottom=0.08)
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def generate_rule_visualizations(
    rules: pd.DataFrame,
    figures_dir: Path,
    *,
    top_n: int = 30,
) -> dict[str, Path]:
    """Generate Notebook 05 figures."""
    figures_dir.mkdir(parents=True, exist_ok=True)
    if rules.empty:
        return {}

    return {
        "support_histogram": plot_support_histogram(
            rules,
            figures_dir / "support_histogram.png",
        ),
        "confidence_histogram": plot_confidence_histogram(
            rules,
            figures_dir / "confidence_histogram.png",
        ),
        "top_rules_by_lift": plot_top_rules_by_lift(
            rules,
            figures_dir / "top_30_rules_by_lift.png",
            top_n=top_n,
        ),
    }
