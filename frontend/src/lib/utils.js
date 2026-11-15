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

// NASA POWER (MERRA-2) grid: cells of 0.5° lat x 0.625° lon, centered on multiples from -90 / -180.
const CELL_LAT = 0.5;
const CELL_LON = 0.625;

/** Bounds of the NASA POWER cell that contains the point. */
export function powerCell({ lat, lon }) {
  const centerLat = Math.round(lat / CELL_LAT) * CELL_LAT;
  const centerLon = Math.round((lon + 180) / CELL_LON) * CELL_LON - 180;
  return {
    minLat: centerLat - CELL_LAT / 2,
    maxLat: centerLat + CELL_LAT / 2,
    minLon: centerLon - CELL_LON / 2,
    maxLon: centerLon + CELL_LON / 2,
  };
}
