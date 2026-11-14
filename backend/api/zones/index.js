const { createHandler } = require('../../src/lib/http');
const { getZones, getClimate } = require('../../src/data/loadData');

module.exports = createHandler({
  methods: ['GET'],
  handle: () => ({
    zones: getZones().map((zone) => {
      const climate = getClimate(zone.id);
      return {
        ...zone,
        dataAvailable: Boolean(climate),
        dataGaps: climate ? climate.dataGaps.map((g) => g.key) : ['all'],
      };
    }),
  }),
});
