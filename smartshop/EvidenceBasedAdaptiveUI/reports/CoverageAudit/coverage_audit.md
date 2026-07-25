# Data Coverage Audit

## Bottom line

The survey has **complete UI answers** (no missing UI fields), but **full Persona + Mood + Device combinations are often too small** to support a complete evidence-based UI profile.

- Respondents: **200**
- UI elements measured: **41**
- Full Persona×Mood×Device cells: **59** (Sufficient=3, Borderline=10, Insufficient=46)
- Median respondents per full cell: **2**

## How to read the labels

- **Sufficient** — at least 10 respondents in that context. Safe to mine association rules and claim a UI preference.
- **Borderline** — 5–9 respondents. Usable with caution; expect thin / incomplete profiles.
- **Insufficient** — fewer than 5 respondents. Do **not** claim a full evidence-backed UI for this exact context.

## What this means for the website

- Coarse contexts (e.g. Persona only) look healthy: 6/6 Sufficient.
- Fine contexts (Persona×Mood×Device) are mostly sparse — this is why many JSON base profiles have only a few UI keys.
- Recommended website strategy: **default UI + partial base profile + trait nudges**, not “every context has a complete custom interface”.

## UI preference signal

- UI elements where one answer dominates (≥70%): **5**
- Dominated elements are hard to adapt because almost everyone chose the same option.

## Grain-by-grain verdict

- **Persona**: Good — most cells have enough respondents (Sufficient 6/6, median n=29)
- **Mood**: Good — most cells have enough respondents (Sufficient 6/8, median n=18)
- **Device**: Good — most cells have enough respondents (Sufficient 2/2, median n=100)
- **Persona×Mood**: Weak — most cells are too small for full UI profiles (Sufficient 5/39, median n=4)
- **Persona×Device**: Partial — usable for some contexts, sparse for others (Sufficient 8/12, median n=16)
- **Mood×Device**: Partial — usable for some contexts, sparse for others (Sufficient 6/16, median n=6)
- **Persona×Mood×Device**: Weak — most cells are too small for full UI profiles (Sufficient 3/59, median n=2)