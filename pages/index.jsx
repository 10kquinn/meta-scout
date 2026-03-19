import { useState, useEffect, useRef, useMemo } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const EVENTS = [
  { key: "pt", label: "Pro Tour", date: "Feb 7–9" },
  { key: "santiago", label: "Santiago RC", date: "Feb 15–16" },
  { key: "usca", label: "US/CA RC + AC11", date: "Feb 21–22" },
  { key: "tmnt", label: "TMNT Events", date: "Mar 7–8" },
];

const DECKS = [
  { name: "Izzet Prowess", field: [1.9, 1.9, 5.2, 13.9], wr: [null, null, 52.1, 53.5], color: "#4F8EF7", trend: "hot", tier: "S" },
  { name: "Izzet Lessons", field: [15.0, 12.3, 13.0, 12.1], wr: [51.2, 48.0, 50.5, 50.2], color: "#A78BFA", trend: "stable", tier: "A" },
  { name: "Mono-G Landfall", field: [2.0, 6.6, 12.5, 11.1], wr: [null, 64.6, 56.2, 55.0], color: "#34D399", trend: "stable", tier: "S" },
  { name: "Dimir Midrange", field: [8.0, 13.3, 8.5, 7.3], wr: [44.0, 52.2, 49.8, 48.5], color: "#6B7280", trend: "declining", tier: "A" },
  { name: "Izzet Spellementals", field: [3.5, 1.9, 3.8, 5.4], wr: [58.0, 53.6, 52.0, 53.4], color: "#F97316", trend: "rising", tier: "A" },
  { name: "Dimir Excruciator", field: [7.0, 10.9, 7.2, 5.0], wr: [56.0, 53.3, 50.1, 45.5], color: "#8B5CF6", trend: "declining", tier: "B" },
  { name: "Simic Rhythm", field: [12.0, 3.8, 11.8, 3.8], wr: [40.0, 55.4, 48.5, 49.2], color: "#10B981", trend: "volatile", tier: "B" },
  { name: "Azorius Tempo", field: [3.0, 5.2, 3.5, 3.0], wr: [null, 60.9, 51.0, 49.4], color: "#60A5FA", trend: "stable", tier: "B" },
  { name: "Bant Airbending", field: [8.5, 1.4, 2.8, 2.7], wr: [38.0, 61.9, 49.0, 50.4], color: "#2DD4BF", trend: "declining", tier: "B" },
  { name: "Momo White", field: [0, 0, 0, 2.5], wr: [null, null, null, 56.0], color: "#FBBF24", trend: "new", tier: "A" },
  { name: "Mono-Red Aggro", field: [4.0, 4.3, 3.0, 2.4], wr: [49.0, 48.3, 47.5, 49.7], color: "#EF4444", trend: "declining", tier: "B" },
  { name: "Rakdos Discard", field: [0, 0, 0, 2.3], wr: [null, null, null, 50.6], color: "#DC2626", trend: "new", tier: "B" },
  { name: "Izzet Elementals", field: [2.5, 3.3, 2.0, 2.1], wr: [52.0, 43.9, 51.5, 53.8], color: "#FB923C", trend: "stable", tier: "B" },
  { name: "Jeskai Control", field: [2.0, 3.8, 2.5, 1.9], wr: [null, 39.6, 37.1, 46.1], color: "#F472B6", trend: "declining", tier: "C" },
  { name: "Boros Dragons", field: [1.0, 2.4, 2.0, 1.7], wr: [null, 62.2, 50.5, 49.3], color: "#FCA5A5", trend: "stable", tier: "B" },
];

const ALERTS = [
  { deck: "Izzet Prowess", severity: "critical", badge: "Source cards now", delta: "+12.0pp",
    detail: "Exploded from 1.9% fringe archetype to 13.9% — the most popular deck at TMNT events. 53.5% win rate validates it's not just hype. Key pickups: Stormchaser's Talent, Slickshot Show-Off, Monument to Endurance." },
  { deck: "Momo White", severity: "warning", badge: "New archetype", delta: "New",
    detail: "Brand new TMNT archetype — only 2.5% meta share but posted the highest win rate (56.0%) of all decks. Nobody is sideboarding for it yet. Perfect acquisition window." },
  { deck: "Rakdos Discard", severity: "info", badge: "Emerging", delta: "New",
    detail: "Debuted at TMNT events with 2.3% share and positive 50.6% WR. Discard strategies tend to improve with tuning. Worth acquiring early." },
  { deck: "Simic Rhythm", severity: "neutral", badge: "Declining", delta: "−8.0pp",
    detail: "Collapsed from 11.8% (AC11) back to 3.8%. Badgermole Cub strategies are struggling. Watch for rebound if Izzet Prowess warps the meta." },
];

// Matchup matrix data
const MU_NAMES = ["Izzet Prowess", "Mono-G Landfall", "Izzet Lessons", "Dimir Midrange", "Izzet Spellementals", "Dimir Excruciator", "Simic Rhythm", "Azorius Tempo"];
const MU_SHORT = ["I. Prowess", "MG Landfall", "I. Lessons", "Dimir Mid", "I. Spellem.", "Dimir Excr.", "Simic Rhy.", "Az. Tempo"];
const MU_DATA = [
  [null,  52.3,  51.8,  55.2,  48.6,  54.1,  56.8,  50.3],
  [47.7,  null,  50.2,  52.0,  44.5,  55.8,  53.5,  48.8],
  [48.2,  49.8,  null,  55.6,  47.2,  51.7,  54.2,  52.4],
  [44.8,  48.0,  44.4,  null,  45.8,  48.2,  40.9,  46.5],
  [51.4,  55.5,  52.8,  54.2,  null,  53.6,  58.0,  49.1],
  [45.9,  44.2,  48.3,  51.8,  46.4,  null,  53.3,  47.8],
  [43.2,  46.5,  45.8,  59.1,  42.0,  46.7,  null,  51.2],
  [49.7,  51.2,  47.6,  53.5,  50.9,  52.2,  48.8,  null],
];
const MU_N = [
  [0,82,156,94,45,71,52,38],
  [82,0,134,88,41,63,44,35],
  [156,134,0,112,58,89,72,48],
  [94,88,112,0,39,68,55,41],
  [45,41,58,39,0,32,28,22],
  [71,63,89,68,32,0,44,29],
  [52,44,72,55,28,44,0,26],
  [38,35,48,41,22,29,26,0],
];

const SEV = {
  critical: { border: "#EF4444", badgeBg: "#EF4444", badgeText: "#fff" },
  warning: { border: "#F59E0B", badgeBg: "rgba(245,158,11,0.15)", badgeText: "#F59E0B" },
  info: { border: "#4F8EF7", badgeBg: "rgba(79,142,247,0.12)", badgeText: "#4F8EF7" },
  neutral: { border: "rgba(255,255,255,0.1)", badgeBg: "rgba(255,255,255,0.08)", badgeText: "rgba(255,255,255,0.5)" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Spark({ data, color, w = 80, h = 24 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - (data[data.length - 1] / max) * (h - 4)} r="2.5" fill={color} />
    </svg>
  );
}

function MetaChart({ decks, selected }) {
  const ref = useRef(null);
  const vis = decks.filter(d => selected.includes(d.name));
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr; c.height = r.height * dpr;
    ctx.scale(dpr, dpr);
    const W = r.width, H = r.height, p = { t: 16, r: 16, b: 48, l: 48 };
    const cW = W - p.l - p.r, cH = H - p.t - p.b;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) { const y = p.t + (cH / 5) * i; ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(W - p.r, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "10px monospace"; ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) ctx.fillText((25 - i * 5) + "%", p.l - 8, p.t + (cH / 5) * i + 4);
    ctx.textAlign = "center";
    EVENTS.forEach((e, i) => { const x = p.l + (cW / 3) * i; ctx.fillText(e.label, x, H - p.b + 16); ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillText(e.date, x, H - p.b + 28); ctx.fillStyle = "rgba(255,255,255,0.3)"; });
    vis.forEach(dk => {
      ctx.strokeStyle = dk.color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
      dk.field.forEach((v, i) => { const x = p.l + (cW / 3) * i, y = p.t + cH - (v / 25) * cH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
      ctx.globalAlpha = 0.06; ctx.fillStyle = dk.color; ctx.beginPath();
      dk.field.forEach((v, i) => { const x = p.l + (cW / 3) * i, y = p.t + cH - (v / 25) * cH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
      ctx.lineTo(p.l + cW, p.t + cH); ctx.lineTo(p.l, p.t + cH); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      dk.field.forEach((v, i) => { const x = p.l + (cW / 3) * i, y = p.t + cH - (v / 25) * cH; ctx.fillStyle = "#0B0D10"; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = dk.color; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); });
    });
  }, [vis]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function MatchupCell({ v, n, row, col }) {
  const [hov, setHov] = useState(false);
  const bg = v === null ? "transparent" : v >= 55 ? "rgba(52,211,153,0.22)" : v >= 52 ? "rgba(52,211,153,0.1)" : v <= 45 ? "rgba(239,68,68,0.22)" : v <= 48 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.02)";
  const tc = v === null ? "rgba(255,255,255,0.12)" : v >= 55 ? "#34D399" : v >= 52 ? "#6EE7B7" : v <= 45 ? "#EF4444" : v <= 48 ? "#FCA5A5" : "rgba(255,255,255,0.55)";
  return (
    <td onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: "7px 4px", textAlign: "center", background: hov && v !== null ? "rgba(79,142,247,0.1)" : bg,
      color: tc, fontWeight: v !== null && (v >= 55 || v <= 45) ? 700 : 500,
      border: "1px solid rgba(255,255,255,0.025)", fontSize: v === null ? 10 : 12, position: "relative",
      transition: "background 0.1s", fontFamily: "'DM Mono', monospace",
    }} title={v !== null ? `${MU_NAMES[row]} vs ${MU_NAMES[col]}: ${v}% (${n} matches)` : ""}>
      {v !== null ? v.toFixed(1) : "—"}
      {hov && v !== null && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#15171c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
          padding: "8px 12px", whiteSpace: "nowrap", fontSize: 10, color: "#E2E0D8", zIndex: 50,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)", fontFamily: "'DM Mono', monospace",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{MU_NAMES[row]} vs {MU_NAMES[col]}</div>
          <div><span style={{ color: tc }}>{v}% WR</span> · {n} matches</div>
        </div>
      )}
    </td>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const TOP5 = ["Izzet Prowess", "Mono-G Landfall", "Izzet Lessons", "Dimir Midrange", "Simic Rhythm"];

export default function App() {
  const [sel, setSel] = useState(TOP5);
  const [sortCol, setSortCol] = useState("field");
  const [sortDir, setSortDir] = useState("desc");
  const [filterTier, setFilterTier] = useState("all");
  const [tab, setTab] = useState("overview");
  const [loaded, setLoaded] = useState(false);
  // Deck picker: predicted field % for each matchup deck, initialized from latest actual data
  const [predicted, setPredicted] = useState(() => {
    const init = {};
    MU_NAMES.forEach(n => {
      const dk = DECKS.find(d => d.name === n);
      init[n] = dk ? dk.field[3] : 5;
    });
    init["Other"] = Math.max(0, 100 - MU_NAMES.reduce((s, n) => s + (init[n] || 0), 0));
    return init;
  });
  // Card sourcer state
  const [decklistText, setDecklistText] = useState("");
  const [parsedCards, setParsedCards] = useState([]);
  const [cardImages, setCardImages] = useState({});
  const [cardPrices, setCardPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  // Live metagame state
  const [liveMeta, setLiveMeta] = useState(null);
  const [liveMetaLoading, setLiveMetaLoading] = useState(false);
  const [liveMetaError, setLiveMetaError] = useState(null);
  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  const toggle = n => setSel(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  const handleSort = c => { if (sortCol === c) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortCol(c); setSortDir("desc"); } };

  const sorted = useMemo(() => {
    let d = [...DECKS];
    if (filterTier !== "all") d = d.filter(x => x.tier === filterTier);
    d.sort((a, b) => {
      let va, vb;
      if (sortCol === "field") { va = a.field[3]; vb = b.field[3]; }
      else if (sortCol === "wr") { va = a.wr[3] ?? 0; vb = b.wr[3] ?? 0; }
      else if (sortCol === "delta") { va = a.field[3] - a.field[2]; vb = b.field[3] - b.field[2]; }
      else { va = a.name; vb = b.name; return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); }
      return sortDir === "asc" ? va - vb : vb - va;
    }); return d;
  }, [sortCol, sortDir, filterTier]);

  const M = { fontFamily: "'DM Mono', monospace" };
  const C = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 };
  const F = (d) => ({ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(8px)", transition: `all 0.5s ${d}s cubic-bezier(0.22,1,0.36,1)` });

  return (
    <div style={{ background: "#0B0D10", color: "#E2E0D8", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>

        {/* HEADER */}
        <header style={{ padding: "36px 0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 24, ...F(0) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52,211,153,0.4)", animation: "pulse 2s ease-in-out infinite" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>Meta Scout</h1>
            <span style={{ ...M, fontSize: 10, background: "rgba(79,142,247,0.12)", color: "#4F8EF7", padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>STANDARD</span>
            <span style={{ ...M, fontSize: 10, background: "rgba(52,211,153,0.1)", color: "#34D399", padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>LIVE</span>
          </div>
          <p style={{ ...M, color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>Pro Tour → TMNT RCs · Jan–Mar 2026 · 5,000+ decklists · magic.gg · MTGMelee · MTGDecks.net</p>
        </header>

        {/* TABS */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, ...F(0.08) }}>
          {[["overview", "Overview"], ["live", "Live Meta"], ["matchups", "Matchup matrix"], ["picker", "Deck picker"], ["sourcer", "Card sourcer"], ["alerts", "Alerts"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              ...M, fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 6, cursor: "pointer",
              background: tab === k ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${tab === k ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
              color: tab === k ? "#E2E0D8" : "rgba(255,255,255,0.3)", transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 28, ...F(0.12) }}>
            {[
              { label: "Most played", val: "Izzet Prowess", sub: "13.9% field", accent: "#4F8EF7" },
              { label: "Highest WR", val: "Momo White", sub: "56.0% WR", accent: "#34D399" },
              { label: "Biggest riser", val: "Izzet Prowess", sub: "+12.0pp", accent: "#FBBF24" },
              { label: "Tracked", val: "15 archetypes", sub: "3 new this week", accent: "#A78BFA" },
            ].map((m, i) => (
              <div key={i} style={{ ...C, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.accent, opacity: 0.35 }} />
                <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{m.val}</div>
                <div style={{ ...M, fontSize: 11, color: m.accent }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <section style={{ marginBottom: 36, ...F(0.2) }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>Meta share evolution</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {DECKS.slice(0, 9).map(d => {
                const on = sel.includes(d.name);
                return (<button key={d.name} onClick={() => toggle(d.name)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 5, background: on ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${on ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)"}`, color: on ? d.color : "rgba(255,255,255,0.2)", ...M, fontSize: 11, cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: on ? d.color : "rgba(255,255,255,0.08)" }} />{d.name}
                </button>);
              })}
            </div>
            <div style={{ ...C, height: 300, padding: 14 }}><MetaChart decks={DECKS} selected={sel} /></div>
          </section>

          <section style={{ marginBottom: 48, ...F(0.3) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Archetype breakdown</h2>
              <div style={{ display: "flex", gap: 4 }}>
                {["all", "S", "A", "B", "C"].map(t => (
                  <button key={t} onClick={() => setFilterTier(t)} style={{ ...M, padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: filterTier === t ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${filterTier === t ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)"}`, color: filterTier === t ? "#E2E0D8" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.12s" }}>{t === "all" ? "All" : `Tier ${t}`}</button>
                ))}
              </div>
            </div>
            <div style={{ ...C, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {[{ k: "name", l: "Archetype", a: "left" }, { k: "field", l: "Field %", a: "right" }, { k: "wr", l: "Win rate", a: "right" }, { k: "delta", l: "Δ prior", a: "right" }, { k: "spark", l: "Trend", a: "center" }, { k: "tier", l: "Tier", a: "center" }].map(c => (
                    <th key={c.k} onClick={() => c.k !== "spark" && handleSort(c.k)} style={{ textAlign: c.a, padding: "10px 14px", ...M, fontSize: 9, fontWeight: 600, color: sortCol === c.k ? "#4F8EF7" : "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.6px", cursor: c.k !== "spark" ? "pointer" : "default", userSelect: "none" }}>{c.l}{sortCol === c.k ? (sortDir === "desc" ? " ↓" : " ↑") : ""}</th>
                  ))}
                </tr></thead>
                <tbody>{sorted.map(d => {
                  const delta = d.field[3] - d.field[2]; const wr = d.wr[3];
                  const wrC = wr === null ? "rgba(255,255,255,0.2)" : wr >= 53 ? "#34D399" : wr < 48 ? "#EF4444" : "#E2E0D8";
                  const dC = delta > 1 ? "#34D399" : delta < -1 ? "#EF4444" : "rgba(255,255,255,0.3)";
                  const tC = { S: "#FBBF24", A: "#4F8EF7", B: "#A78BFA", C: "rgba(255,255,255,0.25)" };
                  return (<tr key={d.name} style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "9px 14px", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 3, height: 18, borderRadius: 2, background: d.color, flexShrink: 0 }} />{d.name}
                      {d.trend === "new" && <span style={{ ...M, fontSize: 8, background: "rgba(79,142,247,0.15)", color: "#4F8EF7", padding: "2px 5px", borderRadius: 3, fontWeight: 600 }}>NEW</span>}
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 14px", ...M }}>{d.field[3].toFixed(1)}%</td>
                    <td style={{ textAlign: "right", padding: "9px 14px", ...M, color: wrC }}>{wr !== null ? `${wr.toFixed(1)}%` : "—"}</td>
                    <td style={{ textAlign: "right", padding: "9px 14px", ...M, color: dC }}>{d.field[2] === 0 && d.field[3] > 0 ? "NEW" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}pp`}</td>
                    <td style={{ textAlign: "center", padding: "9px 14px" }}><div style={{ display: "flex", justifyContent: "center" }}><Spark data={d.field} color={d.color} /></div></td>
                    <td style={{ textAlign: "center", padding: "9px 14px" }}><span style={{ ...M, fontSize: 9, fontWeight: 700, color: tC[d.tier], background: `${tC[d.tier]}15`, padding: "2px 7px", borderRadius: 3 }}>{d.tier}</span></td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          </section>
        </>}

        {/* LIVE META */}
        {tab === "live" && (() => {
          const fetchLiveMeta = async () => {
            setLiveMetaLoading(true);
            setLiveMetaError(null);
            try {
              const res = await fetch("/api/metagame");
              if (!res.ok) throw new Error("Failed to fetch");
              const data = await res.json();
              setLiveMeta(data);
            } catch (err) {
              setLiveMetaError(err.message);
            }
            setLiveMetaLoading(false);
          };

          // Auto-fetch on first render of this tab
          if (!liveMeta && !liveMetaLoading && !liveMetaError) {
            fetchLiveMeta();
          }

          const trendIcon = (trend) => {
            if (trend?.includes("up strong")) return "↑↑";
            if (trend?.includes("up")) return "↑";
            if (trend?.includes("down strong")) return "↓↓";
            if (trend?.includes("down")) return "↓";
            return "→";
          };

          const trendColor = (trend) => {
            if (trend?.includes("up")) return "#34D399";
            if (trend?.includes("down")) return "#EF4444";
            return "rgba(255,255,255,0.3)";
          };

          return (
            <section style={F(0.08)}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Live Metagame Data</h2>
                  {liveMeta?.live && (
                    <span style={{ ...M, fontSize: 9, background: "rgba(52,211,153,0.15)", color: "#34D399", padding: "3px 8px", borderRadius: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
                      LIVE
                    </span>
                  )}
                  {liveMeta && !liveMeta.live && (
                    <span style={{ ...M, fontSize: 9, background: "rgba(251,191,36,0.15)", color: "#FBBF24", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>CACHED</span>
                  )}
                  <button onClick={fetchLiveMeta} disabled={liveMetaLoading} style={{
                    ...M, fontSize: 10, padding: "4px 12px", borderRadius: 4, cursor: liveMetaLoading ? "wait" : "pointer",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)", marginLeft: "auto",
                  }}>{liveMetaLoading ? "Refreshing..." : "Refresh"}</button>
                </div>
                <p style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  {liveMeta ? `Source: ${liveMeta.source} · ${liveMeta.period} · ${liveMeta.totalDecks} decks tracked` : "Fetching live metagame data from MTGTop8..."}
                </p>
              </div>

              {liveMetaLoading && !liveMeta && (
                <div style={{ ...C, padding: 40, textAlign: "center" }}>
                  <div style={{ ...M, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Loading live metagame data...</div>
                </div>
              )}

              {liveMetaError && !liveMeta && (
                <div style={{ ...C, padding: 20, borderLeft: "3px solid #EF4444" }}>
                  <div style={{ fontSize: 13, color: "#EF4444", marginBottom: 4 }}>Failed to load live data</div>
                  <div style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{liveMetaError}</div>
                </div>
              )}

              {liveMeta && (
                <>
                  {/* Stats cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 24 }}>
                    {[
                      { label: "Top deck", val: liveMeta.archetypes[0]?.name || "—", sub: `${liveMeta.archetypes[0]?.metaShare || 0}% of field`, accent: "#4F8EF7" },
                      { label: "Total decks", val: liveMeta.totalDecks?.toLocaleString() || "—", sub: liveMeta.period, accent: "#34D399" },
                      { label: "Archetypes", val: liveMeta.archetypes?.length || 0, sub: "tracked", accent: "#A78BFA" },
                      { label: "Data source", val: liveMeta.source?.replace(" (cached)", ""), sub: liveMeta.live ? "Live" : "Cached", accent: liveMeta.live ? "#34D399" : "#FBBF24" },
                    ].map((m, i) => (
                      <div key={i} style={{ ...C, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: m.accent, opacity: 0.35 }} />
                        <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>{m.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{m.val}</div>
                        <div style={{ ...M, fontSize: 11, color: m.accent }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Archetype breakdown */}
                  <div style={{ ...C, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <th style={{ textAlign: "left", padding: "10px 14px", ...M, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Archetype</th>
                          <th style={{ textAlign: "right", padding: "10px 14px", ...M, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Meta %</th>
                          <th style={{ textAlign: "center", padding: "10px 14px", ...M, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Trend</th>
                          <th style={{ textAlign: "left", padding: "10px 14px", ...M, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveMeta.archetypes.map((arch, i) => (
                          <tr key={arch.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.025)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px 14px", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ ...M, fontSize: 10, color: "rgba(255,255,255,0.3)", width: 20 }}>#{i + 1}</span>
                              {arch.name}
                            </td>
                            <td style={{ textAlign: "right", padding: "12px 14px", ...M, fontWeight: 600, color: arch.metaShare >= 10 ? "#4F8EF7" : "#E2E0D8" }}>
                              {arch.metaShare}%
                            </td>
                            <td style={{ textAlign: "center", padding: "12px 14px" }}>
                              <span style={{ ...M, fontSize: 14, color: trendColor(arch.trend) }}>{trendIcon(arch.trend)}</span>
                            </td>
                            <td style={{ padding: "12px 14px", width: "30%" }}>
                              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{
                                  height: "100%",
                                  width: `${Math.min(arch.metaShare * 4, 100)}%`,
                                  background: arch.metaShare >= 15 ? "#4F8EF7" : arch.metaShare >= 10 ? "#34D399" : "rgba(255,255,255,0.2)",
                                  borderRadius: 4,
                                  transition: "width 0.3s ease",
                                }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recent events */}
                  {liveMeta.recentEvents && liveMeta.recentEvents.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Recent Tournaments</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        {liveMeta.recentEvents.map((event, i) => (
                          <div key={i} style={{ ...C, padding: "14px 16px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{event.name}</div>
                            {event.date && <div style={{ ...M, fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{event.date}</div>}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {event.top8?.slice(0, 4).map((deck, j) => (
                                <span key={j} style={{ ...M, fontSize: 9, padding: "2px 6px", background: "rgba(255,255,255,0.05)", borderRadius: 3, color: "rgba(255,255,255,0.5)" }}>
                                  {deck}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last updated */}
                  <div style={{ marginTop: 20, ...M, fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right" }}>
                    Last updated: {liveMeta.lastUpdated ? new Date(liveMeta.lastUpdated).toLocaleString() : "Unknown"}
                  </div>
                </>
              )}
            </section>
          );
        })()}

        {/* MATCHUP MATRIX */}
        {tab === "matchups" && (
          <section style={F(0.08)}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Head-to-head matchup matrix</h2>
              <p style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Win rates from row deck's perspective · Hover cells for sample sizes · RC results + MTGO Challenges Sep 2025 – Mar 2026</p>
            </div>
            <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
              {[{ c: "rgba(52,211,153,0.22)", t: "#34D399", l: "55%+ favored" }, { c: "rgba(52,211,153,0.1)", t: "#6EE7B7", l: "52–55% edge" }, { c: "rgba(255,255,255,0.02)", t: "rgba(255,255,255,0.45)", l: "48–52% even" }, { c: "rgba(239,68,68,0.1)", t: "#FCA5A5", l: "45–48% unfav." }, { c: "rgba(239,68,68,0.22)", t: "#EF4444", l: "45%− bad" }].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: x.c, border: "1px solid rgba(255,255,255,0.05)" }} /><span style={{ color: x.t }}>{x.l}</span>
                </div>
              ))}
            </div>
            <div style={{ ...C, padding: "14px 10px", overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%", minWidth: 680 }}>
                <thead><tr>
                  <th style={{ padding: "8px 10px", textAlign: "left", ...M, color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 600, letterSpacing: "0.5px" }}>ROW vs COL →</th>
                  {MU_SHORT.map((n, i) => (
                    <th key={i} style={{ padding: "6px 4px", textAlign: "center", ...M, color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 600, lineHeight: 1.3, borderBottom: "1px solid rgba(255,255,255,0.06)", verticalAlign: "bottom" }}>
                      <span style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", display: "inline-block", whiteSpace: "nowrap" }}>{n}</span>
                    </th>
                  ))}
                </tr></thead>
                <tbody>{MU_DATA.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ padding: "6px 10px", ...M, fontWeight: 600, fontSize: 11, color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.06)" }}>{MU_SHORT[ri]}</td>
                    {row.map((v, ci) => <MatchupCell key={ci} v={v} n={MU_N[ri][ci]} row={ri} col={ci} />)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {[
                { t: "Izzet Prowess is well-positioned", b: "Favored vs Dimir Midrange (55.2%), Dimir Excruciator (54.1%), Simic Rhythm (56.8%). Only concern: Izzet Spellementals (48.6%)." },
                { t: "Izzet Spellementals punishes green", b: "55.5% vs Mono-G Landfall, 58.0% vs Simic Rhythm. If the meta skews green, this is the counter-pick." },
                { t: "Simic Rhythm beats fair midrange", b: "59.1% vs Dimir Midrange — best matchup in the matrix. Struggles badly against Izzet shells (42–46%)." },
                { t: "Dimir Midrange in a tough spot", b: "Sub-50% against most tier 1 decks. Consider pivoting to Dimir Excruciator or Rakdos Discard." },
              ].map((x, i) => (
                <div key={i} style={{ ...C, padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{x.t}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{x.b}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DECK PICKER — EV CALCULATOR */}
        {tab === "picker" && (() => {
          // Calculate expected win rate for each deck against predicted field
          const totalPredicted = Object.values(predicted).reduce((s, v) => s + v, 0);
          const evResults = MU_NAMES.map((deckName, di) => {
            let weightedWR = 0;
            let totalWeight = 0;
            MU_NAMES.forEach((oppName, oi) => {
              if (di === oi) return; // skip mirror
              const wr = MU_DATA[di][oi];
              if (wr === null) return;
              const oppShare = predicted[oppName] || 0;
              weightedWR += wr * oppShare;
              totalWeight += oppShare;
            });
            // "Other" matchups assumed 50%
            const otherShare = predicted["Other"] || 0;
            weightedWR += 50 * otherShare;
            totalWeight += otherShare;
            const ev = totalWeight > 0 ? weightedWR / totalWeight : 50;
            return { name: deckName, ev, color: DECKS.find(d => d.name === deckName)?.color || "#888" };
          }).sort((a, b) => b.ev - a.ev);

          const bestDeck = evResults[0];
          const worstDeck = evResults[evResults.length - 1];
          const spread = bestDeck.ev - worstDeck.ev;

          const updateSlider = (name, val) => {
            setPredicted(prev => {
              const next = { ...prev, [name]: parseFloat(val) };
              const assigned = MU_NAMES.reduce((s, n) => s + (next[n] || 0), 0);
              next["Other"] = Math.max(0, parseFloat((100 - assigned).toFixed(1)));
              return next;
            });
          };

          const resetToLatest = () => {
            const init = {};
            MU_NAMES.forEach(n => {
              const dk = DECKS.find(d => d.name === n);
              init[n] = dk ? dk.field[3] : 5;
            });
            init["Other"] = Math.max(0, parseFloat((100 - MU_NAMES.reduce((s, n) => s + (init[n] || 0), 0)).toFixed(1)));
            setPredicted(init);
          };

          return (
            <section style={F(0.08)}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Deck picker — EV calculator</h2>
                <p style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  Predict the meta with sliders → see the mathematically optimal deck choice based on matchup win rates
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* LEFT: Sliders */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Predicted field composition</h3>
                    <button onClick={resetToLatest} style={{
                      ...M, fontSize: 10, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontWeight: 600,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)", transition: "all 0.15s",
                    }}>Reset to latest</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {MU_NAMES.map(name => {
                      const dk = DECKS.find(d => d.name === name);
                      const val = predicted[name] || 0;
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 4, height: 20, borderRadius: 2, background: dk?.color || "#888", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 500, width: 120, flexShrink: 0 }}>{MU_SHORT[MU_NAMES.indexOf(name)]}</span>
                          <input
                            type="range" min="0" max="40" step="0.5" value={val}
                            onChange={e => updateSlider(name, e.target.value)}
                            style={{ flex: 1, accentColor: dk?.color || "#888", height: 4, cursor: "pointer" }}
                          />
                          <span style={{ ...M, fontSize: 12, fontWeight: 600, width: 48, textAlign: "right", color: val > 10 ? "#E2E0D8" : "rgba(255,255,255,0.4)" }}>
                            {val.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}

                    {/* Other (auto-calculated) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
                      <span style={{ width: 4, height: 20, borderRadius: 2, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, width: 120, flexShrink: 0 }}>Other</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
                      <span style={{ ...M, fontSize: 12, fontWeight: 600, width: 48, textAlign: "right" }}>
                        {(predicted["Other"] || 0).toFixed(1)}%
                      </span>
                    </div>

                    {/* Total indicator */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                      <span style={{
                        ...M, fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 4,
                        background: Math.abs(totalPredicted - 100) < 0.5 ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                        color: Math.abs(totalPredicted - 100) < 0.5 ? "#34D399" : "#EF4444",
                      }}>
                        Total: {totalPredicted.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Results */}
                <div>
                  {/* Best deck highlight */}
                  <div style={{
                    ...C, padding: "20px 24px", marginBottom: 16,
                    borderLeft: `3px solid ${bestDeck.color}`, position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: bestDeck.color, opacity: 0.3 }} />
                    <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Optimal deck choice</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: bestDeck.color }}>{bestDeck.name}</div>
                    <div style={{ ...M, fontSize: 14 }}>
                      <span style={{ color: "#34D399", fontWeight: 600 }}>{bestDeck.ev.toFixed(2)}%</span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}> expected WR vs this field</span>
                    </div>
                    <div style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                      {spread.toFixed(1)}pp edge over worst option ({worstDeck.name})
                    </div>
                  </div>

                  {/* Ranked results */}
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>Expected win rates vs predicted field</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {evResults.map((r, i) => {
                      const barW = Math.max(0, ((r.ev - 44) / (bestDeck.ev - 44)) * 100);
                      const isTop = i === 0;
                      return (
                        <div key={r.name} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                          borderRadius: 6, background: isTop ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.015)",
                          border: isTop ? "1px solid rgba(52,211,153,0.15)" : "1px solid rgba(255,255,255,0.03)",
                        }}>
                          <span style={{
                            ...M, fontSize: 10, fontWeight: 700, width: 20, textAlign: "center",
                            color: i === 0 ? "#34D399" : i <= 2 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                          }}>#{i + 1}</span>
                          <span style={{ width: 4, height: 18, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 500, width: 120, flexShrink: 0 }}>{r.name}</span>
                          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", width: `${barW}%`, borderRadius: 3,
                              background: r.ev >= 52 ? r.color : "rgba(255,255,255,0.15)",
                              opacity: r.ev >= 52 ? 0.6 : 0.4, transition: "width 0.3s ease",
                            }} />
                          </div>
                          <span style={{
                            ...M, fontSize: 12, fontWeight: 700, width: 56, textAlign: "right",
                            color: r.ev >= 53 ? "#34D399" : r.ev >= 51 ? "#E2E0D8" : r.ev >= 49 ? "rgba(255,255,255,0.4)" : "#EF4444",
                          }}>{r.ev.toFixed(2)}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Methodology note */}
                  <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 6, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Methodology</div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, margin: 0 }}>
                      For each deck, expected WR = Σ(matchup WR × opponent's predicted field %) / total predicted field.
                      "Other" matchups are assumed 50/50. Based on the matchup matrix data from RC results and MTGO Challenges.
                      Mirror matches are excluded from the calculation.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* CARD SOURCER */}
        {tab === "sourcer" && (() => {
          const STORES = [
            { name: "MTG Mate", key: "mtgmate", color: "#34D399", url: (card) => `https://www.mtgmate.com.au/cards/${encodeURIComponent(card.replace(/ /g, " "))}` },
            { name: "Good Games", key: "goodgames", color: "#4F8EF7", url: (card) => `https://tcg.goodgames.com.au/search?q=${encodeURIComponent(card)}` },
            { name: "Games Portal", key: "gamesportal", color: "#F59E0B", url: (card) => `https://gamesportal.com.au/search?q=${encodeURIComponent(card)}&type=product` },
          ];

          const parseDecklist = (text) => {
            const lines = text.trim().split("\n");
            const cards = [];
            let section = "main";
            for (const raw of lines) {
              const line = raw.trim();
              if (!line) continue;
              if (/^(sideboard|sb)/i.test(line) || line === "//Sideboard" || line.toLowerCase() === "sideboard") { section = "sideboard"; continue; }
              if (/^(companion|commander|deck)/i.test(line) || line.startsWith("//")) continue;
              // Match: "4 Card Name" or "4x Card Name" or "4 Card Name (SET) 123"
              const m = line.match(/^(\d+)x?\s+(.+?)(?:\s+\([A-Z0-9]+\))?(?:\s+\d+)?$/i);
              if (m) {
                const qty = parseInt(m[1]);
                let name = m[2].trim();
                // Strip set code and collector number from Arena format
                name = name.replace(/\s*\([A-Z0-9]+\)\s*\d*$/, "").trim();
                cards.push({ qty, name, section });
              }
            }
            return cards;
          };

          const handleParse = async () => {
            const cards = parseDecklist(decklistText);
            setParsedCards(cards);
            setCardPrices({});
            setPricesLoading(true);

            // Fetch images from Scryfall for unique cards
            const unique = [...new Set(cards.map(c => c.name))].slice(0, 30);
            unique.forEach(name => {
              if (cardImages[name]) return;
              fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                  if (data?.image_uris?.small) {
                    setCardImages(prev => ({ ...prev, [name]: data.image_uris.small }));
                  } else if (data?.card_faces?.[0]?.image_uris?.small) {
                    setCardImages(prev => ({ ...prev, [name]: data.card_faces[0].image_uris.small }));
                  }
                })
                .catch(() => {});
            });

            // Fetch live prices from our API for each unique card
            for (const name of unique) {
              try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
                if (res.ok) {
                  const data = await res.json();
                  setCardPrices(prev => ({ ...prev, [name]: data }));
                }
              } catch (err) {
                console.error(`Failed to fetch prices for ${name}:`, err);
              }
              // Small delay to avoid hammering the API
              await new Promise(r => setTimeout(r, 150));
            }
            setPricesLoading(false);
          };

          const mainCards = parsedCards.filter(c => c.section === "main");
          const sideCards = parsedCards.filter(c => c.section === "sideboard");
          const totalMain = mainCards.reduce((s, c) => s + c.qty, 0);
          const totalSide = sideCards.reduce((s, c) => s + c.qty, 0);

          const SAMPLE = `4 Stormchaser's Talent
4 Slickshot Show-Off
4 Monument to Endurance
4 Firebending Lesson
4 Accumulate Wisdom
3 Iroh's Demonstration
4 Combustion Technique
4 Artist's Talent
4 Multiversal Passage
4 Riverpyre Verge
4 Spirebluff Canal
7 Island
2 Mountain
3 Boomerang Basics
1 Agna Qel'a
4 Gran-Gran

Sideboard
2 Negate
1 Annul
1 Torch the Tower
1 Iroh's Demonstration
1 Abandon Attachments
1 Abrade
1 Pyroclasm
2 Quantum Riddler
2 Soul-Guide Lantern
1 It'll Quench Ya!
1 Spell Pierce
1 Broadside Barrage`;

          return (
            <section style={F(0.08)}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Card sourcer</h2>
                <p style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  Paste a decklist → get live prices from Australian stores (Games Portal, Good Games, MTG Mate)
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  {STORES.map(s => (
                    <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: parsedCards.length > 0 ? "320px 1fr" : "1fr", gap: 20 }}>
                {/* Input */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Decklist</h3>
                    <button onClick={() => { setDecklistText(SAMPLE); }} style={{
                      ...M, fontSize: 10, padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontWeight: 600,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)", transition: "all 0.15s",
                    }}>Load example (Izzet Lessons)</button>
                  </div>
                  <textarea
                    value={decklistText}
                    onChange={e => setDecklistText(e.target.value)}
                    placeholder={"Paste MTGO/Arena decklist here...\n\n4 Lightning Bolt\n4 Counterspell\n...\n\nSideboard\n2 Negate\n..."}
                    style={{
                      width: "100%", minHeight: 320, padding: 14, borderRadius: 8, fontSize: 12,
                      fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)", color: "#E2E0D8", resize: "vertical",
                      lineHeight: 1.7, outline: "none",
                    }}
                  />
                  <button onClick={handleParse} disabled={pricesLoading} style={{
                    width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 6, cursor: pricesLoading ? "wait" : "pointer",
                    fontSize: 13, fontWeight: 600, background: pricesLoading ? "rgba(255,255,255,0.05)" : "rgba(79,142,247,0.12)",
                    border: `1px solid ${pricesLoading ? "rgba(255,255,255,0.1)" : "rgba(79,142,247,0.25)"}`,
                    color: pricesLoading ? "rgba(255,255,255,0.4)" : "#4F8EF7", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                  }}>{pricesLoading ? "Fetching prices..." : "Parse decklist & fetch prices"}</button>

                  {parsedCards.length > 0 && (
                    <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      <div style={{ ...C, padding: "10px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Main</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: totalMain === 60 ? "#34D399" : "#F59E0B" }}>{totalMain}</div>
                      </div>
                      <div style={{ ...C, padding: "10px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Side</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: totalSide === 15 ? "#34D399" : totalSide > 0 ? "#F59E0B" : "rgba(255,255,255,0.3)" }}>{totalSide}</div>
                      </div>
                      <div style={{ ...C, padding: "10px 14px", flex: 1, textAlign: "center" }}>
                        <div style={{ ...M, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>Unique</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{new Set(parsedCards.map(c => c.name)).size}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results */}
                {parsedCards.length > 0 && (
                  <div>
                    {[{ label: "Mainboard", cards: mainCards }, { label: "Sideboard", cards: sideCards }]
                      .filter(g => g.cards.length > 0)
                      .map(group => (
                        <div key={group.label} style={{ marginBottom: 24 }}>
                          <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: "rgba(255,255,255,0.5)" }}>
                            {group.label} ({group.cards.reduce((s, c) => s + c.qty, 0)})
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {group.cards.map((card, i) => {
                              const prices = cardPrices[card.name];
                              const isLoadingPrice = pricesLoading && !prices;

                              // Extract best prices from each store
                              const storePrices = {};
                              if (prices?.stores) {
                                prices.stores.forEach(s => {
                                  if (s.results && s.results.length > 0) {
                                    const best = s.results[0];
                                    storePrices[s.key] = {
                                      price: best.price,
                                      available: best.available,
                                      url: best.url,
                                      name: s.store
                                    };
                                  }
                                });
                              }

                              return (
                                <div key={i} style={{
                                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                                  borderRadius: 6, background: "rgba(255,255,255,0.015)",
                                  border: "1px solid rgba(255,255,255,0.03)", transition: "background 0.1s",
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.035)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                                >
                                  {/* Card image thumbnail */}
                                  {cardImages[card.name] ? (
                                    <img src={cardImages[card.name]} alt={card.name} style={{ width: 32, height: 44, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 32, height: 44, borderRadius: 3, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
                                  )}

                                  {/* Qty */}
                                  <span style={{ ...M, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", width: 20, textAlign: "center", flexShrink: 0 }}>{card.qty}x</span>

                                  {/* Name */}
                                  <span style={{ fontSize: 13, fontWeight: 500, minWidth: 140, flex: 1 }}>{card.name}</span>

                                  {/* Store prices */}
                                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    {isLoadingPrice ? (
                                      <span style={{ ...M, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Loading...</span>
                                    ) : (
                                      STORES.map(store => {
                                        const sp = storePrices[store.key];
                                        const hasPrice = sp && sp.price;
                                        const inStock = sp?.available !== false;

                                        return (
                                          <a
                                            key={store.key}
                                            href={sp?.url || store.url(card.name)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              ...M, fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 4,
                                              background: hasPrice ? `${store.color}15` : "rgba(255,255,255,0.03)",
                                              color: hasPrice ? (inStock ? store.color : "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.2)",
                                              textDecoration: inStock ? "none" : "line-through",
                                              border: `1px solid ${hasPrice ? store.color + "30" : "rgba(255,255,255,0.05)"}`,
                                              transition: "all 0.1s", whiteSpace: "nowrap", minWidth: 65, textAlign: "center",
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${store.color}30`; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = hasPrice ? `${store.color}15` : "rgba(255,255,255,0.03)"; }}
                                            title={`${store.name}${sp ? (inStock ? " - In Stock" : " - Out of Stock") : ""}`}
                                          >
                                            {hasPrice ? sp.price : "—"}
                                          </a>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                    {/* Bulk open buttons */}
                    <div style={{ marginTop: 20, ...C, padding: "16px 20px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Bulk search entire decklist</div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 12, lineHeight: 1.5 }}>
                        Good Games and Games Portal both have deck builder / multi-card search tools.
                        Click below to open your full decklist on their site.
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href="https://tcg.goodgames.com.au/pages/mtg-deck-builder" target="_blank" rel="noopener noreferrer" style={{
                          ...M, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 6,
                          background: "rgba(79,142,247,0.1)", color: "#4F8EF7", textDecoration: "none",
                          border: "1px solid rgba(79,142,247,0.2)", transition: "all 0.15s",
                        }}>Good Games deck builder →</a>
                        <a href="https://gamesportal.com.au/pages/multi-card-search" target="_blank" rel="noopener noreferrer" style={{
                          ...M, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 6,
                          background: "rgba(245,158,11,0.1)", color: "#F59E0B", textDecoration: "none",
                          border: "1px solid rgba(245,158,11,0.2)", transition: "all 0.15s",
                        }}>Games Portal multi-search →</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* ALERTS */}
        {tab === "alerts" && (
          <section style={F(0.08)}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Early warning system</h2>
            <p style={{ ...M, fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Flagging decks with significant meta share movement or high debut win rates</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALERTS.map((a, i) => {
                const s = SEV[a.severity];
                return (<div key={i} style={{ ...C, borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: s.border, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{a.deck}</span>
                      <span style={{ ...M, fontSize: 9, fontWeight: 600, background: s.badgeBg, color: s.badgeText, padding: "3px 9px", borderRadius: 4 }}>{a.badge}</span>
                    </div>
                    <span style={{ ...M, fontSize: 13, fontWeight: 700, color: a.severity === "critical" ? "#EF4444" : a.severity === "warning" ? "#F59E0B" : a.severity === "info" ? "#4F8EF7" : "rgba(255,255,255,0.3)" }}>{a.delta}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.5)", margin: 0 }}>{a.detail}</p>
                </div>);
              })}
            </div>
          </section>
        )}

        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 0 40px", marginTop: 40, display: "flex", justifyContent: "space-between", ...M, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          <span>Sources: magic.gg · MTGMelee · MTGDecks.net · AetherHub</span>
          <span>Last updated: Mar 12, 2026</span>
        </footer>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}*{box-sizing:border-box;margin:0}button:hover{filter:brightness(1.15)}::-webkit-scrollbar{height:5px}::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}`}</style>
    </div>
  );
}
