import { readFile } from 'node:fs/promises';

const DATA_DIR = new URL('../../data/', import.meta.url);
const SAFE_ID = /^[a-z0-9-]+$/;

/** Reads and parses a JSON file relative to /backend/data. */
async function readJson(relativePath) {
  const text = await readFile(new URL(relativePath, DATA_DIR), 'utf8');
  return JSON.parse(text);
}

/** Returns the pilot zones: [{ id, name, lat, lon }]. */
export async function loadZones() {
  return readJson('zones.json');
}

/** Returns one zone by id, or null when it does not exist. */
export async function findZone(id) {
  const zones = await loadZones();
  return zones.find((zone) => zone.id === id) ?? null;
}

/** Returns the draft crop trait table (values pending validation by the team). */
export async function loadCrops() {
  return readJson('crops.json');
}

/** Returns the stored raw NASA POWER response for a zone (data/fallback/<zoneId>.json). */
export async function loadFallback(zoneId) {
  if (!SAFE_ID.test(zoneId)) {
    throw new Error(`Invalid zone id: ${zoneId}`);
  }
  return readJson(`fallback/${zoneId}.json`);
}
