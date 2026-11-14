const { createHandler, getQuery, HttpError } = require('../../../src/lib/http');
const { getZone, getClimate, getClimateMeta } = require('../../../src/data/loadData');
const { fetchClimatology } = require('../../../src/data/nasaPower');

const GLOSSARY = {
  rainMm: 'Average rain that falls in the month, in millimeters.',
  soilMoisture: 'How wet the soil is around the roots, from 0 (dry) to 1 (saturated).',
  ndvi: 'NDVI is a satellite measure of how green and dense the plants are, from 0 (bare soil) to 1 (dense vegetation).',
  bareFieldWindow: 'Months when the field has little or no plant cover, so the soil is exposed to sun, wind and rain.',
};

async function withLive(zone, monthly) {
  try {
    const live = await fetchClimatology(zone);
    const byMonth = new Map(live.monthly.map((m) => [m.month, m]));
    return {
      monthly: monthly.map((m) => ({ ...m, ...byMonth.get(m.month), ndvi: m.ndvi })),
      live: { ok: true, source: live.source, fetchedAt: live.fetchedAt },
    };
  } catch (error) {
    return { monthly, live: { ok: false, error: error.message, fallback: 'precomputed climate_summary.json' } };
  }
}

module.exports = createHandler({
  methods: ['GET'],
  handle: async (req) => {
    const { id, live } = getQuery(req);
    const zone = getZone(id);
    if (!zone) throw new HttpError(404, 'zone_not_found', `Unknown zone: ${id}`);
    const climate = getClimate(id);
    if (!climate) throw new HttpError(404, 'climate_not_found', `No NASA climate summary for zone: ${id}`);

    const base = { zone, ...climate, units: getClimateMeta().units, glossary: GLOSSARY };
    if (live !== 'true') return base;
    return { ...base, ...(await withLive(zone, climate.monthly)) };
  },
});
