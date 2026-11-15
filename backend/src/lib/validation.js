import { PRIORITIES } from '../scoring/weights.js';
import { LANGUAGES } from '../explain/templates.js';

export const RAIN_DELTA_RANGE = [-0.9, 1];
export const HEAT_DELTA_RANGE = [-5, 5];
export const MAX_CURRENT_CROPS = 4;
/** Map points must fall inside this box around El Salvador (crop rules and seasons assume it). */
export const EL_SALVADOR_BOUNDS = { minLat: 13.1, maxLat: 14.5, minLon: -90.2, maxLon: -87.6 };

/** Error for invalid client input (HTTP 400). */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

/** Parses the body when it arrives as a string. */
function parseBody(body) {
  if (typeof body !== 'string') return body ?? {};
  try {
    return JSON.parse(body);
  } catch {
    throw new ValidationError('Body must be valid JSON.');
  }
}

/** Optional number inside [min, max]; defaults to 0. */
function optionalNumber(value, name, [min, max]) {
  if (value === undefined || value === null) return 0;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${name} must be a number between ${min} and ${max}.`);
  }
  return value;
}

/** currentCrop: one crop id or a list of crop ids (the rotation in planting order). */
function cropIds(value, crops) {
  const ids = Array.isArray(value) ? value : [value];
  if (ids.length === 0 || ids.length > MAX_CURRENT_CROPS || ids.some((id) => typeof id !== 'string')) {
    throw new ValidationError(`currentCrop must be a crop id or a list of 1-${MAX_CURRENT_CROPS} crop ids.`);
  }
  if (new Set(ids).size !== ids.length) throw new ValidationError('currentCrop must not repeat crops.');
  const unknown = ids.filter((id) => !crops.some((crop) => crop.id === id));
  if (unknown.length > 0) throw new ValidationError(`Unknown crop: ${unknown.join(', ')}.`);
  return ids;
}

/** Squared distance in degrees; enough to rank nearby points. */
function distance2(a, b) {
  return (a.lat - b.lat) ** 2 + (a.lon - b.lon) ** 2;
}

/** Pilot zone closest to a point (its stored data is the fallback for that point). */
export function nearestZone(point, zones) {
  return zones.reduce((best, zone) => (distance2(point, zone) < distance2(point, best) ? zone : best));
}

/**
 * A map point { lat, lon } inside El Salvador becomes a custom zone. Coordinates are rounded to
 * 2 decimals (~1 km), far below the ~50 km NASA POWER grid.
 */
function pointZone(lat, lon, zones) {
  const { minLat, maxLat, minLon, maxLon } = EL_SALVADOR_BOUNDS;
  const valid = [lat, lon].every((value) => typeof value === 'number' && Number.isFinite(value));
  if (!valid || lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
    throw new ValidationError(`lat/lon must be numbers inside El Salvador (lat ${minLat}..${maxLat}, lon ${minLon}..${maxLon}).`);
  }
  const point = { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
  const nearest = nearestZone(point, zones);
  return { id: 'custom', name: 'Selected location', ...point, fallbackZone: { id: nearest.id, name: nearest.name } };
}

/** Resolves the location: a pilot zone id (`zone`) or a map point (`lat` + `lon`). */
function resolveZone(body, zones) {
  if (body.zone === undefined && (body.lat !== undefined || body.lon !== undefined)) {
    return pointZone(body.lat, body.lon, zones);
  }
  const zone = zones.find((candidate) => candidate.id === body.zone);
  if (!zone) throw new ValidationError(`Send lat and lon, or zone as one of: ${zones.map((z) => z.id).join(', ')}.`);
  return zone;
}

/** Validates POST /api/recommend input and returns normalised values. */
export function validateRecommendBody(rawBody, { zones, crops }) {
  const body = parseBody(rawBody);
  const zone = resolveZone(body, zones);
  if (!PRIORITIES.includes(body.priority)) throw new ValidationError(`priority must be one of: ${PRIORITIES.join(', ')}.`);
  const lang = body.lang ?? 'en';
  if (!LANGUAGES.includes(lang)) throw new ValidationError(`lang must be one of: ${LANGUAGES.join(', ')}.`);
  return {
    zone,
    currentCrops: cropIds(body.currentCrop, crops),
    priority: body.priority,
    rainDelta: optionalNumber(body.rainDelta, 'rainDelta', RAIN_DELTA_RANGE),
    heatDelta: optionalNumber(body.heatDelta, 'heatDelta', HEAT_DELTA_RANGE),
    lang,
  };
}
