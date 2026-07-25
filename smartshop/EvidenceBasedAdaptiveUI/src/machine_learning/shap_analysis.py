"""SHAP explainability utilities for Random Forest UI models."""

from __future__ import annotations

import logging
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap

from src.machine_learning.random_forest import TargetModelResult

logger = logging.getLogger(__name__)


def _mean_abs_shap(shap_values: np.ndarray | list[np.ndarray]) -> np.ndarray:
    """Reduce SHAP values to one mean absolute value per feature."""
    if isinstance(shap_values, list):
        stacked = np.abs(np.stack(shap_values, axis=0))
        return stacked.mean(axis=(0, 1))

    values = np.asarray(shap_values)
    if values.ndim == 3:
        return np.abs(values).mean(axis=(0, 2))
    return np.abs(values).mean(axis=0)


def _summary_shap_values(shap_values: np.ndarray | list[np.ndarray]) -> np.ndarray:
    """Prepare SHAP values for summary plots."""
    if isinstance(shap_values, list):
        return np.mean(np.stack(shap_values, axis=0), axis=0)
    values = np.asarray(shap_values)
    if values.ndim == 3:
        return values.mean(axis=2)
    return values


def compute_mean_shap_values(result: TargetModelResult) -> pd.DataFrame:
    """Compute mean absolute SHAP values for one trained target model."""
    explainer = shap.TreeExplainer(result.model)
    shap_values = explainer.shap_values(result.x_test)

    mean_abs = _mean_abs_shap(shap_values)
    table = pd.DataFrame(
        {
            "UI_Group": result.ui_group,
            "UI_Target": result.target,
            "Predictor": result.feature_importance["Predictor"],
            "Mean_ABS_SHAP": mean_abs,
        }
    ).sort_values("Mean_ABS_SHAP", ascending=False)
    table["SHAP_Rank"] = range(1, len(table) + 1)
    return table


def build_shap_summary_table(
    target_results: list[TargetModelResult],
) -> pd.DataFrame:
    """Combine SHAP summaries across all UI targets."""
    if not target_results:
        return pd.DataFrame(
            columns=["UI_Group", "UI_Target", "Predictor", "Mean_ABS_SHAP", "SHAP_Rank"]
        )
    tables = [compute_mean_shap_values(result) for result in target_results]
    return pd.concat(tables, ignore_index=True)


def generate_shap_plots(
    result: TargetModelResult,
    plots_dir: Path,
    *,
    dependence_feature: str | None = None,
) -> dict[str, Path]:
    """Generate SHAP summary, bar, and dependence plots for one target."""
    plots_dir.mkdir(parents=True, exist_ok=True)
    exported: dict[str, Path] = {}

    explainer = shap.TreeExplainer(result.model)
    shap_values = explainer.shap_values(result.x_test)
    plot_values = _summary_shap_values(shap_values)
    feature_names = result.feature_importance["Predictor"].tolist()

    plt.figure()
    shap.summary_plot(
        plot_values,
        result.x_test,
        feature_names=feature_names,
        show=False,
    )
    summary_path = plots_dir / f"{result.target}_shap_summary.png"
    plt.tight_layout()
    plt.savefig(summary_path, dpi=300, bbox_inches="tight")
    plt.close()
    exported["summary"] = summary_path

    plt.figure()
    shap.summary_plot(
        plot_values,
        result.x_test,
        feature_names=feature_names,
        plot_type="bar",
        show=False,
    )
    bar_path = plots_dir / f"{result.target}_shap_bar.png"
    plt.tight_layout()
    plt.savefig(bar_path, dpi=300, bbox_inches="tight")
    plt.close()
    exported["bar"] = bar_path

    dependence_column = dependence_feature or result.feature_importance.iloc[0]["Predictor"]
    if dependence_column in result.x_test.columns:
        shap_array = _summary_shap_values(shap_values)

        feature_index = list(result.x_test.columns).index(dependence_column)
        plt.figure()
        shap.dependence_plot(
            feature_index,
            shap_array,
            result.x_test,
            show=False,
        )
        dependence_path = plots_dir / f"{result.target}_shap_dependence_{dependence_column}.png"
        plt.tight_layout()
        plt.savefig(dependence_path, dpi=300, bbox_inches="tight")
        plt.close()
        exported["dependence"] = dependence_path

    return exported


def enrich_target_summary_with_shap(
    predictor_summary: pd.DataFrame,
    shap_summary: pd.DataFrame,
) -> pd.DataFrame:
    """Add top SHAP predictors and values to the per-target summary table."""
    enriched = predictor_summary.copy()
    shap_top = (
        shap_summary.sort_values("Mean_ABS_SHAP", ascending=False)
        .groupby("UI_Target")
        .head(3)
    )

    top_shap_predictors = []
    top_shap_values = []
    mean_shap_top = []

    for _, row in enriched.iterrows():
        target_rows = shap_top[shap_top["UI_Target"] == row["UI_Target"]]
        top_shap_predictors.append(", ".join(target_rows["Predictor"].tolist()))
        top_shap_values.append(
            ", ".join(f"{value:.4f}" for value in target_rows["Mean_ABS_SHAP"].tolist())
        )
        mean_shap_top.append(
            float(target_rows.iloc[0]["Mean_ABS_SHAP"]) if not target_rows.empty else np.nan
        )

    enriched["Top_SHAP_Predictors"] = top_shap_predictors
    enriched["Top_SHAP_Values"] = top_shap_values
    enriched["Top_Mean_ABS_SHAP"] = mean_shap_top
    return enriched
