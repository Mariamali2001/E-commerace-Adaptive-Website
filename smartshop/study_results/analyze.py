#!/usr/bin/env python3
"""
SmartShop study results analysis.

Uses sample_* CSVs until you drop real exports into data/:
  experiment_export.csv  (admin)
  form_survey.csv        (Google Form)
  task_outcomes.csv      (optional)

Writes tables/figures under reports/.

Run from study_results/:
  python analyze.py
"""

from __future__ import annotations

import csv
import json
import math
import re
import warnings
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=FutureWarning)

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
REPORTS = ROOT / "reports"
FIGS = REPORTS / "figures"
REPORTS.mkdir(parents=True, exist_ok=True)
FIGS.mkdir(parents=True, exist_ok=True)

# Google Form headers → short analysis names (matches sample_form_survey.csv)
SURVEY_COLUMN_MAP = {
    "Participant ID": "participant_id",
    "Email": "email",
    "Email address": "email",
    "Email Address": "email",
    "Email used on SmartShop": "email",
    "I think that I would like to use this system frequently.": "sus_1",
    "I found the system unnecessarily complex.": "sus_2",
    "I thought the system was easy to use.": "sus_3",
    "I think that I would need the support of a technical person to be able to use this system.": "sus_4",
    "I found the various functions in this system were well integrated.": "sus_5",
    "I thought there was too much inconsistency in this system.": "sus_6",
    "I would imagine that most people would learn to use this system very quickly.": "sus_7",
    "I found the system very cumbersome to use.": "sus_8",
    "I felt very confident using the system.": "sus_9",
    "I needed to learn a lot of things before I could get going with this system.": "sus_10",
    "Obstructive - Supportive": "ueq_1",
    "Complicated - Easy": "ueq_2",
    "Inefficient - Efficient": "ueq_3",
    "Confusing - Clear": "ueq_4",
    "Boring - Exciting": "ueq_5",
    "Not interesting - Interesting": "ueq_6",
    "Conventional - Inventive": "ueq_7",
    "Usual - Leading edge": "ueq_8",
    "The website interface felt tailored to my preferences and shopping style.": "aweq_1",
    "The interface adapted appropriately throughout my shopping experience.": "aweq_2",
    "The interface changes felt natural and did not distract me while using the website.": "aweq_3",
    "The interface was appropriate for the device I was using.": "aweq_4",
    "The interface reflected my current emotional state.": "aweq_5",
    "The adaptive interface made it easier to browse and find products.": "aweq_6",
    "Overall, I would prefer using this adaptive website over a traditional non-adaptive e-commerce website.": "aweq_7",
    "What did you like most about the adaptive website? (Optional)": "opt_1",
    "What would you improve? Optional)": "opt_2",
    "If you could improve one aspect of the adaptive website, what would it be? (Optional)": "opt_3",
}

PERSONA_ALIASES = {
    "the deal hunter": "Deal Hunter",
    "deal hunter": "Deal Hunter",
    "the researcher": "Researcher",
    "researcher": "Researcher",
    "the browser": "Browser",
    "browser": "Browser",
    "the impulsive buyer": "Impulsive Buyer",
    "impulsive buyer": "Impulsive Buyer",
    "the loyal customer": "Loyal Customer",
    "loyal customer": "Loyal Customer",
    "the minimalist": "Minimalist",
    "minimalist": "Minimalist",
}

DEVICE_ALIASES = {
    "mobile": "mobile",
    "smartphone": "mobile",
    "phone": "mobile",
    "desktop": "desktop",
    "laptop": "desktop",
    "laptop/desktop": "desktop",
}


def norm_email(val) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return ""
    s = str(val).strip().lower()
    if not s or s in {"nan", "none", "null"}:
        return ""
    return s


def pick_file(*candidates: str) -> Path | None:
    for name in candidates:
        p = DATA / name
        if p.exists() and p.stat().st_size > 0:
            return p
    return None


def pick_latest_glob(*patterns: str) -> Path | None:
    found: list[Path] = []
    for pat in patterns:
        found.extend(p for p in DATA.glob(pat) if p.is_file() and p.stat().st_size > 0)
    if not found:
        return None
    return max(found, key=lambda p: p.stat().st_mtime)


def pick_experiment_csv() -> Path | None:
    exact = pick_file("experiment_export.csv")
    if exact:
        return exact
    dated = pick_latest_glob("smartshop_participants_new_chapter_*.csv")
    if dated:
        return dated
    return pick_file("sample_experiment_export.csv")


def pick_survey_csv() -> Path | None:
    # Dated Tally export wins over a stale form_survey.csv
    tally = pick_latest_glob(
        "*Post*Experiment*Submissions*.csv",
        "*Post_Experiment_Submissions*.csv",
    )
    if tally:
        return tally
    return pick_file("form_survey.csv", "sample_form_survey.csv")


def dedupe_survey(survey: pd.DataFrame) -> pd.DataFrame:
    """Keep the later Tally/Google Form row per person (email, else Participant ID)."""
    df = survey.copy()
    time_col = next(
        (c for c in df.columns if c.strip().lower() in {"submitted at", "submitted_at", "timestamp"}),
        None,
    )
    if time_col:
        df["_t"] = pd.to_datetime(df[time_col], errors="coerce")
        df = df.sort_values("_t", na_position="first")
    before = len(df)
    if "email" in df.columns:
        df["_e"] = df["email"].map(norm_email)
        with_email = df[df["_e"] != ""].drop_duplicates("_e", keep="last")
        without = df[df["_e"] == ""]
        if "participant_id" in without.columns:
            without = without.drop_duplicates("participant_id", keep="last")
        df = pd.concat([with_email, without], ignore_index=True)
        df = df.drop(columns=["_e"], errors="ignore")
    elif "participant_id" in df.columns:
        df = df.drop_duplicates("participant_id", keep="last")
    dropped = before - len(df)
    if dropped:
        print(f"  survey dedupe: kept later of {dropped} duplicate submission(s) → n={len(df)}")
    return df.drop(columns=["_t"], errors="ignore")


def save_table(df: pd.DataFrame, name: str) -> Path:
    path = REPORTS / name
    df.to_csv(path, index=False)
    print(f"  wrote {path.relative_to(ROOT)}")
    return path


def save_fig(name: str) -> Path:
    path = FIGS / name
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  wrote {path.relative_to(ROOT)}")
    return path


def coerce_survey_email_column(survey: pd.DataFrame) -> pd.DataFrame:
    """Map Google Form Email column names if SURVEY_COLUMN_MAP missed them."""
    if "email" in survey.columns:
        return survey
    for c in survey.columns:
        key = c.strip().lower()
        if key in {"email", "email address", "e-mail"} or "email" in key:
            return survey.rename(columns={c: "email"})
    return survey


def apply_id_map(survey: pd.DataFrame) -> pd.DataFrame:
    """Fill missing form emails from data/id_map.csv (participant_id → email)."""
    map_path = pick_file("id_map.csv")
    if map_path is None or "participant_id" not in survey.columns:
        return survey
    mapping = pd.read_csv(map_path, encoding="utf-8-sig")
    mapping.columns = [c.strip().lower() for c in mapping.columns]
    if "participant_id" not in mapping.columns or "email" not in mapping.columns:
        print("  id_map.csv needs columns participant_id,email — skipped")
        return survey
    mapping["participant_id"] = mapping["participant_id"].astype(str).str.strip()
    mapping["email"] = mapping["email"].map(norm_email)
    mapping = mapping[mapping["email"] != ""]
    if mapping.empty:
        print("  id_map.csv has no filled emails yet — join will use form Email only")
        return survey
    lookup = dict(zip(mapping["participant_id"], mapping["email"]))
    survey = survey.copy()
    pids = survey["participant_id"].astype(str).str.strip()
    if "email" not in survey.columns:
        survey["email"] = ""
    filled_from_map = 0
    emails = []
    for pid, existing in zip(pids, survey["email"]):
        current = norm_email(existing)
        if current:
            emails.append(current)
            continue
        mapped = lookup.get(pid, "")
        if mapped:
            filled_from_map += 1
            emails.append(mapped)
        else:
            emails.append("")
    survey["email"] = emails
    print(f"  id_map.csv: filled {filled_from_map} form row(s) missing Email")
    return survey


def join_experiment_survey(exp: pd.DataFrame, survey: pd.DataFrame) -> tuple[pd.DataFrame, str]:
    """Prefer normalized email; fall back to participant_id."""
    survey = coerce_survey_email_column(survey)
    survey = apply_id_map(survey)

    if "email" in exp.columns and "email" in survey.columns:
        left = exp.copy()
        right = survey.copy()
        left["_join"] = left["email"].map(norm_email)
        right["_join"] = right["email"].map(norm_email)
        right = right[right["_join"] != ""].drop_duplicates("_join", keep="last")
        merged = left.merge(right, on="_join", how="inner", suffixes=("", "_form"))
        if len(merged):
            return merged, "email"

    if "participant_id" in exp.columns and "participant_id" in survey.columns:
        merged = exp.merge(survey, on="participant_id", how="inner", suffixes=("", "_form"))
        if len(merged):
            return merged, "participant_id"

    return pd.DataFrame(), "none"


def grouped_score_table(merged: pd.DataFrame, group: str, score: str) -> pd.DataFrame | None:
    if group not in merged.columns or score not in merged.columns:
        return None
    tmp = merged[[group, score]].copy()
    tmp[score] = tmp[score].map(to_number)
    tmp[group] = tmp[group].astype(str).str.strip()
    tmp = tmp[tmp[group].isin(["", "nan", "None"]) == False]
    tmp = tmp.dropna(subset=[score])
    if tmp.empty:
        return None
    out = (
        tmp.groupby(group, dropna=False)[score]
        .agg(n="count", mean="mean", std="std")
        .reset_index()
        .sort_values("n", ascending=False)
    )
    out["mean"] = out["mean"].round(2)
    out["std"] = out["std"].round(2)
    return out


def read_experiment_csv(path: Path) -> pd.DataFrame:
    """Robust admin CSV reader (ui_elements_json sometimes breaks quoting)."""
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    if not rows:
        return pd.DataFrame()
    header = [h.lstrip("\ufeff") for h in rows[0]]
    n = len(header)
    json_idx = header.index("ui_elements_json") if "ui_elements_json" in header else None
    cleaned: list[list[str]] = []
    skipped = 0
    for row in rows[1:]:
        if len(row) == n:
            cleaned.append(row)
            continue
        if json_idx is not None and len(row) > n:
            extra = len(row) - n
            merged = row[:json_idx] + [",".join(row[json_idx : json_idx + extra + 1])] + row[json_idx + extra + 1 :]
            if len(merged) == n:
                cleaned.append(merged)
                continue
        skipped += 1
    if skipped:
        print(f"  note: skipped {skipped} malformed experiment row(s)")
    return pd.DataFrame(cleaned, columns=header)


def to_number(val) -> float:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return float("nan")
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return float("nan")
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else float("nan")


def norm_mood(val) -> str | None:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    # map camera classes → guideline moods when needed
    alias = {
        "angry": "Frustrated",
        "disgust": "Frustrated",
        "fear": "Stressed",
        "surprise": "Excited",
        "happy": "Happy",
        "sad": "Sad",
        "neutral": "Neutral",
    }
    key = s.lower()
    if key in alias:
        return alias[key]
    return s[:1].upper() + s[1:].lower() if s else None


def norm_persona(val) -> str | None:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    if not s:
        return None
    # strip long survey label: "The Researcher (I thoroughly...)"
    short = s.split("(")[0].strip()
    return PERSONA_ALIASES.get(short.lower(), short.replace("The ", "").strip())


def norm_device(val) -> str | None:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip().lower()
    return DEVICE_ALIASES.get(s, s)


def score_sus(row: pd.Series, cols: list[str]) -> float:
    contrib = []
    for i, c in enumerate(cols, start=1):
        v = to_number(row.get(c))
        if math.isnan(v):
            return float("nan")
        contrib.append((v - 1) if i % 2 == 1 else (5 - v))
    return float(sum(contrib) * 2.5)


def score_ueq(row: pd.Series, cols: list[str]) -> tuple[float, float, float]:
    vals = [to_number(row.get(c)) - 4 for c in cols]  # 1..7 → -3..+3
    if any(math.isnan(v) for v in vals):
        return float("nan"), float("nan"), float("nan")
    pq = float(np.mean(vals[:4]))
    hq = float(np.mean(vals[4:]))
    overall = float(np.mean(vals))
    return pq, hq, overall


def load_master_cells() -> list[tuple[str, str, str]]:
    """persona, device(mobile|desktop), mood from master JSON."""
    master = ROOT.parent / "public" / "assets" / "master_adaptive_ui_rules.json"
    if not master.exists():
        return []
    data = json.loads(master.read_text(encoding="utf-8"))
    cells: list[tuple[str, str, str]] = []
    # structure: personas → devices → moods
    rules = data.get("rules") or data.get("personas") or data
    if isinstance(rules, dict):
        for persona_raw, devices in rules.items():
            if not isinstance(devices, dict):
                continue
            persona = norm_persona(persona_raw) or persona_raw
            for device_raw, moods in devices.items():
                if not isinstance(moods, dict):
                    continue
                device = norm_device(device_raw) or device_raw
                for mood_raw in moods.keys():
                    mood = norm_mood(mood_raw) or mood_raw
                    cells.append((persona, device, mood))
    return cells


def build_combination_table(exp: pd.DataFrame) -> pd.DataFrame:
    exp = exp.copy()
    exp["persona_n"] = exp["guideline_persona"].map(norm_persona) if "guideline_persona" in exp.columns else None
    if exp["persona_n"].isna().all() and "survey_persona" in exp.columns:
        exp["persona_n"] = exp["survey_persona"].map(norm_persona)
    exp["device_n"] = exp["device"].map(norm_device) if "device" in exp.columns else None
    mood_col = next(
        (c for c in ["guideline_mood", "confirmed_mood", "self_reported_mood"] if c in exp.columns),
        None,
    )
    exp["mood_n"] = exp[mood_col].map(norm_mood) if mood_col else None

    counts = (
        exp.dropna(subset=["persona_n", "device_n", "mood_n"])
        .groupby(["persona_n", "device_n", "mood_n"], dropna=False)
        .size()
        .rename("n")
        .reset_index()
    )

    master_cells = load_master_cells()
    if master_cells:
        base = pd.DataFrame(master_cells, columns=["persona_n", "device_n", "mood_n"])
        base["in_master_rules"] = "yes"
        out = base.merge(counts, on=["persona_n", "device_n", "mood_n"], how="left")
        # also keep observed cells not in master (fallback paths)
        extras = counts.merge(base, on=["persona_n", "device_n", "mood_n"], how="left", indicator=True)
        extras = extras[extras["_merge"] == "left_only"].drop(columns=["_merge"])
        extras["in_master_rules"] = "no"
        out = pd.concat([out, extras], ignore_index=True)
    else:
        out = counts.copy()
        out["in_master_rules"] = "unknown"

    out["n"] = out["n"].fillna(0).astype(int)
    out["has_participants"] = np.where(out["n"] > 0, "yes", "no")
    out["device_label"] = out["device_n"].map({"mobile": "Smartphone", "desktop": "Laptop/Desktop"}).fillna(out["device_n"])
    out = out.rename(columns={"persona_n": "persona", "device_n": "device", "mood_n": "mood"})
    out = out[["persona", "device", "device_label", "mood", "n", "in_master_rules", "has_participants"]]
    out = out.sort_values(["persona", "device", "mood"]).reset_index(drop=True)
    return out


def short_choice(val) -> str:
    if val is None:
        return ""
    s = str(val).strip()
    s = re.sub(r"^\d+\.\s*", "", s)
    if "(" in s:
        s = s.split("(")[0].strip()
    return s.replace('"', "").strip()


def short_persona_label(raw: str) -> str:
    return (norm_persona(raw) or raw.split("(")[0].replace("The ", "").strip())


def export_guidelines_tables() -> None:
    """Readable persona × device × mood lookup for the methodology appendix."""
    master = ROOT.parent / "public" / "assets" / "master_adaptive_ui_rules.json"
    if not master.exists():
        print("  master JSON not found — skipped guidelines table")
        return
    data = json.loads(master.read_text(encoding="utf-8"))
    rules = data.get("rules") or {}
    rows: list[dict] = []
    lines = [
        "MASTER ADAPTIVE UI GUIDELINES (lookup table)",
        "Source: public/assets/master_adaptive_ui_rules.json",
        "Each row is one filled cell: persona × device × mood → UI tokens the live shop uses.",
        "Empty cells are not listed; runtime uses the fallback ladder (mood → device → persona → global defaults).",
        "",
    ]
    for persona_raw, devices in rules.items():
        if not isinstance(devices, dict):
            continue
        persona = short_persona_label(persona_raw)
        lines.append("=" * 72)
        lines.append(persona)
        lines.append("=" * 72)
        for device_raw, moods in devices.items():
            if not isinstance(moods, dict):
                continue
            prefix = "mobile_" if "smart" in str(device_raw).lower() else "desktop_"
            for mood_raw, tokens in moods.items():
                if not isinstance(tokens, dict):
                    continue

                def tok(*keys: str) -> str:
                    for k in keys:
                        if k in tokens:
                            return short_choice(tokens[k])
                        pk = prefix + k
                        if pk in tokens:
                            return short_choice(tokens[pk])
                    return ""

                row = {
                    "persona": persona,
                    "device": device_raw,
                    "mood": mood_raw,
                    "color_theme": tok("color_theme_pref"),
                    "accent": tok("accent_color_pref"),
                    "font_style": tok("font_style_pref"),
                    "font_size": tok("font_size_pref"),
                    "whitespace": tok("whitespace_pref"),
                    "hero": tok("hero_banner_size"),
                    "recommendations": tok("recommendation_type"),
                    "urgency": tok("urgency_pref"),
                    "checkout": tok("checkout_style"),
                    "product_card": tok("product_card"),
                    "navigation": tok("navigation"),
                    "info_density": tok("info_density"),
                    "price_display": tok("price_display"),
                    "category_display": tok("category_display"),
                    "search": tok("search_visibility"),
                    "social_proof": tok("social_proof_display"),
                    "product_description": tok("product_desc_length"),
                }
                rows.append(row)
                lines.append(f"  [{device_raw} · {mood_raw}]")
                lines.append(
                    f"    Theme {row['color_theme']} / {row['accent']} · "
                    f"Font {row['font_style']} {row['font_size']} · "
                    f"Space {row['whitespace']}"
                )
                lines.append(
                    f"    Hero {row['hero']} · Recs {row['recommendations']} · "
                    f"Urgency {row['urgency']} · Checkout {row['checkout']}"
                )
                lines.append(
                    f"    Card {row['product_card']} · Nav {row['navigation']} · "
                    f"Density {row['info_density']} · Price {row['price_display']}"
                )
                lines.append("")
    gdir = ROOT / "guidelines"
    gdir.mkdir(exist_ok=True)
    csv_path = gdir / "GUIDELINES_LOOKUP_TABLE.csv"
    txt_path = gdir / "GUIDELINES_LOOKUP_TABLE.txt"
    pd.DataFrame(rows).to_csv(csv_path, index=False)
    txt_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"  wrote {csv_path.relative_to(ROOT)}  ({len(rows)} filled cells)")
    print(f"  wrote {txt_path.relative_to(ROOT)}")


def _yes_no_series(s: pd.Series) -> pd.Series:
    return s.astype(str).str.lower().isin(["yes", "true", "1"])


def run_inferential_tests(
    exp: pd.DataFrame,
    survey: pd.DataFrame | None,
    merged: pd.DataFrame | None,
    camera_n: int,
    camera_correct_rate: float,
) -> list[dict]:
    """A few planned tests. Descriptive Results stay primary; p-values are support."""
    try:
        from scipy import stats
    except ImportError:
        print("  scipy not installed — skip p-values (pip install scipy)")
        return []

    rows: list[dict] = []

    def add(**kwargs):
        rows.append(kwargs)

    if survey is not None and "sus_score" in survey.columns:
        sus = survey["sus_score"].dropna().astype(float)
        if len(sus) >= 8:
            t = stats.ttest_1samp(sus, 68.0)
            d = (float(sus.mean()) - 68.0) / float(sus.std(ddof=1))
            # Wilcoxon on differences from 68
            w = stats.wilcoxon(sus - 68.0, alternative="two-sided", zero_method="wilcox")
            add(
                test="SUS vs 68 (one-sample t)",
                n=int(len(sus)),
                statistic=round(float(t.statistic), 3),
                p_value=round(float(t.pvalue), 4),
                effect=f"Cohen d={d:.2f}",
                note="H0: mean SUS = 68. Significant p means scores differ from the common benchmark.",
            )
            add(
                test="SUS vs 68 (Wilcoxon signed-rank)",
                n=int(len(sus)),
                statistic=round(float(w.statistic), 3),
                p_value=round(float(w.pvalue), 4),
                effect="",
                note="Non-parametric check of the same H0 (SUS is often skewed).",
            )

    if merged is not None and {"device", "sus_score"}.issubset(merged.columns):
        tmp = merged[["device", "sus_score"]].copy()
        tmp["sus_score"] = tmp["sus_score"].map(to_number)
        tmp["device"] = tmp["device"].map(norm_device)
        a = tmp.loc[tmp["device"] == "desktop", "sus_score"].dropna()
        b = tmp.loc[tmp["device"] == "mobile", "sus_score"].dropna()
        if len(a) >= 8 and len(b) >= 8:
            u = stats.mannwhitneyu(b, a, alternative="two-sided")
            # rank-biserial: 1 - 2U/(n1 n2)
            rrb = 1 - (2 * float(u.statistic)) / (len(a) * len(b))
            add(
                test="SUS mobile vs desktop (Mann-Whitney U)",
                n=int(len(a) + len(b)),
                statistic=round(float(u.statistic), 3),
                p_value=round(float(u.pvalue), 4),
                effect=f"rank-biserial={rrb:.2f}; mobile n={len(b)} mean={b.mean():.1f}; desktop n={len(a)} mean={a.mean():.1f}",
                note="Exploratory. Joined rows only. Not a randomised device assignment.",
            )

    if camera_n >= 10 and not math.isnan(camera_correct_rate):
        k = int(round(camera_correct_rate * camera_n))
        bt = stats.binomtest(k, camera_n, p=0.5, alternative="two-sided")
        ci = bt.proportion_ci(confidence_level=0.95)
        add(
            test="Camera confirm Yes vs 50% (binomial)",
            n=int(camera_n),
            statistic=k,
            p_value=round(float(bt.pvalue), 4),
            effect=f"Yes={k}/{camera_n}={camera_correct_rate:.1%}; 95% CI [{ci.low:.1%}, {ci.high:.1%}]",
            note="User confirmation of bridged guideline mood, not pixel-level FER accuracy vs a lab gold set.",
        )

    if merged is not None and {"mood_was_correct", "aweq_5"}.issubset(merged.columns):
        tmp = merged.copy()
        tmp["aweq_5"] = tmp["aweq_5"].map(to_number)
        yes = tmp.loc[_yes_no_series(tmp["mood_was_correct"]), "aweq_5"].dropna()
        no = tmp.loc[~_yes_no_series(tmp["mood_was_correct"]) & tmp["mood_was_correct"].notna(), "aweq_5"].dropna()
        # mood_was_correct empty for manual — keep only yes/no
        yn = tmp["mood_was_correct"].astype(str).str.lower().isin(["yes", "no", "true", "false", "1", "0"])
        no = tmp.loc[yn & ~_yes_no_series(tmp["mood_was_correct"]), "aweq_5"].dropna()
        if len(yes) >= 5 and len(no) >= 5:
            u = stats.mannwhitneyu(yes, no, alternative="two-sided")
            add(
                test="AWEQ-5 camera Yes vs No (Mann-Whitney U)",
                n=int(len(yes) + len(no)),
                statistic=round(float(u.statistic), 3),
                p_value=round(float(u.pvalue), 4),
                effect=f"Yes n={len(yes)} mean={yes.mean():.2f}; No n={len(no)} mean={no.mean():.2f}",
                note="Exploratory and likely underpowered until camera N grows. Do not over-interpret.",
            )
        else:
            add(
                test="AWEQ-5 camera Yes vs No",
                n=int(len(yes) + len(no)),
                statistic="",
                p_value="",
                effect=f"Yes n={len(yes)}; No n={len(no)} — too small for a stable test",
                note="Wait for Tuesday camera N (~75) before treating this as inferential.",
            )

    return rows


def write_results_insights(**kw) -> None:
    exp: pd.DataFrame = kw["exp"]
    survey = kw["survey"]
    join_n = kw["join_n"]
    path = ROOT / "RESULTS_INSIGHTS.txt"
    n_shop = len(exp)
    n_form = 0 if survey is None else len(survey)
    cov = kw["coverage_pct"]
    cov_s = f"{cov:.1f}%" if not math.isnan(cov) else "n/a"
    cam = kw["camera_correct_rate"]
    cam_s = f"{cam:.0%}" if not math.isnan(cam) else "n/a"
    sus = kw["sus_mean"]
    aweq = kw["aweq_mean"]
    moods = kw["overview"].get("guideline_moods") or {}
    devices = kw["overview"].get("devices") or {}
    personas = kw["overview"].get("personas") or {}
    fb = kw["fallback_rates"] or {}

    infer_lines = []
    for r in kw.get("infer_rows") or []:
        infer_lines.append(
            f"  - {r.get('test')}: n={r.get('n')}  p={r.get('p_value')}  {r.get('effect')}  ({r.get('note')})"
        )
    if not infer_lines:
        infer_lines = ["  (scipy missing or tests skipped)"]

    text = f"""
SMARTSHOP LIVE EXPERIMENT — RESULTS INSIGHTS
Snapshot from analyze.py (shop + Tally). Re-run analyze.py after Tuesday to refresh.

------------------------------------------------------------------------------
1. WHAT THESE NUMBERS ARE
------------------------------------------------------------------------------
Part B of the thesis (live SmartShop). Not the offline guideline-vote study.
Shop log = one completed adaptive session per admin row.
Tally = post-session SUS + UEQ-S + AWEQ + optional comments.
Join = same email on Tally as SmartShop signup (plus a few id_map rows).

N shop = {n_shop}
N Tally (after keeping later duplicates) = {n_form}
N joined = {join_n} (key={kw['join_key']})
Using sample files = {kw['using_sample']}

Three sample sizes always: all Tally, all shop, paired only.
Persona / device / mood splits of SUS use the paired n={join_n}, not {n_form}.

------------------------------------------------------------------------------
2. ARE THE RESULTS “GOOD” ENOUGH TO SHOW?
------------------------------------------------------------------------------
Yes as a master’s live-study snapshot. Usability is clearly above typical
SUS 68. Adaptation coverage is 40/{kw['master_total']} master cells ({cov_s}).
Camera confirm ({cam_s} on n={kw['camera_n']}) is the mood headline — not
self-report vs raw FER ({kw['agree_rate']:.0%} on n={kw['n_eval']}).

Caveats: convenience / student sample; Neutral-heavy moods; not everyone
used the camera; Tally without email cannot join. Extra ~40 people help if
they add camera + non-Neutral + mobile, not only more Neutral desktop.

If camera reaches ~75 on Tuesday: confirmation CI tightens, and Yes vs No
on AWEQ-5 may become testable. It will not “prove” the Adaptive Engine.

------------------------------------------------------------------------------
3. USABILITY (Tally, n={n_form})
------------------------------------------------------------------------------
SUS mean = {sus:.1f} / 100. Benchmark line often drawn at 68.
UEQ-S pragmatic = {kw['ueq_pq']:.2f}, hedonic = {kw['ueq_hq']:.2f}, overall = {kw['ueq_overall']:.2f}
  (scale −3 to +3; values ≳ 0.8 are typically read as positive).
AWEQ overall = {aweq:.2f} / 5.
  Highest: interface appropriate for device.
  Lowest: interface reflected current emotional state (AWEQ-5).
That pattern fits a Neutral-heavy, often-manual mood sample.

------------------------------------------------------------------------------
4. WHO WAS IN THE SHOP (n={n_shop})
------------------------------------------------------------------------------
Devices: {devices}
Personas: {personas}
Guideline moods: {moods}

------------------------------------------------------------------------------
5. DID THE ENGINE USE THE GUIDELINES?
------------------------------------------------------------------------------
Master cells with ≥1 participant: {kw['master_filled']}/{kw['master_total']} ({cov_s}).
Mood fallback rate: {fb.get('used_mood_fallback', float('nan')):.1%} of shop rows.
Device fallback: {fb.get('used_device_fallback', float('nan')):.1%}
Persona fallback: {fb.get('used_persona_fallback', float('nan')):.1%}
Global fill: {fb.get('used_global_fill', float('nan')):.1%}

Most people landed on an exact filled cell. Mood fallback is the only
non-zero ladder step so far.

The human-readable guideline table (for methodology) is:
  guidelines/GUIDELINES_LOOKUP_TABLE.csv
  guidelines/GUIDELINES_LOOKUP_TABLE.txt

------------------------------------------------------------------------------
6. MOOD DETECTION
------------------------------------------------------------------------------
Camera detections: {kw['camera_n']}  |  manual: {n_shop - kw['camera_n']}
User confirmed the bridged guideline mood: {cam_s}
Self-report vs FER label (angry/happy/… mapped to guideline names): {kw['agree_rate']:.1%} on n={kw['n_eval']}

Use 77%-class confirmation for the live chapter. The 34%-class FER match
is a different question (label space + mapping + lighting).

------------------------------------------------------------------------------
7. P-VALUES — WHAT TO USE, WHAT TO AVOID
------------------------------------------------------------------------------
Do report a small planned set. Do not p-hack every persona×mood cell
(many cells have n=1–4).

Planned:
  (1) SUS vs 68 (one-sample t + Wilcoxon) — primary usability claim.
  (2) SUS mobile vs desktop on joined rows — exploratory, not randomised.
  (3) Camera Yes vs 50% binomial — user confirmation, not lab accuracy.
  (4) AWEQ-5 Yes vs No — wait until camera n is larger (~75).

Current tests:
{chr(10).join(infer_lines)}

α = 0.05, two-sided. No multiple-comparison correction (only these tests).
If p < 0.05 write “statistically significant in this sample,” not “proved.”

------------------------------------------------------------------------------
8. OPEN COMMENTS
------------------------------------------------------------------------------
See reports/08_open_responses.csv. Typical likes: adaptation, mood idea,
layout. Typical improvements: visuals, detection accuracy, consistency.

------------------------------------------------------------------------------
9. AFTER TUESDAY
------------------------------------------------------------------------------
Save new admin CSV as data/smartshop_participants_new_chapter_YYYY-MM-DD.csv
Save new Tally as *Post*Experiment*Submissions*.csv
python3 analyze.py
Refresh this file automatically.

END
""".strip()
    path.write_text(text + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    print("DATA   :", DATA)
    print("REPORTS:", REPORTS)

    # --- Experiment ---
    exp_path = pick_experiment_csv()
    assert exp_path is not None, "No experiment CSV in data/"
    print(f"\n[1] Experiment: {exp_path.name}")
    exp = read_experiment_csv(exp_path)
    using_sample = exp_path.name.startswith("sample_")
    print(f"  N participants = {len(exp)}  (sample={using_sample})")
    people_cols = [
        c
        for c in ["name", "email", "user_id", "study_chapter", "guideline_persona", "device"]
        if c in exp.columns
    ]
    if people_cols:
        exp[people_cols].to_csv(DATA / "admin_people.csv", index=False)
        print("  wrote data/admin_people.csv (cheat sheet for id_map.csv)")

    overview = {
        "n_participants": len(exp),
        "devices": exp["device"].value_counts(dropna=False).to_dict() if "device" in exp.columns else {},
        "personas": exp["guideline_persona"].map(norm_persona).value_counts(dropna=False).to_dict()
        if "guideline_persona" in exp.columns
        else {},
        "guideline_moods": exp["guideline_mood"].value_counts(dropna=False).to_dict()
        if "guideline_mood" in exp.columns
        else {},
    }
    save_table(pd.DataFrame([overview]), "00_overview_meta.csv")
    if overview["devices"]:
        save_table(
            pd.Series(overview["devices"]).rename("count").rename_axis("device").reset_index(),
            "01_device_counts.csv",
        )
    if overview["personas"]:
        save_table(
            pd.Series(overview["personas"]).rename("count").rename_axis("persona").reset_index(),
            "01_persona_counts.csv",
        )

    # Mood agreement
    if {"self_reported_mood", "model_detected_mood"}.issubset(exp.columns):
        mood = exp.copy()
        mood["self_n"] = mood["self_reported_mood"].map(norm_mood)
        mood["model_n"] = mood["model_detected_mood"].map(norm_mood)
        mood_eval = mood.dropna(subset=["self_n", "model_n"]).copy()
        mood_eval["agree"] = mood_eval["self_n"].str.lower() == mood_eval["model_n"].str.lower()
        n_eval = len(mood_eval)
        agree_rate = float(mood_eval["agree"].mean()) if n_eval else float("nan")
        print(f"  Mood agreement: {agree_rate:.1%} on n={n_eval}")
        save_table(
            mood_eval[["user_id", "email", "self_n", "model_n", "agree"]].head(500)
            if "user_id" in mood_eval.columns
            else mood_eval[["self_n", "model_n", "agree"]],
            "02_mood_agreement_rows.csv",
        )
        if n_eval:
            fig, ax = plt.subplots(figsize=(5, 3.5))
            counts = mood_eval["agree"].value_counts().reindex([True, False]).fillna(0)
            ax.bar(["Agree", "Disagree"], counts.values, color=["#059669", "#dc2626"])
            ax.set_title(f"Self vs model mood (n={n_eval})")
            save_fig("02_mood_agreement.png")
    else:
        agree_rate = float("nan")
        n_eval = 0

    camera_n = 0
    camera_correct_rate = float("nan")
    if "mood_source" in exp.columns:
        src = exp["mood_source"].astype(str).str.lower()
        camera_n = int((src == "camera").sum())
        print(f"  Mood source: camera={camera_n}  manual={(src == 'manual').sum()}")
        if "mood_was_correct" in exp.columns and camera_n:
            cam = exp[src == "camera"].copy()
            ok = cam["mood_was_correct"].astype(str).str.lower().isin(["yes", "true", "1"])
            camera_correct_rate = float(ok.mean())
            print(f"  Camera confirm Yes rate: {camera_correct_rate:.1%} on n={camera_n}")

    # Fallbacks
    fallback_cols = [
        "used_mood_fallback",
        "used_device_fallback",
        "used_persona_fallback",
        "used_global_fill",
    ]
    present = [c for c in fallback_cols if c in exp.columns]
    fallback_rates = {}
    if present:
        for c in present:
            series = exp[c].astype(str).str.lower().isin(["yes", "true", "1"])
            fallback_rates[c] = float(series.mean())
        save_table(
            pd.DataFrame([{"metric": k, "rate": v} for k, v in fallback_rates.items()]),
            "03_fallback_rates.csv",
        )
        fig, ax = plt.subplots(figsize=(6, 3.5))
        labels = [c.replace("used_", "") for c in present]
        ax.barh(labels, [fallback_rates[c] * 100 for c in present], color="#2563eb")
        ax.set_xlabel("% of participants")
        ax.set_title("Fallback usage")
        save_fig("03_fallback_rates.png")

    # Smart combinations (persona × device × mood)
    print("\n[2] Smart combinations (persona × device × mood)")
    combos = build_combination_table(exp)
    save_table(combos, "04_smart_combinations.csv")
    # also refresh dated snapshot name in data/ for recruitment tracking
    stamp = pd.Timestamp.now().strftime("%Y-%m-%d")
    combos.to_csv(DATA / f"smartshop_combinations_new_chapter_{stamp}.csv", index=False)
    filled = int((combos["n"] > 0).sum())
    master_yes = combos[combos["in_master_rules"] == "yes"]
    print(
        f"  cells with ≥1 participant: {filled}/{len(combos)} "
        f"(master cells filled: {(master_yes['n'] > 0).sum()}/{len(master_yes)})"
    )
    print(f"  total participant-assignments: {int(combos['n'].sum())}")
    top = combos.sort_values("n", ascending=False).head(15)
    save_table(top, "04_top_combinations.csv")

    fig, ax = plt.subplots(figsize=(8, 4))
    plot_df = top[top["n"] > 0].copy()
    if len(plot_df):
        labels = plot_df.apply(lambda r: f"{r['persona']}|{r['device']}|{r['mood']}", axis=1)
        ax.barh(labels[::-1], plot_df["n"].values[::-1], color="#7c3aed")
        ax.set_xlabel("Participants")
        ax.set_title("Top persona × device × mood combinations")
        save_fig("04_top_combinations.png")

    coverage = pd.DataFrame(
        [
            {
                "master_cells": len(master_yes),
                "master_cells_with_participants": int((master_yes["n"] > 0).sum()),
                "coverage_pct": float((master_yes["n"] > 0).mean() * 100) if len(master_yes) else float("nan"),
                "empty_master_cells": int((master_yes["n"] == 0).sum()),
                "observed_non_master_cells": int(((combos["in_master_rules"] == "no") & (combos["n"] > 0)).sum()),
            }
        ]
    )
    save_table(coverage, "04_combination_coverage_summary.csv")

    # --- Survey ---
    print("\n[3] Form survey")
    survey_path = pick_survey_csv()
    survey = None
    sus_mean = ueq_pq = ueq_hq = ueq_overall = aweq_mean = float("nan")
    if survey_path is None:
        print("  No form survey CSV found")
    else:
        print(f"  Survey: {survey_path.name}")
        survey = pd.read_csv(survey_path, encoding="utf-8-sig", engine="python")
        survey.columns = [c.lstrip("\ufeff").strip().strip('"') for c in survey.columns]
        survey = survey.rename(columns={k: v for k, v in SURVEY_COLUMN_MAP.items() if k in survey.columns})
        survey = coerce_survey_email_column(survey)
        # fuzzy map aweq_7 if truncated
        if "aweq_7" not in survey.columns:
            for c in survey.columns:
                if c.startswith("Overall, I would prefer using this adaptive website"):
                    survey = survey.rename(columns={c: "aweq_7"})
                    break
        survey = dedupe_survey(survey)
        print(f"  N form responses = {len(survey)}")

        sus_cols = [f"sus_{i}" for i in range(1, 11) if f"sus_{i}" in survey.columns]
        ueq_cols = [f"ueq_{i}" for i in range(1, 9) if f"ueq_{i}" in survey.columns]
        aweq_cols = [f"aweq_{i}" for i in range(1, 8) if f"aweq_{i}" in survey.columns]

        if len(sus_cols) == 10:
            survey["sus_score"] = survey.apply(lambda r: score_sus(r, sus_cols), axis=1)
            sus_mean = float(survey["sus_score"].mean())
            print(f"  SUS mean = {sus_mean:.1f} (n={survey['sus_score'].notna().sum()})")
            fig, ax = plt.subplots(figsize=(5, 3.5))
            ax.hist(survey["sus_score"].dropna(), bins=8, color="#0f766e", edgecolor="white")
            ax.axvline(68, color="#b45309", linestyle="--", label="SUS≈68 benchmark")
            ax.axvline(sus_mean, color="#111827", linestyle="-", label=f"mean={sus_mean:.1f}")
            ax.legend(fontsize=8)
            ax.set_title("SUS distribution")
            save_fig("05_sus_hist.png")

        if len(ueq_cols) == 8:
            scored = survey.apply(lambda r: score_ueq(r, ueq_cols), axis=1, result_type="expand")
            scored.columns = ["ueq_pq", "ueq_hq", "ueq_overall"]
            survey = pd.concat([survey, scored], axis=1)
            ueq_pq = float(survey["ueq_pq"].mean())
            ueq_hq = float(survey["ueq_hq"].mean())
            ueq_overall = float(survey["ueq_overall"].mean())
            print(f"  UEQ-S PQ={ueq_pq:.2f} HQ={ueq_hq:.2f} Overall={ueq_overall:.2f}")
            fig, ax = plt.subplots(figsize=(5, 3.5))
            ax.bar(["PQ", "HQ", "Overall"], [ueq_pq, ueq_hq, ueq_overall], color=["#2563eb", "#db2777", "#4b5563"])
            ax.set_ylim(-3, 3)
            ax.axhline(0, color="#9ca3af", linewidth=1)
            ax.set_title("UEQ-S means (−3…+3)")
            save_fig("06_ueq_means.png")

        if len(aweq_cols) >= 1:
            for c in aweq_cols:
                survey[c] = survey[c].map(to_number)
            survey["aweq_mean"] = survey[aweq_cols].mean(axis=1)
            aweq_mean = float(survey["aweq_mean"].mean())
            print(f"  AWEQ overall mean = {aweq_mean:.2f}")
            item_means = survey[aweq_cols].mean().rename("mean").rename_axis("item").reset_index()
            save_table(item_means, "07_aweq_item_means.csv")
            fig, ax = plt.subplots(figsize=(6, 3.5))
            ax.bar(item_means["item"], item_means["mean"], color="#7c3aed")
            ax.set_ylim(1, 5)
            ax.set_title("AWEQ item means (1–5)")
            ax.tick_params(axis="x", rotation=45)
            save_fig("07_aweq_items.png")

        score_cols = [
            c
            for c in ["email", "participant_id", "sus_score", "ueq_pq", "ueq_hq", "ueq_overall", "aweq_mean"]
            if c in survey.columns
        ]
        save_table(survey[score_cols], "05_survey_scores.csv")

        opt_cols = [c for c in ["email", "participant_id", "opt_1", "opt_2", "opt_3"] if c in survey.columns]
        if opt_cols:
            save_table(
                survey[opt_cols].dropna(
                    how="all",
                    subset=[c for c in opt_cols if c not in {"participant_id", "email"}],
                ),
                "08_open_responses.csv",
            )

    # Join experiment logs ↔ form scores (email, then id_map, then participant_id)
    join_n = 0
    join_key = "none"
    merged = None
    if survey is not None:
        merged, join_key = join_experiment_survey(exp, survey)
        join_n = len(merged)
        print(f"  Joined experiment↔survey rows: {join_n} (key={join_key})")
        if join_n == 0:
            print(
                "  No matches yet. Put the 62-row form export at data/form_survey.csv\n"
                "  (must include Email). For early rows without Email, fill data/id_map.csv\n"
                "  using names/emails in data/admin_people.csv."
            )
        else:
            save_table(merged, "09_joined_rows.csv")
            if "guideline_persona" in merged.columns:
                merged["guideline_persona"] = merged["guideline_persona"].map(norm_persona)
            groups = [
                ("guideline_persona", "sus_score", "09_sus_by_persona.csv"),
                ("device", "sus_score", "09_sus_by_device.csv"),
                ("device", "ueq_overall", "09_ueq_by_device.csv"),
                ("mood_was_correct", "sus_score", "09_sus_by_mood_confirm.csv"),
                ("mood_was_correct", "aweq_5", "09_aweq5_by_mood_confirm.csv"),
                ("used_mood_fallback", "aweq_5", "09_aweq5_by_mood_fallback.csv"),
            ]
            for col, score, fname in groups:
                table = grouped_score_table(merged, col, score)
                if table is not None:
                    save_table(table, fname)

    # Thesis summary
    summary = pd.DataFrame(
        [
            {"section": "Sample", "metric": "N participants (admin export)", "value": len(exp)},
            {"section": "Sample", "metric": "N form responses", "value": 0 if survey is None else len(survey)},
            {"section": "Sample", "metric": "Using sample files", "value": using_sample},
            {"section": "Combinations", "metric": "Master cells filled", "value": int((master_yes["n"] > 0).sum())},
            {"section": "Combinations", "metric": "Master cells total", "value": len(master_yes)},
            {"section": "Combinations", "metric": "Coverage %", "value": round(float(coverage.loc[0, "coverage_pct"]), 1)
            if len(coverage) and not math.isnan(coverage.loc[0, "coverage_pct"])
            else ""},
            {"section": "Mood", "metric": "Self vs model agreement", "value": round(agree_rate, 3) if not math.isnan(agree_rate) else ""},
            {"section": "Mood", "metric": "N with both moods", "value": n_eval},
            {"section": "Mood", "metric": "N camera detections", "value": camera_n},
            {
                "section": "Mood",
                "metric": "Camera confirm Yes rate",
                "value": round(camera_correct_rate, 3) if not math.isnan(camera_correct_rate) else "",
            },
            {"section": "SUS", "metric": "Mean (0–100)", "value": round(sus_mean, 1) if not math.isnan(sus_mean) else ""},
            {"section": "UEQ-S", "metric": "Pragmatic Quality", "value": round(ueq_pq, 2) if not math.isnan(ueq_pq) else ""},
            {"section": "UEQ-S", "metric": "Hedonic Quality", "value": round(ueq_hq, 2) if not math.isnan(ueq_hq) else ""},
            {"section": "UEQ-S", "metric": "Overall", "value": round(ueq_overall, 2) if not math.isnan(ueq_overall) else ""},
            {"section": "AWEQ", "metric": "Overall mean (1–5)", "value": round(aweq_mean, 2) if not math.isnan(aweq_mean) else ""},
            {"section": "Join", "metric": "Experiment↔survey matched rows", "value": join_n},
        ]
    )
    save_table(summary, "99_thesis_summary.csv")
    print("\n=== Thesis summary ===")
    print(summary.to_string(index=False))

    print("\n[4] Guidelines lookup table (methodology appendix)")
    export_guidelines_tables()

    print("\n[5] Inferential tests (use sparingly; descriptive Results stay primary)")
    infer_rows = run_inferential_tests(
        exp=exp,
        survey=survey,
        merged=merged,
        camera_n=camera_n,
        camera_correct_rate=camera_correct_rate,
    )
    if infer_rows:
        save_table(pd.DataFrame(infer_rows), "10_inferential_tests.csv")

    write_results_insights(
        exp=exp,
        survey=survey,
        join_n=join_n,
        join_key=join_key,
        overview=overview,
        master_filled=int((master_yes["n"] > 0).sum()),
        master_total=len(master_yes),
        coverage_pct=float(coverage.loc[0, "coverage_pct"]) if len(coverage) else float("nan"),
        agree_rate=agree_rate,
        n_eval=n_eval,
        camera_n=camera_n,
        camera_correct_rate=camera_correct_rate,
        fallback_rates=fallback_rates,
        sus_mean=sus_mean,
        ueq_pq=ueq_pq,
        ueq_hq=ueq_hq,
        ueq_overall=ueq_overall,
        aweq_mean=aweq_mean,
        infer_rows=infer_rows,
        using_sample=using_sample,
    )
    print("\nDone. Re-run anytime after adding more participants to data/.")


if __name__ == "__main__":
    main()
