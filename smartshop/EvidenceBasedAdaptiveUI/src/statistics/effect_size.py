"""Effect size utilities for categorical association analysis."""

from __future__ import annotations

import numpy as np


def cramers_v(chi_square: float, sample_size: int, table_shape: tuple[int, int]) -> float:
    """Calculate Cramér's V for a chi-square test result."""
    if sample_size <= 0:
        return 0.0

    rows, columns = table_shape
    min_dim = min(rows - 1, columns - 1)
    if min_dim <= 0:
        return 0.0

    return float(np.sqrt(chi_square / (sample_size * min_dim)))


def interpret_cramers_v(value: float) -> str:
    """Map Cramér's V to a qualitative effect-size label."""
    if value < 0.1:
        return "Negligible"
    if value < 0.2:
        return "Small"
    if value < 0.4:
        return "Medium"
    return "Large"
