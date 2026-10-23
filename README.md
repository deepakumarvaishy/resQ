# ResQ AI Emergency Response Dashboard

ResQ is a full-stack emergency-response dashboard built around the project flow:

**React dashboard ⇄ Node/Express API ⇄ MongoDB**

- **AI analysis:** explain incident priority factors with a local demo adapter or an optional OpenAI-compatible chat-completions endpoint.
- **Duplicate detection:** compare incoming report text with deterministic text embeddings and combine similarity with geographic distance before merging.
- **Routing:** generate a Google Maps directions link locally, or request a traffic-aware route from Google Routes when an API key is configured.
- **Response controls:** review the suggested response, save a custom route, and explicitly approve dispatch.

> **Prototype only:** sample incidents and routes are illustrative. Dispatch currently records an application status only; it does not contact responders or dispatch systems. Do not use this prototype for real emergency decisions. Add authentication, validated live data, operational review, and an approved dispatch integration before deployment.

## Run locally

Requirements: Node.js 20 or later and npm.

```powershell
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The API runs at `http://localhost:4000`.

Without a MongoDB URI, the API uses editable in-memory sample data, which is useful for trying the dashboard immediately. Changes in demo mode reset when the API restarts.

## Connect services

Copy `.env.example` to `.env`, then set the integrations you want:

- `MONGODB_URI` — MongoDB connection string. The API creates the incident and report collections and seeds the sample incidents when the incident collection is empty.
- `LLM_API_KEY` — optional key for the configured OpenAI-compatible endpoint; `LLM_BASE_URL` and `LLM_MODEL` can be changed to match your provider.
- `MAPS_API_KEY` — optional Google Routes API key with Routes API enabled.

The dashboard clearly indicates sample-data mode when a database is not configured. Do not commit `.env` or provider keys.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API and database status |
| `GET` | `/api/dashboard` | Incidents, resource counts, duplicates, and integration status |
| `GET` | `/api/incidents/:id/analyze` | Explain priority factors using the configured LLM or local adapter |
| `GET` | `/api/incidents/:id/route` | Get a demo or Maps API route |
| `POST` | `/api/incidents/:id/dispatch` | Approve and record a dispatch |
| `POST` | `/api/incidents/:id/override` | Save 1–8 custom route instructions |
| `POST` | `/api/reports` | Merge a matching geolocated report or store it for triage |
| `GET` | `/api/reports?status=needs-triage` | List unmatched reports awaiting review |

Example report intake:

```json
{
  "text": "Water is entering homes near Riverside Colony",
  "source": "Helpline",
  "location": { "lat": 19.0762, "lng": 72.8784 }
}
```

Unmatched reports are stored with `needs-triage` status and are **not** automatically turned into dispatched incidents.

## Production build

```powershell
npm run build
npm start
```
