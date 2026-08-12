# SmartShopping

Next.js e-commerce app with MongoDB-backed auth/cart/experiment storage and a **rule-based adaptive UI**.

## Adaptive UI (frozen architecture)

1. Signup (collects **age/gender**)
2. Browse timer → questionnaire (**TIPI + persona + self-mood** — not age/gender)
3. Webcam mood detection (EfficientNet mood API)
4. **Context Builder** → session context object
5. **Adaptive Engine** — master JSON lookup (`master_adaptive_ui_rules.json`) → **Final UI Configuration** (only decision maker)
6. **`toImplementationSpec()`** — strips persona / mood / device / traits; keeps resolved UI decisions only
7. **LLM Component Generator** (`/api/llm/ensure-components`) — implements React/TSX for unseen configuration hashes; caches under `generated_components/`
8. Adaptive e-commerce website mounts components from the resolved decisions (catalog modules + generated files)

The LLM never decides, recommends, or redesigns UI. Identical configuration hash → cache reuse (no API call).

Guideline extraction (offline): `adaptive_ui_app/`.

## Getting Started

First time after clone (installs Node deps + mood API Python venv):

```bash
cd smartshop
npm run setup
```

Then run the website and mood API in two terminals:

```bash
npm run dev        # website → http://localhost:3000
npm run mood-api   # mood API → http://127.0.0.1:8001
```

Open [http://localhost:3000](http://localhost:3000).

### iPhone camera (HTTPS)

```bash
npm run dev:https
```

On iPhone: `https://YOUR_MAC_IP:3000` (same Wi‑Fi). Or `npm run dev:tunnel` for a public HTTPS URL.

### LLM keys

Copy `env.llm.example` into `.env.local`. Default provider is Gemini; set `LLM_PROVIDER=openai` if needed. Cached/catalog components work without calling the API.

### Demo credentials

- Email: `demo@smartshop.dev`
- Password: `demo1234`

Admin export: `/admin`.

## Backend overview

| Domain     | Endpoints                                                                                     | Notes                                      |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Products   | `GET /api/products`, …                                                                        | Mongo / seeded catalog                     |
| Auth       | signup / login / logout / me                                                                  | Cookie session                             |
| Adaptive   | `POST /api/adaptive-engine/generate`                                                          | Master JSON lookup                         |
| LLM        | `POST /api/llm/ensure-components`, `POST /api/llm/generate-variant`                           | React implementer + cache                  |
| Experiment | `POST /api/experiment/save`, admin CSV                                                        | Results for thesis                         |

Requires `MONGODB_URI` in `.env.local`.

## Deploy (Vercel website + separate mood API)

The mood model is TensorFlow (v4 ~35MB). **Do not put it on Vercel** — Vercel runs the Next.js shop only. Host the mood API elsewhere and point the shop at it.

```text
Vercel (smartshop Next.js)  --MOOD_API_URL-->  Railway/Render/HF Spaces (mood_api)
MongoDB Atlas               <----------------  same Next.js app
```

### 1) Host the `.h5` weights (once)

Upload `mood_model/artifacts/models/best_model_efficientnet_egypt_ft_v4.h5` to a place with a **direct download URL**, e.g. a [Hugging Face](https://huggingface.co/) model repo.

Example `MODEL_URL`:

`https://huggingface.co/<you>/<repo>/resolve/main/best_model_efficientnet_egypt_ft_v4.h5`

### 2) Deploy mood API (Docker)

**Important:** commit + push `smartshop/mood_model/Dockerfile` first.  
**Root directory is not** `mood_model` — it is:

```text
smartshop/mood_model
```

#### Railway
1. New Project → Deploy from GitHub → this repo  
2. Service **Settings → Root Directory** = `smartshop/mood_model`  
3. Builder = Dockerfile (uses `Dockerfile` in that folder)  
4. Variables:
   - `MODEL_URL` = `https://huggingface.co/MariamBashandy/smartshop-mood-egypt/resolve/main/best_model_efficientnet_egypt_ft_v4.h5`
   - `MODEL_PATH` = `/app/artifacts/models/best_model_efficientnet_egypt_ft_v4.h5` (optional; this is the default)
5. Settings → Networking → Generate domain  
6. Open `https://YOUR-DOMAIN/health`

#### Render
1. New → Web Service → this repo  
2. **Root Directory** = `smartshop/mood_model`  
3. Runtime = Docker  
4. Same `MODEL_URL` as above  
5. Open `https://YOUR-SERVICE.onrender.com/health`

| Variable     | Value |
|-------------|--------|
| `MODEL_URL` | Direct URL to `best_model_efficientnet_egypt_ft_v4.h5` |
| `PORT`      | Set automatically by Railway/Render — do not hardcode |

Health check: `GET https://YOUR-MOOD-API/health`  
Expect `"model": "best_model_efficientnet_egypt_ft_v4.h5"` (or the downloaded filename under MODEL_PATH).

### Optional: ViT (Modal) second detector

On Vercel, also set:

- `VIT_MOOD_API_URL=https://mariamali2001--vit-egypt-mood-dev-predict.modal.run` (no trailing slash)

The shop mood page has a dropdown: **EfficientNet (Railway)** vs **ViT (Modal)**. Same validation + frame save; results store `mood_backend`.

### 3) Deploy website on Vercel

1. Import this GitHub repo in Vercel
2. Set **Root Directory** to `smartshop`
3. Add env vars from `.env.example`, including:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `MOOD_API_URL=https://YOUR-MOOD-API` (no trailing slash)
4. Deploy

Local still uses `http://127.0.0.1:8001` by default when `MOOD_API_URL` is unset.
