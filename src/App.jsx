/* Eat Sleep Train — Home + App root. */
import { useState, useEffect } from 'react';
import { Chevron, LoopGlyph, Sparkline, fmt, fmtDuration } from './ui.jsx';
import { EatScreen, SleepScreen, TrainScreen, RepeatScreen } from './screens.jsx';
import { reconcileHistory, EMPTY_WORKING, computeTotals, recentSessions, normalizeLift } from './data.js';

const PILLAR_ICONS = {
  eat: `${import.meta.env.BASE_URL}pillar-icons/eat-icon.png`,
  sleep: `${import.meta.env.BASE_URL}pillar-icons/sleep-icon.png`,
  train: `${import.meta.env.BASE_URL}pillar-icons/train-icon.png`,
};

const BRAND_LOGO = `${import.meta.env.BASE_URL}brand/estr-logo.png`;

function StatusDot({ on, hue }) {
  return <span className={'sdot' + (on ? ' on' : '')} style={on && hue ? { background: hue, boxShadow: `0 0 9px ${hue}` } : undefined} />;
}

function PillarAsset({ type, size = 28 }) {
  return <img className="pillar-asset" src={PILLAR_ICONS[type]} alt="" width={size} height={size} draggable="false" />;
}

function HomeButton({ label, sub, on, onClick, hue, iconType }) {
  return (
    <button className="homebtn" onClick={onClick} style={hue ? { '--btn-accent': hue } : undefined}>
      <span className="hb-left">
        {iconType ? <span className="hb-glyph"><PillarAsset type={iconType} size={42} /></span> : null}
        <span className="hb-label">{label}</span>
      </span>
      <span className="hb-right">
        <span className="hb-sub">{sub}</span>
        <StatusDot on={on} hue={hue} />
        <Chevron dir="right" size={18} color="var(--text-faint)" />
      </span>
    </button>
  );
}

function Home({ go, foodLog, trainLog, sleep, today, btnStyle, hues, history }) {
  const kcal = today.kcal, protein = today.protein;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const sleepStr = sleep.sleeping ? 'In bed now'
    : sleep.lastDuration ? fmtDuration(sleep.lastDuration) : 'Not logged';
  const lifts = trainLog.filter(t => t.kind === 'lift').length;
  const cardio = trainLog.filter(t => t.kind === 'cardio').length;
  const trainStr = trainLog.length === 0 ? 'Rest day'
    : [lifts ? `${lifts} lift${lifts>1?'s':''}` : '', cardio ? `${cardio} cardio` : ''].filter(Boolean).join(' · ');

  // real mini-trend for the REPEAT strip (no fabricated history)
  const histDays = (history && history.days) || [];
  const kseries = [...histDays.slice(-6).map(d => d.kcal), kcal];
  const miniData = kseries.length > 1 ? kseries : [0, kcal];
  const hasTrend = histDays.some(d => d.hasData);

  return (
    <div className="home">
      <div className="home-head">
        <img className="brand-logo" src={BRAND_LOGO} alt="ESTR" width="120" height="30" draggable="false" />
        <button className="datebtn" type="button" onClick={() => go('repeat')} aria-label="Open date history">
          <span className="datebtn-icon" aria-hidden="true" />
          <span>{dateStr}</span>
        </button>
      </div>

      <div className={'homebtns ' + btnStyle}>
        <HomeButton label="EAT"   sub={`${fmt(kcal)} kcal`} on={foodLog.length>0} hue={hues.eat} iconType="eat" onClick={() => go('eat')} />
        <HomeButton label="SLEEP" sub={sleep.sleeping ? 'awake?' : ''} on={!!sleep.lastDuration || sleep.sleeping} hue={hues.sleep} iconType="sleep" onClick={() => go('sleep')} />
        <HomeButton label="TRAIN" sub={trainLog.length ? `${lifts+cardio} logged` : ''} on={trainLog.length>0} hue={hues.train} iconType="train" onClick={() => go('train')} />
      </div>

      <div className="summary">
        <div className="sum-head">
          <div>
            <div className="sum-label">TODAY</div>
            <div className="sum-date">{dateStr}</div>
          </div>
          <span className={'sum-live' + (today.hasData ? ' on' : '')}>{today.hasData ? 'ACTIVE' : 'OPEN'}</span>
        </div>

        <div className="sum-primary">
          <div className="sum-tile" style={{ '--metric': hues.eat }}>
            <div className="sum-tile-top">
              <PillarAsset type="eat" size={21} />
              <span>CALORIES</span>
            </div>
            <div className="sum-num">{fmt(kcal)}</div>
          </div>
          <div className="sum-tile" style={{ '--metric': hues.eat }}>
            <div className="sum-tile-top">
              <PillarAsset type="eat" size={21} />
              <span>PROTEIN</span>
            </div>
            <div className="sum-num">{fmt(protein)}<span className="sum-of">g</span></div>
          </div>
        </div>

        <div className="sum-status">
          <div className="sum-row" style={{ '--metric': hues.sleep }}>
            <span className="sum-row-icon"><PillarAsset type="sleep" size={25} /></span>
            <span className="sum-row-copy">
              <span className="sum-cap">SLEEP</span>
              <span className="sum-stat">{sleepStr}</span>
            </span>
          </div>
          <div className="sum-row" style={{ '--metric': hues.train }}>
            <span className="sum-row-icon"><PillarAsset type="train" size={25} /></span>
            <span className="sum-row-copy">
              <span className="sum-cap">TRAINING</span>
              <span className="sum-stat">{trainStr}</span>
            </span>
          </div>
        </div>
      </div>

      <button className="repeatstrip" onClick={() => go('repeat')}>
        <span className="rs-left">
          <span className="rs-orbit"><LoopGlyph size={17} color="var(--accent)" /></span>
          <span className="rs-text">
            <span className="rs-kicker">LOOP</span>
            <b>REPEAT</b>
            <i>{hasTrend ? 'your patterns are waking up' : 'patterns build as you log'}</i>
          </span>
        </span>
        <span className="rs-viz">
          <Sparkline data={miniData} width={104} height={30} accent="var(--accent)" />
          <span className="rs-pulse" />
        </span>
      </button>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────────────
// Fixed design defaults (the design tweaks panel was a prototype-only tool).
const TWEAK_DEFAULTS = {
  accent: '#d8a24a',
  colorMode: 'pillars',
  buttonStyle: 'outline',
  motion: 'subtle',
};

// one muted signal hue per pillar (shared lightness/chroma, varied hue)
const PILLARS = { eat: '#d8a24a', sleep: '#6f86d6', train: '#6bb37f' };

const STORE_KEY = 'est-state-v1';
function loadState(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}

// Reconcile the calendar EXACTLY ONCE per page load, here at module-eval time — before
// any render. reconcileHistory has a side effect (it persists the advanced date), so it
// must not run inside the component: StrictMode double-renders AND simulates an
// unmount/remount, both of which would re-run it, see the date already advanced, and drop
// the daily-reset signal — leaving today's log uncleared. Module scope is immune to all of
// that. The focus/visibilitychange handler below covers the long-running (no-reload) case.
const _saved = loadState();
const _recon = reconcileHistory(_saved);

export default function App(){
  const t = TWEAK_DEFAULTS;
  const saved = _saved;
  const recon = _recon;
  const rolledInit = !!recon.reset;

  const [screen, setScreen] = useState('home');
  const [foodLog, setFoodLog]   = useState(rolledInit ? [] : (saved.foodLog || []));
  const [trainLog, setTrainLog] = useState(rolledInit ? [] : (saved.trainLog || []).map(normalizeLift));
  const [sleep, setSleep]       = useState(rolledInit ? { ...EMPTY_WORKING.sleep } : (saved.sleep || { sleeping: false, bedAt: null, lastDuration: null, lastEnd: null }));
  const [history, setHistory]   = useState(recon.history);
  const [anim, setAnim] = useState('home');

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ foodLog, trainLog, sleep }));
  }, [foodLog, trainLog, sleep]);

  // reconcile again whenever the app regains focus / becomes visible
  useEffect(() => {
    const check = () => {
      const r = reconcileHistory({ foodLog, trainLog, sleep });
      setHistory(r.history);
      if (r.reset){ setFoodLog([]); setTrainLog([]); setSleep({ ...r.reset.sleep }); setScreen('home'); }
    };
    const onVis = () => { if (!document.hidden) check(); };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', onVis); };
  }, [foodLog, trainLog, sleep]);

  const go = s => { setScreen(s); setAnim(s); };
  const back = () => { setScreen('home'); setAnim('home'); };

  // derive "today" for Repeat + Home summary
  const totals = computeTotals(foodLog, trainLog, sleep);
  const sleepHrs = sleep.lastDuration ? +(sleep.lastDuration/3600000).toFixed(1) : (sleep.sleeping ? 0 : 0);
  const today = { kcal: totals.kcal, protein: totals.protein, sleep: sleepHrs, train: totals.train, hasData: totals.hasData };
  const sessions = recentSessions(history);

  const motionMs = t.motion === 'instant' ? '1ms' : '240ms';
  const pillars = t.colorMode === 'pillars';
  const hues = pillars ? PILLARS : { eat: t.accent, sleep: t.accent, train: t.accent };
  // each screen adopts its pillar hue as the working accent
  const screenAccent = pillars ? ({ eat: PILLARS.eat, sleep: PILLARS.sleep, train: PILLARS.train }[screen] || t.accent) : t.accent;
  const repeatColors = pillars
    ? { kcal: PILLARS.eat, protein: PILLARS.eat, sleep: PILLARS.sleep, train: PILLARS.train }
    : null;

  let body;
  if (screen === 'home') body = <Home go={go} foodLog={foodLog} trainLog={trainLog} sleep={sleep} today={today} btnStyle={'hb-' + t.buttonStyle} hues={hues} history={history} />;
  else if (screen === 'eat') body = <EatScreen onBack={back} foodLog={foodLog} setFoodLog={setFoodLog} />;
  else if (screen === 'sleep') body = <SleepScreen onBack={back} sleep={sleep} setSleep={setSleep} />;
  else if (screen === 'train') body = <TrainScreen onBack={back} trainLog={trainLog} setTrainLog={setTrainLog} sessions={sessions} />;
  else if (screen === 'repeat') body = <RepeatScreen onBack={back} today={today} history={history} colors={repeatColors} />;

  return (
    <div className="app" data-screen={screen} style={{ '--accent': screenAccent, '--eat': PILLARS.eat, '--sleep': PILLARS.sleep, '--train': PILLARS.train, '--t': motionMs }}>
      <div key={anim} className="screenfade">{body}</div>
    </div>
  );
}
