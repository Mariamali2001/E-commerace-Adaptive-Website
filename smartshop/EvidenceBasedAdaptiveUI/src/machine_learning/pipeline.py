"""Grouped feature-importance pipeline for Notebook 04."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from src.machine_learning.random_forest import (
    TargetModelResult,
    build_feature_importance_table,
    build_model_metrics_table,
    build_target_predictor_summary,
    plot_confusion_matrix,
    summarize_group_importance,
    summarize_overall_importance,
    train_all_targets,
)
from src.machine_learning.shap_analysis import (
    build_shap_summary_table,
    enrich_target_summary_with_shap,
    generate_shap_plots,
)
from src.preprocessing.columns import get_ui_target_groups

logger = logging.getLogger(__name__)


@dataclass
class UIGroupResult:
    """Consolidated outputs for one UI target group."""

    group_name: str
    target_results: list[TargetModelResult]
    model_metrics: pd.DataFrame
    feature_importance: pd.DataFrame
    shap_summary: pd.DataFrame
    target_summary: pd.DataFrame


@dataclass
class FeatureImportancePipelineResult:
    """Full Notebook 04 pipeline output."""

    groups: dict[str, UIGroupResult]
    model_metrics: pd.DataFrame
    feature_importance: pd.DataFrame
    shap_summary: pd.DataFrame
    target_summary: pd.DataFrame
    overall_importance: pd.DataFrame
    group_importance: pd.DataFrame
    export_paths: dict[str, Path]


def _export_table(df: pd.DataFrame, base_path: Path) -> dict[str, Path]:
    """Export a dataframe to CSV and Excel."""
    base_path.parent.mkdir(parents=True, exist_ok=True)
    csv_path = base_path.with_suffix(".csv")
    xlsx_path = base_path.with_suffix(".xlsx")
    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False)
    return {"csv": csv_path, "xlsx": xlsx_path}


def _process_ui_group(
    df: pd.DataFrame,
    feature_columns: list[str],
    group_name: str,
    target_columns: list[str],
    plots_dir: Path,
    *,
    param_grid: dict[str, list[Any]] | None = None,
) -> UIGroupResult:
    """Train, evaluate, and explain models for one UI target group."""
    logger.info("Processing UI group: %s (%s targets)", group_name, len(target_columns))

    available_targets = [column for column in target_columns if column in df.columns]
    target_results = train_all_targets(
        df,
        feature_columns,
        available_targets,
        ui_group=group_name,
        param_grid=param_grid,
    )

    group_plot_dir = plots_dir / group_name
    group_plot_dir.mkdir(parents=True, exist_ok=True)

    for result in target_results:
        generate_shap_plots(result, group_plot_dir)
        plot_confusion_matrix(
            result.confusion,
            result.target,
            group_plot_dir / f"{result.target}_confusion_matrix.png",
        )

    model_metrics = build_model_metrics_table(target_results)
    feature_importance = build_feature_importance_table(target_results)
    shap_summary = build_shap_summary_table(target_results)
    target_summary = enrich_target_summary_with_shap(
        build_target_predictor_summary(target_results),
        shap_summary,
    )

    return UIGroupResult(
        group_name=group_name,
        target_results=target_results,
        model_metrics=model_metrics,
        feature_importance=feature_importance,
        shap_summary=shap_summary,
        target_summary=target_summary,
    )


def _write_pipeline_summary(
    result: FeatureImportancePipelineResult,
    output_path: Path,
) -> Path:
    """Write a markdown summary for the grouped pipeline."""
    avg_accuracy = (
        f"{result.model_metrics['accuracy'].mean():.3f}"
        if not result.model_metrics.empty
        else "n/a"
    )
    lines = [
        "# Feature Importance Pipeline Summary",
        "",
        f"- UI groups processed: {len(result.groups)}",
        f"- Models trained: {len(result.model_metrics)}",
        f"- Average accuracy: {avg_accuracy}",
        "",
        "## Group Overview",
        "",
    ]

    for group_name, group_result in result.groups.items():
        if group_result.model_metrics.empty:
            lines.extend(
                [
                    f"### {group_name}",
                    "",
                    "- Targets trained: 0",
                    "",
                ]
            )
            continue

        avg_accuracy = group_result.model_metrics["accuracy"].mean()
        best_target = group_result.model_metrics.loc[
            group_result.model_metrics["accuracy"].idxmax(),
            "UI_Target",
        ]
        lines.extend(
            [
                f"### {group_name}",
                "",
                f"- Targets trained: {len(group_result.target_results)}",
                f"- Average accuracy: {avg_accuracy:.3f}",
                f"- Best target: {best_target}",
                "",
            ]
        )

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def run_feature_importance_pipeline(
    df: pd.DataFrame,
    feature_columns: list[str],
    reports_dir: Path,
    *,
    ui_target_groups: dict[str, list[str]] | None = None,
    param_grid: dict[str, list[Any]] | None = None,
) -> FeatureImportancePipelineResult:
    """Run the grouped Random Forest + SHAP pipeline for Notebook 04."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    plots_dir = reports_dir / "plots"
    group_reports_dir = reports_dir / "group_reports"
    group_reports_dir.mkdir(parents=True, exist_ok=True)

    groups_config = ui_target_groups or get_ui_target_groups()
    group_results: dict[str, UIGroupResult] = {}

    for group_name, target_columns in groups_config.items():
        group_results[group_name] = _process_ui_group(
            df,
            feature_columns,
            group_name,
            target_columns,
            plots_dir,
            param_grid=param_grid,
        )
        _export_table(
            group_results[group_name].target_summary,
            group_reports_dir / f"{group_name.lower()}_summary",
        )

    model_metrics = pd.concat(
        [group.model_metrics for group in group_results.values()],
        ignore_index=True,
    )
    feature_importance = pd.concat(
        [group.feature_importance for group in group_results.values()],
        ignore_index=True,
    )
    shap_summary = pd.concat(
        [group.shap_summary for group in group_results.values()],
        ignore_index=True,
    )
    target_summary = pd.concat(
        [group.target_summary for group in group_results.values()],
        ignore_index=True,
    )

    overall_importance = summarize_overall_importance(feature_importance)
    group_importance = summarize_group_importance(feature_importance)

    export_paths: dict[str, Path] = {}
    export_paths.update(_export_table(model_metrics, reports_dir / "model_metrics"))
    export_paths.update(_export_table(feature_importance, reports_dir / "feature_importance"))
    export_paths.update(_export_table(shap_summary, reports_dir / "shap_summary"))
    export_paths.update(_export_table(target_summary, reports_dir / "target_predictor_summary"))
    export_paths.update(_export_table(overall_importance, reports_dir / "overall_importance"))
    export_paths.update(_export_table(group_importance, reports_dir / "group_importance"))

    pipeline_result = FeatureImportancePipelineResult(
        groups=group_results,
        model_metrics=model_metrics,
        feature_importance=feature_importance,
        shap_summary=shap_summary,
        target_summary=target_summary,
        overall_importance=overall_importance,
        group_importance=group_importance,
        export_paths=export_paths,
    )
    export_paths["pipeline_summary_md"] = _write_pipeline_summary(
        pipeline_result,
        reports_dir / "pipeline_summary.md",
    )

    logger.info("Feature importance pipeline completed: %s models", len(model_metrics))
    return pipeline_result
