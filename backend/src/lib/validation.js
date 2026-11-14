import { PRIORITIES } from '../scoring/weights.js';

export const RAIN_DELTA_RANGE = [-0.9, 1];
export const HEAT_DELTA_RANGE = [-5, 5];
export const MAX_CURRENT_CROPS = 4;

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

/** Validates POST /api/recommend input and returns normalised values. */
export function validateRecommendBody(rawBody, { zones, crops }) {
  const body = parseBody(rawBody);
  const zone = zones.find((candidate) => candidate.id === body.zone);
  if (!zone) throw new ValidationError(`zone must be one of: ${zones.map((z) => z.id).join(', ')}.`);
  if (!PRIORITIES.includes(body.priority)) throw new ValidationError(`priority must be one of: ${PRIORITIES.join(', ')}.`);
  return {
    zone,
    currentCrops: cropIds(body.currentCrop, crops),
    priority: body.priority,
    rainDelta: optionalNumber(body.rainDelta, 'rainDelta', RAIN_DELTA_RANGE),
    heatDelta: optionalNumber(body.heatDelta, 'heatDelta', HEAT_DELTA_RANGE),
  };
}
