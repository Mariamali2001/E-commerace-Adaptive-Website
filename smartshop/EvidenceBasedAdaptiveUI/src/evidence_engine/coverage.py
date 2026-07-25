"""Dataset coverage audit for adaptive UI profiles.

Answers a practical thesis question: for each Persona / Mood / Device context,
is the survey sample large enough to support evidence-based UI adaptations?

Labels:
- Sufficient  — n >= 10 (stable enough for association rules / majority UI)
- Borderline  — 5 <= n < 10 (usable with caution; expect thin profiles)
- Insufficient — n < 5 (do not claim a full evidence-backed UI for this cell)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from src.preprocessing.columns import get_ui_target_groups

PERSONA_COL = "primary_persona"
MOOD_COL = "current_mood"
DEVICE_COL = "primary_device"

SUFFICIENT_MIN = 10
BORDERLINE_MIN = 5

GRAIN_SPECS: list[tuple[str, list[str]]] = [
    ("Persona", [PERSONA_COL]),
    ("Mood", [MOOD_COL]),
    ("Device", [DEVICE_COL]),
    ("Persona×Mood", [PERSONA_COL, MOOD_COL]),
    ("Persona×Device", [PERSONA_COL, DEVICE_COL]),
    ("Mood×Device", [MOOD_COL, DEVICE_COL]),
    ("Persona×Mood×Device", [PERSONA_COL, MOOD_COL, DEVICE_COL]),
]


def _short_label(value: object, max_len: int = 40) -> str:
    text = str(value).strip()
    if "(" in text:
        text = text.split("(", maxsplit=1)[0].strip()
    if text.startswith("The "):
        text = text[4:]
    return text if len(text) <= max_len else text[: max_len - 1] + "…"


def classify_coverage(n: int) -> str:
    """Map a cell size to a coverage label."""
    if n >= SUFFICIENT_MIN:
        return "Sufficient"
    if n >= BORDERLINE_MIN:
        return "Borderline"
    return "Insufficient"


def _ui_columns(df: pd.DataFrame) -> list[str]:
    groups = get_ui_target_groups()
    return [column for columns in groups.values() for column in columns if column in df.columns]


def build_cell_coverage(df: pd.DataFrame, group_cols: list[str], grain: str) -> pd.DataFrame:
    """Count respondents per context cell and label coverage."""
    counts = (
        df.groupby(group_cols, dropna=False, observed=False)
        .size()
        .reset_index(name="n")
        .sort_values("n", ascending=False)
        .reset_index(drop=True)
    )
    counts["Grain"] = grain
    counts["Coverage"] = counts["n"].map(classify_coverage)
    for column in group_cols:
        counts[column] = counts[column].map(_short_label)
    return counts


def build_all_grain_coverage(df: pd.DataFrame) -> pd.DataFrame:
    """Build coverage tables for every context grain and stack them."""
    frames = [
        build_cell_coverage(df, group_cols, grain) for grain, group_cols in GRAIN_SPECS
    ]
    return pd.concat(frames, ignore_index=True)


def summarize_grain_coverage(all_cells: pd.DataFrame) -> pd.DataFrame:
    """One summary row per grain: how many cells fall in each coverage band."""
    rows: list[dict[str, object]] = []
    for grain, _ in GRAIN_SPECS:
        subset = all_cells[all_cells["Grain"] == grain]
        rows.append(
            {
                "Grain": grain,
                "Cells": len(subset),
                "Sufficient": int((subset["Coverage"] == "Sufficient").sum()),
                "Borderline": int((subset["Coverage"] == "Borderline").sum()),
                "Insufficient": int((subset["Coverage"] == "Insufficient").sum()),
                "Median_n": float(subset["n"].median()) if not subset.empty else 0.0,
                "Mean_n": round(float(subset["n"].mean()), 1) if not subset.empty else 0.0,
                "Max_n": int(subset["n"].max()) if not subset.empty else 0,
                "Verdict": _grain_verdict(subset),
            }
        )
    return pd.DataFrame(rows)


def _grain_verdict(subset: pd.DataFrame) -> str:
    if subset.empty:
        return "No data"
    sufficient_share = (subset["Coverage"] == "Sufficient").mean()
    if sufficient_share >= 0.7:
        return "Good — most cells have enough respondents"
    if sufficient_share >= 0.3 or (subset["Coverage"] != "Insufficient").mean() >= 0.5:
        return "Partial — usable for some contexts, sparse for others"
    return "Weak — most cells are too small for full UI profiles"


def build_ui_preference_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Summarize missingness and preference concentration for each UI column."""
    rows: list[dict[str, object]] = []
    for column in _ui_columns(df):
        series = df[column]
        value_counts = series.dropna().value_counts(normalize=True)
        top_share = float(value_counts.iloc[0]) if not value_counts.empty else 0.0
        top_value = _short_label(value_counts.index[0]) if not value_counts.empty else None
        if top_share >= 0.70:
            signal = "Low signal (one value dominates)"
        elif top_share >= 0.55:
            signal = "Moderate signal"
        else:
            signal = "Good diversity"
        rows.append(
            {
                "UI_Element": column,
                "Unique_Values": int(series.nunique(dropna=True)),
                "Missing_Pct": round(float(series.isna().mean() * 100), 1),
                "Top_Share": round(top_share, 3),
                "Top_Value": top_value,
                "Signal": signal,
            }
        )
    return pd.DataFrame(rows).sort_values("Top_Share", ascending=False).reset_index(drop=True)


def build_plain_language_summary(
    df: pd.DataFrame,
    grain_summary: pd.DataFrame,
    ui_summary: pd.DataFrame,
) -> str:
    """Write a short markdown explanation a non-statistician can follow."""
    full = grain_summary[grain_summary["Grain"] == "Persona×Mood×Device"].iloc[0]
    persona = grain_summary[grain_summary["Grain"] == "Persona"].iloc[0]
    dominated = int((ui_summary["Signal"] == "Low signal (one value dominates)").sum())

    lines = [
        "# Data Coverage Audit",
        "",
        "## Bottom line",
        "",
        "The survey has **complete UI answers** (no missing UI fields), but "
        "**full Persona + Mood + Device combinations are often too small** "
        "to support a complete evidence-based UI profile.",
        "",
        f"- Respondents: **{len(df)}**",
        f"- UI elements measured: **{len(ui_summary)}**",
        f"- Full Persona×Mood×Device cells: **{int(full['Cells'])}** "
        f"(Sufficient={int(full['Sufficient'])}, Borderline={int(full['Borderline'])}, "
        f"Insufficient={int(full['Insufficient'])})",
        f"- Median respondents per full cell: **{full['Median_n']:.0f}**",
        "",
        "## How to read the labels",
        "",
        f"- **Sufficient** — at least {SUFFICIENT_MIN} respondents in that context. "
        "Safe to mine association rules and claim a UI preference.",
        f"- **Borderline** — {BORDERLINE_MIN}–{SUFFICIENT_MIN - 1} respondents. "
        "Usable with caution; expect thin / incomplete profiles.",
        f"- **Insufficient** — fewer than {BORDERLINE_MIN} respondents. "
        "Do **not** claim a full evidence-backed UI for this exact context.",
        "",
        "## What this means for the website",
        "",
        f"- Coarse contexts (e.g. Persona only) look healthy: "
        f"{int(persona['Sufficient'])}/{int(persona['Cells'])} Sufficient.",
        "- Fine contexts (Persona×Mood×Device) are mostly sparse — "
        "this is why many JSON base profiles have only a few UI keys.",
        "- Recommended website strategy: **default UI + partial base profile + trait nudges**, "
        "not “every context has a complete custom interface”.",
        "",
        "## UI preference signal",
        "",
        f"- UI elements where one answer dominates (≥70%): **{dominated}**",
        "- Dominated elements are hard to adapt because almost everyone chose the same option.",
        "",
        "## Grain-by-grain verdict",
        "",
    ]
    for row in grain_summary.itertuples():
        lines.append(
            f"- **{row.Grain}**: {row.Verdict} "
            f"(Sufficient {row.Sufficient}/{row.Cells}, median n={row.Median_n:.0f})"
        )
    return "\n".join(lines)


def plot_coverage_by_grain(grain_summary: pd.DataFrame, path: Path) -> Path:
    """Stacked bar chart of Sufficient / Borderline / Insufficient per grain."""
    path.parent.mkdir(parents=True, exist_ok=True)
    labels = grain_summary["Grain"].tolist()
    sufficient = grain_summary["Sufficient"].tolist()
    borderline = grain_summary["Borderline"].tolist()
    insufficient = grain_summary["Insufficient"].tolist()

    fig, ax = plt.subplots(figsize=(10, 5))
    x = range(len(labels))
    ax.bar(x, sufficient, label="Sufficient", color="#2E7D32")
    ax.bar(x, borderline, bottom=sufficient, label="Borderline", color="#F9A825")
    bottoms = [s + b for s, b in zip(sufficient, borderline)]
    ax.bar(x, insufficient, bottom=bottoms, label="Insufficient", color="#C62828")
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, rotation=25, ha="right")
    ax.set_ylabel("Number of context cells")
    ax.set_title("Context coverage by grain")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=200)
    plt.close(fig)
    return path


def plot_full_cell_sizes(full_cells: pd.DataFrame, path: Path) -> Path:
    """Histogram of Persona×Mood×Device cell sizes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.hist(full_cells["n"], bins=range(1, int(full_cells["n"].max()) + 2), color="#4C72B0", edgecolor="white")
    ax.axvline(SUFFICIENT_MIN, color="#2E7D32", linestyle="--", label=f"Sufficient ≥ {SUFFICIENT_MIN}")
    ax.axvline(BORDERLINE_MIN, color="#F9A825", linestyle="--", label=f"Borderline ≥ {BORDERLINE_MIN}")
    ax.set_xlabel("Respondents in Persona×Mood×Device cell")
    ax.set_ylabel("Number of cells")
    ax.set_title("How large are the full-context cells?")
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=200)
    plt.close(fig)
    return path


@dataclass
class CoverageAuditResult:
    """Outputs from the coverage audit."""

    all_cells: pd.DataFrame
    grain_summary: pd.DataFrame
    full_cells: pd.DataFrame
    ui_summary: pd.DataFrame
    markdown: str
    export_paths: dict[str, Path]


def run_coverage_audit(df: pd.DataFrame, reports_dir: Path) -> CoverageAuditResult:
    """Run the full coverage audit and export tables + figures + markdown."""
    reports_dir.mkdir(parents=True, exist_ok=True)
    figures_dir = reports_dir / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)

    all_cells = build_all_grain_coverage(df)
    grain_summary = summarize_grain_coverage(all_cells)
    full_cells = all_cells[all_cells["Grain"] == "Persona×Mood×Device"].copy()
    ui_summary = build_ui_preference_summary(df)
    markdown = build_plain_language_summary(df, grain_summary, ui_summary)

    export_paths: dict[str, Path] = {}

    cells_xlsx = reports_dir / "context_coverage_cells.xlsx"
    with pd.ExcelWriter(cells_xlsx, engine="openpyxl") as writer:
        grain_summary.to_excel(writer, sheet_name="Grain_Summary", index=False)
        full_cells.to_excel(writer, sheet_name="Full_Context_Cells", index=False)
        for grain, _ in GRAIN_SPECS:
            sheet = grain.replace("×", "x")[:31]
            all_cells[all_cells["Grain"] == grain].to_excel(writer, sheet_name=sheet, index=False)
    export_paths["context_coverage_cells_xlsx"] = cells_xlsx

    ui_csv = reports_dir / "ui_preference_signal.csv"
    ui_summary.to_csv(ui_csv, index=False)
    export_paths["ui_preference_signal_csv"] = ui_csv

    md_path = reports_dir / "coverage_audit.md"
    md_path.write_text(markdown, encoding="utf-8")
    export_paths["coverage_audit_md"] = md_path

    export_paths["coverage_by_grain_png"] = plot_coverage_by_grain(
        grain_summary, figures_dir / "coverage_by_grain.png"
    )
    export_paths["full_cell_sizes_png"] = plot_full_cell_sizes(
        full_cells, figures_dir / "full_context_cell_sizes.png"
    )

    return CoverageAuditResult(
        all_cells=all_cells,
        grain_summary=grain_summary,
        full_cells=full_cells,
        ui_summary=ui_summary,
        markdown=markdown,
        export_paths=export_paths,
    )
