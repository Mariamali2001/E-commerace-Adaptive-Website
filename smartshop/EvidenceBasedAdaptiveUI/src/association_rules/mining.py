"""FP-Growth association rule mining for Notebook 05."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth
from mlxtend.preprocessing import TransactionEncoder

from src.association_rules.filtering import filter_adaptation_rules

logger = logging.getLogger(__name__)

DEFAULT_MIN_CONFIDENCE = 0.60
DEFAULT_MIN_SUPPORT = 0.05


@dataclass
class MiningResult:
    """Container for one FP-Growth mining stage."""

    parameters: dict[str, float]
    rules: pd.DataFrame
    frequent_itemsets: pd.DataFrame
    raw_rule_count: int


def encode_transactions(transactions: list[list[str]]) -> pd.DataFrame:
    """One-hot encode transactions for mlxtend."""
    encoder = TransactionEncoder()
    encoded = encoder.fit(transactions).transform(transactions)
    return pd.DataFrame(encoded, columns=encoder.columns_)


def mine_frequent_itemsets(encoded_df: pd.DataFrame, *, min_support: float) -> pd.DataFrame:
    """Run FP-Growth frequent itemset mining."""
    return fpgrowth(encoded_df, min_support=min_support, use_colnames=True)


def generate_association_rules(
    itemsets: pd.DataFrame,
    *,
    min_confidence: float,
) -> pd.DataFrame:
    """Generate association rules from frequent itemsets."""
    if itemsets.empty:
        return pd.DataFrame()

    return association_rules(
        itemsets,
        metric="confidence",
        min_threshold=min_confidence,
    )


def mine_stage(
    encoded_df: pd.DataFrame,
    *,
    min_support: float,
    min_confidence: float = DEFAULT_MIN_CONFIDENCE,
    label: str = "FP-Growth",
) -> MiningResult:
    """Mine, generate, and filter context→UI rules at a single support level."""
    itemsets = mine_frequent_itemsets(encoded_df, min_support=min_support)
    raw_rules = generate_association_rules(itemsets, min_confidence=min_confidence)
    filtered_rules = filter_adaptation_rules(raw_rules)

    logger.info(
        "%s support=%.2f confidence=%.2f -> %s raw rules, %s context->UI rules, %s itemsets",
        label,
        min_support,
        min_confidence,
        len(raw_rules),
        len(filtered_rules),
        len(itemsets),
    )
    return MiningResult(
        parameters={"min_support": min_support, "min_confidence": min_confidence},
        rules=filtered_rules,
        frequent_itemsets=itemsets,
        raw_rule_count=len(raw_rules),
    )
