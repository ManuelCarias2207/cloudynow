# Cloudynow

**Satellite-informed crop rotation planning for smallholder farmers in El Salvador's Dry Corridor.**

Built for NASA Space Apps Challenge San Salvador — Challenge: *Cambio de campo*.

> This tool **supports** the farmer's decision. It does not replace the farmer's judgment or the advice of local agricultural technicians.

---

## Problem

Smallholder farmers in El Salvador's Dry Corridor select crops based on generational experience. Rainfall patterns are shifting: onset is later, mid-summer droughts (*canícula*) are longer and hotter, and total annual precipitation is more variable. Soil fertility declines with continuous maize-bean rotations. Water scarcity limits irrigation. Market access favors certain crops over others.

The gap: **farmers lack access to localized, historical climate data translated into actionable agronomic guidance.** NASA POWER provides 10+ years of daily satellite-derived climate data at ~50 km resolution, but it is not designed for direct farmer use.

---

## Solution

Cloudynow bridges NASA POWER data to farm-level decisions through a three-step, no-login web tool:

1. **Location** — Select a point on the map of El Salvador or search for a town. The tool identifies the nearest NASA POWER grid cell and retrieves 10 complete years of daily data.
2. **Farm Profile** — Choose current crops (1–4) and primary objective: *Water conservation*, *Income maximization*, or *Soil health*.
3. **Results** — Three rotations compared side by side with transparent, evidence-backed scores:
   - **A. Current rotation** — Baseline using farmer's existing crops.
   - **B. Current + cover crop** — Adds a nitrogen-fixing cover crop during the bare-field window.
   - **C. Drought-tolerant swap** — Replaces the highest-water-demand crop with a drought-tolerant alternative.

Each rotation receives a score across five criteria (Water, Soil, Erosion, Income, Risk) computed from NASA-derived indicators. Scores are **rule-based, not a black box**: `total = Σ weight × score`. Weights reflect the farmer's chosen priority. When the top two rotations differ by < 0.05, they are flagged as "similar." High rainfall variability (CV > 0.2) lowers confidence and is explicitly noted.

---

## NASA Data & Methodology

### Data Source
| Parameter | Variable | Unit | NASA POWER Code |
|-----------|----------|------|-----------------|
| Precipitation | Bias-corrected daily total | mm/day | `PRECTOTCORR` |
| Temperature | Daily mean air temp at 2 m | °C | `T2M` |
| Humidity | Daily mean relative humidity at 2 m | % | `RH2M` |
| Soil Moisture | Root-zone wetness (0–1) | — | `GWETROOT` |

**Community:** `AG` (Agroclimatology)  
**Period:** Last 10 complete years (2016–2025 at build time)  
**Resolution:** ~0.5° × 0.5° (~50 km)  
**Fallback:** Stored climatology in `backend/data/fallback/` used when live API fails (timeout, 429, 5xx). UI displays "Using stored data" banner.

### Derived Indicators (per zone/point)
- **Mean annual rainfall** (mm)
- **Rainfall coefficient of variation** (CV)
- **Longest dry spell** (consecutive days < 1 mm, May–Oct, mean over years)
- **Extreme heat days/year** (daily mean T2M ≥ 29 °C)
- **Mean root-zone soil moisture** (0–1)
- **Peak monthly rainfall** (mm)
- **Bare-field window** — months with mean rain < 50 mm and soil moisture below annual mean

### Scoring Formulas (0–1, 1 = best)
| Criterion | Formula | Key Indicators |
|-----------|---------|----------------|
| **Water** | Mean over crops of `1 − waterStress × (demand + (1 − droughtTolerance)) / 2` | Annual rain, longest dry spell |
| **Soil** | `0.7 × mean(0.5·fixesN + 0.5·soilCover) + 0.3 × (1 − bareMonths/12)` | Bare-field window, soil moisture |
| **Erosion** | `1 − min(1, peakMonthlyRain/400) × (1 − meanSoilCover)` | Peak monthly rain |
| **Income** | `mean(incomePotential) × (1 − 0.5 × waterStress × (1 − meanDroughtTolerance))` | Annual rain, dry spell |
| **Risk** | `1 − climateRisk × (1 − 0.5 × meanDroughtTolerance)` | Rainfall CV, extreme heat days |

Where:  
`waterStress = 0.5·clamp((2000 − annualRain)/1000) + 0.5·clamp((drySpell − 3)/12)`  
`climateRisk = 0.4·clamp(CV/0.4) + 0.3·clamp(heatDays/90) + 0.3·waterStress`

Crop trait levels (low/medium/high = 0/0.5/1) and normalization references are documented in `backend/src/scoring/engine.js` and `backend/data/crops.json` (`needsValidation: true`).

### Priority Weights
| Priority | Water | Soil | Erosion | Income | Risk |
|----------|-------|------|---------|--------|------|
| Water    | 0.40  | 0.15 | 0.15    | 0.10   | 0.20 |
| Soil     | 0.15  | 0.35 | 0.25    | 0.10   | 0.15 |
| Income   | 0.15  | 0.10 | 0.10    | 0.40   | 0.25 |

---

## Impact & Validation

- **Pilot zones:** Sonsonate (13.72, -89.72), Usulután (13.35, -88.44), San Miguel (13.48, -88.18). Any point in El Salvador (lat 13.1–14.5, lon -90.2 to -87.6) is accepted.
- **Transparency:** Every score cites the NASA indicators behind it. Benefits, risks, and information gaps are listed per rotation.
- **Limitations acknowledged:**
  - Crop traits in `crops.json` are drafts requiring local agronomic validation (MAG, CENTA, FAO).
  - NASA POWER cells are ~50 km; nearby points return identical data.
  - Bare-field window estimated from rain/soil moisture, not NDVI.
  - No local soil type, market prices, or pest data.
- **Validation path:** Backend includes 58 unit tests using only stored fallback data (no live NASA calls). Run with `npm test` in `backend/`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudynow System                         │
├─────────────────────┬───────────────────────────────────────┤
│  Frontend (Vercel)  │  Backend (Vercel Serverless Functions) │
│  React 19 + Vite    │  Node.js 20+ ES Modules                │
│  Tailwind CSS 4     │  No runtime dependencies               │
│  MapLibre GL        │  No database, no auth                  │
│  Recharts           │  CORS enabled (*)                      │
│  React Router       │                                         │
└─────────┬───────────┴─────────────┬─────────────────────────┘
          │                         │
          │     HTTPS /api/*        │
          ▼                         ▼
   ┌─────────────┐           ┌───────────────┐
   │ User Browser│           │ NASA POWER    │
   │             │           │ Daily API     │
   └─────────────┘           └───────────────┘
          │                         ▲
          │                         │
          ▼                         │
   ┌─────────────────────────────────────────┐
   │ Static Data (bundled)                   │
   │ zones.json, crops.json, fallback/*.json │
   └─────────────────────────────────────────┘
```

- **Frontend:** Single-page app, proxies `/api` to backend in dev. MapLibre with OpenFreeMap tiles. Place search via Nominatim (El Salvador only, rate-limited).
- **Backend:** Three endpoints (`GET /api/zones`, `GET /api/zones/:id`, `POST /api/recommend`). Stateless, serverless-ready. Fallback data bundled via `vercel.json`.
- **Data:** Static JSON in repo. `preprocess/fetchFallback.js` downloads fresh climatology from NASA POWER.

---

## Quick Start

Requirements: Node.js 20+

```bash
# Terminal 1: API on http://localhost:3001
cd backend
npm run dev

# Terminal 2: Web app on http://localhost:5173 (proxies /api to :3001)
cd frontend
npm install
npm run dev
```

### API Example

```bash
curl -X POST http://localhost:3001/api/recommend \
  -H 'Content-Type: application/json' \
  -d '{"lat": 13.35, "lon": -88.44, "currentCrop": ["maize", "bean"], "priority": "water"}'
```

Response includes: zone data, priority weights, climate indicators, monthly series, three scored rotations with evidence/benefits/risks/gaps, similarity flag, confidence note, and disclaimer.

Scenario simulation supported via `rainDelta` (-0.9 to 1) and `heatDelta` (-5 to 5 °C).

---

## Deployment (Vercel)

Two Vercel projects from this repository:

| Project | Root Directory | Environment Variables |
|---------|----------------|----------------------|
| Backend | `backend/` | None required |
| Frontend | `frontend/` | `VITE_API_URL` = backend URL |

`vercel.json` in each directory bundles `data/**` for fallback availability at runtime.

---

## Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| NDVI (MODIS) integration | Planned | Vegetation-based bare-field detection |
| SMAP soil moisture | Planned | Higher-resolution soil data |
| GPM precipitation | Planned | Complement POWER rainfall |
| Planting calendar | Planned | Crop-specific windows |
| LLM-written explanations | Optional | Templates used today |
| Simulated chat assistant | Optional | "Waze del campo" demo mode |
| Basic constraints step | Planned | Slope, soil texture, market access |
| Coffee & vegetable crops | Planned | Expand `crops.json` with validated traits |

---

## Team & AI Use

Developed by a multidisciplinary team for NASA Space Apps Challenge San Salvador.

**AI Assistance:** AI coding assistants were used during development. The scoring engine is entirely rule-based; every explanation is generated from deterministic templates using evidence data. No language model makes recommendations or scores.

**NASA Data Attribution:** This project uses NASA POWER data (parameters: T2M, PRECTOTCORR, RH2M, GWETROOT) from the NASA Langley Research Center POWER Project funded through the NASA Earth Science Division.

---

## Repository Structure

```
backend/    API: NASA POWER client, indicators, rotation builder, scoring engine, templates
frontend/   React app: map, farm form, results, charts
context/    Project spec (nasa.simpler.json) and backend notes
```

## License

MIT — Open for collaboration and extension.