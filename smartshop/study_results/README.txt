================================================================================
STUDY RESULTS — analysis folder
================================================================================

Purpose
  Draft Results-chapter analysis for the SmartShop evaluation study.
  Uses the admin experiment CSV + one Google Form export
  (Participant ID → SUS → UEQ-S → AWEQ + optional),
  aligned with STUDY_EVALUATION_FORMS.txt.

Layout
  data/          Place exports here (see data/README.txt)
  notebooks/     Jupyter analysis notebooks
  reports/       Tables / figures written by the notebook

Main notebook
  notebooks/01_Study_Results_Analysis.ipynb

Python env (fixes “Import pandas could not be resolved”)
  requirements.txt + local .venv (already set up via pyrightconfig.json)
  Select interpreter in Cursor:
    study_results/.venv/bin/python
  Or notebook kernel:
    Python (study_results)

How to run (after the study)
  1. Download experiment CSV from SmartShop /admin →
       data/experiment_export.csv
  2. Export the single Google Form →
       data/form_survey.csv
  3. (Optional) Task outcomes → data/task_outcomes.csv
  4. Open the notebook, map Google headers in COLUMN_MAP if needed, Run All

Until real data exists, the notebook falls back to sample_* files.

Metrics covered
  - Participant / context overview
  - Mood agreement (self vs model)
  - Fallback rates (mood / device / persona / global fill)
  - Config diversity (themes, nav, cards, combinations)
  - SUS (official Brooke scoring → 0–100)
  - UEQ-S / UEQ-8 (PQ, HQ, overall; −3…+3)
  - AWEQ-1…7 means (adaptive experience)
  - Optional open responses (listed, not scored)
  - Task outcomes (cart / order), if joined
  - Thesis-ready summary tables + figure exports

Related docs
  ../STUDY_EVALUATION_FORMS.txt
  MATRIX_COVERAGE_APPENDIX.txt
  ../METHODOLOGY_AND_IMPLEMENTATION.txt

================================================================================
END
================================================================================
