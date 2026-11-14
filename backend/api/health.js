const { createHandler } = require('../src/lib/http');
const { getZones, getClimateMeta } = require('../src/data/loadData');
const { isLlmConfigured, llmConfig } = require('../src/explain/llmClient');
const { nasaPowerConfig } = require('../src/data/nasaPower');
const { version } = require('../package.json');

module.exports = createHandler({
  methods: ['GET'],
  handle: () => ({
    status: 'ok',
    service: 'siembra-satelital-api',
    version,
    time: new Date().toISOString(),
    data: { zones: getZones().length, climateGeneratedAt: getClimateMeta().generatedAt },
    integrations: {
      llm: { configured: isLlmConfigured(), model: llmConfig().model, fallback: 'templates' },
      nasaPower: { liveEnabled: nasaPowerConfig().enabled, baseUrl: nasaPowerConfig().baseUrl, fallback: 'precomputed climate_summary.json' },
    },
  }),
});
