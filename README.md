# Multilingual AI Farm Decision Assistant

A web app for Indian farmers. Ask a farming question in Hindi, Punjabi or English and get an answer based on your local weather and mandi prices.

Built as a B.Tech project by Krishka Laller.

> Advice from this app is informational only. It is not a replacement for expert advice. For serious crop loss or any chemical dosage, contact your local Krishi Vigyan Kendra (KVK).

## What it does

| Feature | How it works | Data source |
|---|---|---|
| Chat assistant | Answers farming questions in the selected language | Groq LLM API |
| Weather | Current conditions and a short forecast for a chosen district or your location | Open-Meteo |
| Mandi prices | Daily wholesale prices by state, district and commodity | Agmarknet via data.gov.in |
| Crop advice | Suggests crops from location, soil, season and water availability | Groq LLM API with live weather as context |
| Fertilizer guidance | General guidance only, never specific doses or brands | Groq LLM API |
| Disease photo check | Page and upload flow are built, the AI analysis is not enabled yet | Not available yet |

Weather and mandi cards show the source name and the last updated time. If a data source fails, the app shows an honest error. It never shows dummy numbers.

## Languages

The interface is available in English, Hindi and Punjabi. The backend accepts eight language codes (en, hi, pa, mr, gu, ta, te, bn), so the remaining UI translations can be added without API changes.

## Tech stack

- Backend: FastAPI (Python), Pydantic, httpx, slowapi for rate limiting, Pillow for image handling, cachetools for caching
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons
- API contract: the backend exports `openapi.json`, and the frontend client types are generated from it with `openapi-typescript`
- Tests: pytest with external APIs mocked

## Design decisions

- **Stateless.** There is no database. Chat history lives only in the browser tab. Chat text and photos are not stored by this app.
- **No invented data.** Prices and weather come from real APIs only. When data is missing, the app says so.
- **No chemical doses.** The assistant gives general guidance and tells users to follow the product label and contact the local KVK.
- **One error shape.** Every API error returns `{ code, message, details }`.
- **LLM calls only on the backend.** API keys never reach the browser.

## Project structure

```
farm-assistant/
  backend/
    app/
      api/routes/      chat, crop, disease, fertilizer, location, mandi, weather
      services/        LLM wrapper, weather, mandi, geocoding, image handling
      middleware/      rate limiting, error handler
      models/          Pydantic schemas and error types
    data/              location data (states and districts)
    tests/
    openapi.json
    requirements.txt
  frontend/
    src/
      app/             pages: chat, weather, mandi, crop, fertilizer, disease, privacy, terms
      components/
      i18n/            en, hi, pa translation files
      lib/api-client/  generated API types and fetch wrapper
  README.md
```

## Getting started

You need Python 3.12 or newer and Node.js 20 or newer.

### 1. Get API keys

- Groq: create a key at console.groq.com
- data.gov.in: register and copy the key from My Account

Open-Meteo needs no key.

### 2. Run the backend

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your keys:

```
GROQ_API_KEY=
DATA_GOV_IN_API_KEY=
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Start the server:

```
uvicorn app.main:app --reload
```

Interactive API docs are at `http://127.0.0.1:8000/docs`.

### 3. Run the frontend

Open a second terminal:

```
cd frontend
npm install
```

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Start the app:

```
npm run dev
```

Open `http://localhost:3000`. Keep both terminals running.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat` | Chat in the selected language |
| POST | `/api/crop/recommend` | Crop suggestions |
| POST | `/api/fertilizer/guide` | General fertilizer guidance |
| POST | `/api/disease/identify` | Leaf photo analysis (not enabled yet) |
| GET | `/api/weather` | Weather and forecast |
| GET | `/api/mandi/prices` | Mandi prices |
| GET | `/api/location/states` | States and districts |

## Tests

```
cd backend
venv\Scripts\activate
pytest
```

After changing backend schemas, regenerate the frontend types:

```
cd frontend
npm run gen:api
```

## Known limitations

- The disease photo analysis is not enabled with the current AI provider.
- The farming advice list on the weather page is empty for now.
- Crop and fertilizer answers are AI generated and are not checked against soil tests.
- Voice input is not implemented.
- Mandi data depends on data.gov.in, which can be slow or unavailable. Results are cached for one hour.
- The Groq free tier has rate limits, and model names on the provider side can change.

## Roadmap

- Photo based disease identification with a vision capable model
- Weather based farming advice
- Marathi, Gujarati, Tamil, Telugu and Bengali interface
- Voice input where the browser supports it
- Deployment on a custom domain

## Data and privacy

Chat text, crop and fertilizer inputs go to the LLM provider to produce an answer. Coordinates go to Open-Meteo, and state, district and commodity go to data.gov.in. The app stores only the selected language in the browser. See `/privacy` and `/terms` in the running app. These pages are a project draft and have not been reviewed by a lawyer.
