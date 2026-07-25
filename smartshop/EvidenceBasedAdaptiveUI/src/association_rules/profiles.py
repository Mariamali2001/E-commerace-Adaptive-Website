"""Group context→UI rules into candidate adaptation profiles.

A candidate profile represents one context combination (identical antecedent)
and merges the UI adaptations suggested across all rules sharing that context.
This notebook stage performs pattern discovery only: no scoring, no confidence
filtering, no JSON generation.
"""

from __future__ import annotations

import pandas as pd

ALL_CONTEXT_LABELS: tuple[str, ...] = (
    "Persona",
    "Mood",
    "Device",
    "Extraversion",
    "Agreeableness",
    "Conscientiousness",
    "Neuroticism",
    "Openness",
)

BASE_CONTEXT_LABELS: tuple[str, ...] = ("Persona", "Mood", "Device")


def _profile_columns(context_labels: tuple[str, ...]) -> list[str]:
    return [
        "Profile_ID",
        *context_labels,
        "Antecedent",
        "Num_Context_Conditions",
        "UI_Adaptations",
        "Num_UI_Adaptations",
        "Num_Supporting_Rules",
        "Avg_Support",
        "Avg_Confidence",
        "Avg_Lift",
    ]


def _parse_context_item(
    item: str,
    context_labels: tuple[str, ...],
) -> tuple[str, str] | None:
    """Split ``Label=Value`` and keep it only if the label is a wanted context."""
    if "=" not in item:
        return None
    label, value = item.split("=", maxsplit=1)
    label = label.strip()
    if label not in context_labels:
        return None
    return label, value.strip()


def build_candidate_profiles(
    rules: pd.DataFrame,
    *,
    context_labels: tuple[str, ...] = ALL_CONTEXT_LABELS,
) -> pd.DataFrame:
    """Merge rules sharing an identical antecedent into candidate profiles."""
    profile_columns = _profile_columns(context_labels)
    if rules.empty or "antecedents" not in rules.columns:
        return pd.DataFrame(columns=profile_columns)

    profiles: list[dict[str, object]] = []
    grouped = rules.groupby("Antecedent", sort=False)

    for profile_id, (antecedent, group) in enumerate(grouped, start=1):
        antecedent_items = sorted(next(iter(group["antecedents"])))

        context_values: dict[str, str] = {label: "" for label in context_labels}
        for item in antecedent_items:
            parsed = _parse_context_item(item, context_labels)
            if parsed:
                context_values[parsed[0]] = parsed[1]

        ui_items: set[str] = set()
        for consequent in group["consequents"]:
            ui_items.update(consequent)
        ui_adaptations = sorted(ui_items)

        profiles.append(
            {
                "Profile_ID": profile_id,
                **context_values,
                "Antecedent": antecedent,
                "Num_Context_Conditions": len(antecedent_items),
                "UI_Adaptations": " | ".join(ui_adaptations),
                "Num_UI_Adaptations": len(ui_adaptations),
                "Num_Supporting_Rules": len(group),
                "Avg_Support": round(float(group["Support"].mean()), 6),
                "Avg_Confidence": round(float(group["Confidence"].mean()), 6),
                "Avg_Lift": round(float(group["Lift"].mean()), 6),
            }
        )

    profiles_df = pd.DataFrame(profiles, columns=profile_columns)
    return profiles_df.sort_values(
        ["Num_Supporting_Rules", "Avg_Confidence", "Avg_Lift"],
        ascending=False,
    ).reset_index(drop=True)


def build_candidate_rules(rules: pd.DataFrame) -> pd.DataFrame:
    """Return the flat candidate-rule table with readable columns for export."""
    export_columns = [
        "UI_Category",
        "Antecedent",
        "Consequent",
        "Support",
        "Confidence",
        "Lift",
        "Leverage",
        "Conviction",
        "Rule_Length",
    ]
    available = [column for column in export_columns if column in rules.columns]
    return rules[available].reset_index(drop=True) if available else rules.reset_index(drop=True)
