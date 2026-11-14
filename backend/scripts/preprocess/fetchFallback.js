// Downloads the real NASA POWER daily response (last 10 complete years) for every
// pilot zone and stores it in data/fallback/<zoneId>.json.
// Usage: npm run preprocess
import { writeFile, mkdir } from 'node:fs/promises';
import { loadZones } from '../../src/data/loadData.js';
import { fetchPowerRaw, lastTenFullYears } from '../../src/lib/power.js';

const FALLBACK_DIR = new URL('../../data/fallback/', import.meta.url);
const DOWNLOAD_TIMEOUT_MS = 60_000;

async function main() {
  await mkdir(FALLBACK_DIR, { recursive: true });
  const period = lastTenFullYears();
  for (const zone of await loadZones()) {
    const raw = await fetchPowerRaw(zone, { period, timeoutMs: DOWNLOAD_TIMEOUT_MS });
    await writeFile(new URL(`${zone.id}.json`, FALLBACK_DIR), JSON.stringify(raw));
    console.log(`Saved ${zone.id} (${period.start}-${period.end})`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
