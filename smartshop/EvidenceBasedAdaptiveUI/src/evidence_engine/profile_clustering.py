"""Agglomerative clustering and representative profile generation."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import linkage
from scipy.spatial.distance import squareform
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score

from src.evidence_engine.json_builder import ui_element_to_adaptation_key
from src.evidence_engine.profile_similarity import (
    core_context_match,
    personality_difference_count,
    ui_profile_similarity,
)
from src.evidence_engine.profile_vectors import (
    CONTEXT_COLUMNS,
    parse_context_row,
    parse_ui_profile,
)
from src.statistics.evidence import min_max_normalize

SURVEY_SAMPLE_SIZE = 200
TARGET_MIN_CLUSTERS = 40
TARGET_MAX_CLUSTERS = 80
UI_MERGE_THRESHOLD = 0.92
PERSONALITY_MERGE_MAX_DIFF = 1


def distance_matrix_from_similarity(similarity: pd.DataFrame) -> np.ndarray:
    """Convert a similarity matrix to a condensed distance matrix."""
    distance = 1.0 - similarity.values.astype(float)
    np.fill_diagonal(distance, 0.0)
    distance = np.clip(distance, 0.0, 1.0)
    return distance


def select_cluster_count(
    distance: np.ndarray,
    *,
    min_clusters: int = TARGET_MIN_CLUSTERS,
    max_clusters: int = TARGET_MAX_CLUSTERS,
) -> tuple[int, float]:
    """Pick a cluster count in the target range using silhouette score."""
    n_samples = distance.shape[0]
    upper = min(max_clusters, n_samples - 1)
    lower = min(min_clusters, upper)

    best_k = lower
    best_score = -1.0
    for k in range(lower, upper + 1):
        labels = AgglomerativeClustering(
            n_clusters=k,
            metric="precomputed",
            linkage="average",
        ).fit_predict(distance)
        unique = len(set(labels))
        if unique < 2 or unique >= n_samples:
            continue
        score = silhouette_score(distance, labels, metric="precomputed")
        if score > best_score:
            best_score = score
            best_k = k
    return best_k, best_score


def cluster_profiles(
    similarity: pd.DataFrame,
    *,
    n_clusters: int | None = None,
) -> tuple[pd.Series, int, np.ndarray]:
    """Cluster profiles with agglomerative clustering on precomputed distances."""
    profile_ids = similarity.index.tolist()
    distance = distance_matrix_from_similarity(similarity)

    if n_clusters is None:
        n_clusters, _ = select_cluster_count(distance)

    labels = AgglomerativeClustering(
        n_clusters=n_clusters,
        metric="precomputed",
        linkage="average",
    ).fit_predict(distance)

    condensed = squareform(distance, checks=False)
    linkage_matrix = linkage(condensed, method="average")

    assignments = pd.Series(labels, index=profile_ids, name="Cluster_ID")
    return assignments, n_clusters, linkage_matrix


def _member_weight(
    profile_row: pd.Series | None = None,
    adaptation_row: pd.Series | None = None,
    *,
    fallback: pd.Series | None = None,
) -> float:
    source = profile_row if profile_row is not None else fallback
    if source is None:
        return 1e-6

    support = float(source.get("Avg_Support", 0.0) or 0.0)
    confidence = float(source.get("Avg_Confidence", 0.0) or 0.0)
    lift = float(source.get("Avg_Lift", 1.0) or 1.0)
    evidence = float(source.get("Overall_Profile_Score", source.get("Avg_Evidence_Score", 0.0)) or 0.0)
    participants = max(1.0, support * SURVEY_SAMPLE_SIZE)

    if adaptation_row is not None:
        support = float(adaptation_row.get("Rule_Support", support) or support)
        confidence = float(adaptation_row.get("Rule_Confidence", confidence) or confidence)
        lift = float(adaptation_row.get("Rule_Lift", lift) or lift)
        evidence = float(adaptation_row.get("Evidence_Score", evidence) or evidence)
        participants = max(1.0, support * SURVEY_SAMPLE_SIZE)

    return max(support * confidence * lift * max(evidence, 0.01) * participants, 1e-6)


def _weighted_mode(values_weights: list[tuple[str, float]]) -> str | None:
    if not values_weights:
        return None
    totals: dict[str, float] = defaultdict(float)
    for value, weight in values_weights:
        totals[value] += weight
    return max(totals.items(), key=lambda item: item[1])[0]


def _build_antecedent(context: dict[str, str | None]) -> str:
    parts: list[str] = []
    label_map = {
        "Persona": "Persona",
        "Mood": "Mood",
        "Device": "Device",
    }
    for column, label in label_map.items():
        value = context.get(column)
        if value:
            parts.append(f"{label}={value}")
    for trait in CONTEXT_COLUMNS[3:]:
        value = context.get(trait)
        if value:
            parts.append(f"{trait}={value}")
    return ", ".join(parts)


def _ui_dict_to_adaptations(ui_profile: dict[str, str]) -> str:
    return " | ".join(f"{key}={value}" for key, value in sorted(ui_profile.items()))


def build_cluster_representatives(
    profiles: pd.DataFrame,
    scored_profiles: pd.DataFrame,
    adaptations: pd.DataFrame,
    assignments: pd.Series,
) -> pd.DataFrame:
    """Generate one representative profile per cluster using weighted majority voting."""
    profile_lookup = scored_profiles.set_index("Profile_ID")
    representatives: list[dict[str, Any]] = []

    for cluster_id in sorted(assignments.unique()):
        member_ids = assignments[assignments == cluster_id].index.tolist()
        member_profiles = profiles[profiles["Profile_ID"].isin(member_ids)].copy()
        member_scored = scored_profiles[scored_profiles["Profile_ID"].isin(member_ids)].copy()
        member_adaptations = adaptations[adaptations["Profile_ID"].isin(member_ids)].copy()

        context_votes: dict[str, list[tuple[str, float]]] = defaultdict(list)
        ui_votes: dict[str, list[tuple[str, float]]] = defaultdict(list)

        for _, member in member_profiles.iterrows():
            profile_id = int(member["Profile_ID"])
            scored_row = profile_lookup.loc[profile_id] if profile_id in profile_lookup.index else None
            weight = _member_weight(scored_row, fallback=member)
            context = parse_context_row(member)
            for column, value in context.items():
                if value:
                    context_votes[column].append((value, weight))

            ui_profile = parse_ui_profile(str(member.get("UI_Adaptations", "")))
            for ui_key, ui_value in ui_profile.items():
                ui_votes[ui_key].append((ui_value, weight))

        for _, adapt_row in member_adaptations.iterrows():
            ui_element = adapt_row.get("UI_Element")
            if not ui_element:
                continue
            canonical = ui_element_to_adaptation_key(str(ui_element))
            adaptation_text = str(adapt_row.get("UI_Adaptation", ""))
            if "=" not in adaptation_text:
                continue
            cleaned = adaptation_text.split("=", maxsplit=1)[1].split("(", maxsplit=1)[0].strip()
            profile_id = int(adapt_row["Profile_ID"])
            scored_row = profile_lookup.loc[profile_id] if profile_id in profile_lookup.index else None
            weight = _member_weight(
                scored_row,
                adapt_row,
                fallback=member_profiles.loc[member_profiles["Profile_ID"] == profile_id].iloc[0]
                if profile_id in member_profiles["Profile_ID"].values
                else None,
            )
            ui_votes[canonical].append((cleaned, weight))

        rep_context: dict[str, str | None] = {column: None for column in CONTEXT_COLUMNS}
        for column in CONTEXT_COLUMNS:
            rep_context[column] = _weighted_mode(context_votes.get(column, []))

        rep_ui: dict[str, str] = {}
        for ui_key, votes in ui_votes.items():
            chosen = _weighted_mode(votes)
            if chosen:
                rep_ui[ui_key] = chosen

        avg_support = float(member_scored["Avg_Support"].mean()) if "Avg_Support" in member_scored else float(
            member_profiles["Avg_Support"].mean()
        )
        avg_confidence = float(member_scored["Avg_Confidence"].mean()) if "Avg_Confidence" in member_scored else float(
            member_profiles["Avg_Confidence"].mean()
        )
        avg_lift = float(member_scored["Avg_Lift"].mean()) if "Avg_Lift" in member_scored else float(
            member_profiles["Avg_Lift"].mean()
        )
        avg_cramers = float(member_scored["Avg_Cramers_V"].mean()) if "Avg_Cramers_V" in member_scored else 0.0
        avg_rf = float(member_scored["Avg_RF_Importance"].mean()) if "Avg_RF_Importance" in member_scored else 0.0
        avg_shap = float(member_scored["Avg_SHAP"].mean()) if "Avg_SHAP" in member_scored else 0.0
        avg_evidence = float(member_scored["Overall_Profile_Score"].mean()) if "Overall_Profile_Score" in member_scored else float(
            member_adaptations["Evidence_Score"].mean() if not member_adaptations.empty else 0.0
        )
        participant_coverage = float(
            sum(
                float(row.get("Avg_Support", 0.0) or 0.0) * SURVEY_SAMPLE_SIZE
                for _, row in member_profiles.iterrows()
            )
        )

        representatives.append(
            {
                "Representative_Profile_ID": int(cluster_id) + 1,
                "Cluster_ID": int(cluster_id),
                "Merged_Candidate_Count": len(member_ids),
                "Merged_Profile_IDs": ", ".join(str(pid) for pid in sorted(member_ids)),
                "Antecedent": _build_antecedent(rep_context),
                **{column: rep_context.get(column) for column in CONTEXT_COLUMNS},
                "UI_Adaptations": _ui_dict_to_adaptations(rep_ui),
                "Num_UI_Adaptations": len(rep_ui),
                "Num_Supporting_Rules": int(member_profiles["Num_Supporting_Rules"].sum()),
                "Avg_Support": avg_support,
                "Avg_Confidence": avg_confidence,
                "Avg_Lift": avg_lift,
                "Avg_Cramers_V": avg_cramers,
                "Avg_RF_Importance": avg_rf,
                "Avg_SHAP": avg_shap,
                "Avg_Evidence_Score": avg_evidence,
                "Participant_Coverage": participant_coverage,
                "UI_Profile_Dict": rep_ui,
                "Context_Dict": rep_context,
            }
        )

    return pd.DataFrame(representatives)


def merge_near_duplicate_representatives(
    representatives: pd.DataFrame,
    records: list[dict],
) -> pd.DataFrame:
    """Merge representatives with nearly identical UI that differ by one personality level."""
    if representatives.empty:
        return representatives

    record_map = {record["Profile_ID"]: record for record in records}
    rep_rows = representatives.to_dict("records")
    merged_flags = [False] * len(rep_rows)
    merged_groups: list[list[int]] = []

    for i in range(len(rep_rows)):
        if merged_flags[i]:
            continue
        group = [i]
        ui_i = rep_rows[i]["UI_Profile_Dict"]
        member_ids_i = [int(x) for x in str(rep_rows[i]["Merged_Profile_IDs"]).split(",") if x.strip()]

        for j in range(i + 1, len(rep_rows)):
            if merged_flags[j]:
                continue
            ui_j = rep_rows[j]["UI_Profile_Dict"]
            if ui_profile_similarity(ui_i, ui_j) < UI_MERGE_THRESHOLD:
                continue

            sample_i = record_map.get(member_ids_i[0]) if member_ids_i else None
            sample_j_id = int(str(rep_rows[j]["Merged_Profile_IDs"]).split(",")[0])
            sample_j = record_map.get(sample_j_id)
            if sample_i is None or sample_j is None:
                continue
            if not core_context_match(sample_i, sample_j):
                continue
            if personality_difference_count(sample_i, sample_j) > PERSONALITY_MERGE_MAX_DIFF:
                continue

            group.append(j)
            merged_flags[j] = True

        merged_groups.append(group)
        merged_flags[i] = True

    merged_rows: list[dict[str, Any]] = []
    for new_id, group in enumerate(merged_groups, start=1):
        group_rows = [rep_rows[index] for index in group]
        base = group_rows[0].copy()

        total_candidates = sum(int(row["Merged_Candidate_Count"]) for row in group_rows)
        merged_ids = []
        for row in group_rows:
            merged_ids.extend(str(row["Merged_Profile_IDs"]).split(", "))

        ui_counter: Counter[str] = Counter()
        ui_values: dict[str, Counter[str]] = defaultdict(Counter)
        for row in group_rows:
            weight = float(row["Merged_Candidate_Count"])
            for key, value in row["UI_Profile_Dict"].items():
                ui_counter[key] += weight
                ui_values[key][value] += weight

        merged_ui = {
            key: ui_values[key].most_common(1)[0][0]
            for key in ui_counter
        }

        context = base["Context_Dict"].copy()
        for row in group_rows[1:]:
            for trait in CONTEXT_COLUMNS[3:]:
                if not context.get(trait) and row["Context_Dict"].get(trait):
                    context[trait] = row["Context_Dict"][trait]

        base.update(
            {
                "Representative_Profile_ID": new_id,
                "Merged_Candidate_Count": total_candidates,
                "Merged_Profile_IDs": ", ".join(sorted(set(merged_ids), key=lambda x: int(x))),
                "Context_Dict": context,
                "UI_Profile_Dict": merged_ui,
                "Antecedent": _build_antecedent(context),
                **{column: context.get(column) for column in CONTEXT_COLUMNS},
                "UI_Adaptations": _ui_dict_to_adaptations(merged_ui),
                "Num_UI_Adaptations": len(merged_ui),
                "Avg_Support": float(np.mean([row["Avg_Support"] for row in group_rows])),
                "Avg_Confidence": float(np.mean([row["Avg_Confidence"] for row in group_rows])),
                "Avg_Lift": float(np.mean([row["Avg_Lift"] for row in group_rows])),
                "Avg_Cramers_V": float(np.mean([row["Avg_Cramers_V"] for row in group_rows])),
                "Avg_RF_Importance": float(np.mean([row["Avg_RF_Importance"] for row in group_rows])),
                "Avg_SHAP": float(np.mean([row["Avg_SHAP"] for row in group_rows])),
                "Avg_Evidence_Score": float(np.mean([row["Avg_Evidence_Score"] for row in group_rows])),
                "Participant_Coverage": float(sum(row["Participant_Coverage"] for row in group_rows)),
                "Num_Supporting_Rules": int(sum(row["Num_Supporting_Rules"] for row in group_rows)),
            }
        )
        merged_rows.append(base)

    result = pd.DataFrame(merged_rows)
    drop_cols = [column for column in ("UI_Profile_Dict", "Context_Dict") if column in result.columns]
    return result.drop(columns=drop_cols).reset_index(drop=True)


def build_cluster_summary(
    assignments: pd.Series,
    representatives: pd.DataFrame,
    n_clusters: int,
    silhouette: float,
) -> pd.DataFrame:
    """Summarize cluster sizes and representative metrics."""
    sizes = assignments.value_counts().sort_index()
    rows = []
    for cluster_id, size in sizes.items():
        rep = representatives[representatives["Cluster_ID"] == cluster_id]
        rep_score = float(rep["Representative_Profile_Score"].iloc[0]) if not rep.empty and "Representative_Profile_Score" in rep else np.nan
        rows.append(
            {
                "Cluster_ID": int(cluster_id),
                "Candidate_Profiles": int(size),
                "Representative_Profile_ID": int(rep["Representative_Profile_ID"].iloc[0]) if not rep.empty else None,
                "Representative_Profile_Score": rep_score,
                "Merged_Candidate_Count": int(rep["Merged_Candidate_Count"].iloc[0]) if not rep.empty else None,
            }
        )
    summary = pd.DataFrame(rows)
    summary.attrs["initial_clusters"] = n_clusters
    summary.attrs["silhouette"] = silhouette
    return summary
