const { createHandler, readJsonBody } = require('../src/lib/http');
const { validateRecommendInput } = require('../src/lib/validation');
const { evaluate } = require('../src/scoring/engine');

module.exports = createHandler({
  methods: ['POST'],
  handle: async (req) => evaluate(validateRecommendInput(await readJsonBody(req))),
});
