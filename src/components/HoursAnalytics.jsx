import { useState, useMemo } from "react";
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { fmtHours } from "../lib/helpers";
import { collectAllLogs, getSeries, shiftAnchor } from "../lib/analytics";

const MODES = [{ id: "year", label: "Year" }, { id: "month", label: "Month" }, { id: "week", label: "Week" }];
const HINT = { year: "Hours per month", month: "Hours per week", week: "Hours per day" };

const shortH = h => (h === 0 ? "" : Number.isInteger(h) ? `${h}` : h.toFixed(1));

function niceMax(v) {
  if (v <= 0) return 4;
  const steps = [2, 4, 5, 6, 8, 10, 12, 16, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 500, 1000];
  return steps.find(s => s >= v) || Math.ceil(v / 100) * 100;
}

export default function HoursAnalytics({ chapters }) {
  const [mode, setMode] = useState("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [sel, setSel] = useState(null);

  const logs = useMemo(() => collectAllLogs(chapters), [chapters]);
  const { title, bars } = useMemo(() => getSeries(logs, mode, anchor), [logs, mode, anchor]);

  const total = bars.reduce((s, b) => s + b.hours, 0);
  const peak = bars.reduce((best, b) => (b.hours > best.hours ? b : best), { hours: 0, label: "—" });
  const active = bars.filter(b => b.hours > 0).length;
  const avg = active ? total / active : 0;

  const W = 320, H = 190, top = 22, bottom = 40, side = 6;
  const max = niceMax(Math.max(...bars.map(b => b.hours), 0));
  const plotH = H - top - bottom;
  const step = (W - side * 2) / bars.length;
  const bw = Math.min(30, step * 0.62);

  const go = dir => { setAnchor(a => shiftAnchor(a, mode, dir)); setSel(null); };
  const changeMode = m => { setMode(m); setSel(null); };
  const selected = sel != null ? bars[sel] : null;

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,.07)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
        <TrendingUp size={16} /> Hours Analytics
      </div>

      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 3, marginBottom: 12 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => changeMode(m.id)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: mode === m.id ? "#fff" : "transparent", color: mode === m.id ? "#4338ca" : "#64748b", boxShadow: mode === m.id ? "0 1px 4px rgba(0,0,0,.12)" : "none" }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <button onClick={() => go(-1)} aria-label="Previous" style={{ background: "#eef2ff", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} color="#4338ca" /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{HINT[mode]}</div>
        </div>
        <button onClick={() => go(1)} aria-label="Next" style={{ background: "#eef2ff", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={18} color="#4338ca" /></button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={side} x2={W - side} y1={top + plotH * (1 - f)} y2={top + plotH * (1 - f)} stroke="#e2e8f0" strokeDasharray={f === 0 ? "0" : "3 3"} />
        ))}
        {bars.map((b, i) => {
          const h = (b.hours / max) * plotH;
          const x = side + i * step + (step - bw) / 2;
          const y = top + plotH - h;
          const isSel = sel === i;
          return (
            <g key={i} onClick={() => setSel(isSel ? null : i)} style={{ cursor: "pointer" }}>
              <rect x={side + i * step} y={0} width={step} height={H} fill="transparent" />
              {b.hours > 0 && <rect x={x} y={y} width={bw} height={Math.max(h, 2)} rx={4} fill={isSel ? "#f59e0b" : "url(#barGrad)"} />}
              {b.hours === 0 && <rect x={x} y={top + plotH - 2} width={bw} height={2} rx={1} fill="#e2e8f0" />}
              {b.hours > 0 && <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">{shortH(b.hours)}</text>}
              <text x={x + bw / 2} y={H - 22} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={isSel ? "#d97706" : "#64748b"}>{b.label}</text>
              {b.sub && <text x={x + bw / 2} y={H - 9} textAnchor="middle" fontSize="8" fill="#94a3b8">{b.sub}</text>}
            </g>
          );
        })}
      </svg>

      <div style={{ minHeight: 22, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>
        {selected ? `${selected.full} · ${fmtHours(selected.hours)}` : <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Tap a bar for details</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[{ l: "Total", v: fmtHours(total) }, { l: "Peak", v: peak.hours ? `${peak.label} · ${fmtHours(peak.hours)}` : "—" }, { l: "Average", v: fmtHours(avg) }].map(s => (
          <div key={s.l} style={{ background: "#eef2ff", borderRadius: 12, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#4338ca" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
