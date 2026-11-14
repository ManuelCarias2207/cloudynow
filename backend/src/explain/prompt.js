const MAX_WORDS = 80;

const SYSTEM_PROMPT = [
  'You explain crop rotation comparisons to small farmers in El Salvador\'s Dry Corridor.',
  `Write at most ${MAX_WORDS} words in plain, friendly English with no jargon.`,
  'Use ONLY the facts and numbers in the evidence JSON. Never invent numbers, crops or advice.',
  'Do not recommend anything that is not in the evidence. Mention one benefit and one risk.',
  'End by reminding that the farmer and the local technician make the final decision.',
].join(' ');

function buildEvidence(rotation, result) {
  return {
    zone: result.zone.name,
    farmerPriority: result.input.priority,
    option: { id: rotation.id, name: rotation.name, rank: rotation.rank, totalScore: rotation.total, of: result.rotations.length },
    similarToOtherOption: result.ranking.similar && rotation.rank <= 2,
    whySuggested: rotation.whySuggested,
    scores: Object.fromEntries(Object.entries(rotation.scores).map(([k, s]) => [k, { score: s.score, reason: s.reason }])),
    nasaIndicators: Object.fromEntries(
      ['annualRain', 'drySpell', 'soilMoisture', 'heatDays', 'bareField'].map((k) => {
        const ind = result.indicators[k];
        return [ind.label, `${ind.value} ${ind.unit}`];
      }),
    ),
    benefits: rotation.benefits,
    risks: rotation.risks,
    dataGaps: rotation.dataGaps,
    confidence: result.confidence.level,
  };
}

function buildMessages(evidence) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Evidence JSON:\n${JSON.stringify(evidence)}` },
  ];
}

function limitWords(text, max = MAX_WORDS) {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text.trim() : `${words.slice(0, max).join(' ')}…`;
}

module.exports = { MAX_WORDS, buildEvidence, buildMessages, limitWords };
