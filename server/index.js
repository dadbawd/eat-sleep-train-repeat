/* Eat Sleep Train — AI parsing backend.
   Holds the Anthropic API key (from .env, never shipped to the client) and
   exposes one endpoint the app's food/workout parsers call. If this server
   is down or unreachable, the app falls back to its built-in local parsers. */
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const MODEL = process.env.EST_MODEL || 'claude-haiku-4-5';
const PORT = process.env.EST_AI_PORT || 8787;

// Keep the model on-task no matter what prompt arrives: parsing JSON only.
// (Mirrors the production Cloudflare function in functions/api/complete.js.)
const SYSTEM_PROMPT =
  'You are a strict JSON parsing engine embedded in a food and fitness tracking app. ' +
  'You only ever output a single JSON object that satisfies the schema given in the user message. ' +
  'You never hold a conversation, answer general questions, give advice, or write prose, code, or ' +
  'explanations, and you never output anything other than the requested JSON. If the input is not a ' +
  'food or workout description that can be parsed, return a minimal JSON object such as {}.';

const app = express();
app.use(express.json({ limit: '16kb' }));

app.post('/api/complete', async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) {
    res.status(400).json({ error: 'bad_prompt' });
    return;
  }
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    res.json({ text, model: msg.model });
  } catch (err) {
    // don't leak SDK error details to the client; the app falls back locally
    console.error('[ai] request failed:', err.status || '', err.message);
    res.status(502).json({ error: 'ai_unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`[ai] parsing backend on http://localhost:${PORT} (model: ${MODEL})`);
});
