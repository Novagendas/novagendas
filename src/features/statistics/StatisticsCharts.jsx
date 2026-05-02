import React, { useRef, useState } from 'react';

// ─── Vertical Bar Chart ───────────────────────────────────────────────────────
export function BarChart({ data = [], color = 'var(--primary)', formatValue }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fv = formatValue || (v => v.toLocaleString('es-CO'));

  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-chart-col">
          <div className="bar-chart-bar-wrap">
            <span className="bar-chart-tooltip">{fv(d.value)}</span>
            <div
              className="bar-chart-bar"
              style={{ '--bar-h': `${(d.value / max) * 100}%`, background: color, animationDelay: `${i * 60}ms` }}
            />
          </div>
          <span className="bar-chart-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
export function LineChart({ data = [], color = 'var(--primary)' }) {
  const svgRef = useRef(null);
  const [pathLen, setPathLen] = useState(0);
  const [tooltip, setTooltip] = useState(null);

  React.useLayoutEffect(() => {
    const path = svgRef.current?.querySelector('.lc-path');
    if (path) setPathLen(path.getTotalLength());
  }, [data]);

  if (!data.length) return null;
  const W = 500, H = 200;
  const PAD = { top: 36, right: 16, bottom: 28, left: 10 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const xS = i => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * iW : iW / 2);
  const yS = v => PAD.top + (1 - v / max) * iH;
  const pts = data.map((d, i) => [xS(i), yS(d.value)]);
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1][0]},${PAD.top + iH} L${pts[0][0]},${PAD.top + iH} Z`;

  return (
    <div className="line-chart">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="line-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lc-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i} x1={PAD.left} y1={PAD.top + (1 - pct) * iH} x2={W - PAD.right} y2={PAD.top + (1 - pct) * iH}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={areaD} fill="url(#lc-area-grad)" />
        <path className="lc-path" d={pathD} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={pathLen ? { strokeDasharray: pathLen, strokeDashoffset: 0, animation: 'lcDraw 1s ease forwards' } : {}} />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="5" fill={color} className="lc-dot" stroke="var(--surface)" strokeWidth="2"
            onMouseEnter={() => setTooltip({ x: p[0], y: p[1], label: data[i].label, value: data[i].value })}
            onMouseLeave={() => setTooltip(null)} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={xS(i)} y={H - 4} textAnchor="middle" className="chart-axis-label">{d.label}</text>
        ))}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 36} y={tooltip.y - 34} width="72" height="22" rx="5" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
            <text x={tooltip.x} y={tooltip.y - 18} textAnchor="middle" className="chart-tooltip-text">{tooltip.value.toLocaleString('es-CO')}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Horizontal Bars ──────────────────────────────────────────────────────────
export function HorizontalBars({ data = [], color = 'var(--primary)', formatValue }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const fv = formatValue || (v => v.toLocaleString('es-CO'));

  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div key={i} className="hbar-row animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <span className="hbar-label" title={d.label}>{d.label.length > 20 ? d.label.slice(0, 20) + '…' : d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ '--bar-w': `${(d.value / max) * 100}%`, background: d.color || color }} />
          </div>
          <span className="hbar-value">{fv(d.value)}</span>
          {d.pct !== undefined && <span className="hbar-pct">{d.pct}%</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
export function DonutChart({ data = [], subLabel = 'total' }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const R = 38, CX = 55, CY = 55;
  const C = 2 * Math.PI * R;
  const segments = data.reduce((acc, d) => {
    const length = (d.value / total) * C;
    const offset = -acc.totalLen;
    acc.items.push({ ...d, length, offset });
    acc.totalLen += length;
    return acc;
  }, { items: [], totalLen: 0 }).items;

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 110 110" className="donut-svg">
        <g transform={`rotate(-90, ${CX}, ${CY})`}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
          {segments.map((s, i) => (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth="14"
              strokeDasharray={`${s.length.toFixed(2)} ${(C - s.length).toFixed(2)}`}
              strokeDashoffset={s.offset.toFixed(2)}
              className="donut-segment" />
          ))}
        </g>
        <text x={CX} y={CY - 4} textAnchor="middle" className="donut-total-text">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" className="donut-sub-text">{subLabel}</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: d.color }} />
            <span className="donut-legend-label">{d.label}</span>
            <span className="donut-legend-count">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
