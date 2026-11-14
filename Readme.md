# Siembra Satelital

**Compare crop rotations with NASA satellite data for small farmers in El Salvador's Dry Corridor.**

NASA Space Apps Challenge 2026, San Salvador. Challenge: *Cambio de campo* (field change).

Small farmers choose what to plant based on experience, while rain is becoming unpredictable, soil is degrading and water is scarce. Siembra Satelital combines NASA data (NASA POWER, MODIS NDVI, with SMAP and GPM planned) with the farmer's priorities. It always compares **3 rotation strategies** and explains the evidence, benefits, information gaps and risks for each one.

> The tool supports the decision. It does not replace the judgment of the farmer or the local technician.

## How it works (3 steps, no login)

1. **Choose your zone**: 3 pilot zones in the Dry Corridor (Chalatenango, Corinto in Morazán, Santa Rosa de Lima in La Unión).
2. **Your farm**: current crop (maize-bean, coffee, vegetables), main priority (save water, extra income, improve soil) and constraints.
3. **Results**: rotations compared side by side:
   - **A** current rotation
   - **B** current rotation + cover crop / legume in the bare-field window
   - **C** with a drought-tolerant crop

   Each one includes NASA evidence, scores, benefits, risks, data gaps, climate and soil charts, and the support-not-replacement notice.

Optional extras: scenario slider (less rain / more heat), "Waze of the field" chat assistant (simulated), planting calendar.

## Repository

```
backend/    Node.js API (Vercel functions), scoring engine, NASA data and preprocessing scripts
frontend/   React + Vite app (react-leaflet, recharts, tailwindcss, lucide-react)
context/    Project specification (nasa.simpler.json)
```

## Run locally

```bash
# Backend: http://localhost:3001/api
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm run dev

# Frontend: http://localhost:5173
cd frontend
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:3001/api
npm install && npm run dev
```

API documentation, scoring rules and data pipeline: [backend/README.md](backend/README.md).

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite, react-leaflet, recharts, tailwindcss, lucide-react |
| Backend | Node.js (zero-dependency serverless functions) |
| Data | Static JSON: `zones.json`, `climate_summary.json`, `crops.json` (no database) |
| NASA data | NASA POWER API (rain, max temperature, root-zone soil moisture), MODIS MOD13Q1 NDVI (ORNL DAAC); SMAP and GPM IMERG via Earthdata planned |
| LLM | Optional; it only rewrites the evidence in plain English (max 80 words) |
| Hosting | Vercel (frontend and backend as separate projects) |

## Design rules

- **Precomputed data**: nothing critical depends on a live external call. If NASA POWER or the LLM fails, cached data and templates are used.
- **Transparent scoring**: each rotation gets 0–1 scores for water, soil, erosion, income and risk. `total = sum(weight * score)`, and the farmer's priority gets weight 0.4. Each score shows the NASA indicator behind it.
- **Uncertainty**: high rainfall variability lowers confidence. A gap below 0.05 between the top options is shown as "similar". Gaps that NASA data cannot cover (local soil type, market prices, pests) are always listed.
- **No accounts**: no login, profiles or roles.

## NASA data used

| Dataset | Use |
| --- | --- |
| NASA POWER `PRECTOTCORR` | Monthly rainfall, rainfall variability, longest dry spell |
| NASA POWER `T2M_MAX` | Days above 35 °C (heat stress) |
| NASA POWER `GWETROOT` | Root-zone soil moisture and anomaly |
| MODIS MOD13Q1 NDVI | Vegetation curve and bare-field window (the rainfall proxy is used until processed) |
| SMAP / GPM IMERG | Planned via NASA Earthdata (`earthaccess`) |

## Hackathon checklist

- [x] Backend API with 3-rotation comparator and NASA evidence
- [ ] Frontend 3-step flow connected to the API
- [ ] Backend and frontend deployed live (Vercel)
- [ ] Crop traits table validated with a local technician
- [ ] Pitch in English (7-slide deck or 30 s video) + NASA data tab + AI usage declaration

## AI usage declaration

AI tools were used to help write code and documentation (Devin, Cursor). In the app, an LLM only rewrites the scoring evidence in plain language and never makes the recommendation.
