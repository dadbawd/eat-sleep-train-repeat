/* Client bridge to the AI parsing backend (server/index.js).
   On any failure — offline, server down, credits exhausted, timeout — callers
   catch and fall back to the built-in local parsers, so the app never breaks. */

export function aiAvailable(){
  // offline → don't even try; the local parser handles it instantly
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export async function aiComplete(prompt){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch('/api/complete', {
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
