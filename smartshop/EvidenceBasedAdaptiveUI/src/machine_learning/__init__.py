"""Machine learning utilities for UI preference modelling."""

from src.machine_learning.pipeline import (
    FeatureImportancePipelineResult,
    UIGroupResult,
    run_feature_importance_pipeline,
)
from src.machine_learning.random_forest import (
    build_feature_importance_table,
    build_model_metrics_table,
    build_target_predictor_summary,
    summarize_group_importance,
    summarize_overall_importance,
    train_all_targets,
)
from src.machine_learning.shap_analysis import (
    build_shap_summary_table,
    enrich_target_summary_with_shap,
    generate_shap_plots,
)

__all__ = [
    "FeatureImportancePipelineResult",
    "UIGroupResult",
    "build_feature_importance_table",
    "build_model_metrics_table",
    "build_shap_summary_table",
    "build_target_predictor_summary",
    "enrich_target_summary_with_shap",
    "generate_shap_plots",
    "run_feature_importance_pipeline",
    "summarize_group_importance",
    "summarize_overall_importance",
    "train_all_targets",
]
