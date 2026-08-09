#!/usr/bin/env python3
"""
Headless export of master / global / trait JSON from E-Commerce.csv.
Mirrors pages/9_Export_Guidelines.py but skips Streamlit + bootstrap for speed
on the master matrix (master only stores majority values).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pandas as pd
from sklearn.utils import resample

APP_DIR = Path(__file__).resolve().parent
CSV_PATH = APP_DIR / "data" / "E-Commerce.csv"
ASSETS_DIR = APP_DIR.parent / "public" / "assets"


def filter_attention_checks(df: pd.DataFrame) -> pd.DataFrame:
    check_cols = ["check1", "check2", "check3", "check4", "check5"]
    if not any(c in df.columns for c in check_cols):
        return df

    def score_row(row):
        score = 0
        for col in ["check1", "check2", "check4", "check5"]:
            if col in row and pd.notna(row[col]):
                val = str(row[col]).strip()
                if val in ("3", "3.0"):
                    score += 1
        if "check3" in row and pd.notna(row["check3"]):
            val = str(row["check3"]).strip().lower()
            if "rounded corners" in val:
                score += 1
        return score

    scores = df.apply(score_row, axis=1)
    return df[scores >= 4].copy()


def get_targets() -> list[str]:
    return [
        "font_style_pref",
        "font_size_pref",
        "color_theme_pref",
        "accent_color_pref",
        "background_pref",
        "whitespace_pref",
        "button_style_pref",
        "hero_banner_size",
        "recommendation_type",
        "social_proof_display",
        "urgency_pref",
        "checkout_style",
        "form_field_style",
        "product_desc_length",
        "desktop_navigation",
        "desktop_product_card",
        "desktop_review_display",
        "desktop_info_density",
        "desktop_filter_location",
        "desktop_quick_view",
        "desktop_whitespace",
        "desktop_grid_pref",
        "desktop_image_text_ratio",
        "desktop_search_visibility",
        "desktop_category_display",
        "desktop_price_display",
        "desktop_persistent_filters",
        "mobile_navigation",
        "mobile_product_card",
        "mobile_review_display",
        "mobile_info_density",
        "mobile_filter_location",
        "mobile_quick_view",
        "mobile_whitespace",
        "mobile_grid_pref",
        "mobile_image_text_ratio",
        "mobile_search_visibility",
        "mobile_category_display",
        "mobile_price_display",
        "mobile_sticky_header",
        "mobile_touch_size",
    ]


def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    out = df
    for key, value in filters.items():
        if key not in out.columns:
            continue
        if value is None or value == "Any":
            continue
        out = out[out[key] == value]
    return out


def majority(df: pd.DataFrame, target_col: str):
    if df.empty or target_col not in df.columns:
        return None, 0.0, 0
    vc = df[target_col].value_counts()
    if vc.empty:
        return None, 0.0, 0
    top = vc.idxmax()
    count = int(vc.max())
    total = int(len(df))
    return top, count / total if total else 0.0, total


def stability(df: pd.DataFrame, target_col: str, current_best, n_iterations: int = 20) -> float:
    if len(df) < 5:
        return 0.0
    matches = 0
    for i in range(n_iterations):
        sample = resample(df, replace=True, n_samples=len(df), random_state=i)
        if sample[target_col].dropna().empty:
            continue
        if sample[target_col].value_counts().idxmax() == current_best:
            matches += 1
    return matches / n_iterations


def get_guideline(df: pd.DataFrame, filters: dict, target_col: str):
    filtered = apply_filters(df, filters)
    rec, conf, total = majority(filtered, target_col)
    if rec is None or total == 0:
        return "Not enough data", 0.0, 0, "Unknown", 0.0
    stab = stability(filtered, target_col, rec)
    if stab > 0.8:
        label = "High Confidence"
    elif stab > 0.5:
        label = "Moderate Confidence"
    else:
        label = "Exploratory"
    return rec, conf, total, label, stab


def export_global(df: pd.DataFrame, targets: list[str]) -> dict:
    g_filters = {
        "primary_persona": "Any",
        "current_mood": "Any",
        "primary_device": "Any",
    }
    tokens = {}
    details = {}
    for t in targets:
        if t not in df.columns:
            continue
        rec, conf, count, stab_label, stab_score = get_guideline(df, g_filters, t)
        if count > 0 and rec and rec != "Not enough data":
            tokens[t] = rec
            details[t] = {
                "value": rec,
                "confidence": round(conf, 4),
                "user_support_count": int(count),
                "stability_label": stab_label,
                "stability_score": round(stab_score, 4),
            }
    return {
        "project": "Towards Intelligent User-Adaptive Interfaces",
        "description": (
            "Global UI defaults — dataset-wide majority "
            "(persona/device/mood = Any). Used by Adaptive Engine "
            "to fill missing tokens after master matrix lookup."
        ),
        "version": "1.0",
        "source": "adaptive_ui_app get_guideline filters=Any/Any/Any",
        "total_dataset_records": int(len(df)),
        "applied_filters": g_filters,
        "tokens": tokens,
        "token_details": details,
    }


def export_master(df: pd.DataFrame, targets: list[str]) -> dict:
    personas = list(df["primary_persona"].dropna().unique())
    devices = ["Smartphone", "Laptop/Desktop"]
    moods = list(df["current_mood"].dropna().unique())
    master_rules: dict = {}
    cells = 0
    for p in personas:
        master_rules[p] = {}
        for d in devices:
            master_rules[p][d] = {}
            for m in moods:
                filtered = apply_filters(
                    df,
                    {
                        "primary_persona": p,
                        "primary_device": d,
                        "current_mood": m,
                    },
                )
                if filtered.empty:
                    continue
                r_dict = {}
                for t in targets:
                    if t not in df.columns:
                        continue
                    rec, conf, count = majority(filtered, t)
                    if count > 0 and rec is not None:
                        r_dict[t] = rec
                if r_dict:
                    master_rules[p][d][m] = r_dict
                    cells += 1
    print(f"  master cells with data: {cells}")
    return {
        "project": "Towards Intelligent User-Adaptive Interfaces",
        "description": "Master Adaptive UI Lookup Matrix for All User Profiles",
        "total_dataset_records": int(len(df)),
        "total_personas": len(master_rules),
        "rules": master_rules,
    }


def export_traits(n_records: int) -> dict:
    """Soft TIPI nudge table (same schema as public/assets/trait_modifiers.json)."""
    return {
        "project": "Towards Intelligent User-Adaptive Interfaces",
        "description": (
            "Soft trait nudges applied after master matrix + global fill. "
            "Never replace categorical UI tokens. Deltas are small and capped."
        ),
        "version": "1.0",
        "total_dataset_records": int(n_records),
        "source": "adaptive_ui_app TIPI soft-nudge table (post attention-check cohort)",
        "nudge_keys": [
            "information_density",
            "visual_richness",
            "social_proof",
            "recommendation_strength",
        ],
        "clamp": {"min": -2, "max": 2},
        "modifiers": {
            "Extraversion": {
                "High": {"social_proof": 1, "visual_richness": 1},
                "Low": {"social_proof": -1, "visual_richness": -1},
            },
            "Agreeableness": {
                "High": {"social_proof": 1},
                "Low": {"social_proof": -1},
            },
            "Conscientiousness": {
                "High": {
                    "information_density": 1,
                    "recommendation_strength": -1,
                },
                "Low": {
                    "information_density": -1,
                    "recommendation_strength": 1,
                },
            },
            "Neuroticism": {
                "High": {
                    "information_density": 1,
                    "visual_richness": -1,
                    "recommendation_strength": -1,
                },
                "Low": {"visual_richness": 1},
            },
            "Openness": {
                "High": {"visual_richness": 1, "social_proof": 1},
                "Low": {"visual_richness": -1},
            },
        },
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--attention-filter",
        action="store_true",
        help="Drop rows failing attention checks (score < 4). Default: use all CSV rows.",
    )
    args = parser.parse_args()

    print(f"Loading {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH).dropna(how="all")
    raw_n = len(df)
    if args.attention_filter:
        df = filter_attention_checks(df)
        print(f"Raw rows: {raw_n} → after attention checks: {len(df)}")
    else:
        print(f"Using all CSV rows (no attention filter): {len(df)}")

    targets = [t for t in get_targets() if t in df.columns]
    print(f"UI targets: {len(targets)}")

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    print("Generating global_defaults.json ...")
    global_export = export_global(df, targets)
    global_path = ASSETS_DIR / "global_defaults.json"
    global_path.write_text(json.dumps(global_export, indent=2), encoding="utf-8")
    print(f"  wrote {global_path} ({len(global_export['tokens'])} tokens)")

    print("Generating master_adaptive_ui_rules.json ...")
    master_export = export_master(df, targets)
    master_path = ASSETS_DIR / "master_adaptive_ui_rules.json"
    master_path.write_text(json.dumps(master_export, indent=2), encoding="utf-8")
    print(f"  wrote {master_path} ({master_export['total_personas']} personas)")

    print("Generating trait_modifiers.json ...")
    traits_export = export_traits(len(df))
    traits_path = ASSETS_DIR / "trait_modifiers.json"
    traits_path.write_text(json.dumps(traits_export, indent=2), encoding="utf-8")
    print(f"  wrote {traits_path}")

    # Also keep copies under adaptive_ui_app/data/exports for download convenience
    out_dir = APP_DIR / "data" / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, payload in [
        ("global_defaults.json", global_export),
        ("master_adaptive_ui_rules.json", master_export),
        ("trait_modifiers.json", traits_export),
    ]:
        (out_dir / name).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Copies also saved to {out_dir}")
    print("Done.")


if __name__ == "__main__":
    # Avoid matplotlib cache noise if anything pulls it in
    os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
    main()
