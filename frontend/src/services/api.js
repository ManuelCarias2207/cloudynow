const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Calls the backend and returns JSON, throwing the API error message on failure. */
async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data;
}

/** POST /api/recommend with a map point. `lang` ('en' | 'es') sets the language of the texts. */
export function recommend({ lat, lon, currentCrops, priority, lang }) {
  return request('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, currentCrop: currentCrops, priority, lang }),
  });
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

const PHOTON = 'https://photon.komoot.io/api/';
const SV_BBOX = '-90.2,13.1,-87.6,14.5';

function photonLabel({ name, city, county, state }) {
  return [...new Set([name, city ?? county, state].filter(Boolean))].join(', ');
}

/**
 * Place search inside El Salvador for the autocomplete (Photon, OpenStreetMap data).
 * Returns [{ lat, lon, label }]. Pass an AbortSignal to cancel a stale search.
 */
export async function searchPlaces(query, { signal, lang } = {}) {
  const params = new URLSearchParams({ q: query, limit: '6', bbox: SV_BBOX });
  if (lang === 'en') params.set('lang', 'en');
  const response = await fetch(`${PHOTON}?${params}`, { signal });
  if (!response.ok) throw new Error('Place search is not available right now.');
  const { features = [] } = await response.json();
  const places = features
    .filter((feature) => feature.properties.countrycode === 'SV')
    .map((feature) => ({ lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0], label: photonLabel(feature.properties) }));
  return places.filter((place, index) => places.findIndex((other) => other.label === place.label) === index);
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
