/* Eat Sleep Train — shared UI primitives. Exports to window. */

// Chevron / glyphs (kept dead simple)
function Chevron({ dir = 'right', size = 16, color = 'currentColor', w = 2 }) {
  const d = {
    right: 'M6 4l6 6-6 6', left: 'M12 4l-6 6 6 6',
    up: 'M4 12l6-6 6 6', down: 'M4 6l6 6 6-6',
  }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoopGlyph({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
      <path d="M4 10a6 6 0 0 1 10-4.5M16 10a6 6 0 0 1-10 4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 3v3h-3M6 17v-3h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// number formatting
const fmt = n => Math.round(n).toLocaleString('en-US');
function fmtDuration(ms){
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2,'0')}m`;
}
function fmtClock(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), ss = s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

// ── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, width = 240, height = 44, accent = '#d8a24a', goal }) {
  const pad = 5;
  const max = Math.max(...data, goal || 0) || 1;
  const min = Math.min(...data, 0);
  const span = (max - min) || 1;
  const x = i => pad + (i * (width - pad * 2)) / (data.length - 1);
  const y = v => height - pad - ((v - min) / span) * (height - pad * 2);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const lastX = x(data.length - 1), lastY = y(data[data.length - 1]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      {goal != null && (
        <line x1={pad} x2={width - pad} y1={y(goal)} y2={y(goal)}
              stroke="#3a414c" strokeWidth="1" strokeDasharray="2 4" />
      )}
      <polyline points={pts} fill="none" stroke="#5b636e" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round" />
      <line x1={lastX} x2={lastX} y1={lastY} y2={height - pad} stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
      <circle cx={lastX} cy={lastY} r="3.4" fill={accent} />
    </svg>
  );
}

// thin progress bar
function Bar({ value, max, accent = '#d8a24a', mono = false }) {
  const pct = Math.max(0, Math.min(1, (value || 0) / (max || 1)));
  return (
    <div style={{ height: 3, background: '#23272e', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        width: `${pct * 100}%`, height: '100%',
        background: mono ? '#6b7480' : accent, borderRadius: 2,
        transition: 'width var(--t, 220ms) cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  );
}

// screen scaffold: back bar + title, content scrolls
function Screen({ title, onBack, children, right }) {
  return (
    <div className="screen">
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '8px 18px 14px', flexShrink: 0,
      }}>
        <button className="iconbtn" onClick={onBack} aria-label="Back"
                style={{ marginLeft: -10 }}>
          <Chevron dir="left" size={22} color="var(--text-dim)" />
        </button>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: 3,
          color: 'var(--text-dim)', fontWeight: 600, flex: 1,
        }}>{title}</div>
        {right}
      </div>
      <div className="screen-body">{children}</div>
    </div>
  );
}

export { Chevron, LoopGlyph, Sparkline, Bar, Screen, fmt, fmtDuration, fmtClock };
