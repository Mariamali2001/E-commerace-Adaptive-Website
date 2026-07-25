"""Random Forest training and evaluation for UI preference prediction."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)

RANDOM_STATE = 42
TEST_SIZE = 0.2

DEFAULT_PARAM_GRID: dict[str, list[Any]] = {
    "n_estimators": [100, 200],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2],
    "criterion": ["gini", "entropy"],
}


@dataclass
class EncodedFeatures:
    """Container for model-ready feature matrix and encoders."""

    frame: pd.DataFrame
    feature_names: list[str]
    encoders: dict[str, LabelEncoder]


@dataclass
class TargetModelResult:
    """Results from training and evaluating one UI target model."""

    target: str
    ui_group: str
    best_params: dict[str, Any]
    metrics: dict[str, float]
    feature_importance: pd.DataFrame
    classification_report: str
    confusion: np.ndarray
    model: RandomForestClassifier
    target_encoder: LabelEncoder
    x_train: pd.DataFrame
    x_test: pd.DataFrame
    y_train: np.ndarray
    y_test: np.ndarray


def encode_features(
    df: pd.DataFrame,
    feature_columns: list[str],
) -> EncodedFeatures:
    """Encode categorical predictors and retain numeric Big Five scores."""
    encoded = df[feature_columns].copy()
    encoders: dict[str, LabelEncoder] = {}

    for column in feature_columns:
        if pd.api.types.is_numeric_dtype(encoded[column]):
            encoded[column] = pd.to_numeric(encoded[column], errors="coerce")
        else:
            encoder = LabelEncoder()
            encoded[column] = encoder.fit_transform(encoded[column].astype(str))
            encoders[column] = encoder

    encoded = encoded.dropna()
    return EncodedFeatures(
        frame=encoded,
        feature_names=feature_columns,
        encoders=encoders,
    )


def prepare_target_series(
    df: pd.DataFrame,
    target_column: str,
    row_index: pd.Index,
) -> tuple[np.ndarray, LabelEncoder]:
    """Encode a UI target aligned to the encoded feature rows."""
    target_series = df.loc[row_index, target_column].astype(str)
    encoder = LabelEncoder()
    encoded_target = encoder.fit_transform(target_series)
    return encoded_target, encoder


def evaluate_classifier(
    model: RandomForestClassifier,
    x_test: pd.DataFrame,
    y_test: np.ndarray,
) -> dict[str, float | str | np.ndarray]:
    """Compute classification metrics and reports for a trained model."""
    predictions = model.predict(x_test)

    return {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(
            precision_score(y_test, predictions, average="macro", zero_division=0)
        ),
        "recall": float(
            recall_score(y_test, predictions, average="macro", zero_division=0)
        ),
        "macro_f1": float(
            f1_score(y_test, predictions, average="macro", zero_division=0)
        ),
        "classification_report": classification_report(
            y_test,
            predictions,
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(y_test, predictions),
    }


def train_random_forest_for_target(
    df: pd.DataFrame,
    feature_columns: list[str],
    target_column: str,
    *,
    ui_group: str = "",
    param_grid: dict[str, list[Any]] | None = None,
    random_state: int = RANDOM_STATE,
) -> TargetModelResult | None:
    """Train a tuned Random Forest classifier for one UI preference target."""
    features = encode_features(df, feature_columns)
    if features.frame.empty:
        logger.warning("No usable rows for target %s", target_column)
        return None

    y_encoded, target_encoder = prepare_target_series(
        df,
        target_column,
        features.frame.index,
    )

    if len(np.unique(y_encoded)) < 2:
        logger.warning("Target %s has fewer than two classes; skipping.", target_column)
        return None

    split_kwargs: dict[str, Any] = {
        "test_size": TEST_SIZE,
        "random_state": random_state,
    }
    try:
        x_train, x_test, y_train, y_test = train_test_split(
            features.frame,
            y_encoded,
            stratify=y_encoded,
            **split_kwargs,
        )
    except ValueError:
        logger.warning("Stratified split failed for %s; using random split.", target_column)
        x_train, x_test, y_train, y_test = train_test_split(
            features.frame,
            y_encoded,
            **split_kwargs,
        )

    grid = param_grid or DEFAULT_PARAM_GRID
    search = GridSearchCV(
        RandomForestClassifier(random_state=random_state),
        param_grid=grid,
        cv=3,
        scoring="f1_macro",
        n_jobs=-1,
    )
    search.fit(x_train, y_train)
    model = search.best_estimator_
    evaluation = evaluate_classifier(model, x_test, y_test)

    importance = pd.DataFrame(
        {
            "Predictor": features.feature_names,
            "Importance": model.feature_importances_,
        }
    ).sort_values("Importance", ascending=False)
    importance["Rank"] = range(1, len(importance) + 1)

    return TargetModelResult(
        target=target_column,
        ui_group=ui_group,
        best_params=dict(search.best_params_),
        metrics={
            "accuracy": evaluation["accuracy"],
            "precision": evaluation["precision"],
            "recall": evaluation["recall"],
            "macro_f1": evaluation["macro_f1"],
        },
        feature_importance=importance,
        classification_report=str(evaluation["classification_report"]),
        confusion=evaluation["confusion_matrix"],
        model=model,
        target_encoder=target_encoder,
        x_train=x_train,
        x_test=x_test,
        y_train=y_train,
        y_test=y_test,
    )


def train_all_targets(
    df: pd.DataFrame,
    feature_columns: list[str],
    target_columns: list[str],
    *,
    ui_group: str = "",
    param_grid: dict[str, list[Any]] | None = None,
) -> list[TargetModelResult]:
    """Train Random Forest models for all UI preference targets."""
    results: list[TargetModelResult] = []
    for target in target_columns:
        if target not in df.columns:
            logger.warning("Target column missing: %s", target)
            continue
        result = train_random_forest_for_target(
            df,
            feature_columns,
            target,
            ui_group=ui_group,
            param_grid=param_grid,
        )
        if result is not None:
            results.append(result)
            logger.info(
                "Trained %s | accuracy=%.3f | best=%s",
                target,
                result.metrics["accuracy"],
                result.best_params,
            )
    return results


def build_feature_importance_table(
    target_results: list[TargetModelResult],
) -> pd.DataFrame:
    """Combine per-target feature importance into one table."""
    rows: list[pd.DataFrame] = []
    for result in target_results:
        table = result.feature_importance.copy()
        table.insert(0, "UI_Group", result.ui_group)
        table.insert(1, "UI_Target", result.target)
        rows.append(table)
    if not rows:
        return pd.DataFrame(
            columns=["UI_Group", "UI_Target", "Predictor", "Importance", "Rank"]
        )
    return pd.concat(rows, ignore_index=True)


def build_model_metrics_table(target_results: list[TargetModelResult]) -> pd.DataFrame:
    """Build a metrics table for all trained targets."""
    rows = []
    for result in target_results:
        row = {
            "UI_Group": result.ui_group,
            "UI_Target": result.target,
            **result.metrics,
        }
        row["Best_Params"] = str(result.best_params)
        rows.append(row)
    return pd.DataFrame(rows)


def build_target_predictor_summary(target_results: list[TargetModelResult]) -> pd.DataFrame:
    """Summarise top predictors and importance values for each UI target."""
    rows = []
    for result in target_results:
        ranked = result.feature_importance.sort_values("Importance", ascending=False)
        top_three = ranked.head(3)
        rows.append(
            {
                "UI_Group": result.ui_group,
                "UI_Target": result.target,
                "Top_Predictor": top_three.iloc[0]["Predictor"],
                "Top_Predictor_Importance": top_three.iloc[0]["Importance"],
                "Top_3_Predictors": ", ".join(top_three["Predictor"].tolist()),
                "Top_3_Importance_Values": ", ".join(
                    f"{value:.4f}" for value in top_three["Importance"].tolist()
                ),
            }
        )
    return pd.DataFrame(rows)


def plot_confusion_matrix(
    confusion: np.ndarray,
    target_name: str,
    output_path: Path,
) -> Path:
    """Save a confusion matrix heatmap."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(6, 5))
    sns.heatmap(confusion, annot=True, fmt="d", cmap="Blues")
    plt.title(f"Confusion Matrix — {target_name}")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    return output_path


def summarize_overall_importance(
    importance_table: pd.DataFrame,
    *,
    top_n: int = 20,
) -> pd.DataFrame:
    """Rank predictors by average importance across all UI targets."""
    if importance_table.empty:
        return pd.DataFrame(columns=["Predictor", "Importance"])
    return (
        importance_table.groupby("Predictor", as_index=False)["Importance"]
        .mean()
        .sort_values("Importance", ascending=False)
        .head(top_n)
    )


def summarize_group_importance(
    importance_table: pd.DataFrame,
    *,
    top_n: int = 20,
) -> pd.DataFrame:
    """Rank predictors by average importance within each UI group."""
    if importance_table.empty:
        return pd.DataFrame(columns=["UI_Group", "Predictor", "Importance"])
    return (
        importance_table.groupby(["UI_Group", "Predictor"], as_index=False)["Importance"]
        .mean()
        .sort_values(["UI_Group", "Importance"], ascending=[True, False])
        .groupby("UI_Group", group_keys=False)
        .head(top_n)
    )
