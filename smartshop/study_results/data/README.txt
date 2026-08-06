Place study data files here.

Expected filenames (notebook looks for these first):

  experiment_export.csv   ← Admin CSV from /admin (required for real results)
  form_survey.csv         ← One Google Form export (4 sections)
  task_outcomes.csv       ← Optional: participant_id/email, reached_cart, placed_order

Sample / draft files (dry-run):

  sample_experiment_export.csv
  sample_form_survey.csv
  sample_task_outcomes.csv

Join key
  participant_id  (form)  ↔  user_id  (admin CSV)
  Also works if you add the same participant_id column on both sides.

Form column naming (after export, rename or use COLUMN_MAP in notebook)

  Section 1:  participant_id

  Section 2 — SUS (1–5):
    sus_1 … sus_10

  Section 3 — UEQ-S (1–7, left→right):
    ueq_1 … ueq_8
      1 obstructive–supportive
      2 complicated–easy
      3 inefficient–efficient
      4 confusing–clear
      5 boring–exciting
      6 not interesting–interesting
      7 conventional–inventive
      8 usual–leading edge

  Section 4 — AWEQ (1–5):
    aweq_1 … aweq_7

  Optional open text (3):
    opt_1  What did you like most about the adaptive website?
    opt_2  What would you improve?
    opt_3  If you could improve one aspect of the adaptive website, what would it be?
