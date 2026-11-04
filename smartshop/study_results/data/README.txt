DATA FOLDER — study_results/data
================================================================================

Purpose
  Holds experiment + survey CSVs for analyze.py / the Results notebook.

Files we currently have
  sample_experiment_export.csv
    Admin-style export of completed SmartShop runs.
    Includes: demographics, survey persona, TIPI items + Big Five scores/levels,
    self-reported mood, camera mood (if used), bridged guideline mood,
    fallback flags, final UI tokens, guidelines_pipeline, timestamps.

  sample_form_survey.csv
    Early Google Form export (Participant ID codes, no Email).
    Newer exports should include Email (same as SmartShop signup).

  id_map.csv
    Historical join: participant_id → email.
    Fill email for old form rows using admin_people.csv.
    Rows that already have Email on the form do not need a map line.

  admin_people.csv
    Cheat sheet from the last admin-style export (name, email, user_id).
    Use this to fill id_map.csv. Replace it when you download a new
    experiment CSV.

  smartshop_combinations_new_chapter_YYYY-MM-DD.csv
    Auto-written by analyze.py.
    Columns: persona, device, device_label, mood, n, in_master_rules, has_participants

Real files (add when ready — preferred over sample_*)
  experiment_export.csv   ← download from /admin (new chapter)
  form_survey.csv         ← Google Form → CSV export (62+ rows with Email)
  id_map.csv              ← fill emails for pre-Email form IDs
  task_outcomes.csv       ← optional only (participant_id, reached_cart, placed_order)
                            Not required; omit if unused.

How analyze.py picks files
  Looks for experiment_export.csv then sample_experiment_export.csv
  Looks for form_survey.csv then sample_form_survey.csv

Join key
  1) form Email ↔ admin email (lowercased, trimmed)
  2) missing form Email filled from id_map.csv via Participant ID
  3) participant_id on both files (only if you add that column to admin)

Form columns after export
  analyze.py maps long Google Form headers via SURVEY_COLUMN_MAP.
  Short names used in scoring:
    sus_1 … sus_10
    ueq_1 … ueq_8
    aweq_1 … aweq_7
    opt_1, opt_2, opt_3

What this folder is not
  Not the offline guideline extractor (that is adaptive_ui_app/).
  Not live Mongo — only CSV snapshots for the Results chapter.

================================================================================
END
================================================================================
