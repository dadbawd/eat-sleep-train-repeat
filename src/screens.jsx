/* Eat Sleep Train — screens. */
import { useState, useEffect, useRef } from 'react';
import { Chevron, Screen, Sparkline, LoopGlyph, fmt, fmtDuration, fmtClock, useRollUp } from './ui.jsx';
import {
  parseFood, parseWorkout, FOOD_DB, LIFT_NAMES, CARDIO_NAMES,
  titleCase, makeCardio, fmtMins, computeInsight,
} from './data.js';
import { aiComplete, aiAvailable } from './ai.js';

// shared lazy text input with optional typeahead suggestions
// `placeholder` may be a string or an array — arrays rotate with a quiet fade while empty
function LazyInput({ placeholder, onSubmit, autoFocus, suggest }) {
  const [val, setVal] = useState('');
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [phIdx, setPhIdx] = useState(0);
  const [phFade, setPhFade] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  const phList = Array.isArray(placeholder) ? placeholder : [placeholder];
  useEffect(() => {
    if (phList.length < 2 || val) return;
    const id = setInterval(() => {
      setPhFade(true);
      setTimeout(() => { setPhIdx(i => (i + 1) % phList.length); setPhFade(false); }, 220);
    }, 3200);
    return () => clearInterval(id);
  }, [phList.length, val]);

  // split the trailing segment so suggestions track the food/exercise being typed
  const parts = val.split(/,|\band\b|\bwith\b|\+|&|\bthen\b/i);
  const fragment = parts[parts.length - 1];
  const lead = fragment.match(/^(\s*(?:\d+(?:\.\d+)?\s*(?:oz|g|lb|lbs)?|\d+\/\d+)?\s*)/i);
  const qtyPart = lead ? lead[1] : '';
  const query = fragment.slice(qtyPart.length);
  const prefix = val.slice(0, val.length - fragment.length) + qtyPart;

  const suggestions = (suggest && focused && query.trim().length >= 2) ? suggest(query) : [];
  const showSug = suggestions.length > 0;

  const go = () => { const v = val.trim(); if (!v) return; onSubmit(v); setVal(''); setActive(-1); };
  const pick = item => {
    setVal(prefix + item.value + ' ');
    setActive(-1);
    if (ref.current) ref.current.focus();
  };
  const onKey = e => {
    if (showSug && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setActive(a => {
        const n = suggestions.length;
        return e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSug && active >= 0) pick(suggestions[active]); else go();
    } else if (e.key === 'Escape') {
      setActive(-1); setFocused(false);
    }
  };

  return (
    <div className="suggest-wrap">
      <div className="inputbar">
        <input
          ref={ref}
          value={val}
          onChange={e => { setVal(e.target.value); setActive(-1); setFocused(true); }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={phList[phIdx]}
          style={{ '--ph-o': phFade ? 0 : 1 }}
          className="lazyinput"
          autoCapitalize="none" autoCorrect="off" spellCheck="false"
        />
        <button className={'submit' + (val.trim() ? ' on' : '')} onClick={go} aria-label="Log">
          <Chevron dir="up" size={20} color={val.trim() ? '#0c0d10' : 'var(--text-faint)'} w={2.4} />
        </button>
      </div>
      {showSug && (
        <div className="suggest-list">
          {suggestions.map((s, i) => (
            <button
              key={s.value + i}
              className={'suggest-row' + (i === active ? ' active' : '')}
              onMouseDown={e => { e.preventDefault(); pick(s); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="suggest-label">{s.label}</span>
              {s.meta ? <span className="suggest-meta">{s.meta}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// suggestion builders ------------------------------------------------
function foodSuggest(q) {
  q = q.toLowerCase().trim();
  const seen = new Set(), starts = [], contains = [];
  for (const key of Object.keys(FOOD_DB)) {
    const f = FOOD_DB[key];
    const name = f.name || titleCase(key);
    if (seen.has(name)) continue;
    const k = key.toLowerCase();
    if (k.startsWith(q) || name.toLowerCase().startsWith(q)) { starts.push({ key, name, f }); seen.add(name); }
    else if (k.includes(q)) { contains.push({ key, name, f }); seen.add(name); }
  }
  return [...starts, ...contains].slice(0, 6).map(({ key, name, f }) => ({
    label: name, meta: `${f.kcal} · ${f.protein}g`, value: key,
  }));
}
function exerciseSuggest(q) {
  q = q.toLowerCase().trim();
  const seen = new Set(), starts = [], contains = [];
  const scan = (entries, meta) => {
    for (const [k, name] of entries) {
      if (seen.has(name)) continue;
      if (k.startsWith(q) || name.toLowerCase().startsWith(q)) { starts.push({ name, meta }); seen.add(name); }
      else if (k.includes(q)) { contains.push({ name, meta }); seen.add(name); }
    }
  };
  scan(Object.entries(LIFT_NAMES), '');
  scan(Object.entries(CARDIO_NAMES), 'cardio');
  return [...starts, ...contains].slice(0, 6).map(({ name, meta }) => ({ label: name, meta, value: name }));
}

// AI food-parsing prompt (used for items the local pantry can't resolve) -----
const FOOD_PROMPT = `You are the food-parsing engine for a minimal nutrition tracker. The user types what they ate in casual, lazy natural language. Your job is to identify each food item and estimate its calories and protein.

Return ONLY a valid JSON object. No preamble, no explanation, no markdown code fences. Just the raw JSON.

Schema:
{
  "items": [
    { "name": "string — clean display name of the food", "quantity": "string — the portion you assumed, e.g. '2 large' or '1 cup'", "calories": number, "protein_g": number }
  ],
  "total_calories": number,
  "total_protein_g": number,
  "needs_clarification": boolean,
  "clarification": "string — see format below; empty string when needs_clarification is false"
}

Clarification format (only when needs_clarification is true):
Write a short question, then each tappable option, ALL separated by ' / '. The question comes first and must NOT contain any option text. 2-4 options.
Example: "Which McDonald's order? / Big Mac Meal / Quarter Pounder Meal / 10pc Nuggets Meal"

Rules:
- Estimate reasonable default portions when the user doesn't specify (e.g. "a bowl of oatmeal" = ~1 cup cooked). State the assumed portion in the "quantity" field.
- For known chain restaurants (McDonald's, Chipotle, Olive Garden, etc.), use their actual published nutrition values.
- For packaged or branded items, use typical label values.
- For homemade or vague items, estimate and round to sensible numbers.
- Round calories to the nearest 5 and protein to the nearest whole gram.
- Set needs_clarification to TRUE only when an item is genuinely unresolvable — for example a restaurant combo referenced by number ("number 5 at McDonald's") where you cannot know which item it is. When you CAN reasonably estimate, do NOT ask — just estimate.
- When needs_clarification is true, still return your best-guess items, but populate the clarification field with a short question and tappable options.
- Never refuse. Never lecture about health, calories, or diet. Just return the numbers.

User input: "{USER_TEXT}"`;

async function aiParseFood(text){
  const raw = await aiComplete(FOOD_PROMPT.replace('{USER_TEXT}', text.replace(/"/g, "'")));
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no json');
  return JSON.parse(m[0]);
}

// AI workout-parsing prompt (handles notes, units, repeat-matching) ----------
const WORKOUT_PROMPT = `You are the workout-parsing engine for a minimal fitness tracker. The user types what they trained in casual, lazy natural language. Your job is to parse it into clean structured exercises, and to recognize when they're repeating something they've done recently so they can re-log it effortlessly.

Return ONLY a valid JSON object. No preamble, no explanation, no markdown code fences. Just the raw JSON.

Schema:
{
  "exercises": [
    { "name": "string — clean exercise name, e.g. 'Bench Press'", "sets": number or null, "reps": number or null, "weight": number or null, "weight_unit": "lb" or "kg" or null, "duration_min": number or null, "distance": number or null, "distance_unit": "mi" or "km" or null, "notes": "string — anything that doesn't fit the fields, e.g. 'to failure', 'incline'. Empty string if none." }
  ],
  "session_type": "string — short label: 'lifting', 'cardio', or 'mixed'",
  "matched_recent": boolean,
  "matched_label": "string — if this closely matches a recent workout, name it, e.g. 'Same as Monday: Push Day'. Otherwise empty string."
}

Rules:
- Parse natural lazy input. "bench 3x5 at 185" = Bench Press, 3 sets, 5 reps, 185 lb. "ran 30 min" = Run, duration_min 30, session_type cardio. "ran 3 miles in 25 min" = Run, duration_min 25, distance 3, distance_unit mi.
- For cardio, always fill duration_min and/or distance when the user gives them — do not bury them in notes.
- Assume pounds (lb) unless the user says kg or the weight is clearly metric.
- If the user doesn't give sets/reps/weight, set those fields to null — don't invent numbers.
- Use standard exercise names for display, but don't be pedantic — keep the user's intent.
- Compare the input against the RECENT WORKOUTS provided below. If the current input closely matches a recent session (same main exercises), set matched_recent to true and describe the match in matched_label so the app can offer one-tap re-logging. If it's new or clearly different, set matched_recent to false.
- Never lecture about training, form, or programming. Never suggest routines. Just parse what they did.

RECENT WORKOUTS (most recent first):
{RECENT_WORKOUTS_JSON}

User input: "{USER_TEXT}"`;

async function aiParseWorkout(text, sessions){
  const ctx = sessions.map(s => ({ label: s.label, day: s.day, exercises: s.exercises.map(e => e.name) }));
  const prompt = WORKOUT_PROMPT
    .replace('{RECENT_WORKOUTS_JSON}', JSON.stringify(ctx))
    .replace('{USER_TEXT}', text.replace(/"/g, "'"));
  const raw = await aiComplete(prompt);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no json');
  return JSON.parse(m[0]);
}

// build a lift/cardio log item from sets/reps/weight (+ optional notes)
function makeLift(name, sets, reps, weight, notes){
  const e1rm = (weight != null && reps) ? Math.round(weight * (1 + reps / 30)) : null;
  const volume = (weight != null && sets && reps) ? sets * reps * weight : (sets && reps) ? sets * reps : 0;
  const detail = [
    (sets && reps) ? `${sets} × ${reps}` : reps ? `${reps} reps` : sets ? `${sets} sets` : '',
    weight != null ? `${weight} lb` : '',
    notes || '',
  ].filter(Boolean).join('  ·  ');
  return { kind: 'lift', name, sets, reps, weight, e1rm, volume, detail, note: notes || '' };
}

// ── EAT ──────────────────────────────────────────────────────────────
let _fid = 0;
function EatScreen({ onBack, foodLog, setFoodLog }) {
  const [pending, setPending] = useState(null);   // ambiguous clarify
  const [loading, setLoading] = useState(false);   // AI in flight
  const [flashIds, setFlashIds] = useState(() => new Set());  // rows logged this visit
  const kcal = useRollUp(foodLog.reduce((s, f) => s + f.kcal, 0));
  const protein = useRollUp(foodLog.reduce((s, f) => s + f.protein, 0));

  const addItems = items => {
    const stamped = items.map(it => ({ ...it, id: `${Date.now()}_${++_fid}` }));
    setFlashIds(prev => new Set([...prev, ...stamped.map(s => s.id)]));
    setFoodLog(prev => [...stamped, ...prev]);
  };

  const cleanQty = (q, name = '') => {
    if (!q) return null;
    let t = String(q).trim().toLowerCase();
    t = t.replace(/\([^)]*\)/g, ' ');                                   // drop "(21 oz)" parentheticals
    t = t.replace(/\b(entree|entr[ée]+e?|serving|servings|order|portion|item|items|regular|each|piece|pieces|bowl|bowls|cup|cups|glass|glasses|bottle|bottles|can|cans|slice|slices|burger|sandwich|wrap|plate|scoop|scoops|bar|link|links|patty|stick|packet|container|box|bag)\b/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    if (!t) return null;
    const numMatch = t.match(/^(\d+(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1]) : null;
    const words = t.split(' ').filter(w => !/^\d/.test(w));
    const nameLow = name.toLowerCase();
    // label words already echoed by the food name → redundant
    if (words.length && words.every(w => nameLow.includes(w))) {
      return num && num > 1 ? `${num}×` : null;
    }
    if (!words.length) return num && num > 1 ? `${num}×` : null;
    return t.replace(/^1 /, '');   // "1 large" → "large"
  };
  const handleAI = json => {
    if (json.needs_clarification && json.clarification) {
      const parts = json.clarification.split('/').map(s => s.trim()).filter(Boolean);
      const q = parts.shift() || 'Which one?';
      setPending({ prompt: q, ai: true, options: parts.map(p => ({ label: p, value: p })) });
    } else {
      addItems((json.items || []).map(it => ({
        name: it.name || 'Food',
        kcal: Math.round(+it.calories || 0),
        protein: Math.round(+it.protein_g || 0),
        qtyLabel: cleanQty(it.quantity, it.name || ''),
      })));
    }
  };
  // ask the AI engine; fall back to the local result on error / offline
  const runAI = async (raw, localFallback) => {
    if (!aiAvailable()) { localFallback(); return; }
    setLoading(true);
    try { handleAI(await aiParseFood(raw)); }
    catch (e) { localFallback(); }
    finally { setLoading(false); }
  };
  const localResolve = raw => () => {
    const res = parseFood(raw);
    if (res.ambiguous) setPending(res); else addItems(res.items);
  };

  const submit = raw => {
    setPending(null);
    // restaurant / brand mention → always use AI (real published values, full meal)
    const BRANDS = /\b(mcdonald|chipotle|starbucks|chick.?fil|panera|subway|wendy|burger king|taco bell|kfc|popeye|dunkin|olive garden|cheesecake factory|in.?n.?out|five guys|domino|pizza hut|papa john|sweetgreen|panda express|shake shack|jersey mike|raising cane|dairy queen|sonic|arby|jimmy john|qdoba|ihop|denny|applebee|chili|buffalo wild|texas roadhouse|outback|cava|wingstop|whataburger|culver|portillo)/i;
    if (BRANDS.test(raw)) { runAI(raw, localResolve(raw)); return; }
    const local = parseFood(raw);
    // local fully resolved (everything known, fully explained, no estimates) → instant
    if (local.items && local.items.length && !local.items.some(i => i.est) && !local.uncertain) { addItems(local.items); return; }
    // unknown / branded / combo → let the AI engine handle it
    runAI(raw, localResolve(raw));
  };
  const choose = opt => {
    setPending(null);
    if (opt.value !== undefined) { runAI(opt.value, localResolve(opt.value)); return; }
    addItems([{ name: opt.log || opt.name, kcal: opt.kcal, protein: opt.protein, est: opt.est }]);
  };
  const [editId, setEditId] = useState(null);
  const removeFood = id => { setFoodLog(prev => prev.filter(f => f.id !== id)); setEditId(null); };

  return (
    <Screen title="EAT" onBack={onBack}>
      <div className="totalrow">
        <div className="totalmetric">
          <div className="bignum">{fmt(kcal)}</div>
          <div className="metriclabel">KCAL TODAY</div>
        </div>
        <div className="totalmetric">
          <div className="bignum">{fmt(protein)}<span className="unit">g</span></div>
          <div className="metriclabel">PROTEIN</div>
        </div>
      </div>

      <LazyInput placeholder="two eggs and toast…" autoFocus onSubmit={submit} suggest={foodSuggest} />

      {pending && (
        <div className="clarify pop">
          <div className="clarify-q">{pending.prompt}</div>
          <div className="clarify-opts">
            {pending.options.map((o, i) => (
              <button key={i} className="chip" onClick={() => choose(o)}>
                <span>{o.label || o.name}</span>
                {o.kcal != null ? <span className="chip-meta">{fmt(o.kcal)} · {o.protein}g</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="loglist">
        {loading && (
          <div className="logitem ai-row">
            <div className="logitem-name"><span className="ai-dot" />Estimating…</div>
            <div className="logitem-macros"><span className="kcal">· · ·</span></div>
          </div>
        )}
        {foodLog.length === 0 && !pending && !loading && (
          <div className="empty">Type what you ate. No portions, no labels.</div>
        )}
        {foodLog.map(f => (
          <div key={f.id} className={'logitem tappable pop' + (flashIds.has(f.id) ? ' flash' : '') + (editId === f.id ? ' editing' : '')}
               onClick={() => setEditId(editId === f.id ? null : f.id)}>
            <div className="logitem-name">
              {f.qtyLabel ? <span className="qty">{f.qtyLabel} </span> : f.qty > 1 ? <span className="qty">{f.qty}× </span> : null}{f.name}
              {f.est ? <span className="esttag">≈ est</span> : null}
            </div>
            {editId === f.id
              ? <button className="inline-remove" onClick={e => { e.stopPropagation(); removeFood(f.id); }}>REMOVE</button>
              : (
                <div className="logitem-macros">
                  <span className="kcal">{fmt(f.kcal)}</span>
                  <span className="pro">{f.protein}g</span>
                </div>
              )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ── TRAIN ────────────────────────────────────────────────────────────
let _tid = 0;
function TrainScreen({ onBack, trainLog, setTrainLog, sessions = [] }) {
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState(null);   // {label, session} repeat suggestion
  const [flashIds, setFlashIds] = useState(() => new Set());  // rows logged this visit
  const lifts = trainLog.filter(t => t.kind === 'lift').length;
  const cardio = trainLog.filter(t => t.kind === 'cardio').length;
  const volume = useRollUp(trainLog.reduce((s, t) => s + (t.volume || 0), 0));

  const addItems = items => {
    const stamped = items.map(it => ({ ...it, id: `${Date.now()}_${++_tid}` }));
    setFlashIds(prev => new Set([...prev, ...stamped.map(s => s.id)]));
    setTrainLog(prev => [...stamped, ...prev]);
  };

  // log a whole saved session's exercises in one tap (lifts + cardio)
  const logSession = sess => {
    addItems(sess.exercises.map(e => e.kind === 'cardio'
      ? makeCardio(e.name, e.mins ?? null, e.dist ?? null, e.distUnit ?? null)
      : makeLift(e.name, e.sets ?? null, e.reps ?? null, e.weight ?? null, '')));
    setMatched(null);
  };
  const findSession = label => {
    const low = (label || '').toLowerCase();
    return sessions.find(s => low.includes(s.label.toLowerCase()) || low.includes(s.day.toLowerCase())) || null;
  };

  // map an AI exercise → a log item
  const aiToItem = e => {
    let weight = e.weight ?? null;
    if (weight != null && e.weight_unit === 'kg') weight = Math.round(weight * 2.20462);
    const notes = (e.notes || '').trim();
    const mins = e.duration_min ?? null;
    const dist = e.distance ?? null;
    const hasStrength = e.sets != null || e.reps != null || weight != null;
    if (!hasStrength && (mins != null || dist != null)) {
      const c = makeCardio(e.name, mins, dist, e.distance_unit || null);
      if (notes) c.note = notes;
      return c;
    }
    if (hasStrength) return makeLift(e.name, e.sets ?? null, e.reps ?? null, weight, notes);
    return { kind: 'cardio', name: e.name, detail: notes, volume: 0 };
  };
  const handleAI = json => {
    addItems((json.exercises || []).map(aiToItem));
    if (json.matched_recent && json.matched_label) setMatched({ label: json.matched_label, session: findSession(json.matched_label) });
    else setMatched(null);
  };
  const runAI = async raw => {
    if (!aiAvailable()) { const r = parseWorkout(raw); addItems(r.items); return; }
    setLoading(true);
    try { handleAI(await aiParseWorkout(raw, sessions)); }
    catch (e) { const r = parseWorkout(raw); addItems(r.items); }
    finally { setLoading(false); }
  };

  const submit = raw => {
    setMatched(null);
    const local = parseWorkout(raw);
    const hasNote = local.items.some(i => i.kind === 'other');
    // notes / units / repeat-references / unparseable → use the AI engine
    const aiSignal = hasNote || local.items.length === 0
      || /\b(same|again|repeat|like|last|monday|tuesday|wednesday|thursday|friday|saturday|sunday|yesterday|failure|drop ?set|super ?set|amrap|emom|circuit|kg|each side|per side|to fail|warm ?up)\b/i.test(raw);
    if (!aiSignal) { addItems(local.items); return; }
    runAI(raw);
  };

  const recompute = t => {
    const { sets, reps, weight } = t;
    const e1rm = (weight != null && reps) ? Math.round(weight * (1 + reps / 30)) : null;
    const volume = (weight != null && sets && reps) ? sets * reps * weight : (sets && reps) ? sets * reps : 0;
    const detail = [
      (sets && reps) ? `${sets} × ${reps}` : reps ? `${reps} reps` : sets ? `${sets} sets` : '',
      weight != null ? `${weight} lb` : '',
    ].filter(Boolean).join('  @  ');
    return { ...t, e1rm, volume, detail };
  };
  const numVal = v => v === '' ? null : Math.max(0, Math.round(+v) || 0);
  const numValF = v => v === '' ? null : Math.max(0, parseFloat(v) || 0);
  const patchLift = (id, key, val) => setTrainLog(prev => prev.map(t => t.id === id ? recompute({ ...t, [key]: val }) : t));
  const patchCardio = (id, key, val) => setTrainLog(prev => prev.map(t => {
    if (t.id !== id) return t;
    const next = { ...t, [key]: val };
    return { ...makeCardio(next.name, next.mins, next.dist, next.distUnit), id: t.id, note: t.note };
  }));
  const removeEntry = id => { setTrainLog(prev => prev.filter(t => t.id !== id)); setEditId(null); };

  return (
    <Screen title="TRAIN" onBack={onBack}>
      <div className="totalrow">
        <div className="totalmetric">
          <div className="bignum">{lifts + cardio}</div>
          <div className="metriclabel">MOVEMENTS</div>
        </div>
        <div className="totalmetric">
          <div className="bignum">{volume ? fmt(volume) : '—'}<span className="unit">{volume ? 'lb' : ''}</span></div>
          <div className="metriclabel">VOLUME</div>
        </div>
      </div>

      <LazyInput placeholder={['bench 3x5 at 185…', 'ran 3 miles in 25 min…', 'squat 5x5 315…', 'bike 45 min…']} autoFocus onSubmit={submit} suggest={exerciseSuggest} />

      {matched && (
        <div className="matched pop">
          <div className="matched-label"><span className="ai-dot" />{matched.label}</div>
          {matched.session && (
            <button className="matched-btn" onClick={() => logSession(matched.session)}>
              Re-log all {matched.session.exercises.length}
            </button>
          )}
        </div>
      )}

      <div className="loglist">
        {loading && (
          <div className="logitem ai-row">
            <div className="logitem-name"><span className="ai-dot" />Reading…</div>
            <div className="logitem-detail">· · ·</div>
          </div>
        )}
        {trainLog.length === 0 && !loading && (
          <div className="recent">
            {sessions.length > 0 ? (
              <>
                <div className="recent-head">REPEAT A RECENT SESSION</div>
                {sessions.map(s => (
                  <button key={s.id} className="recent-chip" onClick={() => logSession(s)}>
                    <span className="rc-main">
                      <span className="rc-day">{s.day}</span>
                      <span className="rc-label">{s.label}</span>
                    </span>
                    <span className="rc-meta">{s.exercises.length} exercises ↻</span>
                  </button>
                ))}
                <div className="recent-hint">…or just type it: “incline bench 3x10 at 150”, “ran 30 min”</div>
              </>
            ) : (
              <div className="empty">Type your sets and they log clean.<br />Your past sessions show up here to repeat in one tap.</div>
            )}
          </div>
        )}
        {trainLog.map(t => t.kind === 'lift' ? (
          editId === t.id ? (
            <div key={t.id} className="liftcard editing">
              <div className="lift-top">
                <span className="lift-name">{t.name}</span>
                <button className="lift-done" onClick={() => setEditId(null)}>DONE</button>
              </div>
              <div className="lift-metrics edit">
                <label className="lm le">
                  <input inputMode="numeric" value={t.sets ?? ''} placeholder="–"
                    onChange={e => patchLift(t.id, 'sets', numVal(e.target.value))} />
                  <i>SETS</i>
                </label>
                <label className="lm le">
                  <input inputMode="numeric" value={t.reps ?? ''} placeholder="–"
                    onChange={e => patchLift(t.id, 'reps', numVal(e.target.value))} />
                  <i>REPS</i>
                </label>
                <label className="lm le">
                  <input inputMode="numeric" value={t.weight ?? ''} placeholder="BW"
                    onChange={e => patchLift(t.id, 'weight', numVal(e.target.value))} />
                  <i>LOAD · LB</i>
                </label>
              </div>
              <button className="row-remove" onClick={() => removeEntry(t.id)}>REMOVE</button>
            </div>
          ) : (
            <div key={t.id} className={'liftcard tappable pop' + (flashIds.has(t.id) ? ' flash' : '')} onClick={() => setEditId(t.id)} title="Tap to edit">
              <div className="lift-top">
                <span className="lift-name">{t.name}</span>
                {t.weight != null && t.volume
                  ? <span className="lift-vol">{fmt(t.volume)} <i>lb vol</i></span>
                  : (t.sets && t.reps)
                    ? <span className="lift-vol">{t.sets * t.reps} <i>total reps</i></span>
                    : null}
              </div>
              <div className="lift-metrics">
                <div className="lm">
                  <b>{t.sets && t.reps ? `${t.sets}×${t.reps}` : t.reps ? t.reps : t.sets ? t.sets : '—'}</b>
                  <i>{t.sets && t.reps ? 'SETS × REPS' : t.reps ? 'REPS' : 'SETS'}</i>
                </div>
                <div className="lm">
                  <b>{t.weight != null ? t.weight : 'BW'}{t.weight != null ? <u>lb</u> : null}</b>
                  <i>LOAD</i>
                </div>
                <div className="lm accent">
                  <b>{t.e1rm != null ? t.e1rm : '—'}{t.e1rm != null ? <u>lb</u> : null}</b>
                  <i>EST 1RM</i>
                </div>
              </div>
              {t.note ? <div className="lift-note">{t.note}</div> : null}
            </div>
          )
        ) : t.kind === 'cardio' ? (
          editId === t.id ? (
            <div key={t.id} className="liftcard editing pop">
              <div className="lift-top">
                <span className="lift-name">{t.name}</span>
                <button className="lift-done" onClick={() => setEditId(null)}>DONE</button>
              </div>
              <div className="lift-metrics edit">
                <label className="lm le">
                  <input inputMode="decimal" value={t.mins ?? ''} placeholder="–"
                    onChange={e => patchCardio(t.id, 'mins', numValF(e.target.value))} />
                  <i>TIME · MIN</i>
                </label>
                <label className="lm le">
                  <input inputMode="decimal" value={t.dist ?? ''} placeholder="–"
                    onChange={e => patchCardio(t.id, 'dist', numValF(e.target.value))} />
                  <i>DIST · {(t.distUnit || 'mi').toUpperCase()}</i>
                </label>
              </div>
              <button className="row-remove" onClick={() => removeEntry(t.id)}>REMOVE</button>
            </div>
          ) : (
            <div key={t.id} className={'liftcard tappable pop' + (flashIds.has(t.id) ? ' flash' : '')} onClick={() => setEditId(t.id)} title="Tap to edit">
              <div className="lift-top">
                <span className="lift-name">{t.name}</span>
                <span className="kindtag cardio">cardio</span>
              </div>
              <div className="lift-metrics">
                <div className="lm">
                  <b>{t.mins != null ? fmtMins(t.mins) : '—'}</b>
                  <i>TIME</i>
                </div>
                <div className="lm">
                  <b>{t.dist != null ? t.dist : '—'}{t.dist != null ? <u>{t.distUnit}</u> : null}</b>
                  <i>DISTANCE</i>
                </div>
                <div className="lm accent">
                  <b>{t.pace || '—'}{t.pace ? <u>/{t.distUnit}</u> : null}</b>
                  <i>PACE</i>
                </div>
              </div>
              {t.note ? <div className="lift-note">{t.note}</div> : null}
            </div>
          )
        ) : (
          <div key={t.id} className={'logitem tappable pop' + (flashIds.has(t.id) ? ' flash' : '') + (editId === t.id ? ' editing' : '')}
               onClick={() => setEditId(editId === t.id ? null : t.id)}>
            <div className="logitem-name">
              {t.name}
              <span className="kindtag">note</span>
            </div>
            {editId === t.id
              ? <button className="inline-remove" onClick={e => { e.stopPropagation(); removeEntry(t.id); }}>REMOVE</button>
              : <div className="logitem-detail">{t.detail}</div>}
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ── SLEEP ────────────────────────────────────────────────────────────
function SleepScreen({ onBack, sleep, setSleep }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!sleep.sleeping) return;
    const id = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [sleep.sleeping]);

  const toggle = () => {
    if (sleep.sleeping) {
      const dur = Date.now() - sleep.bedAt;
      setSleep({ sleeping: false, bedAt: null, lastDuration: dur, lastEnd: Date.now() });
    } else {
      setSleep({ ...sleep, sleeping: true, bedAt: Date.now() });
    }
  };

  const elapsed = sleep.sleeping ? Date.now() - sleep.bedAt : 0;

  return (
    <Screen title="SLEEP" onBack={onBack}>
      <div className={'sleepwrap' + (sleep.sleeping ? ' asleep' : '')}>
        {/* fixed-height slot so the button never moves when the timer appears */}
        <div className="sleep-status">
          {sleep.sleeping ? (
            <>
              <div className="sleep-since">In bed since {new Date(sleep.bedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>
              <div className="sleep-timer">{fmtClock(elapsed)}</div>
            </>
          ) : sleep.lastDuration ? (
            <>
              <div className="sleep-since">Last night</div>
              <div className="sleep-last">{fmtDuration(sleep.lastDuration)}</div>
            </>
          ) : (
            <div className="sleep-since">No sleep logged yet</div>
          )}
        </div>

        <button className={'sleepbtn' + (sleep.sleeping ? ' awake' : '')} onClick={toggle}>
          {sleep.sleeping ? "I’m awake" : 'Going to bed'}
        </button>

        <div className="sleep-hint">
          {sleep.sleeping ? 'Tap when you wake up. We’ll log the time between.' : 'One tap now, one tap in the morning.'}
        </div>
      </div>
    </Screen>
  );
}

// ── REPEAT ───────────────────────────────────────────────────────────
function RepeatScreen({ onBack, today, history, colors }) {
  const histDays = (history && history.days) || [];
  const todayDay = { dow: 'Today', kcal: today.kcal, protein: today.protein, sleep: today.sleep, train: today.train, hasData: today.hasData, isToday: true };
  const timeline = [...histDays, todayDay];
  const dataDays = timeline.filter(d => d.hasData);
  const enough = dataDays.length >= 2;

  // honest empty state — no fabricated personal history
  if (!enough) {
    return (
      <Screen title="REPEAT" onBack={onBack} right={<LoopGlyph size={15} color="var(--text-dim)" />}>
        <div className="repeat-empty">
          <div className="re-spark">
            {[0,1,2,3].map(i => (
              <div key={i} className="re-row">
                <span className="re-cap">{['CALORIES','PROTEIN','SLEEP','TRAINING'][i]}</span>
                <div className="re-flat" />
              </div>
            ))}
          </div>
          <div className="re-msg">
            <LoopGlyph size={20} color="var(--text-dim)" />
            <div className="re-msg-t">Log a few days and your patterns show up here</div>
            <div className="re-msg-s">{dataDays.length === 1 ? 'One day in. Keep going — the loop needs a couple of days to draw.' : 'Eat, sleep, and train track themselves. Come back after a few days.'}</div>
          </div>
        </div>
      </Screen>
    );
  }

  // real charts from real days only
  const days = dataDays;
  const labels = days.map(d => d.isToday ? 'Today' : d.dow);
  const last = days[days.length - 1];
  const series = [
    { key: 'kcal',    title: 'CALORIES', data: days.map(d => d.kcal),    cur: last.kcal,    unit: '' },
    { key: 'protein', title: 'PROTEIN',  data: days.map(d => d.protein), cur: last.protein, unit: 'g' },
    { key: 'sleep',   title: 'SLEEP',    data: days.map(d => d.sleep),   cur: last.sleep,   unit: 'h', fix: 1 },
    { key: 'train',   title: 'TRAINING', data: days.map(d => d.train),   cur: last.train,   unit: '', vol: true },
  ];
  const insight = computeInsight(history, today);

  return (
    <Screen title="REPEAT" onBack={onBack}
      right={<LoopGlyph size={15} color="var(--text-dim)" />}>
      <div className="repeat-intro">{days.length} day{days.length>1?'s':''} logged · your real trend</div>

      <div className="sparkstack">
        {series.map(s => (
          <div key={s.key} className="sparkrow">
            <div className="sparkhead">
              <span className="sparktitle">{s.title}</span>
              <span className="sparkcur">
                {s.vol ? (s.cur > 0 ? 'trained' : 'rest')
                  : s.fix ? s.cur.toFixed(1) + s.unit
                  : fmt(s.cur) + s.unit}
              </span>
            </div>
            <Sparkline data={s.data} width={300} height={46} accent={(colors && colors[s.key]) || 'var(--accent)'}
                       goal={s.goal} />
            <div className="sparkdays">
              {labels.map((l, i) => (
                <span key={i} className={'sparkday' + (i === labels.length - 1 ? ' now' : '')}
                      style={i === labels.length - 1 && colors && colors[s.key] ? { color: colors[s.key] } : undefined}>{l[0]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="insight">
        <span className="insight-dot" />
        {insight || 'Keep logging — clearer patterns surface after about a week of real days.'}
      </div>
    </Screen>
  );
}

export { EatScreen, TrainScreen, SleepScreen, RepeatScreen, LazyInput };
