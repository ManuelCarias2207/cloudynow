# Siembra Satelital

Web tool that compares crop rotations with NASA satellite climate data for small farmers in
El Salvador's Dry Corridor. Built for NASA Space Apps Challenge San Salvador (challenge: *Cambio de campo*).

> The tool **supports** the farmer's decision. It does not replace the farmer's judgment or the advice
> of local agricultural technicians.

## The problem

Small farmers choose what to plant from experience, while rainfall becomes less predictable, soil
degrades and water gets scarce. Trying a new crop in the rotation is risky: what improves the soil in
one place may use too much water or not fit the local market in another.

## What it does

A three-step flow, no login:

1. **Location**: pick a point on the map of El Salvador or search for a town.
2. **Your farm**: choose the current crops (1–4) and the main priority: save water, more income or healthier soil.
3. **Results**: three rotations compared side by side:
   - **A. Current rotation**: the crops the farmer already grows.
   - **B. Current rotation + cover crop**: adds a nitrogen-fixing crop in the bare-field months.
   - **C. Drought-tolerant swap**: replaces the thirstiest crop with a drought-tolerant one.

   Each option shows a score per criterion (water, soil, erosion, income, risk), the NASA evidence behind
   each score, benefits, risks and information gaps. The results page also shows charts of monthly rainfall,
   soil moisture and temperature with the bare-field window highlighted, plus a short glossary.

Scores come from transparent rules, not a black box: `total = Σ weight × score`, with weights set by the
farmer's priority. When the two best options are within 0.05 they are shown as "similar", and high rainfall
variability lowers the confidence. See [backend/README.md](backend/README.md#scoring-rules) for the formulas.

## NASA data

| Dataset | Use |
|---|---|
| [NASA POWER Daily API](https://power.larc.nasa.gov/) (community `AG`, last 10 complete years) | `PRECTOTCORR` rainfall, `T2M` temperature, `RH2M` humidity, `GWETROOT` root-zone soil moisture |

From these daily values the backend computes monthly climatology, annual rainfall and its variability,
the longest rainy-season dry spell, extreme heat days and the bare-field window. If NASA POWER does not
respond, stored data in `backend/data/fallback/` is used and the UI shows "Using stored data".

Information NASA data does not cover is always listed as a gap: local soil type, market prices and pests.

## Stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, MapLibre GL (OpenFreeMap tiles), Recharts, React Router |
| Backend | Node.js 20+ serverless functions (Vercel), no runtime dependencies, no database |
| Data | Static JSON in the repo (`zones.json`, `crops.json`, `fallback/`) plus live NASA POWER calls |
| Place search | OpenStreetMap Nominatim (El Salvador only) |

## Repository structure

```
backend/    API: NASA POWER client, indicators, rotation builder, scoring engine, text templates
frontend/   React app: map, farm form, results, charts
context/    project spec (nasa.simpler.json) and backend notes
```

## Run locally

Requirements: Node.js 20 or newer.

```bash
# Terminal 1: API on http://localhost:3001
cd backend
npm run dev

# Terminal 2: web app on http://localhost:5173 (proxies /api to :3001)
cd frontend
npm install
npm run dev
```

Other backend commands:

```bash
npm test             # unit tests, use stored data only (no NASA calls)
npm run preprocess   # re-download the fallback data from NASA POWER
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/zones` | Pilot zones (Sonsonate, Usulután, San Miguel) |
| `GET` | `/api/zones/:id` | Monthly climate series and indicators for a pilot zone |
| `POST` | `/api/recommend` | Three scored rotations for a zone or a `lat`/`lon` point, with indicators and monthly data |

Example:

```bash
curl -X POST http://localhost:3001/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"lat": 13.35, "lon": -88.44, "currentCrop": ["maize", "bean"], "priority": "water"}'
```

`/api/recommend` also accepts `rainDelta` (`-0.9`..`1`) and `heatDelta` (`-5`..`5` °C) to simulate
scenarios. Full request and response details are in [backend/README.md](backend/README.md#endpoints).

## Deployment (Vercel)

Two Vercel projects from this repository:

- **Backend**: Root Directory `backend`.
- **Frontend**: Root Directory `frontend`, environment variable `VITE_API_URL` set to the backend URL.

## Status

| Feature | Status |
|---|---|
| Map location picker and place search | Done |
| Farm form: crops and priority | Done |
| Rule-based comparison of 3 rotations with evidence, benefits, risks and gaps | Done |
| "Supports, does not replace" notice and "similar options" badge | Done |
| NASA POWER client with stored fallback | Done |
| Rainfall, soil moisture and temperature charts with bare-field window | Done |
| Live deployment | To do |
| NDVI (MODIS), SMAP and GPM summaries | To do |
| "About the data" page with AI-use statement | To do |
| Basic constraints step in the farm form | To do |
| Coffee and vegetables in the crop table | To do |
| Scenario slider (less rain, more heat); the API already supports it | To do (optional) |
| Simulated chat assistant | To do (optional) |
| LLM-written explanations (templates are used today) | To do (optional) |
| Planting calendar | To do (optional) |

## Limitations

- Crop traits in `backend/data/crops.json` are drafts and must be validated by a local technician.
- NASA POWER cells are about 50 km wide, so nearby points can return the same data.
- The bare-field window is estimated from rainfall and soil moisture, not from vegetation (NDVI) yet.

## AI use

AI coding assistants were used during development. The scoring is rule-based and every explanation is
generated from templates using the evidence data. No language model makes the recommendations.
