/* Client bridge to the AI parsing backend (server/index.js in dev,
   functions/api/complete.js in production on Cloudflare Pages).
   On any failure — offline, server down, credits exhausted, timeout — callers
   catch and fall back to the built-in local parsers, so the app never breaks. */

/* Where the /api/complete endpoint lives.
   - Web (served from the Cloudflare Pages site): leave VITE_API_BASE empty so we
     call the SAME origin with a relative path — the Pages Function answers it.
   - Native app (Capacitor Android/iOS): the webview is served from
     https://localhost, so a relative path goes nowhere. The native build MUST be
     built with VITE_API_BASE set to the deployed site origin, e.g.
        VITE_API_BASE=https://your-deployed-site.example  npm run build
     See .env.production.example and LAUNCH_HANDOFF.md. */
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

// Are we running inside the packaged native shell (vs. a normal browser tab)?
function isNativeApp(){
  try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  catch { return false; }
}

export function aiAvailable(){
  // offline → don't even try; the local parser handles it instantly
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  // native app with no API base configured → the call can't reach a backend,
  // so skip the 15s timeout and fall straight back to the local parser
  if (isNativeApp() && !API_BASE){
    if (typeof console !== 'undefined') console.warn('[ai] VITE_API_BASE is not set for this native build — AI parsing is disabled; using local parsers. See LAUNCH_HANDOFF.md.');
    return false;
  }
  return true;
}

export async function aiComplete(prompt){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(API_BASE + '/api/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('ai http ' + r.status);
    const data = await r.json();
    if (!data.text) throw new Error('ai empty response');
    return data.text;
  } finally {
    clearTimeout(timer);
  }
}
