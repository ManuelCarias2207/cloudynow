const DIMENSIONS = ['water', 'soil', 'erosion', 'income', 'risk'];
const PRIORITY_DIMENSION = { 'save-water': 'water', 'improve-soil': 'soil', 'extra-income': 'income' };
const PRIORITY_WEIGHT = 0.4;

function weightsForPriority(priority) {
  const focus = PRIORITY_DIMENSION[priority];
  const rest = (1 - PRIORITY_WEIGHT) / (DIMENSIONS.length - 1);
  return Object.fromEntries(DIMENSIONS.map((d) => [d, d === focus ? PRIORITY_WEIGHT : Number(rest.toFixed(4))]));
}

module.exports = { DIMENSIONS, PRIORITY_DIMENSION, weightsForPriority };
