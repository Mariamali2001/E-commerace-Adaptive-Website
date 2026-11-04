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





Local still uses `http://127.0.0.1:8001` by default when `MOOD_API_URL` is unset.
