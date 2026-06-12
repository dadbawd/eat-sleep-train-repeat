/* Cloudflare Pages Function — production version of server/index.js.
   Runs only when called (serverless). The API key lives in the Cloudflare
   dashboard as an encrypted environment variable named ANTHROPIC_API_KEY. */
import Anthropic from '@anthropic-ai/sdk';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const prompt = body && body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) {
    return json({ error: 'bad_prompt' }, 400);
  }
  if (!env.ANTHROPIC_API_KEY) {
    // key not configured yet — app falls back to its local parsers
    return json({ error: 'ai_unavailable' }, 502);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({
      model: env.EST_MODEL || 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    return json({ text, model: msg.model });
  } catch (err) {
    return json({ error: 'ai_unavailable' }, 502);
  }
}
