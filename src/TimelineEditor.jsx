import { useState, useRef, useEffect } from "react";
import { ICONS, COLORS } from "./constants";
import EventModal from "./EventModal";

const DATE_TYPES = [
  { value: "year", label: "Anno" },
  { value: "month", label: "Mese" },
  { value: "day", label: "Giorno" },
  { value: "datetime", label: "Ora" },
];

const RANGE_COLORS = ["#ef4444","#f59e0b","#10b981","#3b82f6","#6366f1","#ec4899","#8b5cf6","#111"];

const emptyForm = {
  date: "", dateEnd: "", dateType: "day", isRange: false, isBC: false, isBCEnd: false,
  title: "", desc: "", icon: 0, color: COLORS[0], rangeColor: "#ef4444", thumbnail: null, image: null,
};

// Sort key: converts any date format (including BC) to a sortable number
function sortKey(dateStr, isBCFlag) {
  if (!dateStr) return 0;
  const parts = dateStr.split(/[-T:]/);
  const year = Number(parts[0]) * (isBCFlag ? -1 : 1);
  const month = parts[1] ? Number(parts[1]) : 0;
  const day = parts[2] ? Number(parts[2]) : 0;
  const hour = parts[3] ? Number(parts[3]) : 0;
  const min = parts[4] ? Number(parts[4]) : 0;
  return year * 1e8 + month * 1e6 + day * 1e4 + hour * 100 + min;
}

// Format a single date value based on type
function fmtSingleDate(dateStr, dateType, isBCFlag) {
  if (!dateStr) return "";

  if (dateType === "year") {
    const y = dateStr.slice(0, 4);
    return isBCFlag ? `${Number(y)} a.C.` : y;
  }

  if (dateType === "month") {
    const match = dateStr.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const dt = new Date(Number(match[1]), Number(match[2]) - 1);
      const formatted = dt.toLocaleDateString("it-IT", { year: "numeric", month: "long" });
      return isBCFlag ? formatted.replace(/\d{4}/, `${Number(match[1])} a.C.`) : formatted;
    }
    return dateStr;
  }

  if (dateType === "datetime") {
    const dt = new Date(dateStr);
    if (isNaN(dt)) return dateStr;
    const datePart = dt.toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
    const timePart = dt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    return `${datePart}, ${timePart}`;
  }

  // "day"
  const dt = new Date(dateStr);
  if (isNaN(dt)) return dateStr;
  const formatted = dt.toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
  return isBCFlag ? formatted.replace(/\d{4}/, m => `${Number(m)} a.C.`) : formatted;
}

// Format event date (handles ranges)
function fmtEventDate(ev) {
  const type = ev.dateType || "day";
  const start = fmtSingleDate(ev.date, type, ev.isBC);
  if (ev.isRange && ev.dateEnd) {
    const end = fmtSingleDate(ev.dateEnd, type, ev.isBCEnd);
    return `${start} \u2013 ${end}`;
  }
  return start;
}

// Short format for timeline labels
function fmtEventShort(ev) {
  const type = ev.dateType || "day";
  if (type === "year") {
    const y = ev.date?.slice(0, 4);
    if (!y) return "";
    const label = ev.isBC ? `${Number(y)} a.C.` : y;
    if (ev.isRange && ev.dateEnd) {
      const ye = ev.dateEnd.slice(0, 4);
      const labelEnd = ev.isBCEnd ? `${Number(ye)} a.C.` : ye;
      return `${label}\u2013${labelEnd}`;
    }
    return label;
  }
  if (type === "month") {
    const match = ev.date?.match(/^(\d{4})-(\d{2})/);
    if (!match) return "";
    const dt = new Date(Number(match[1]), Number(match[2]) - 1);
    const s = dt.toLocaleDateString("it-IT", { year: "numeric", month: "short" });
    const formatted = ev.isBC ? s.replace(/\d{4}/, m => `${Number(m)} a.C.`) : s;
    if (ev.isRange && ev.dateEnd) {
      const m2 = ev.dateEnd.match(/^(\d{4})-(\d{2})/);
      if (m2) {
        const dt2 = new Date(Number(m2[1]), Number(m2[2]) - 1);
        const e = dt2.toLocaleDateString("it-IT", { year: "numeric", month: "short" });
        const fmtEnd = ev.isBCEnd ? e.replace(/\d{4}/, m => `${Number(m)} a.C.`) : e;
        return `${formatted}\u2013${fmtEnd}`;
      }
    }
    return formatted;
  }
  // day/datetime
  const base = fmtSingleDate(ev.date, type, ev.isBC);
  if (ev.isRange && ev.dateEnd) {
    const endStr = fmtSingleDate(ev.dateEnd, type, ev.isBCEnd);
    return `${base}\u2013${endStr}`;
  }
  return base;
}

function isDateInRange(date, isBCFlag, start, end, startBC, endBC) {
  if (!start && !end) return true;
  if (!date) return true;
  const d = sortKey(date, isBCFlag);
  if (start) { const s = sortKey(start, startBC); if (d < s) return false; }
  if (end) { const e = sortKey(end, endBC); if (d > e) return false; }
  return true;
}

export default function TimelineEditor({ timeline, onUpdate, onBack }) {
  const dateStart = timeline.dateStart || "";
  const dateEnd = timeline.dateEnd || "";

  const [events, setEvents] = useState(timeline.events);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("view");
  const [layout, setLayout] = useState("horizontal");
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [rangeError, setRangeError] = useState("");
  const thumbRef = useRef(null);
  const imageRef = useRef(null);
  const lineRef = useRef(null);
  const nid = useRef(Date.now());

  const sorted = [...events].sort((a, b) => {
    const ka = sortKey(a.date, a.isBC);
    const kb = sortKey(b.date, b.isBC);
    return ka - kb;
  });

  useEffect(() => {
    onUpdate({ ...timeline, events });
  }, [events]);

  const updateTimeline = patch => {
    onUpdate({ ...timeline, events, ...patch });
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.date || !form.title) return;
    if (dateStart || dateEnd) {
      if (!isDateInRange(form.date, form.isBC, dateStart, dateEnd, timeline.dateStartBC, timeline.dateEndBC)) {
        setRangeError("La data deve essere compresa nell'arco temporale della timeline");
        return;
      }
    }
    setRangeError("");
    const eventData = {
      date: form.date, dateEnd: form.isRange ? form.dateEnd : "",
      dateType: form.dateType, isRange: form.isRange,
      isBC: form.isBC, isBCEnd: form.isBCEnd,
      title: form.title, desc: form.desc, icon: form.icon, color: form.color,
      rangeColor: form.isRange ? form.rangeColor : "",
      thumbnail: form.thumbnail, image: form.image,
    };
    if (editId !== null) {
      setEvents(ev => ev.map(e => e.id === editId ? { ...e, ...eventData } : e));
      setEditId(null);
    } else {
      setEvents(ev => [...ev, { ...eventData, id: nid.current++ }]);
    }
    setForm(emptyForm);
    setMode("view");
  };

  const startEdit = e => {
    setForm({
      date: e.date, dateEnd: e.dateEnd || "", dateType: e.dateType || "day",
      isRange: !!e.isRange, isBC: !!e.isBC, isBCEnd: !!e.isBCEnd,
      title: e.title, desc: e.desc, icon: e.icon, color: e.color,
      rangeColor: e.rangeColor || "#ef4444",
      thumbnail: e.thumbnail || null, image: e.image || null,
    });
    setEditId(e.id);
    setSel(null);
    setRangeError("");
    setMode("form");
  };

  const cancel = () => {
    setEditId(null);
    setForm(emptyForm);
    setRangeError("");
    setMode("view");
  };

  const remove = id => {
    setEvents(ev => ev.filter(e => e.id !== id));
    setSel(null);
  };

  const onFileFor = field => e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => setF(field, ev.target.result);
    r.readAsDataURL(f);
  };

  const goNav = dir => {
    const idx = sorted.findIndex(e => e.id === sel);
    if (sel === null) { setSel(sorted[0]?.id || null); return; }
    const next = idx + dir;
    if (next >= 0 && next < sorted.length) setSel(sorted[next].id);
  };

  useEffect(() => {
    const h = e => {
      if (mode === "form") return;
      const fwd = layout === "horizontal" ? "ArrowRight" : "ArrowDown";
      const bwd = layout === "horizontal" ? "ArrowLeft" : "ArrowUp";
      if (e.key === fwd) { e.preventDefault(); goNav(1); }
      if (e.key === bwd) { e.preventDefault(); goNav(-1); }
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  useEffect(() => {
    if (sel === null || !lineRef.current) return;
    const el = lineRef.current.querySelector(`[data-id="${sel}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [sel]);

  const selEv = sorted.find(e => e.id === sel);
  const getDotImage = ev => ev.thumbnail || ev.image;
  const isH = layout === "horizontal";

  // Compute how many events a range event spans (for visual bar width)
  const getRangeSpan = (ev, startIdx) => {
    if (!ev.isRange || !ev.dateEnd) return 0;
    const endKey = sortKey(ev.dateEnd, ev.isBCEnd);
    let span = 0;
    for (let j = startIdx + 1; j < sorted.length; j++) {
      if (sortKey(sorted[j].date, sorted[j].isBC) <= endKey) span = j - startIdx;
      else break;
    }
    return span;
  };

  // Render date input based on dateType
  const renderDateField = (value, onChange, isBCValue, onBCChange, label) => {
    const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" };
    const type = form.dateType;

    return (
      <div>
        <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {type === "year" ? (
            <input type="number" min="1" max="9999" placeholder="es. 1945" value={value} onChange={onChange} style={{ ...inputStyle, flex: 1 }} />
          ) : type === "month" ? (
            <input type="month" value={value} onChange={onChange} style={{ ...inputStyle, flex: 1 }} />
          ) : type === "datetime" ? (
            <input type="datetime-local" value={value} onChange={onChange} style={{ ...inputStyle, flex: 1 }} />
          ) : (
            <input type="date" value={value} onChange={onChange} style={{ ...inputStyle, flex: 1 }} />
          )}
          {(type === "year" || type === "day") && (
            <button type="button" onClick={() => onBCChange(!isBCValue)} style={{
              padding: "7px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: isBCValue ? "1px solid #6366f1" : "1px solid #e0e0e0",
              background: isBCValue ? "#eef2ff" : "#fff",
              color: isBCValue ? "#6366f1" : "#999",
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}>a.C.</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#111", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .node:hover .dot { transform:scale(1.4); }
        .node .dot { transition:transform 0.2s; }
        .vnode:hover .dot { transform:scale(1.4); }
        .vnode .dot { transition:transform 0.2s; }
        .vrow:hover .dot { transform:scale(1.4); }
        ::-webkit-scrollbar { height:0; width:0; }
        .vnode { transition: all 0.2s; }
        .vnode:hover { background: #fafafa !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid #e0e0e0",
            background: "#fff", cursor: "pointer", fontSize: 13, color: "#666",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>&larr;</span> Home
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.3px" }}>{timeline.name}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#999" }}>{events.length} eventi</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Settings toggle */}
          <button onClick={() => setShowSettings(s => !s)} style={{
            padding: "6px 12px", borderRadius: 8, border: "1px solid #e0e0e0",
            background: showSettings ? "#f8f8f8" : "#fff", cursor: "pointer", fontSize: 13, color: "#666",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Arco temporale
          </button>

          {/* Layout toggle */}
          <div style={{ display: "flex", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <button onClick={() => setLayout("horizontal")} style={{
              padding: "6px 12px", border: "none", fontSize: 13, cursor: "pointer",
              background: isH ? "#111" : "#fff", color: isH ? "#fff" : "#888",
              display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="15 6 21 12 15 18"/></svg>
              Orizzontale
            </button>
            <button onClick={() => setLayout("vertical")} style={{
              padding: "6px 12px", border: "none", borderLeft: "1px solid #e0e0e0", fontSize: 13, cursor: "pointer",
              background: !isH ? "#111" : "#fff", color: !isH ? "#fff" : "#888",
              display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="6 15 12 21 18 15"/></svg>
              Verticale
            </button>
          </div>

          {mode === "form" ? (
            <button onClick={cancel} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#666" }}>Annulla</button>
          ) : (
            <button onClick={() => { setEditId(null); setForm(emptyForm); setRangeError(""); setMode("form"); }} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Nuovo evento</button>
          )}
        </div>
      </div>

      {/* Settings panel - timeline date range */}
      {showSettings && (
        <div style={{ padding: "16px 32px", borderBottom: "1px solid #f0f0f0", background: "#fcfcfc", animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ maxWidth: 640, display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Inizio Arco</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="number" min="1" max="9999" placeholder="Anno" value={dateStart} onChange={e => updateTimeline({ dateStart: e.target.value })} style={{ width: 90, padding: "6px 8px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 12, boxSizing: "border-box" }} />
                <button type="button" onClick={() => updateTimeline({ dateStartBC: !timeline.dateStartBC })} style={{
                  padding: "5px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: timeline.dateStartBC ? "1px solid #6366f1" : "1px solid #e0e0e0",
                  background: timeline.dateStartBC ? "#eef2ff" : "#fff",
                  color: timeline.dateStartBC ? "#6366f1" : "#999",
                }}>a.C.</button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fine Arco</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="number" min="1" max="9999" placeholder="Anno" value={dateEnd} onChange={e => updateTimeline({ dateEnd: e.target.value })} style={{ width: 90, padding: "6px 8px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 12, boxSizing: "border-box" }} />
                <button type="button" onClick={() => updateTimeline({ dateEndBC: !timeline.dateEndBC })} style={{
                  padding: "5px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: timeline.dateEndBC ? "1px solid #6366f1" : "1px solid #e0e0e0",
                  background: timeline.dateEndBC ? "#eef2ff" : "#fff",
                  color: timeline.dateEndBC ? "#6366f1" : "#999",
                }}>a.C.</button>
              </div>
            </div>
            {(dateStart || dateEnd) && (
              <button onClick={() => updateTimeline({ dateStart: "", dateEnd: "", dateStartBC: false, dateEndBC: false })} style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #e0e0e0",
                background: "#fff", cursor: "pointer", fontSize: 12, color: "#999",
              }}>Rimuovi</button>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {mode === "form" && (
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #f0f0f0", animation: "fadeIn 0.3s ease-out" }}>
          <div style={{ maxWidth: 640 }}>

            {/* Date type selector + range toggle */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", borderRadius: 8, border: "1px solid #e0e0e0", overflow: "hidden" }}>
                {DATE_TYPES.map(t => (
                  <button key={t.value} onClick={() => { setF("dateType", t.value); setF("date", ""); setF("dateEnd", ""); setF("isBC", false); setF("isBCEnd", false); }} style={{
                    padding: "5px 12px", border: "none", borderLeft: t.value !== "year" ? "1px solid #e0e0e0" : "none",
                    fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                    background: form.dateType === t.value ? "#111" : "#fff",
                    color: form.dateType === t.value ? "#fff" : "#888",
                  }}>{t.label}</button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#666" }}>
                <input type="checkbox" checked={form.isRange} onChange={e => setF("isRange", e.target.checked)} style={{ accentColor: "#111" }} />
                Periodo
              </label>
              {form.isRange && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>Barra:</span>
                  {RANGE_COLORS.map(c => (
                    <div key={c} onClick={() => setF("rangeColor", c)} style={{
                      width: 16, height: 16, borderRadius: "50%", background: c, cursor: "pointer",
                      border: `2px solid ${form.rangeColor === c ? "#111" : "transparent"}`,
                      opacity: form.rangeColor === c ? 1 : 0.5, transition: "all 0.15s",
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Date inputs */}
            <div style={{ display: "grid", gridTemplateColumns: form.isRange ? "1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {renderDateField(form.date, e => setF("date", e.target.value), form.isBC, v => setF("isBC", v), form.isRange ? "Da" : "Data")}
              {form.isRange ? (
                renderDateField(form.dateEnd, e => setF("dateEnd", e.target.value), form.isBCEnd, v => setF("isBCEnd", v), "A")
              ) : (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Titolo</label>
                  <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Nome dell'evento" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              )}
            </div>

            {/* Title (when range mode) */}
            {form.isRange && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Titolo</label>
                <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Nome dell'evento" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            )}

            {rangeError && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", fontSize: 12, marginBottom: 12 }}>
                {rangeError}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Descrizione</label>
              <textarea value={form.desc} onChange={e => setF("desc", e.target.value)} rows={2} placeholder="Descrizione opzionale..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, resize: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {ICONS.map((ic, i) => (
                  <div key={i} onClick={() => setF("icon", i)} style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${form.icon === i ? "#111" : "#e8e8e8"}`, cursor: "pointer", color: form.icon === i ? "#111" : "#bbb", transition: "all 0.15s" }}>{ic.svg}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setF("color", c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: `2.5px solid ${form.color === c ? "#111" : "transparent"}`, transition: "all 0.15s", opacity: form.color === c ? 1 : 0.5 }} />
                ))}
              </div>
            </div>

            {/* Dual image upload */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Icona Timeline</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {form.thumbnail && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `url(${form.thumbnail}) center/cover`, border: "2px solid #e0e0e0", flexShrink: 0 }} />
                  )}
                  <input ref={thumbRef} type="file" accept="image/*" onChange={onFileFor("thumbnail")} style={{ display: "none" }} />
                  <button onClick={() => thumbRef.current?.click()} style={{ padding: "6px 14px", borderRadius: 6, border: "1px dashed #ccc", background: "#fff", cursor: "pointer", fontSize: 12, color: "#888" }}>
                    {form.thumbnail ? "Cambia" : "+ Icona"}
                  </button>
                  {form.thumbnail && <span onClick={() => setF("thumbnail", null)} style={{ cursor: "pointer", color: "#ccc", fontSize: 14 }}>&times;</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Immagine Popup</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {form.image && (
                    <div style={{ width: 48, height: 32, borderRadius: 4, background: `url(${form.image}) center/contain no-repeat`, backgroundColor: "#f8f8f8", border: "1px solid #e0e0e0", flexShrink: 0 }} />
                  )}
                  <input ref={imageRef} type="file" accept="image/*" onChange={onFileFor("image")} style={{ display: "none" }} />
                  <button onClick={() => imageRef.current?.click()} style={{ padding: "6px 14px", borderRadius: 6, border: "1px dashed #ccc", background: "#fff", cursor: "pointer", fontSize: 12, color: "#888" }}>
                    {form.image ? "Cambia" : "+ Immagine"}
                  </button>
                  {form.image && <span onClick={() => setF("image", null)} style={{ cursor: "pointer", color: "#ccc", fontSize: 14 }}>&times;</span>}
                </div>
              </div>
            </div>

            <button onClick={save} disabled={!form.date || !form.title} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: (!form.date || !form.title) ? "#e0e0e0" : "#111", color: "#fff", cursor: (!form.date || !form.title) ? "default" : "pointer", fontSize: 13, fontWeight: 500 }}>{editId !== null ? "Aggiorna" : "Aggiungi"}</button>
          </div>
        </div>
      )}

      {/* Main timeline area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: isH ? "center" : "flex-start", padding: isH ? "40px 0" : "32px 0" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", color: "#ccc", padding: 60 }}>
            <p style={{ fontSize: 15 }}>Nessun evento. Aggiungi il primo.</p>
          </div>
        ) : isH ? (
          /* ========== HORIZONTAL LAYOUT ========== */
          <>
            <div ref={lineRef} style={{ overflowX: "auto", padding: "0 40px 20px", scrollBehavior: "smooth" }}>
              <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", position: "relative", padding: "80px 60px 80px" }}>
                <div style={{ position: "absolute", left: 60, right: 60, top: "50%", height: 1, background: "#ddd" }} />

                {sorted.map((ev, i) => {
                  const active = sel === ev.id;
                  const dotImg = getDotImage(ev);
                  return (
                    <div key={ev.id} data-id={ev.id} className="node" onClick={() => setSel(active ? null : ev.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: 120, marginRight: i < sorted.length - 1 ? 40 : 0 }}>
                      <div style={{ position: "absolute", bottom: "calc(50% + 20px)", textAlign: "center", width: 140, transition: "all 0.3s", opacity: active ? 1 : 0.5 }}>
                        {i % 2 === 0 && <>
                          <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{fmtEventShort(ev)}</div>
                          <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                        </>}
                      </div>

                      {dotImg ? (
                        <div className="dot" style={{ width: active ? 44 : 32, height: active ? 44 : 32, borderRadius: "50%", background: `url(${dotImg}) center/cover`, border: active ? `3px solid ${ev.color}` : "2px solid #e0e0e0", boxShadow: active ? `0 0 0 4px ${ev.color}20` : "none", transition: "all 0.3s", zIndex: 2 }} />
                      ) : (
                        <div className="dot" style={{ width: active ? 16 : 10, height: active ? 16 : 10, borderRadius: "50%", background: active ? ev.color : "#ccc", border: active ? `3px solid ${ev.color}33` : "3px solid #fff", boxShadow: active ? `0 0 0 4px ${ev.color}15` : "none", transition: "all 0.3s", zIndex: 2 }} />
                      )}

                      {/* Range bar */}
                      {ev.isRange && ev.dateEnd && (() => {
                        const span = getRangeSpan(ev, i);
                        const barW = Math.max(span * 160, 50);
                        const barColor = ev.rangeColor || ev.color;
                        return <div style={{
                          position: "absolute", left: "50%", top: "50%",
                          height: 4, borderRadius: 2,
                          background: barColor, opacity: 0.6,
                          width: barW, transform: "translateY(-50%)", zIndex: 1,
                        }} />;
                      })()}

                      <div style={{ position: "absolute", top: "calc(50% + 20px)", textAlign: "center", width: 140, transition: "all 0.3s", opacity: active ? 1 : 0.5 }}>
                        {i % 2 === 1 && <>
                          <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{fmtEventShort(ev)}</div>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
              <button onClick={() => goNav(-1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&larr;</button>
              <button onClick={() => goNav(1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&rarr;</button>
            </div>
          </>
        ) : (
          /* ========== VERTICAL LAYOUT ========== */
          <div ref={lineRef} style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px", width: "100%" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#ddd", transform: "translateX(-0.5px)" }} />

              {sorted.map((ev, i) => {
                const active = sel === ev.id;
                const dotImg = getDotImage(ev);
                const isLeft = i % 2 === 0;

                return (
                  <div key={ev.id} data-id={ev.id} className="vrow" style={{
                    display: "flex", alignItems: "flex-start", position: "relative",
                    marginBottom: 12,
                    flexDirection: isLeft ? "row" : "row-reverse",
                    animation: "fadeIn 0.3s ease-out",
                    animationDelay: `${i * 0.05}s`, animationFillMode: "backwards",
                  }}>
                    <div className="vnode" onClick={() => setSel(active ? null : ev.id)} style={{
                      width: "calc(50% - 28px)", cursor: "pointer", borderRadius: 12,
                      padding: "14px 16px",
                      background: active ? "#f8f8fa" : "transparent",
                      border: active ? "1px solid #e8e8ee" : "1px solid transparent",
                      textAlign: isLeft ? "right" : "left",
                    }}>
                      <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{fmtEventShort(ev)}</div>
                      <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                    </div>

                    <div style={{
                      width: 56, flexShrink: 0, display: "flex",
                      alignItems: "flex-start", justifyContent: "center",
                      paddingTop: 14,
                    }}>
                      {dotImg ? (
                        <div className="dot" onClick={() => setSel(active ? null : ev.id)} style={{
                          width: active ? 38 : 28, height: active ? 38 : 28, borderRadius: "50%",
                          background: `url(${dotImg}) center/cover`, cursor: "pointer",
                          border: active ? `3px solid ${ev.color}` : "2px solid #e0e0e0",
                          boxShadow: active ? `0 0 0 3px ${ev.color}20` : "none",
                          transition: "all 0.3s",
                        }} />
                      ) : (
                        <div className="dot" onClick={() => setSel(active ? null : ev.id)} style={{
                          width: active ? 14 : 10, height: active ? 14 : 10, borderRadius: "50%",
                          background: active ? ev.color : "#ccc", cursor: "pointer",
                          border: active ? `3px solid ${ev.color}33` : "3px solid #fff",
                          boxShadow: active ? `0 0 0 3px ${ev.color}15` : "none",
                          transition: "all 0.3s",
                        }} />
                      )}
                    </div>

                    {/* Range bar (vertical) */}
                    {ev.isRange && ev.dateEnd && (() => {
                      const span = getRangeSpan(ev, i);
                      const barH = Math.max(span * 56, 36);
                      const barColor = ev.rangeColor || ev.color;
                      // Start right below the dot: paddingTop(14) + dotSize + border
                      const dotSize = dotImg ? (active ? 38 : 28) : (active ? 14 : 10);
                      const borderW = dotImg ? (active ? 3 : 2) : 3;
                      const barTop = 14 + dotSize + borderW * 2;
                      return <div style={{
                        position: "absolute", left: "50%", top: barTop,
                        width: 4, borderRadius: 2,
                        background: barColor, opacity: 0.6,
                        height: barH, transform: "translateX(-50%)", zIndex: 1,
                      }} />;
                    })()}

                    <div style={{ width: "calc(50% - 28px)" }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
              <button onClick={() => goNav(-1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&uarr;</button>
              <button onClick={() => goNav(1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&darr;</button>
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selEv && (
        <EventModal
          event={selEv}
          fmtDate={fmtEventDate}
          onClose={() => setSel(null)}
          onEdit={startEdit}
          onDelete={remove}
        />
      )}
    </div>
  );
}
