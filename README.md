# KrishiPro: Crop Profit Optimization System

AI-assisted crop recommendation and profit analysis platform.

## Components

- Frontend: static HTML/CSS/JS in `frontend/`
- Backend: Flask API in `backend/`
- ML model: `backend/models/crop_model.pkl`

## Project Structure

```text
Crop Profit Optimization System/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── crop_knowledge.py
│   │   ├── model.py
│   │   ├── model_registry.py
│   │   ├── profit_engine.py
│   │   ├── recommendation_service.py
│   │   ├── routes.py
│   │   ├── utils.py
│   │   └── weather_service.py
│   ├── config/config.py
│   ├── data/
│   ├── models/crop_model.pkl
│   ├── tests/test_app.py
│   ├── Procfile
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── run.py
│   └── wsgi.py
├── frontend/
│   ├── index.html
│   └── static/
│       ├── css/style.css
│       └── js/
│           ├── config.js
│           └── main.js
├── netlify/functions/proxy.js
├── netlify.toml
├── render.yaml
├── run.py
└── README.md
```

## Local Setup

### 1) Python environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 2) Environment variables

Create backend env file:

```bash
cp .env.example backend/.env
```

Important variables:

- `APP_ENV=development` or `production`
- `SECRET_KEY=your_secret`
- `MODEL_PATH=models/crop_model.pkl`
- `CORS_ORIGINS=*` (or your frontend domain in production)
- `GEMINI_API_KEY` (optional)
- `OPENAI_API_KEY` (optional)
- `MANDI_API_KEY` (optional, fallback works)

## Run Application

### Option A: run from repository root

```bash
source .venv/bin/activate
python run.py
```

### Option B: run backend directly

```bash
cd backend
source ../.venv/bin/activate
python run.py
```

Backend default URL: `http://127.0.0.1:5001`

## Frontend

Serve `frontend/` with any static server:

```bash
cd frontend
python -m http.server 8080
```

Frontend URL: `http://127.0.0.1:8080`

If backend runs on a different origin, set API base in `frontend/static/js/config.js`:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "https://your-backend-url"
};
```

## API Endpoints

- `GET /api/health`
- `GET /api/states`
- `GET /api/public-meta`
- `GET /api/districts/<state_name>`
- `GET|POST /predict`
- `GET|POST /api/predict` (compat route)
- `GET|POST /api/crops/weather` (legacy compat)
- `GET /mandi-prices?state=<state>&district=<district>&crop=<optional>`
- `POST /chat`

## Testing

```bash
cd backend
source ../.venv/bin/activate
python -m pytest -q
```

## Quality Checks

```bash
cd backend
source ../.venv/bin/activate
python -m ruff check .
```

Optional formatter command:

```bash
cd backend
source ../.venv/bin/activate
python -m black .
```

## Smoke Check

Run a quick API sanity check without starting an external server:

```bash
cd backend
source ../.venv/bin/activate
python scripts/smoke_check.py
```

## Deployment Notes

- Netlify frontend config: `netlify.toml`
- Netlify function proxy: `netlify/functions/proxy.js`
- Render backend config: `render.yaml`
- Production entrypoint: `backend/wsgi.py`

## Notes

- Mandi API may timeout in development depending on network; backend returns fallback prices.
- Chat route tries Gemini, then OpenAI, then local fallback.