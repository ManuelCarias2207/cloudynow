const { HttpError } = require('./http');
const { getZone, getCurrentSystem, getCrop } = require('../data/loadData');

const PRIORITIES = ['save-water', 'extra-income', 'improve-soil'];
const SCENARIO_LIMITS = { rainfallChangePct: [-50, 30], temperatureChangeC: [0, 4] };

function validateRecommendInput(body) {
  const errors = [];
  const input = body && typeof body === 'object' ? body : {};

  if (!getZone(input.zoneId)) errors.push({ field: 'zoneId', message: 'Unknown zone. See GET /api/zones' });
  if (!getCurrentSystem(input.currentCrop)) errors.push({ field: 'currentCrop', message: 'Unknown current crop system. See GET /api/crops' });
  if (!PRIORITIES.includes(input.priority)) errors.push({ field: 'priority', message: `Must be one of: ${PRIORITIES.join(', ')}` });

  const constraints = input.constraints || {};
  const avoidCrops = Array.isArray(constraints.avoidCrops) ? constraints.avoidCrops : [];
  avoidCrops.filter((id) => !getCrop(id)).forEach((id) => errors.push({ field: 'constraints.avoidCrops', message: `Unknown crop: ${id}` }));

  const scenario = {};
  for (const [key, [min, max]] of Object.entries(SCENARIO_LIMITS)) {
    const raw = input.scenario?.[key] ?? 0;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) {
      errors.push({ field: `scenario.${key}`, message: `Must be a number between ${min} and ${max}` });
    }
    scenario[key] = value;
  }

  if (errors.length) throw new HttpError(400, 'invalid_input', 'Invalid request body', errors);

  return {
    zoneId: input.zoneId,
    currentCrop: input.currentCrop,
    priority: input.priority,
    constraints: { irrigation: constraints.irrigation === true, avoidCrops },
    scenario,
  };
}

module.exports = { PRIORITIES, SCENARIO_LIMITS, validateRecommendInput };
