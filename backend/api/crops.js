const { createHandler } = require('../src/lib/http');
const { getCrops, getCurrentSystems, getTraitDescriptions } = require('../src/data/loadData');
const { PRIORITIES, SCENARIO_LIMITS } = require('../src/lib/validation');

module.exports = createHandler({
  methods: ['GET'],
  handle: () => ({
    currentSystems: getCurrentSystems(),
    priorities: PRIORITIES,
    scenarioLimits: SCENARIO_LIMITS,
    traits: getTraitDescriptions(),
    crops: getCrops(),
    toValidate: true,
  }),
});
