const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Calls the backend and returns JSON, throwing the API error message on failure. */
async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data;
}

/** POST /api/recommend with a map point. */
export function recommend({ lat, lon, currentCrops, priority }) {
  return request('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, currentCrop: currentCrops, priority }),
  });
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Place search inside El Salvador (OpenStreetMap Nominatim). Returns [{ lat, lon, label }]. */
export async function searchPlaces(query) {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', countrycodes: 'sv', limit: '5' });
  const response = await fetch(`${NOMINATIM}/search?${params}`);
  if (!response.ok) throw new Error('Place search is not available right now.');
  const places = await response.json();
  return places.map((place) => ({ lat: Number(place.lat), lon: Number(place.lon), label: place.display_name }));
}

/** Short place name for a point, or null. */
export async function placeName({ lat, lon }) {
  const params = new URLSearchParams({ lat, lon, format: 'jsonv2', zoom: '12' });
  try {
    const response = await fetch(`${NOMINATIM}/reverse?${params}`);
    const place = await response.json();
    const a = place.address ?? {};
    const parts = [a.village ?? a.town ?? a.city ?? a.municipality ?? a.county, a.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}
