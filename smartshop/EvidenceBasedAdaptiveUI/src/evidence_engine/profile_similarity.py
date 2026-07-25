"""Deterministic similarity metrics for adaptive UI profiles."""

from __future__ import annotations

import numpy as np
import pandas as pd

from src.evidence_engine.profile_vectors import PERSONALITY_COLUMNS

CONTEXT_WEIGHT = 0.35
UI_WEIGHT = 0.65


def jaccard_similarity(left: set[str], right: set[str]) -> float:
    """Jaccard index between two token sets."""
    if not left and not right:
        return 1.0
    if not left or not right:
        return 0.0
    intersection = len(left & right)
    union = len(left | right)
    return intersection / union if union else 0.0


def hamming_similarity(left: set[str], right: set[str], universe: set[str]) -> float:
    """Fraction of universe tokens that match between two profiles."""
    if not universe:
        return 1.0
    matches = sum(1 for token in universe if (token in left) == (token in right))
    return matches / len(universe)


def weighted_token_overlap(
    left: set[str],
    right: set[str],
    weights: dict[str, float],
) -> float:
    """Weighted overlap normalized by the combined weight mass."""
    if not left and not right:
        return 1.0
    shared = left & right
    left_only = left - right
    right_only = right - left

    shared_weight = sum(weights.get(token, 1.0) for token in shared)
    penalty = sum(weights.get(token, 1.0) for token in left_only | right_only)
    total = shared_weight + penalty
    return shared_weight / total if total else 0.0


def build_token_weights(records: list[dict]) -> dict[str, float]:
    """Assign higher weight to tokens that appear in high-evidence profiles."""
    weights: dict[str, float] = {}
    for record in records:
        mass = (
            float(record.get("Avg_Support", 0.0))
            * float(record.get("Avg_Confidence", 0.0))
            * float(record.get("Avg_Lift", 1.0))
        )
        mass = max(mass, 0.01)
        for token in record["Context_Tokens"] | record["UI_Tokens"]:
            weights[token] = max(weights.get(token, 0.0), mass)
    return weights


def profile_similarity(
    left: dict,
    right: dict,
    *,
    token_weights: dict[str, float] | None = None,
    universe_context: set[str] | None = None,
    universe_ui: set[str] | None = None,
) -> dict[str, float]:
    """Compute context, UI, and combined similarity between two profile records."""
    token_weights = token_weights or {}

    context_jaccard = jaccard_similarity(left["Context_Tokens"], right["Context_Tokens"])
    ui_jaccard = jaccard_similarity(left["UI_Tokens"], right["UI_Tokens"])

    if universe_context is None:
        universe_context = left["Context_Tokens"] | right["Context_Tokens"]
    if universe_ui is None:
        universe_ui = left["UI_Tokens"] | right["UI_Tokens"]

    context_hamming = hamming_similarity(
        left["Context_Tokens"],
        right["Context_Tokens"],
        universe_context,
    )
    ui_hamming = hamming_similarity(left["UI_Tokens"], right["UI_Tokens"], universe_ui)

    context_weighted = weighted_token_overlap(
        left["Context_Tokens"],
        right["Context_Tokens"],
        token_weights,
    )
    ui_weighted = weighted_token_overlap(
        left["UI_Tokens"],
        right["UI_Tokens"],
        token_weights,
    )

    context_similarity = (
        0.40 * context_jaccard + 0.30 * context_hamming + 0.30 * context_weighted
    )
    ui_similarity = 0.40 * ui_jaccard + 0.30 * ui_hamming + 0.30 * ui_weighted
    combined = CONTEXT_WEIGHT * context_similarity + UI_WEIGHT * ui_similarity

    return {
        "context_jaccard": context_jaccard,
        "ui_jaccard": ui_jaccard,
        "context_hamming": context_hamming,
        "ui_hamming": ui_hamming,
        "context_similarity": context_similarity,
        "ui_similarity": ui_similarity,
        "combined_similarity": combined,
    }


def build_similarity_matrix(records: list[dict]) -> pd.DataFrame:
    """Pairwise combined similarity matrix indexed by Profile_ID."""
    token_weights = build_token_weights(records)
    universe_context: set[str] = set()
    universe_ui: set[str] = set()
    for record in records:
        universe_context |= record["Context_Tokens"]
        universe_ui |= record["UI_Tokens"]

    profile_ids = [record["Profile_ID"] for record in records]
    size = len(profile_ids)
    matrix = np.eye(size, dtype=float)

    for i in range(size):
        for j in range(i + 1, size):
            metrics = profile_similarity(
                records[i],
                records[j],
                token_weights=token_weights,
                universe_context=universe_context,
                universe_ui=universe_ui,
            )
            matrix[i, j] = metrics["combined_similarity"]
            matrix[j, i] = metrics["combined_similarity"]

    return pd.DataFrame(matrix, index=profile_ids, columns=profile_ids)


def ui_profile_similarity(left_ui: dict[str, str], right_ui: dict[str, str]) -> float:
    """Jaccard similarity between two canonical UI profile dicts."""
    left_tokens = {f"{key}={value}" for key, value in left_ui.items()}
    right_tokens = {f"{key}={value}" for key, value in right_ui.items()}
    return jaccard_similarity(left_tokens, right_tokens)


def personality_difference_count(left: dict, right: dict) -> int:
    """Count differing non-empty personality trait levels."""
    differences = 0
    left_ctx = left["Context"]
    right_ctx = right["Context"]
    for trait in PERSONALITY_COLUMNS:
        left_value = left_ctx.get(trait)
        right_value = right_ctx.get(trait)
        if left_value and right_value and left_value != right_value:
            differences += 1
    return differences


def core_context_match(left: dict, right: dict) -> bool:
    """True when persona, mood, and device match (ignoring empty values)."""
    for field in ("Persona", "Mood", "Device"):
        left_value = left["Context"].get(field)
        right_value = right["Context"].get(field)
        if left_value and right_value and left_value != right_value:
            return False
    return True
