function llmConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 8000,
  };
}

function isLlmConfigured() {
  return Boolean(llmConfig().apiKey);
}

async function complete(messages) {
  const { apiKey, baseUrl, model, timeoutMs } = llmConfig();
  if (!apiKey) throw new Error('LLM_API_KEY is not set');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 200 }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`LLM responded ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('LLM returned an empty response');
  return text;
}

module.exports = { complete, isLlmConfigured, llmConfig };
