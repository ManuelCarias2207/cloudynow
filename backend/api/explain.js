const { createHandler, readJsonBody, HttpError } = require('../src/lib/http');
const { validateRecommendInput } = require('../src/lib/validation');
const { explain } = require('../src/explain/explainService');

const STRATEGY_IDS = ['A', 'B', 'C'];

module.exports = createHandler({
  methods: ['POST'],
  handle: async (req) => {
    const body = await readJsonBody(req);
    if (body.strategyId !== undefined && !STRATEGY_IDS.includes(body.strategyId)) {
      throw new HttpError(400, 'invalid_input', `strategyId must be one of: ${STRATEGY_IDS.join(', ')}`);
    }
    return explain(validateRecommendInput(body), body.strategyId);
  },
});
