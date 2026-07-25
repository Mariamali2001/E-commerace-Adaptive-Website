"""Association rule filtering utilities."""

from __future__ import annotations

import pandas as pd

CONTEXT_ITEM_PREFIXES: tuple[str, ...] = (
    "Persona=",
    "Mood=",
    "Device=",
    "Extraversion=",
    "Agreeableness=",
    "Conscientiousness=",
    "Neuroticism=",
    "Openness=",
)

PERSONALITY_ITEM_PREFIXES: tuple[str, ...] = (
    "Extraversion=",
    "Agreeableness=",
    "Conscientiousness=",
    "Neuroticism=",
    "Openness=",
)

UI_ITEM_PREFIXES: tuple[str, ...] = (
    "Global_",
    "Desktop_",
    "Mobile_",
)


def _items_to_string(itemset: frozenset[str]) -> str:
    return ", ".join(sorted(itemset))


def _item_has_prefix(item: str, prefixes: tuple[str, ...]) -> bool:
    return any(item.startswith(prefix) for prefix in prefixes)


def _itemset_has_prefix(itemset: frozenset[str], prefixes: tuple[str, ...]) -> bool:
    return any(_item_has_prefix(item, prefixes) for item in itemset)


def is_context_item(item: str) -> bool:
    """Return True when an item encodes persona, mood, device, or Big Five."""
    return _item_has_prefix(item, CONTEXT_ITEM_PREFIXES)


def is_ui_item(item: str) -> bool:
    """Return True when an item encodes a UI preference."""
    return _item_has_prefix(item, UI_ITEM_PREFIXES)


def is_personality_item(item: str) -> bool:
    """Return True when an item encodes only a Big Five trait level."""
    return _item_has_prefix(item, PERSONALITY_ITEM_PREFIXES)


def is_adaptation_rule(antecedents: frozenset[str], consequents: frozenset[str]) -> bool:
    """Keep only context-only antecedent → UI-only consequent rules.

    Requiring every antecedent item to be context and every consequent item to
    be UI inherently drops UI→UI, personality→personality, and mixed-antecedent
    rules.
    """
    if not antecedents or not consequents:
        return False

    antecedent_is_context = all(is_context_item(item) for item in antecedents)
    consequent_is_ui = all(is_ui_item(item) for item in consequents)
    return antecedent_is_context and consequent_is_ui


def filter_adaptation_rules_raw(rules: pd.DataFrame) -> pd.DataFrame:
    """Filter raw mlxtend rules to interpretable adaptation rules."""
    if rules.empty:
        return rules.copy()

    mask = rules.apply(
        lambda row: is_adaptation_rule(row["antecedents"], row["consequents"]),
        axis=1,
    )
    return rules.loc[mask].copy()


def format_rules_dataframe(rules: pd.DataFrame) -> pd.DataFrame:
    """Add readable columns, rule length, and sort by confidence, lift, support."""
    if rules.empty:
        return pd.DataFrame(
            columns=[
                "Antecedent",
                "Consequent",
                "Support",
                "Confidence",
                "Lift",
                "Leverage",
                "Conviction",
                "Rule_Length",
            ]
        )

    formatted = rules.copy()
    formatted["Antecedent"] = formatted["antecedents"].apply(_items_to_string)
    formatted["Consequent"] = formatted["consequents"].apply(_items_to_string)
    formatted["Rule_Length"] = formatted.apply(
        lambda row: len(row["antecedents"]) + len(row["consequents"]),
        axis=1,
    )
    formatted = formatted.rename(
        columns={
            "support": "Support",
            "confidence": "Confidence",
            "lift": "Lift",
            "leverage": "Leverage",
            "conviction": "Conviction",
        }
    )
    return formatted.sort_values(
        ["Confidence", "Lift", "Support"],
        ascending=False,
    ).reset_index(drop=True)


def deduplicate_rules(rules: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate rules with identical antecedent and consequent."""
    if rules.empty:
        return rules.copy()

    if "Antecedent" in rules.columns and "Consequent" in rules.columns:
        return rules.drop_duplicates(subset=["Antecedent", "Consequent"], keep="first")

    return rules.drop_duplicates(subset=["antecedents", "consequents"], keep="first")


def prune_redundant_rules(
    rules: pd.DataFrame,
    *,
    confidence_tolerance: float = 1e-9,
) -> pd.DataFrame:
    """Remove redundant rules sharing a consequent.

    For a pair of rules with the same consequent where one antecedent is a
    strict subset of the other (general vs. specific):

    - If the specific rule has similar or better confidence, keep the specific
      rule and drop the general one.
    - Otherwise the general rule is stronger, so drop the specific rule.
    """
    if rules.empty or "antecedents" not in rules.columns:
        return rules.copy()

    working = rules.reset_index(drop=True)
    keep = [True] * len(working)
    antecedents = working["antecedents"].tolist()
    consequents = working["consequents"].tolist()
    confidences = working["Confidence"].tolist()

    by_consequent: dict[frozenset[str], list[int]] = {}
    for idx, consequent in enumerate(consequents):
        by_consequent.setdefault(consequent, []).append(idx)

    for indices in by_consequent.values():
        for i in indices:
            for j in indices:
                if i == j:
                    continue
                # i general, j specific (i's antecedent is a strict subset of j's)
                if antecedents[i] < antecedents[j]:
                    if confidences[j] >= confidences[i] - confidence_tolerance:
                        keep[i] = False
                    else:
                        keep[j] = False

    return working.loc[keep].reset_index(drop=True)


def filter_adaptation_rules(rules: pd.DataFrame) -> pd.DataFrame:
    """Filter, format, and deduplicate association rules for export."""
    filtered = filter_adaptation_rules_raw(rules)
    formatted = format_rules_dataframe(filtered)
    return deduplicate_rules(formatted)
