"""Merge similar candidate profiles into representative adaptive UI profiles."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.cluster.hierarchy import dendrogram
from sklearn.metrics import silhouette_score

from src.evidence_engine.mapping import (
    canonical_predictor,
    rule_item_to_predictor,
    rule_item_to_ui_element,
    split_rule_items,
)
from src.evidence_engine.profile_clustering import (
    SURVEY_SAMPLE_SIZE,
    TARGET_MAX_CLUSTERS,
    TARGET_MIN_CLUSTERS,
    build_cluster_representatives,
    build_cluster_summary,
    cluster_profiles,
    distance_matrix_from_similarity,
    merge_near_duplicate_representatives,
    select_cluster_count,
)
from src.evidence_engine.profile_scoring import (
    REPRESENTATIVE_PROFILE_WEIGHTS,
    aggregate_profile_scores,
    compute_adaptation_evidence_score,
    normalize_adaptation_metrics,
    score_representative_profiles,
)
from src.evidence_engine.profile_similarity import build_similarity_matrix
from src.evidence_engine.profile_vectors import build_profile_records
from src.evidence_engine.scoring import prepare_ml_evidence

logger = logging.getLogger(__name__)

DEFAULT_STATISTICAL_PATH = (
    Path("reports") / "Statistical_Validation" / "tables" / "statistical_results.xlsx"
)
DEFAULT_IMPORTANCE_PATH = Path("reports") / "Feature_Importance" / "feature_importance.xlsx"
DEFAULT_SHAP_PATH = Path("reports") / "Feature_Importance" / "shap_summary.csv"
DEFAULT_PROFILES_PATH = Path("reports") / "AssociationRules" / "candidate_profiles.xlsx"
DEFAULT_RULES_PATH = Path("reports") / "AssociationRules" / "candidate_rules.csv"


@dataclass
class ProfileBuilderResult:
    """Outputs from the adaptive profile builder pipeline."""

    candidate_profiles: pd.DataFrame
    adaptation_scores: pd.DataFrame
    scored_candidates: pd.DataFrame
    similarity_matrix: pd.DataFrame
    cluster_assignments: pd.Series
    representative_profiles: pd.DataFrame
    export_paths: dict[str, Path]
    summary: dict[str, object]
    n_clusters: int
    linkage_matrix: np.ndarray


def _load_table(path: Path) -> pd.DataFrame:
    if path.exists():
        if path.suffix.lower() == ".xlsx":
            return pd.read_excel(path)
        return pd.read_csv(path)

    sibling = path.with_suffix(".csv" if path.suffix.lower() == ".xlsx" else ".xlsx")
    if sibling.exists():
        if sibling.suffix.lower() == ".xlsx":
            return pd.read_excel(sibling)
        return pd.read_csv(sibling)

    raise FileNotFoundError(f"Required input not found: {path} (also checked {sibling})")


def load_profile_inputs(
    project_root: Path,
    *,
    statistical_path: Path | None = None,
    importance_path: Path | None = None,
    shap_path: Path | None = None,
    profiles_path: Path | None = None,
    rules_path: Path | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load Notebook 03–05 outputs for profile building."""
    statistical = _load_table(project_root / (statistical_path or DEFAULT_STATISTICAL_PATH))
    importance = _load_table(project_root / (importance_path or DEFAULT_IMPORTANCE_PATH))
    shap = _load_table(project_root / (shap_path or DEFAULT_SHAP_PATH))
    profiles = _load_table(project_root / (profiles_path or DEFAULT_PROFILES_PATH))
    rules = _load_table(project_root / (rules_path or DEFAULT_RULES_PATH))
    return statistical, importance, shap, profiles, rules


def _parse_ui_adaptations(text: str) -> list[str]:
    if not text or not isinstance(text, str):
        return []
    return [part.strip() for part in text.split(" | ") if part.strip()]


def _profile_predictors(profile_row: pd.Series) -> list[str]:
    predictors: list[str] = []
    for item in split_rule_items(str(profile_row.get("Antecedent", ""))):
        predictor = rule_item_to_predictor(item)
        if predictor:
            predictors.append(canonical_predictor(predictor))
    return sorted(set(predictors))


def _ui_item_matches(candidate: str, reference: str) -> bool:
    candidate = candidate.strip()
    reference = reference.strip()
    if candidate == reference:
        return True
    shorter, longer = sorted([candidate, reference], key=len)
    return longer.startswith(shorter.rstrip("."))


def _lookup_statistical(
    statistical_index: pd.DataFrame,
    predictors: list[str],
    ui_element: str,
) -> dict[str, object]:
    matches = statistical_index.loc[
        (statistical_index.index.get_level_values("Predictor").isin(predictors))
        & (statistical_index.index.get_level_values("UI_Element") == ui_element)
    ]
    if matches.empty:
        return {
            "Cramers_V": 0.0,
            "Evidence_Score": 0.0,
            "Is_Statistically_Significant": False,
        }

    best = matches.sort_values(["Cramers_V", "Evidence_Score"], ascending=False).iloc[0]
    significant = bool(best.get("Significant", False)) or bool(best.get("Is_Moderate_Evidence", False))
    return {
        "Cramers_V": float(best["Cramers_V"]),
        "Evidence_Score": float(best.get("Evidence_Score", 0.0)),
        "Is_Statistically_Significant": significant,
    }


def _lookup_ml(
    ml_index: pd.DataFrame,
    predictors: list[str],
    ui_element: str,
) -> dict[str, float]:
    matches = ml_index.loc[
        (ml_index.index.get_level_values("Predictor").isin(predictors))
        & (ml_index.index.get_level_values("UI_Element") == ui_element)
    ]
    if matches.empty:
        return {"RF_Importance": 0.0, "Mean_SHAP": 0.0}

    best = matches.sort_values(["RF_Importance", "Mean_SHAP"], ascending=False).iloc[0]
    return {
        "RF_Importance": float(best.get("RF_Importance", 0.0) or 0.0),
        "Mean_SHAP": float(best.get("Mean_SHAP", 0.0) or 0.0),
    }


def _lookup_rule_metrics(
    rules: pd.DataFrame,
    antecedent: str,
    ui_adaptation: str,
) -> dict[str, float]:
    if rules.empty:
        return {"Rule_Support": 0.0, "Rule_Confidence": 0.0, "Rule_Lift": 0.0}

    antecedent_col = "Antecedent" if "Antecedent" in rules.columns else "antecedents"
    consequent_col = "Consequent" if "Consequent" in rules.columns else "consequents"
    support_col = "Support" if "Support" in rules.columns else "support"
    confidence_col = "Confidence" if "Confidence" in rules.columns else "confidence"
    lift_col = "Lift" if "Lift" in rules.columns else "lift"

    subset = rules[rules[antecedent_col].astype(str) == str(antecedent)]
    if subset.empty:
        return {"Rule_Support": 0.0, "Rule_Confidence": 0.0, "Rule_Lift": 0.0}

    matched_rows = []
    for _, row in subset.iterrows():
        consequent_items = split_rule_items(str(row[consequent_col]))
        if any(_ui_item_matches(ui_adaptation, item) for item in consequent_items):
            matched_rows.append(row)

    if not matched_rows:
        return {"Rule_Support": 0.0, "Rule_Confidence": 0.0, "Rule_Lift": 0.0}

    matched = pd.DataFrame(matched_rows)
    return {
        "Rule_Support": float(matched[support_col].max()),
        "Rule_Confidence": float(matched[confidence_col].max()),
        "Rule_Lift": float(matched[lift_col].max()),
    }


def build_adaptation_evidence_table(
    profiles: pd.DataFrame,
    statistical: pd.DataFrame,
    importance: pd.DataFrame,
    shap: pd.DataFrame,
    rules: pd.DataFrame,
) -> pd.DataFrame:
    """Attach multi-source evidence to every UI adaptation in every candidate profile."""
    statistical_index = statistical.set_index(["Predictor", "UI_Element"])
    ml_evidence = prepare_ml_evidence(importance, shap).set_index(["Predictor", "UI_Element"])

    rows: list[dict[str, object]] = []
    for _, profile in profiles.iterrows():
        predictors = _profile_predictors(profile)
        antecedent = str(profile["Antecedent"])
        for ui_adaptation in _parse_ui_adaptations(str(profile.get("UI_Adaptations", ""))):
            ui_element = rule_item_to_ui_element(ui_adaptation)
            if ui_element is None:
                continue

            stat = _lookup_statistical(statistical_index, predictors, ui_element)
            ml = _lookup_ml(ml_evidence, predictors, ui_element)
            rule_metrics = _lookup_rule_metrics(rules, antecedent, ui_adaptation)

            rows.append(
                {
                    "Profile_ID": profile["Profile_ID"],
                    "Antecedent": antecedent,
                    "Persona": profile.get("Persona", ""),
                    "Mood": profile.get("Mood", ""),
                    "Device": profile.get("Device", ""),
                    "Extraversion": profile.get("Extraversion", ""),
                    "Agreeableness": profile.get("Agreeableness", ""),
                    "Conscientiousness": profile.get("Conscientiousness", ""),
                    "Neuroticism": profile.get("Neuroticism", ""),
                    "Openness": profile.get("Openness", ""),
                    "Num_Context_Conditions": profile.get("Num_Context_Conditions", 0),
                    "Num_UI_Adaptations": profile.get("Num_UI_Adaptations", 0),
                    "Num_Supporting_Rules": profile.get("Num_Supporting_Rules", 0),
                    "Avg_Support": profile.get("Avg_Support", 0.0),
                    "Avg_Confidence": profile.get("Avg_Confidence", 0.0),
                    "Avg_Lift": profile.get("Avg_Lift", 0.0),
                    "UI_Adaptation": ui_adaptation,
                    "UI_Element": ui_element,
                    "Predictors": ", ".join(predictors),
                    **stat,
                    **ml,
                    **rule_metrics,
                }
            )

    if not rows:
        return pd.DataFrame()

    scored = normalize_adaptation_metrics(pd.DataFrame(rows))
    scored["Evidence_Score"] = compute_adaptation_evidence_score(scored)
    return scored.sort_values(["Profile_ID", "Evidence_Score"], ascending=[True, False]).reset_index(
        drop=True
    )


def plot_cluster_size_distribution(
    assignments: pd.Series,
    output_path: Path,
    *,
    dpi: int = 300,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sizes = assignments.value_counts().sort_values(ascending=False)
    plt.figure(figsize=(9, 5))
    plt.bar(range(len(sizes)), sizes.values, color="#55A868")
    plt.title("Cluster Size Distribution")
    plt.xlabel("Cluster Rank")
    plt.ylabel("Candidate Profiles per Cluster")
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi)
    plt.close()
    return output_path


def plot_representative_score_distribution(
    representatives: pd.DataFrame,
    output_path: Path,
    *,
    dpi: int = 300,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 5))
    plt.hist(
        representatives["Representative_Profile_Score"],
        bins=20,
        color="#4C72B0",
        edgecolor="white",
    )
    plt.title("Representative Profile Score Distribution")
    plt.xlabel("Representative Profile Score")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi)
    plt.close()
    return output_path


def plot_dendrogram(
    linkage_matrix: np.ndarray,
    output_path: Path,
    *,
    max_profiles: int = 40,
    dpi: int = 300,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(12, 6))
    dendrogram(
        linkage_matrix,
        truncate_mode="lastp",
        p=max_profiles,
        leaf_rotation=90.0,
        leaf_font_size=8.0,
        color_threshold=None,
    )
    plt.title("Hierarchical Clustering Dendrogram (Truncated)")
    plt.xlabel("Profile Index")
    plt.ylabel("Distance")
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi)
    plt.close()
    return output_path


def plot_similarity_heatmap(
    similarity: pd.DataFrame,
    representatives: pd.DataFrame,
    output_path: Path,
    *,
    top_n: int = 30,
    dpi: int = 300,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rep_ids = representatives.head(top_n)["Merged_Profile_IDs"].head(top_n)
    sample_ids: list[int] = []
    for merged in rep_ids:
        first_id = int(str(merged).split(",")[0])
        sample_ids.append(first_id)
    sample_ids = sample_ids[:top_n]
    subset = similarity.loc[sample_ids, sample_ids]

    plt.figure(figsize=(10, 8))
    sns.heatmap(subset, cmap="viridis", vmin=0, vmax=1, square=True)
    plt.title("Profile Similarity Heatmap (Representative Sample)")
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi)
    plt.close()
    return output_path


def plot_top_representative_profiles(
    representatives: pd.DataFrame,
    output_path: Path,
    *,
    top_n: int = 20,
    dpi: int = 300,
) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    top = representatives.head(top_n).copy()
    top["Label"] = top["Antecedent"].astype(str).str.slice(0, 42)

    plt.figure(figsize=(10, 7))
    sns.barplot(
        data=top,
        y="Label",
        x="Representative_Profile_Score",
        color="#4C72B0",
    )
    plt.title(f"Top {top_n} Representative Profiles")
    plt.xlabel("Representative Profile Score")
    plt.ylabel("Context")
    plt.tight_layout()
    plt.savefig(output_path, dpi=dpi)
    plt.close()
    return output_path


def export_profile_outputs(
    candidate_profiles: pd.DataFrame,
    representatives: pd.DataFrame,
    similarity: pd.DataFrame,
    assignments: pd.Series,
    cluster_summary: pd.DataFrame,
    reports_dir: Path,
    *,
    n_clusters: int,
    silhouette: float,
) -> dict[str, Path]:
    """Export representative profiles, cluster summaries, and figures."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    figures_dir = reports_dir / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)
    export_paths: dict[str, Path] = {}

    rep_csv = reports_dir / "representative_profiles.csv"
    export_df = representatives.drop(
        columns=[col for col in ("UI_Profile_Dict", "Context_Dict") if col in representatives.columns],
        errors="ignore",
    ).copy()
    export_df["Profile_ID"] = export_df["Representative_Profile_ID"]
    export_df["Overall_Profile_Score"] = export_df["Representative_Profile_Score"]
    export_df.to_csv(rep_csv, index=False)
    export_paths["representative_profiles_csv"] = rep_csv

    rep_xlsx = reports_dir / "representative_profiles.xlsx"
    export_df.to_excel(rep_xlsx, index=False)
    export_paths["representative_profiles_xlsx"] = rep_xlsx

    # Downstream Notebook 07 compatibility alias
    alias_xlsx = reports_dir / "adaptive_profiles.xlsx"
    export_df.to_excel(alias_xlsx, index=False)
    export_paths["adaptive_profiles_xlsx"] = alias_xlsx

    cluster_xlsx = reports_dir / "cluster_summary.xlsx"
    with pd.ExcelWriter(cluster_xlsx, engine="openpyxl") as writer:
        cluster_summary.to_excel(writer, sheet_name="Cluster_Summary", index=False)
        assignment_df = assignments.reset_index()
        assignment_df.columns = ["Profile_ID", "Cluster_ID"]
        assignment_df.to_excel(writer, sheet_name="Assignments", index=False)
        meta = pd.DataFrame(
            [
                {"Metric": "Initial Clusters", "Value": n_clusters},
                {"Metric": "Silhouette Score", "Value": silhouette},
                {"Metric": "Representative Profiles", "Value": len(representatives)},
                {"Metric": "Candidate Profiles", "Value": len(candidate_profiles)},
            ]
        )
        meta.to_excel(writer, sheet_name="Run_Metadata", index=False)
    export_paths["cluster_summary_xlsx"] = cluster_xlsx

    sim_csv = reports_dir / "profile_similarity_matrix.csv"
    similarity.to_csv(sim_csv)
    export_paths["profile_similarity_matrix_csv"] = sim_csv

    export_paths["cluster_size_png"] = plot_cluster_size_distribution(
        assignments,
        figures_dir / "cluster_size_distribution.png",
    )
    export_paths["score_distribution_png"] = plot_representative_score_distribution(
        representatives,
        figures_dir / "profile_score_distribution.png",
    )

    logger.info("Exported representative profile outputs to %s", reports_dir)
    return export_paths


def export_profile_outputs_with_linkage(
    candidate_profiles: pd.DataFrame,
    representatives: pd.DataFrame,
    similarity: pd.DataFrame,
    assignments: pd.Series,
    cluster_summary: pd.DataFrame,
    reports_dir: Path,
    *,
    n_clusters: int,
    silhouette: float,
    linkage_matrix: np.ndarray,
) -> dict[str, Path]:
    export_paths = export_profile_outputs(
        candidate_profiles,
        representatives,
        similarity,
        assignments,
        cluster_summary,
        reports_dir,
        n_clusters=n_clusters,
        silhouette=silhouette,
    )
    figures_dir = reports_dir / "figures"
    export_paths["dendrogram_png"] = plot_dendrogram(
        linkage_matrix,
        figures_dir / "dendrogram.png",
    )
    export_paths["similarity_heatmap_png"] = plot_similarity_heatmap(
        similarity,
        representatives,
        figures_dir / "similarity_heatmap.png",
    )
    export_paths["top_profiles_png"] = plot_top_representative_profiles(
        representatives,
        figures_dir / "top_representative_profiles.png",
    )
    return export_paths


def run_profile_builder_pipeline(
    project_root: Path,
    reports_dir: Path,
) -> ProfileBuilderResult:
    """Cluster candidate profiles and export representative adaptive UI profiles."""
    statistical, importance, shap, profiles, rules = load_profile_inputs(project_root)

    adaptations = build_adaptation_evidence_table(
        profiles,
        statistical,
        importance,
        shap,
        rules,
    )
    scored_candidates = aggregate_profile_scores(adaptations)

    records = build_profile_records(profiles)
    similarity = build_similarity_matrix(records)

    distance = distance_matrix_from_similarity(similarity)
    n_clusters, silhouette = select_cluster_count(distance)
    assignments, n_clusters, linkage_matrix = cluster_profiles(similarity, n_clusters=n_clusters)

    representatives = build_cluster_representatives(
        profiles,
        scored_candidates,
        adaptations,
        assignments,
    )
    representatives = merge_near_duplicate_representatives(representatives, records)
    representatives = score_representative_profiles(representatives)
    representatives["Cluster_ID"] = representatives["Representative_Profile_ID"] - 1

    cluster_summary = build_cluster_summary(assignments, representatives, n_clusters, silhouette)

    export_paths = export_profile_outputs_with_linkage(
        profiles,
        representatives,
        similarity,
        assignments,
        cluster_summary,
        reports_dir,
        n_clusters=n_clusters,
        silhouette=silhouette,
        linkage_matrix=linkage_matrix,
    )

    original_count = len(profiles)
    representative_count = len(representatives)
    reduction_pct = (
        (1.0 - representative_count / original_count) * 100.0 if original_count else 0.0
    )
    avg_participants = float(
        (representatives["Participant_Coverage"] / representatives["Merged_Candidate_Count"]).mean()
    ) if not representatives.empty else 0.0

    summary = {
        "original_candidate_profiles": original_count,
        "representative_profiles": representative_count,
        "reduction_percent": round(reduction_pct, 2),
        "average_representative_score": float(representatives["Representative_Profile_Score"].mean())
        if not representatives.empty
        else 0.0,
        "average_participants_per_profile": avg_participants,
        "n_clusters": n_clusters,
        "silhouette_score": silhouette,
        "top_20_representative_profiles": representatives.head(20),
        "score_weights": REPRESENTATIVE_PROFILE_WEIGHTS,
    }

    return ProfileBuilderResult(
        candidate_profiles=profiles,
        adaptation_scores=adaptations,
        scored_candidates=scored_candidates,
        similarity_matrix=similarity,
        cluster_assignments=assignments,
        representative_profiles=representatives,
        export_paths=export_paths,
        summary=summary,
        n_clusters=n_clusters,
        linkage_matrix=linkage_matrix,
    )
