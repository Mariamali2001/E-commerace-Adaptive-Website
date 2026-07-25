# Evidence-Based Adaptive UI

Master's thesis project: **Towards Intelligent Adaptive User Interfaces for E-Commerce based on Personality, Mood, Persona, and Device Context.**

Extract evidence-based adaptive UI guidelines from survey data. The LLM never decides UI adaptations — it only converts verified JSON guidelines into React components.

## Pipeline

```
Survey Responses
        ↓
Data Cleaning & Validation
        ↓
Exploratory Data Analysis
        ↓
Statistical Validation
        ↓
Feature Importance (Random Forest + SHAP)
        ↓
Association Rule Mining
        ↓
Evidence Scoring
        ↓
Verified Guideline JSON
        ↓
Context Builder (Personality + Mood + Persona + Device)
        ↓
LLM (Generates React UI code only)
        ↓
Adaptive E-commerce Website
```

## Project Structure

```
EvidenceBasedAdaptiveUI/
├── data/
│   ├── raw/                     # Original, immutable survey data
│   ├── processed/               # Cleaned and validated datasets
│   └── outputs/                 # Pipeline outputs (e.g. verified guidelines)
├── notebooks/                   # Main workflow (one step at a time)
│   ├── 01_Data_Cleaning.ipynb
│   ├── 02_Exploratory_Data_Analysis.ipynb
│   ├── 03_Statistical_Validation.ipynb
│   ├── 04_Feature_Importance.ipynb
│   ├── 05_Association_Rules.ipynb
│   ├── 06_Evidence_Scoring.ipynb
│   └── 07_Guideline_JSON.ipynb
├── reports/                     # Auto-exported CSV, Excel, PNG, Markdown
├── src/                         # Reusable functions only
│   ├── preprocessing/
│   ├── visualization/
│   ├── statistics/
│   ├── machine_learning/
│   ├── association_rules/
│   ├── evidence_engine/
│   ├── utils/
│   └── config.py
└── requirements.txt
```

## Development

- Python 3.11
- Notebooks drive the workflow; keep cells clean and delegate logic to `src/`
- Every notebook auto-saves exports to `reports/`
- Build incrementally — one notebook at a time

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Open **EvidenceBasedAdaptiveUI** as your workspace folder before running notebooks. The first code cell bootstraps `sys.path` so local imports like `from src...` work — do **not** run `pip install src` (that installs an unrelated PyPI package).
