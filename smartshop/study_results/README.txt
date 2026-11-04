================================================================================
STUDY RESULTS — SmartShop evaluation analysis
================================================================================

What this folder is
  Offline analysis for the thesis Results chapter.
  It joins (1) admin experiment runs from the live shop with (2) one Google Form
  post-study survey (SUS + UEQ-S + AWEQ + optional comments).

What we did (pipeline)
  1. Participants use SmartShop (browse → consent → questionnaire TIPI + persona
     + self-mood → mood check camera/manual → Adaptive Engine UI).
  2. Each completed run is saved in Mongo and exportable from /admin as CSV.
  3. After the session, participants fill one Google Form (evaluation scales).
  4. Here we run analyze.py to score the form, summarize experiment cells
     (persona × device × mood), mood agreement, fallbacks, and matrix coverage
     against public/assets/master_adaptive_ui_rules.json.

What we have now
  data/
    sample_experiment_export.csv   Draft/admin-style export (TIPI, moods,
                                   guideline mood, UI tokens, fallbacks, …)
    sample_form_survey.csv         Draft Google Form export (SUS / UEQ-S / AWEQ)
    smartshop_combinations_*.csv   Combination snapshot written by analyze.py
    README.txt                     Data file naming rules
  analyze.py                       One-command analysis (preferred)
  notebooks/01_Study_Results_Analysis.ipynb   Same logic, interactive
  reports/                         Tables + figures from the last run
  MATRIX_COVERAGE_APPENDIX.txt     Which persona×device×mood cells exist in master

What we do NOT use here
  - adaptive_ui_app EDA / majority-vote export (that built the guidelines offline)
  - Runtime LLM calls (analysis is CSV + JSON only)
  - task_outcomes.csv is optional and not present unless you add it

Quick start
  cd study_results
  python3 analyze.py
  → writes reports/ (overview, SUS/UEQ/AWEQ, mood agreement, combinations, …)

When real participants increase
  1. /admin → download CSV → save as data/experiment_export.csv
  2. Google Form → export CSV → save as data/form_survey.csv
  3. Re-run: python3 analyze.py
     (real filenames are preferred over sample_*)

What analyze.py produces (reports/)
  00_overview_meta.csv
  01_device_counts.csv / 01_persona_counts.csv
  02_mood_agreement_rows.csv (+ figure)
  03_fallback_rates.csv (+ figure)
  04_smart_combinations.csv / 04_top_combinations.csv /
      04_combination_coverage_summary.csv (+ figures)
  05_survey_scores.csv (SUS, UEQ-S PQ/HQ, AWEQ)
  07_aweq_item_means.csv (+ figure)
  08_open_responses.csv
  99_thesis_summary.csv
  figures/  PNG charts

Smart combinations
  Counts participants in each persona × device × mood cell and marks whether
  that cell exists in master_adaptive_ui_rules.json (in_master_rules yes/no).

Join key (form ↔ admin)
  Best: form Email = SmartShop signup email (admin column email).
  Early form rows with only Participant ID: fill data/id_map.csv.
  Survey scores still analyze without a merge; persona/device/mood
  comparisons need the join.

Python
  requirements.txt
  Optional: python3 -m venv .venv && source .venv/bin/activate
            && pip install -r requirements.txt

Related docs (repo)
  ../STUDY_EVALUATION_FORMS.txt
  ../METHODOLOGY_AND_IMPLEMENTATION.txt
  MATRIX_COVERAGE_APPENDIX.txt

================================================================================
END
================================================================================
