const { evaluate } = require('../scoring/engine');
const { buildEvidence, buildMessages, limitWords } = require('./prompt');
const { complete, isLlmConfigured } = require('./llmClient');
const { renderExplanation } = require('./templates');

async function explainRotation(rotation, result) {
  if (isLlmConfigured()) {
    try {
      const text = await complete(buildMessages(buildEvidence(rotation, result)));
      return { strategyId: rotation.id, source: 'llm', text: limitWords(text) };
    } catch (error) {
      console.warn(`LLM fallback for ${rotation.id}: ${error.message}`);
    }
  }
  return { strategyId: rotation.id, source: 'template', text: renderExplanation(rotation, result) };
}

async function explain(input, strategyId) {
  const result = evaluate(input);
  const targets = strategyId ? result.rotations.filter((r) => r.id === strategyId) : result.rotations;
  const explanations = await Promise.all(targets.map((rotation) => explainRotation(rotation, result)));
  return { zone: result.zone, ranking: result.ranking, explanations, disclaimer: result.disclaimer };
}

module.exports = { explain };
