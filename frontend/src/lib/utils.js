/** Joins class names, skipping falsy values. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** 0.684 -> "68". */
export function toPercent(score) {
  return Math.round(score * 100);
}

/** true when the point is inside El Salvador's bounding box. */
export function isInsideBounds({ lat, lon }, bounds) {
  return lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon;
}
