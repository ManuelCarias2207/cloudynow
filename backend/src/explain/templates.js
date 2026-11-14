const { limitWords } = require('./prompt');

const DIMENSION_LABEL = { water: 'water use', soil: 'soil health', erosion: 'erosion protection', income: 'income', risk: 'climate resilience' };
const PRIORITY_LABEL = { 'save-water': 'saving water', 'extra-income': 'extra income', 'improve-soil': 'better soil' };

function renderExplanation(rotation, result) {
  const { indicators, ranking, input, zone } = result;
  const position = ranking.similar && rotation.rank <= 2
    ? 'scores about the same as the other top option'
    : `ranks ${rotation.rank} of ${result.rotations.length}`;
  const [best, bestScore] = Object.entries(rotation.scores).sort((a, b) => b[1].score - a[1].score)[0];

  return limitWords([
    `In ${zone.name}, option ${rotation.id} (${rotation.name}) ${position} for ${PRIORITY_LABEL[input.priority]}, with a score of ${rotation.total}.`,
    `NASA data shows about ${indicators.annualRain.value} mm of rain per year and ${indicators.heatDays.value} very hot days.`,
    `Its strongest point is ${DIMENSION_LABEL[best]} (${bestScore.score} of 1). ${rotation.benefits[0]}`,
    rotation.risks[0] ? `Watch out: ${rotation.risks[0]}` : '',
    'You and your local technician make the final decision.',
  ].filter(Boolean).join(' '));
}

module.exports = { renderExplanation };
