# Siembra Satelital — Frontend

React + Vite + Tailwind + MapLibre GL. Flow: pick a point on the map (or search a place) →
choose current crops and priority → compare three rotations from the backend.

## Run locally

```bash
cd backend && npm run dev      # API on http://localhost:3001
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :3001)
```

## Production (Vercel)

Create a Vercel project with Root Directory = `frontend` and set `VITE_API_URL` to the backend URL.

## External services (no API keys)

- Map tiles: OpenFreeMap (`positron` style).
- Place search and place names: OpenStreetMap Nominatim, limited to El Salvador (max ~1 request/second).
