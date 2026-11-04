# SmartShop

Master’s experiment: a Next.js e-commerce shop that **adapts UI from persona × device × mood**, with face-mood detection and user confirmation.

Offline guideline extraction lives in `adaptive_ui_app/`. Live rules: `public/assets/master_adaptive_ui_rules.json` (**67** designed cells; theoretical space is 6 personas × 2 devices × 8 moods = 96).

---

## What the participant does

1. **Signup** — age + gender (**Female / Male** only).
2. **Browse** the static shop for **5 minutes**.
3. **Questionnaire** — TIPI traits, shopping persona, self-reported mood.
4. **Mood page** — camera detect (default **ViT / Modal**; dropdown can switch to **EfficientNet / Railway**).
5. **Confirm popup** — “Is this your mood?” Yes / No → pick from **8 guideline moods**. Adaptation always uses the **confirmed** mood.
6. Personalized shop (cart badge, checkout includes **Egypt**).

Frames from Yes and No confirms are stored (`MoodFeedback`) for later fine-tune — not live training.

---

## Mood detection (two backends)

| Choice in dropdown | Where it runs | Env var on Vercel |
|--------------------|---------------|-------------------|
| **ViT (Modal)** — default | Modal predict URL | `VIT_MOOD_API_URL` |
| **EfficientNet (Railway)** | FastAPI + `.h5` | `MOOD_API_URL` |

ViT: client sends a smaller face-centered JPEG; a background call warms Modal. EfficientNet: Railway `mood_api.py` + `best_model_efficientnet_egypt_ft_v4.h5` (Hugging Face `MODEL_URL`).

Labels are bridged to guideline moods (`angry`/`anger` → Frustrated, etc.). Admin stores `mood_backend`.

---

## Admin (`/admin`)

- **All participants CSV** — includes legacy rows + `study_chapter`.
- **New chapter CSV** — only runs after mood confirmation (`mood_source` / `confirmed_mood`).
- **Combinations CSV (all / new chapter)** — 67 master cells with `n`, plus fallback counts.
- Mood frame previews (fine-tune dataset).

Do **not** wipe results in admin; split old vs new with the two CSVs.

---

## Local run

```bash
cd smartshop
npm run setup
npm run dev          # http://localhost:3000
npm run mood-api     # EfficientNet local API → http://127.0.0.1:8001
```

iPhone camera: `npm run dev:https`. Demo admin: `demo@smartshop.dev` / `demo1234`.

LLM: copy env example into `.env.local`. Cached components under `generated_components/` work without calling the API.

---

## Deploy (nothing mood-related on Vercel)

```text
Vercel (Next.js shop)
  ├─ MOOD_API_URL      → Railway EfficientNet
  └─ VIT_MOOD_API_URL  → Modal ViT
MongoDB Atlas ← shop
```

**Railway (EfficientNet):** root directory `smartshop/mood_model`, Dockerfile, `MODEL_URL` = Hugging Face resolve link for `best_model_efficientnet_egypt_ft_v4.h5`.

**Vercel:** root directory `smartshop`. Set `MONGODB_URI`, `SESSION_SECRET`, `MOOD_API_URL`, `VIT_MOOD_API_URL`. Optional: `NEXT_PUBLIC_EVALUATION_FORM_URL` (link shown after mood confirm).

---

## Related folders

| Path | Role |
|------|------|
| `src/` | Shop, experiment, adaptive engine, admin |
| `mood_model/` | EfficientNet API + training notebooks |
| `mood_model/modal_version_vit/` | ViT Modal deploy / fine-tune scripts |
| `adaptive_ui_app/` | Streamlit — built the 67-cell master JSON |
| `study_results/` | Results-chapter notebook + sample CSVs |
| `public/assets/` | Master rules, global defaults, trait nudges |

---

## Retrain mood (later)

Collect labeled frames during the study → fine-tune offline (EfficientNet Colab or ViT Modal script) → replace weights / redeploy Railway or Modal. Do not retrain live per participant.
