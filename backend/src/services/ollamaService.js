// src/services/ollamaService.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)); // Node 18+ may have fetch
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

async function callOllama(prompt, model = 'llama3') {
  const body = { model, prompt, stream: false };
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Ollama error: ' + txt);
  }
  const json = await res.json();

  // Defensive parsing depending on response shape
  if (json?.response) return json.response;
  if (json?.[0]?.text) return json.map(x => x.text).join('\n');
  if (json?.[0]?.response) return json.map(x => x.response).join('\n');

  // fallback
  return JSON.stringify(json);
}

module.exports = { callOllama };
