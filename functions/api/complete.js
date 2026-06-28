/* Cloudflare Pages Function — production version of server/index.js.
   Runs only when called (serverless). The API key lives in the Cloudflare
   dashboard as an encrypted environment variable named ANTHROPIC_API_KEY.

   Abuse hardening (this endpoint spends real money on every call):
   - Origin allowlist: only the site itself and the native app shells may call it,
     so other websites can't hotlink it as a free Claude proxy.
   - Scope-locked system prompt: the model will only ever emit parsing JSON, so
     even a spoofed request can't turn it into a general-purpose chatbot.
   - Hard input cap (8k chars) and output cap (1024 tokens) bound the cost per call.
   For volume protection, also add a Cloudflare "Rate limiting rule" on /api/* in
   the dashboard (see LAUNCH_HANDOFF.md) — serverless functions can't keep a
   reliable per-IP counter on their own. */
import Anthropic from '@anthropic-ai/sdk';

// Native shells (Capacitor) make a cross-origin call from these origins.
const NATIVE_ORIGINS = new Set([
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
]);

// Keeps the model on-task no matter what prompt is sent: parsing JSON only.
const SYSTEM_PROMPT =
  'You are a strict JSON parsing engine embedded in a food and fitness tracking app. ' +
  'You only ever output a single JSON object that satisfies the schema given in the user message. ' +
  'You never hold a conversation, answer general questions, give advice, or write prose, code, or ' +
  'explanations, and you never output anything other than the requested JSON. If the input is not a ' +
  'food or workout description that can be parsed, return a minimal JSON object such as {}.';

function allowedOrigin(origin, selfOrigin, env) {
  if (!origin) return null;                       // no Origin header → not an allowed browser/app call
  if (origin === selfOrigin) return origin;       // the site calling itself
  if (NATIVE_ORIGINS.has(origin)) return origin;  // the packaged app
  const extra = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return extra.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });

// CORS preflight for the native app's cross-origin POST.
export function onRequestOptions({ request, env }) {
  const origin = request.headers.get('Origin');
  const selfOrigin = new URL(request.url).origin;
  const allow = allowedOrigin(origin, selfOrigin, env);
  return new Response(null, { status: allow ? 204 : 403, headers: corsHeaders(allow) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  const selfOrigin = new URL(request.url).origin;
  const allow = allowedOrigin(origin, selfOrigin, env);
  if (!allow) return json({ error: 'forbidden' }, 403);

  const cors = corsHeaders(allow);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400, cors);
  }
  const prompt = body && body.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) {
    return json({ error: 'bad_prompt' }, 400, cors);
  }
  if (!env.ANTHROPIC_API_KEY) {
    // key not configured yet — app falls back to its local parsers
    return json({ error: 'ai_unavailable' }, 502, cors);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({
      model: env.EST_MODEL || 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    return json({ text, model: msg.model }, 200, cors);
  } catch (err) {
    return json({ error: 'ai_unavailable' }, 502, cors);
  }
}
