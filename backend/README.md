# Cloudynow — Backend

Serverless API (Vercel, Node.js ES modules) that compares three crop rotations for small farms in
El Salvador's Dry Corridor using NASA POWER daily climate data. The tool **supports** the farmer's
decision; it does not replace the farmer's judgment or local technicians.

- No database, no authentication, no runtime dependencies.
- CORS enabled on every endpoint (`Access-Control-Allow-Origin: *`).
- Every text returned by the API is in English.

## Run locally

Requirements: Node.js 20+.

```bash
cd backend
npm run dev              # local API on http://localhost:3001 (scripts/devServer.js, no Vercel CLI needed)
npm test                 # unit tests (only use stored data in data/fallback, never call NASA POWER)
npm run preprocess       # re-download the last 10 complete years from NASA POWER into data/fallback/
npx vercel dev           # serves /api/* on http://localhost:3000 (needs the Vercel CLI and login)
```

On Vercel, create a project with **Root Directory = `backend`**. `vercel.json` bundles `data/**`
with the functions so the fallback files are available at runtime.

## Structure

```
api/zones/index.js        GET  /api/zones
api/zones/[id].js         GET  /api/zones/:id
api/recommend.js          POST /api/recommend
src/data/loadData.js      reads data/*.json and data/fallback/<zoneId>.json
src/lib/power.js          NASA POWER client (10 s timeout, -999 filter, 422/429/500/503, fallback)
src/lib/indicators.js     climate indicators (formulas documented in comments)
src/lib/validation.js     request validation
src/lib/http.js           CORS, JSON responses, error handling
src/rotations/            builds rotations A, B, C
src/scoring/              rule-based scores, weights, similarity/confidence, recommend orchestration
src/explain/templates.js  English template texts (benefits, risks, gaps, disclaimer); no LLM
scripts/preprocess/       fetchFallback.js (downloads data/fallback/<zoneId>.json)
scripts/devServer.js      local server for the /api functions (npm run dev)
data/                     zones.json, crops.json (draft, needsValidation), fallback/
```

## Data source

NASA POWER Daily API, `https://power.larc.nasa.gov/api/temporal/daily/point`, `community=AG`,
last 10 complete years, parameters:

| Parameter | Meaning | Unit |
|---|---|---|
| `T2M` | mean air temperature at 2 m | °C |
| `PRECTOTCORR` | bias-corrected precipitation | mm/day |
| `RH2M` | relative humidity at 2 m | % |
| `GWETROOT` | root-zone soil wetness | 0 (dry) – 1 (saturated) |

Values equal to `-999` are discarded before any calculation. If the live call fails (timeout of
10 s, network error, 422, 429, 500, 503) the API uses `data/fallback/<zoneId>.json` and returns
`"fallback": true`.

## Endpoints

All responses are JSON. Errors: `{ "error": "message" }` with status `400` (invalid input),
`404` (unknown zone), `405` (wrong method) or `500`. `OPTIONS` returns `204` (CORS preflight).

### `GET /api/zones`

```json
[{ "id": "sonsonate", "name": "Sonsonate", "lat": 13.72, "lon": -89.72 }, ...]
```

### `GET /api/zones/:id`

Zone data plus monthly climatology (12 entries, Jan–Dec) for charts.

```json
{
  "zone": { "id": "sonsonate", "name": "Sonsonate", "lat": 13.72, "lon": -89.72 },
  "monthly": [
    { "month": 1, "label": "Jan", "rainMm": 31.2, "tempC": 26.9, "humidityPct": 66.1, "soilMoisture": 0.55 }
  ],
  "indicators": {
    "meanAnnualRainMm": 2292, "rainCV": 0.163, "longestDrySpellDays": 4.9,
    "extremeHeatDaysPerYear": 43.1, "extremeHeatThresholdC": 29, "meanSoilMoisture": 0.66,
    "peakMonthlyRainMm": 389, "bareWindowMonths": [1, 2, 12]
  },
  "hasSoilMoisture": true,
  "fallback": false,
  "dataSource": { "name": "NASA POWER Daily API (community AG)", "parameters": ["T2M", "PRECTOTCORR", "RH2M", "GWETROOT"], "period": { "start": "20160101", "end": "20251231" } }
}
```

`rainMm` is the mean monthly total; `tempC`, `humidityPct` and `soilMoisture` are monthly means.
`soilMoisture` is `null` when not available.

### `POST /api/recommend`

Request:

```json
{ "zone": "usulutan", "currentCrop": ["maize", "bean"], "priority": "water", "rainDelta": -0.2, "heatDelta": 2 }
```

| Field | Required | Description |
|---|---|---|
| `zone` | one of `zone` or `lat`+`lon` | pilot zone id from `/api/zones` |
| `lat`, `lon` | one of `zone` or `lat`+`lon` | any map point inside El Salvador (lat 13.1..14.5, lon -90.2..-87.6). Returned as `zone: { id: "custom", name: "Selected location", lat, lon, fallbackZone }` |
| `currentCrop` | yes | crop id, or list of 1–4 crop ids (the current rotation) from `data/crops.json` |
| `priority` | yes | `"water"`, `"income"` or `"soil"` |
| `rainDelta` | no | rain change applied to daily data, `-0.9`..`1` (`-0.2` = 20% less rain). Default `0` |
| `heatDelta` | no | °C added to daily temperature, `-5`..`5`. Default `0` |

Response (abbreviated):

```json
{
  "zone": { "id": "usulutan", ... },
  "priority": "water",
  "weights": { "water": 0.4, "soil": 0.15, "erosion": 0.15, "income": 0.1, "risk": 0.2 },
  "scenario": { "rainDelta": -0.2, "heatDelta": 2 },
  "indicators": { "meanAnnualRainMm": 1247, "rainCV": 0.225, ... },
  "monthly": [{ "month": 1, "label": "Jan", "rainMm": 9.8, "tempC": 27.1, "humidityPct": 63.2, "soilMoisture": 0.48 }, ...],
  "hasSoilMoisture": true,
  "rotations": [
    {
      "id": "A",
      "name": "Current rotation",
      "crops": [{ "id": "maize", "name": "Maize" }, { "id": "bean", "name": "Common bean" }],
      "scores": { "water": 0.6, "soil": 0.49, "erosion": 0.6, "income": 0.58, "risk": 0.45, "total": 0.55 },
      "evidence": {
        "water": { "indicators": { "meanAnnualRainMm": 1247, "longestDrySpellDays": 7.1 }, "waterStress": 0.5, "source": "NASA POWER PRECTOTCORR" },
        "soil": { ... }, "erosion": { ... }, "income": { ... }, "risk": { ... }
      },
      "benefits": ["..."],
      "risks": ["..."],
      "informationGaps": ["Local soil type and fertility are not measured by NASA POWER.", "..."]
    },
    { "id": "B", "name": "Current rotation + cover crop", ... },
    { "id": "C", "name": "Drought-tolerant swap", ... }
  ],
  "similar": false,
  "confidenceNote": "Rainfall changes a lot from year to year here (CV 0.225), so these scores carry lower confidence.",
  "fallback": false,
  "disclaimer": "This tool supports your decision; it does not replace your own judgment or the advice of local agricultural technicians. ...",
  "dataSource": { ... }
}
```

- For a map point, if NASA POWER fails the stored data of the nearest pilot zone (`fallbackZone`) is used
  and `fallback` is `true`. Note: NASA POWER cells are ~50 km, so nearby points can return identical data.
- Always exactly 3 rotations: **A** current, **B** current + nitrogen-fixing cover crop in the
  bare-field window, **C** current with its thirstiest crop replaced by a drought-tolerant one.
- All scores are 0..1 (1 = best). `total = Σ weight × score`.
- `similar` is `true` when the two best totals differ by less than `0.05`.
- `confidenceNote` reports lower confidence when the rainfall CV is above `0.2`.

## Scoring rules

| Criterion | Formula (0..1, 1 = best) | NASA indicators |
|---|---|---|
| water | mean over crops of `1 − waterStress × (demand + (1 − droughtTolerance)) / 2` | annual rain, longest dry spell |
| soil | `0.7 × mean(0.5·fixesN + 0.5·soilCover) + 0.3 × (1 − bareMonths/12)` (bare months = 0 if B covers them) | bare-field window, soil moisture |
| erosion | `1 − min(1, peakMonthlyRain/400) × (1 − meanSoilCover)` | peak monthly rain |
| income | `mean(incomePotential) × (1 − 0.5 × waterStress × (1 − meanDroughtTolerance))` | annual rain, dry spell |
| risk | `1 − climateRisk × (1 − 0.5 × meanDroughtTolerance)` | rainfall CV, extreme heat days |

`waterStress = 0.5·clamp((2000 − annualRain)/1000) + 0.5·clamp((drySpell − 3)/12)`;
`climateRisk = 0.4·clamp(CV/0.4) + 0.3·clamp(heatDays/90) + 0.3·waterStress`.
Trait levels: low = 0, medium = 0.5, high = 1. Reference values live in `src/scoring/engine.js`.

Weights by priority:

| priority | water | soil | erosion | income | risk |
|---|---|---|---|---|---|
| water | .40 | .15 | .15 | .10 | .20 |
| soil | .15 | .35 | .25 | .10 | .15 |
| income | .15 | .10 | .10 | .40 | .25 |

## Assumptions

1. Soil moisture parameter: `GWETROOT` (root-zone wetness), verified to work with `community=AG`.
2. Fallback/test period: 2016-01-01 to 2025-12-31 (last 10 complete years at build time).
3. Extreme heat day: daily **mean** `T2M` ≥ 29 °C (POWER daily T2M is a mean, roughly 34–35 °C highs).
4. Longest dry spell: mean over years of the longest run of days with rain < 1 mm in May–October
   (the dry season is dry every year and would hide the mid-summer drought).
5. Bare-field window: months with mean rain < 50 mm and soil moisture below the annual mean.
6. `currentCrop` accepts one crop id or a list (a rotation usually has 2 crops, e.g. maize + bean).
7. B adds the nitrogen-fixing crop with most soil cover; C replaces the crop with the highest water
   demand by the most drought-tolerant crop (then highest income) whose cycle fits the replaced one.
8. Crop traits and the normalisation references are drafts (`needsValidation: true`) for the team to validate.
9. The endpoint is `GET /api/zones/:id` as requested; the placeholder files that were outside this
   scope (`/api/explain`, `/api/health`, LLM client/prompt, Python preprocess scripts,
   `climate_summary.json`, `.env.example`) were removed.
