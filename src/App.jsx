/* Eat Sleep Train — Home + App root. */
import { useState, useEffect, useRef } from 'react';
import { Chevron, LoopGlyph, PlateGlyph, MoonGlyph, BarbellGlyph, Sparkline, fmt, fmtDuration } from './ui.jsx';
import { EatScreen, SleepScreen, TrainScreen, RepeatScreen } from './screens.jsx';
import { reconcileHistory, EMPTY_WORKING, computeTotals, recentSessions } from './data.js';

function StatusDot({ on, hue }) {
  return <span className={'sdot' + (on ? ' on' : '')} style={on && hue ? { background: hue, boxShadow: `0 0 9px ${hue}` } : undefined} />;
}

function HomeButton({ label, sub, on, onClick, hue, icon: Icon }) {
  return (
    <button className="homebtn" onClick={onClick} style={hue ? { '--btn-accent': hue } : undefined}>
      <span className="hb-left">
        {Icon ? <span className="hb-glyph"><Icon size={19} color={hue || 'var(--accent)'} /></span> : null}
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
        <div className="wordmark">EAT<span>/</span>SLEEP<span>/</span>TRAIN</div>
        <div className="datestr">{dateStr}</div>
      </div>

      <div className={'homebtns ' + btnStyle}>
        <HomeButton label="EAT"   sub={`${fmt(kcal)} kcal`} on={foodLog.length>0} hue={hues.eat} icon={PlateGlyph} onClick={() => go('eat')} />
        <HomeButton label="SLEEP" sub={sleep.sleeping ? 'awake?' : ''} on={!!sleep.lastDuration || sleep.sleeping} hue={hues.sleep} icon={MoonGlyph} onClick={() => go('sleep')} />
        <HomeButton label="TRAIN" sub={trainLog.length ? `${lifts+cardio} logged` : ''} on={trainLog.length>0} hue={hues.train} icon={BarbellGlyph} onClick={() => go('train')} />
      </div>

      <div className="summary">
        <div className="sum-label">TODAY</div>
        <div className="sum-grid">
          <div className="sum-cell">
            <div className="sum-num">{fmt(kcal)}</div>
            <div className="sum-cap">CALORIES</div>
          </div>
          <div className="sum-cell">
            <div className="sum-num">{fmt(protein)}<span className="sum-of">g</span></div>
            <div className="sum-cap">PROTEIN</div>
          </div>
          <div className="sum-cell line">
            <div className="sum-stat">{sleepStr}</div>
            <div className="sum-cap">SLEEP</div>
          </div>
          <div className="sum-cell line">
            <div className="sum-stat">{trainStr}</div>
            <div className="sum-cap">TRAINING</div>
          </div>
        </div>
      </div>

      <button className="repeatstrip" onClick={() => go('repeat')}>
        <span className="rs-left">
          <LoopGlyph size={16} color="var(--text-dim)" />
          <span className="rs-text"><b>REPEAT</b><i>{hasTrend ? 'your patterns' : 'patterns build as you log'}</i></span>
        </span>
        <Sparkline data={miniData} width={92} height={26} accent="var(--accent)" />
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

export default function App(){
  const t = TWEAK_DEFAULTS;
  const saved = useRef(loadState()).current;
  // reconcile the calendar BEFORE first paint: snapshot/roll over if the date advanced
  const recon = useRef(reconcileHistory(saved)).current;
  const rolledInit = !!recon.reset;

  const [screen, setScreen] = useState('home');
  const [foodLog, setFoodLog]   = useState(rolledInit ? [] : (saved.foodLog || []));
  const [trainLog, setTrainLog] = useState(rolledInit ? [] : (saved.trainLog || []));
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
    <div className="app" style={{ '--accent': screenAccent, '--eat': PILLARS.eat, '--sleep': PILLARS.sleep, '--train': PILLARS.train, '--t': motionMs }}>
      <div key={anim} className="screenfade">{body}</div>
    </div>
  );
}
