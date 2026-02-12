import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ICONS, COLORS } from "./constants";
import EventModal from "./EventModal";
import exifr from "exifr";
import useIsMobile from "./useIsMobile";

const LocationPicker = lazy(() => import("./LocationPicker"));
const GlobalMap = lazy(() => import("./GlobalMap"));

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

const DATE_TYPES = [
  { value: "year", label: "Anno" },
  { value: "month", label: "Mese" },
  { value: "day", label: "Giorno" },
  { value: "datetime", label: "Ora" },
];

const RANGE_COLORS = ["#ef4444","#f59e0b","#10b981","#3b82f6","#6366f1","#ec4899","#8b5cf6","#111"];

const CARD_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#0ea5e9"];
function cardColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}

const emptyForm = {
  date: "", dateEnd: "", dateType: "day", isRange: false, isBC: false, isBCEnd: false,
  title: "", desc: "", icon: 0, color: COLORS[0], rangeColor: "#ef4444", thumbnail: null, image: null,
  showMap: false, location: null,
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

export default function TimelineEditor({ timeline, onUpdate, onBack, onGuide }) {
  const dateStart = timeline.dateStart || "";
  const dateEnd = timeline.dateEnd || "";

  const [events, setEvents] = useState(timeline.events);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("view");
  const [layout, setLayout] = useState("horizontal");
  const [zoom, setZoom] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlobalMap, setShowGlobalMap] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("timeline"); // "timeline" | "map"
  const isMobile = useIsMobile();
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
      showMap: form.showMap, location: form.location,
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
      showMap: !!e.showMap, location: e.location || null,
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

    // Always read data URL immediately (photo must load regardless of EXIF)
    const r = new FileReader();
    r.onload = ev => setF(field, ev.target.result);
    r.readAsDataURL(f);

    // Try EXIF GPS as a separate, independent operation
    if (f.type && f.type.startsWith("image/")) {
      exifr.gps(f).then(gps => {
        if (gps && gps.latitude != null && gps.longitude != null) {
          setForm(prev => ({
            ...prev,
            location: { lat: parseFloat(gps.latitude.toFixed(6)), lng: parseFloat(gps.longitude.toFixed(6)) },
            showMap: true,
          }));
        }
      }).catch(() => {});
    }
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

  const headerColor = timeline.coverColor || cardColor(timeline.id);
  const hasCoverImage = !!timeline.coverImage;
  const coverBgStyle = hasCoverImage
    ? { background: `url(${timeline.coverImage}) center/cover no-repeat` }
    : { background: headerColor };

  const coverImgRef = useRef(null);
  const onCoverFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => updateTimeline({ coverImage: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  // Label style shared
  const labelSt = { fontSize: 11, fontWeight: 500, color: "var(--md-on-surface-variant)", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" };
  const inputSt = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--md-outline)", fontSize: 13, boxSizing: "border-box", background: "var(--md-surface-container-lowest)", fontFamily: "var(--md-font)" };

  // Render date input based on dateType
  const renderDateField = (value, onChange, isBCValue, onBCChange, label) => {
    const type = form.dateType;
    return (
      <div>
        <label style={labelSt}>{label}</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {type === "year" ? (
            <input type="number" min="1" max="9999" placeholder="es. 1945" value={value} onChange={onChange} style={{ ...inputSt, flex: 1 }} />
          ) : type === "month" ? (
            <input type="month" value={value} onChange={onChange} style={{ ...inputSt, flex: 1 }} />
          ) : type === "datetime" ? (
            <input type="datetime-local" value={value} onChange={onChange} style={{ ...inputSt, flex: 1 }} />
          ) : (
            <input type="date" value={value} onChange={onChange} style={{ ...inputSt, flex: 1 }} />
          )}
          {(type === "year" || type === "day") && (
            <button type="button" onClick={() => onBCChange(!isBCValue)} style={{
              padding: "8px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "none",
              background: isBCValue ? "var(--md-primary-container)" : "var(--md-surface-container)",
              color: isBCValue ? "var(--md-primary)" : "var(--md-on-surface-variant)",
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}>a.C.</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--md-surface)", fontFamily: "var(--md-font)", color: "var(--md-on-surface)", display: "flex", flexDirection: "column", overflowX: "hidden" }}>

      {/* Hidden file input for cover image */}
      <input ref={coverImgRef} type="file" accept="image/*" onChange={onCoverFile} style={{ display: "none" }} />

      {/* Large cover banner (Google Classroom style) */}
      <div style={{
        ...coverBgStyle, position: "relative",
        minHeight: isMobile ? 120 : 180, padding: isMobile ? "0 12px" : "0 32px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderRadius: "0 0 16px 16px",
      }}>
        {/* Dark gradient overlay for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)", borderRadius: "0 0 16px 16px", pointerEvents: "none" }} />

        {/* Top row: back + actions */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: isMobile ? 10 : 16 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onBack} className="md-btn" style={{
              padding: isMobile ? "7px 10px" : "7px 16px", borderRadius: 9999,
              background: "rgba(255,255,255,0.2)", color: "#fff", border: "none",
              backdropFilter: "blur(4px)", minHeight: 44, minWidth: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              {!isMobile && " Home"}
            </button>
            <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: isMobile ? 24 : 30, display: "block", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
            {onGuide && (
              <button onClick={onGuide} className="md-btn" title="Guida" style={{
                padding: "7px 10px", borderRadius: 9999, border: "none",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                backdropFilter: "blur(4px)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </button>
            )}
          </div>

          {/* Right side: Hamburger menu for ALL devices */}
          <button onClick={() => setDrawerOpen(d => !d)} className="md-btn" style={{
            padding: "7px 10px", borderRadius: 9999, border: "none",
            background: drawerOpen ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)",
            color: "#fff", backdropFilter: "blur(4px)",
            minHeight: 44, minWidth: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Bottom: title + subtitle */}
        <div style={{ position: "relative", zIndex: 2, paddingBottom: isMobile ? 12 : 20 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>{timeline.name}</h1>
          <p style={{ margin: "4px 0 0", fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.85)" }}>{events.length} eventi</p>
        </div>
      </div>

      {/* DRAWER (all devices) */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50 }} />
          <div className="mobile-drawer" style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "75%", maxWidth: 320,
            background: "var(--md-surface)", zIndex: 51,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
            padding: "20px 16px", overflowY: "auto",
            animation: "slideInRight 0.25s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Menu</span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", color: "var(--md-on-surface)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Layout */}
              <div className="drawer-label">Layout</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <button onClick={() => { setLayout("horizontal"); setDrawerOpen(false); }} className="drawer-btn" style={{ flex: 1, background: isH ? "var(--md-primary-container)" : "var(--md-surface-container)", color: isH ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>
                  Orizzontale
                </button>
                <button onClick={() => { setLayout("vertical"); setDrawerOpen(false); }} className="drawer-btn" style={{ flex: 1, background: !isH ? "var(--md-primary-container)" : "var(--md-surface-container)", color: !isH ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>
                  Verticale
                </button>
              </div>

              {/* Zoom */}
              <div className="drawer-label">Zoom</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))} className="drawer-btn" style={{ width: 44, height: 44 }}>−</button>
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(1)))} className="drawer-btn" style={{ width: 44, height: 44 }}>+</button>
                {zoom !== 1 && <button onClick={() => setZoom(1)} className="drawer-btn" style={{ fontSize: 12 }}>Reset</button>}
              </div>

              {/* Mappa */}
              <button onClick={() => { setShowGlobalMap(s => !s); setDrawerOpen(false); }} className="drawer-btn" style={{ background: showGlobalMap ? "var(--md-primary-container)" : "var(--md-surface-container)", color: showGlobalMap ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {showGlobalMap ? "Nascondi Mappa" : "Mostra Mappa"}
              </button>

              {/* Copertina */}
              <button onClick={() => { coverImgRef.current?.click(); setDrawerOpen(false); }} className="drawer-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Copertina
              </button>
              {hasCoverImage && (
                <button onClick={() => { updateTimeline({ coverImage: null }); setDrawerOpen(false); }} className="drawer-btn">
                  Rimuovi copertina
                </button>
              )}

              {/* Colori */}
              {!hasCoverImage && (
                <>
                  <div className="drawer-label">Colore copertina</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {CARD_COLORS.map(c => (
                      <div key={c} onClick={() => { updateTimeline({ coverColor: c }); }} style={{
                        width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer",
                        border: `3px solid ${headerColor === c ? "var(--md-on-surface)" : "transparent"}`,
                      }} />
                    ))}
                  </div>
                </>
              )}

              {/* Arco temporale */}
              <button onClick={() => { setShowSettings(s => !s); setDrawerOpen(false); }} className="drawer-btn" style={{ background: showSettings ? "var(--md-primary-container)" : "var(--md-surface-container)", color: showSettings ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Arco temporale
              </button>

              {/* Guida */}
              {onGuide && (
                <button onClick={() => { onGuide(); setDrawerOpen(false); }} className="drawer-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Guida
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings panel - timeline date range */}
      {showSettings && (
        <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--md-outline-variant)", background: "var(--md-surface-container-low)", animation: "fadeIn 0.2s ease-out" }}>
          <div style={{ maxWidth: 640, display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={labelSt}>Inizio Arco</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="number" min="1" max="9999" placeholder="Anno" value={dateStart} onChange={e => updateTimeline({ dateStart: e.target.value })} style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--md-outline)", fontSize: 12, boxSizing: "border-box", fontFamily: "var(--md-font)" }} />
                <button type="button" onClick={() => updateTimeline({ dateStartBC: !timeline.dateStartBC })} style={{
                  padding: "7px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                  background: timeline.dateStartBC ? "var(--md-primary-container)" : "var(--md-surface-container)",
                  color: timeline.dateStartBC ? "var(--md-primary)" : "var(--md-on-surface-variant)",
                }}>a.C.</button>
              </div>
            </div>
            <div>
              <label style={labelSt}>Fine Arco</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="number" min="1" max="9999" placeholder="Anno" value={dateEnd} onChange={e => updateTimeline({ dateEnd: e.target.value })} style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--md-outline)", fontSize: 12, boxSizing: "border-box", fontFamily: "var(--md-font)" }} />
                <button type="button" onClick={() => updateTimeline({ dateEndBC: !timeline.dateEndBC })} style={{
                  padding: "7px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                  background: timeline.dateEndBC ? "var(--md-primary-container)" : "var(--md-surface-container)",
                  color: timeline.dateEndBC ? "var(--md-primary)" : "var(--md-on-surface-variant)",
                }}>a.C.</button>
              </div>
            </div>
            {(dateStart || dateEnd) && (
              <button className="md-btn md-btn-text" onClick={() => updateTimeline({ dateStart: "", dateEnd: "", dateStartBC: false, dateEndBC: false })} style={{ fontSize: 12, color: "var(--md-on-surface-variant)", padding: "7px 14px" }}>
                Rimuovi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {mode === "form" && (
        <div style={{ padding: isMobile ? "16px 12px" : "24px 32px", borderBottom: "1px solid var(--md-outline-variant)", background: "var(--md-surface-container-lowest)", animation: "fadeIn 0.3s ease-out" }}>
          <div style={{ maxWidth: 640 }}>

            {/* Date type selector + range toggle */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", borderRadius: 9999, overflow: "hidden", background: "var(--md-surface-container)" }}>
                {DATE_TYPES.map(t => (
                  <button key={t.value} onClick={() => { setF("dateType", t.value); setF("date", ""); setF("dateEnd", ""); setF("isBC", false); setF("isBCEnd", false); }} className="md-btn" style={{
                    padding: "6px 14px", border: "none", fontSize: 12,
                    background: form.dateType === t.value ? "var(--md-primary)" : "transparent",
                    color: form.dateType === t.value ? "var(--md-on-primary)" : "var(--md-on-surface-variant)",
                    borderRadius: 9999,
                  }}>{t.label}</button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "var(--md-on-surface-variant)" }}>
                <input type="checkbox" checked={form.isRange} onChange={e => setF("isRange", e.target.checked)} style={{ accentColor: "var(--md-primary)" }} />
                Periodo
              </label>
              {form.isRange && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--md-on-surface-variant)" }}>Barra:</span>
                  {RANGE_COLORS.map(c => (
                    <div key={c} onClick={() => setF("rangeColor", c)} style={{
                      width: 16, height: 16, borderRadius: "50%", background: c, cursor: "pointer",
                      border: `2px solid ${form.rangeColor === c ? "var(--md-on-surface)" : "transparent"}`,
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
                  <label style={labelSt}>Titolo</label>
                  <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Nome dell'evento" style={inputSt} />
                </div>
              )}
            </div>

            {/* Title (when range mode) */}
            {form.isRange && (
              <div style={{ marginBottom: 12 }}>
                <label style={labelSt}>Titolo</label>
                <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Nome dell'evento" style={inputSt} />
              </div>
            )}

            {rangeError && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", fontSize: 13, marginBottom: 12 }}>
                {rangeError}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Descrizione</label>
              <textarea value={form.desc} onChange={e => setF("desc", e.target.value)} rows={3} placeholder="Descrizione... Incolla URL YouTube o codice <iframe> (Maps, Spotify...) per incorporare. Supporta **grassetto**, *corsivo*, [link](url)" style={{ ...inputSt, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {ICONS.map((ic, i) => (
                  <div key={i} onClick={() => setF("icon", i)} style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: form.icon === i ? "var(--md-primary-container)" : "var(--md-surface-container)", cursor: "pointer", color: form.icon === i ? "var(--md-primary)" : "var(--md-on-surface-variant)", transition: "all 0.15s", border: "none" }}>{ic.svg}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setF("color", c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: `2.5px solid ${form.color === c ? "var(--md-on-surface)" : "transparent"}`, transition: "all 0.15s", opacity: form.color === c ? 1 : 0.5 }} />
                ))}
              </div>
            </div>

            {/* Dual image upload */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelSt}>Icona Timeline</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {form.thumbnail && (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `url(${form.thumbnail}) center/cover`, border: "2px solid var(--md-outline-variant)", flexShrink: 0 }} />
                  )}
                  <input ref={thumbRef} type="file" accept="image/*" onChange={onFileFor("thumbnail")} style={{ display: "none" }} />
                  <button onClick={() => thumbRef.current?.click()} className="md-btn md-btn-outlined" style={{ padding: "6px 14px", fontSize: 12 }}>
                    {form.thumbnail ? "Cambia" : "+ Icona"}
                  </button>
                  {form.thumbnail && <span onClick={() => setF("thumbnail", null)} style={{ cursor: "pointer", color: "var(--md-outline)", fontSize: 16, padding: 4 }}>&times;</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelSt}>Immagine Popup</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {form.image && (
                    <div style={{ width: 48, height: 32, borderRadius: 8, background: `url(${form.image}) center/contain no-repeat`, backgroundColor: "var(--md-surface-container)", border: "1px solid var(--md-outline-variant)", flexShrink: 0 }} />
                  )}
                  <input ref={imageRef} type="file" accept="image/*" onChange={onFileFor("image")} style={{ display: "none" }} />
                  <button onClick={() => imageRef.current?.click()} className="md-btn md-btn-outlined" style={{ padding: "6px 14px", fontSize: 12 }}>
                    {form.image ? "Cambia" : "+ Immagine"}
                  </button>
                  {form.image && <span onClick={() => setF("image", null)} style={{ cursor: "pointer", color: "var(--md-outline)", fontSize: 16, padding: 4 }}>&times;</span>}
                </div>
              </div>
            </div>

            {/* Map / Geotagging */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--md-on-surface-variant)" }}>
                <input type="checkbox" checked={form.showMap} onChange={e => setF("showMap", e.target.checked)} style={{ accentColor: "var(--md-primary)" }} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Mostra posizione sulla mappa
              </label>
              {form.showMap && (
                <div style={{ marginTop: 10 }}>
                  {form.location && (
                    <div style={{ fontSize: 11, color: "var(--md-on-surface-variant)", marginBottom: 6 }}>
                      Coordinate: {form.location.lat}, {form.location.lng}
                    </div>
                  )}
                  <Suspense fallback={<div style={{ height: 200, borderRadius: 12, background: "var(--md-surface-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--md-on-surface-variant)" }}>Caricamento mappa...</div>}>
                    <LocationPicker
                      lat={form.location?.lat}
                      lng={form.location?.lng}
                      onChange={(lat, lng) => setF("location", { lat, lng })}
                      height={200}
                    />
                  </Suspense>
                  {!form.location && (
                    <p style={{ fontSize: 11, color: "var(--md-on-surface-variant)", marginTop: 6, fontStyle: "italic" }}>
                      Clicca sulla mappa per impostare la posizione. Se carichi una foto con dati GPS, verrà precompilata automaticamente.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="md-btn md-btn-filled" onClick={save} disabled={!form.date || !form.title} style={{ opacity: (!form.date || !form.title) ? 0.5 : 1, cursor: (!form.date || !form.title) ? "default" : "pointer" }}>{editId !== null ? "Aggiorna" : "Aggiungi"}</button>
              <button className="md-btn md-btn-outlined" onClick={cancel}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile tab bar when global map is active */}
      {isMobile && showGlobalMap && mode !== "form" && (
        <div style={{
          display: "flex", borderBottom: "1px solid var(--md-outline-variant)",
          background: "var(--md-surface-container-lowest)",
        }}>
          {[{ key: "timeline", label: "Timeline", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg> },
            { key: "map", label: "Mappa", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setMobileTab(tab.key)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "12px 0", border: "none", cursor: "pointer",
              background: mobileTab === tab.key ? "var(--md-primary-container)" : "transparent",
              color: mobileTab === tab.key ? "var(--md-primary)" : "var(--md-on-surface-variant)",
              fontFamily: "var(--md-font)", fontSize: 14, fontWeight: mobileTab === tab.key ? 600 : 400,
              borderBottom: mobileTab === tab.key ? "2px solid var(--md-primary)" : "2px solid transparent",
              minHeight: 48,
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main timeline area */}
      <div style={{ flex: 1, display: "flex", flexDirection: (!isMobile && !isH && showGlobalMap) ? "row" : "column", justifyContent: isH ? "center" : "flex-start", padding: isH ? (isMobile ? "20px 0" : "40px 0") : (isMobile ? "16px 0" : "32px 0") }}>
        {/* Timeline column */}
        <div style={{ flex: 1, minWidth: 0, display: (isMobile && showGlobalMap && mobileTab === "map") ? "none" : undefined }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--md-on-surface-variant)", padding: 60 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3, marginBottom: 12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Nessun evento</p>
            <p style={{ fontSize: 13, marginTop: 4, opacity: 0.6 }}>Clicca + per aggiungere il primo</p>
          </div>
        ) : isH ? (
          /* ========== HORIZONTAL LAYOUT ========== */
          <>
            <div ref={lineRef} style={{ overflowX: "auto", padding: "0 40px 20px", scrollBehavior: "smooth" }}>
              <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", position: "relative", padding: `${100 * zoom}px ${60 * zoom}px` }}>
                {/* Gradient segmented line */}
                {sorted.length > 1 && sorted.map((ev, i) => {
                  if (i === sorted.length - 1) return null;
                  const nextEv = sorted[i + 1];
                  const segW = 120 * zoom + 40 * zoom; // minWidth + marginRight
                  return (
                    <div key={`seg-${i}`} style={{
                      position: "absolute",
                      left: 60 * zoom + i * segW + 60 * zoom,
                      top: "50%", height: 3 * zoom,
                      width: segW,
                      background: `linear-gradient(to right, ${ev.color}90, ${nextEv.color}90)`,
                      borderRadius: 2 * zoom,
                      transform: "translateY(-50%)",
                    }} />
                  );
                })}
                {/* Fallback single line if only 1 event */}
                {sorted.length === 1 && (
                  <div style={{ position: "absolute", left: 60 * zoom, right: 60 * zoom, top: "50%", height: 3 * zoom, background: `${sorted[0].color}60`, borderRadius: 2 * zoom, transform: "translateY(-50%)" }} />
                )}

                {sorted.map((ev, i) => {
                  const active = sel === ev.id;
                  const dotImg = getDotImage(ev);
                  const dotW = dotImg ? (active ? 48 * zoom : 34 * zoom) : (active ? 22 * zoom : 14 * zoom);
                  const isTop = i % 2 === 0;
                  return (
                    <div key={ev.id} data-id={ev.id} className="node" onClick={() => setSel(active ? null : ev.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: 120 * zoom, marginRight: i < sorted.length - 1 ? 40 * zoom : 0 }}>

                      {/* Top label (even index) */}
                      <div style={{ position: "absolute", bottom: `calc(50% + ${24 * zoom}px)`, textAlign: "center", width: 150 * zoom, transition: "all 0.3s" }}>
                        {isTop && <>
                          {/* Connector line */}
                          <div style={{
                            position: "absolute", bottom: -8 * zoom, left: "50%",
                            width: 1.5, height: 10 * zoom,
                            background: active ? ev.color : `${ev.color}50`,
                            borderLeft: active ? "none" : `1.5px dashed ${ev.color}60`,
                            transition: "all 0.3s",
                          }} />
                          {/* Mini-card */}
                          <div style={{
                            background: active ? `${ev.color}15` : "var(--md-surface-container-lowest)",
                            border: active ? `1.5px solid ${ev.color}50` : "1px solid var(--md-outline-variant)",
                            borderRadius: 12 * zoom, padding: `${6 * zoom}px ${10 * zoom}px`,
                            boxShadow: active ? `0 4px 12px ${ev.color}20` : "0 1px 3px rgba(0,0,0,0.06)",
                            transition: "all 0.3s",
                            transform: active ? "translateY(-2px)" : "none",
                          }}>
                            {/* Date badge */}
                            <div style={{
                              display: "inline-block", fontSize: 10 * zoom, fontWeight: 600,
                              color: active ? ev.color : "var(--md-on-surface-variant)",
                              background: active ? `${ev.color}18` : "var(--md-surface-container)",
                              padding: `${2 * zoom}px ${7 * zoom}px`, borderRadius: 6 * zoom,
                              marginBottom: 3 * zoom, transition: "all 0.3s",
                            }}>{fmtEventShort(ev)}</div>
                            <div style={{ fontSize: 12.5 * zoom, fontWeight: active ? 700 : 500, color: active ? ev.color : "var(--md-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "all 0.3s" }}>{ev.title}</div>
                          </div>
                        </>}
                      </div>

                      {/* Dot */}
                      {dotImg ? (
                        <div className="dot" style={{
                          width: dotW, height: dotW, borderRadius: "50%",
                          background: `url(${dotImg}) center/cover`,
                          border: active ? `${3 * zoom}px solid ${ev.color}` : `${2 * zoom}px solid ${ev.color}88`,
                          boxShadow: active ? `0 0 0 ${5 * zoom}px ${ev.color}35, 0 3px 10px rgba(0,0,0,0.15)` : `0 2px 6px rgba(0,0,0,0.12)`,
                          transition: "all 0.3s", zIndex: 2,
                        }} />
                      ) : (
                        /* Ring dot: outer ring + inner fill */
                        <div className="dot" style={{
                          width: dotW, height: dotW, borderRadius: "50%",
                          background: active ? ev.color : `${ev.color}25`,
                          border: `${active ? 3 * zoom : 2.5 * zoom}px solid ${ev.color}`,
                          boxShadow: active ? `0 0 0 ${5 * zoom}px ${ev.color}30, 0 3px 10px rgba(0,0,0,0.15)` : `0 2px 6px ${ev.color}20`,
                          transition: "all 0.3s", zIndex: 2,
                        }} />
                      )}

                      {/* Range bar */}
                      {ev.isRange && ev.dateEnd && (() => {
                        const span = getRangeSpan(ev, i);
                        const barW = Math.max(span * 160 * zoom, 50 * zoom);
                        const barColor = ev.rangeColor || ev.color;
                        return <div style={{
                          position: "absolute", left: "50%", top: "50%",
                          height: 4 * zoom, borderRadius: 2 * zoom,
                          background: barColor, opacity: 0.6,
                          width: barW, transform: "translateY(-50%)", zIndex: 1,
                        }} />;
                      })()}

                      {/* Bottom label (odd index) */}
                      <div style={{ position: "absolute", top: `calc(50% + ${24 * zoom}px)`, textAlign: "center", width: 150 * zoom, transition: "all 0.3s" }}>
                        {!isTop && <>
                          {/* Connector line */}
                          <div style={{
                            position: "absolute", top: -8 * zoom, left: "50%",
                            width: 1.5, height: 10 * zoom,
                            background: active ? ev.color : `${ev.color}50`,
                            borderLeft: active ? "none" : `1.5px dashed ${ev.color}60`,
                            transition: "all 0.3s",
                          }} />
                          {/* Mini-card */}
                          <div style={{
                            background: active ? `${ev.color}15` : "var(--md-surface-container-lowest)",
                            border: active ? `1.5px solid ${ev.color}50` : "1px solid var(--md-outline-variant)",
                            borderRadius: 12 * zoom, padding: `${6 * zoom}px ${10 * zoom}px`,
                            boxShadow: active ? `0 4px 12px ${ev.color}20` : "0 1px 3px rgba(0,0,0,0.06)",
                            transition: "all 0.3s",
                            transform: active ? "translateY(2px)" : "none",
                          }}>
                            <div style={{ fontSize: 12.5 * zoom, fontWeight: active ? 700 : 500, color: active ? ev.color : "var(--md-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "all 0.3s" }}>{ev.title}</div>
                            {/* Date badge */}
                            <div style={{
                              display: "inline-block", fontSize: 10 * zoom, fontWeight: 600,
                              color: active ? ev.color : "var(--md-on-surface-variant)",
                              background: active ? `${ev.color}18` : "var(--md-surface-container)",
                              padding: `${2 * zoom}px ${7 * zoom}px`, borderRadius: 6 * zoom,
                              marginTop: 3 * zoom, transition: "all 0.3s",
                            }}>{fmtEventShort(ev)}</div>
                          </div>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
              <button onClick={() => goNav(-1)} style={{ width: 40 * zoom, height: 40 * zoom, borderRadius: "50%", border: "none", background: "var(--md-surface-container)", cursor: "pointer", fontSize: 16 * zoom, color: "var(--md-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>&larr;</button>
              <button onClick={() => goNav(1)} style={{ width: 40 * zoom, height: 40 * zoom, borderRadius: "50%", border: "none", background: "var(--md-surface-container)", cursor: "pointer", fontSize: 16 * zoom, color: "var(--md-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>&rarr;</button>
            </div>
          </>
        ) : (
          /* ========== VERTICAL LAYOUT ========== */
          <div ref={lineRef} style={{ maxWidth: showGlobalMap ? "100%" : 760 * zoom, margin: "0 auto", padding: "0 20px", width: "100%" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--md-outline-variant)", transform: "translateX(-0.5px)" }} />

              {sorted.map((ev, i) => {
                const active = sel === ev.id;
                const dotImg = getDotImage(ev);
                const isLeft = i % 2 === 0;
                const vDotW = dotImg ? (active ? 38 * zoom : 28 * zoom) : (active ? 14 * zoom : 10 * zoom);

                return (
                  <div key={ev.id} data-id={ev.id} className="vrow" style={{
                    display: "flex", alignItems: "flex-start", position: "relative",
                    marginBottom: 12 * zoom,
                    flexDirection: isLeft ? "row" : "row-reverse",
                    animation: "fadeIn 0.3s ease-out",
                    animationDelay: `${i * 0.05}s`, animationFillMode: "backwards",
                  }}>
                    <div className="vnode" onClick={() => setSel(active ? null : ev.id)} style={{
                      width: `calc(50% - ${28 * zoom}px)`, cursor: "pointer", borderRadius: 12,
                      padding: `${14 * zoom}px ${16 * zoom}px`,
                      background: active ? "var(--md-primary-container)" : "transparent",
                      border: active ? `2px solid var(--md-primary)` : "1px solid transparent",
                      boxShadow: active ? "0 2px 12px rgba(99,102,241,0.18)" : "none",
                      textAlign: isLeft ? "right" : "left",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ fontSize: 11 * zoom, color: "#999", marginBottom: 2 }}>{fmtEventShort(ev)}</div>
                      <div style={{ fontSize: 13 * zoom, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                    </div>

                    <div style={{
                      width: 56 * zoom, flexShrink: 0, display: "flex",
                      alignItems: "flex-start", justifyContent: "center",
                      paddingTop: 14 * zoom,
                    }}>
                      {dotImg ? (
                        <div className="dot" onClick={() => setSel(active ? null : ev.id)} style={{
                          width: vDotW, height: vDotW, borderRadius: "50%",
                          background: `url(${dotImg}) center/cover`, cursor: "pointer",
                          border: active ? `${3 * zoom}px solid ${ev.color}` : `${2 * zoom}px solid #e0e0e0`,
                          boxShadow: active ? `0 0 0 ${4 * zoom}px ${ev.color}40, 0 2px 8px rgba(0,0,0,0.15)` : "none",
                          transition: "all 0.3s",
                        }} />
                      ) : (
                        <div className="dot" onClick={() => setSel(active ? null : ev.id)} style={{
                          width: vDotW, height: vDotW, borderRadius: "50%",
                          background: active ? ev.color : "#ccc", cursor: "pointer",
                          border: active ? `${3 * zoom}px solid ${ev.color}55` : `${3 * zoom}px solid #fff`,
                          boxShadow: active ? `0 0 0 ${4 * zoom}px ${ev.color}30, 0 2px 8px rgba(0,0,0,0.15)` : "none",
                          transition: "all 0.3s",
                        }} />
                      )}
                    </div>

                    {/* Range bar (vertical) */}
                    {ev.isRange && ev.dateEnd && (() => {
                      const span = getRangeSpan(ev, i);
                      const barH = Math.max(span * 56 * zoom, 36 * zoom);
                      const barColor = ev.rangeColor || ev.color;
                      const dotSize = dotImg ? (active ? 38 * zoom : 28 * zoom) : (active ? 14 * zoom : 10 * zoom);
                      const borderW = dotImg ? (active ? 3 * zoom : 2 * zoom) : 3 * zoom;
                      const barTop = 14 * zoom + dotSize + borderW * 2;
                      return <div style={{
                        position: "absolute", left: "50%", top: barTop,
                        width: 4 * zoom, borderRadius: 2 * zoom,
                        background: barColor, opacity: 0.6,
                        height: barH, transform: "translateX(-50%)", zIndex: 1,
                      }} />;
                    })()}

                    <div style={{ width: `calc(50% - ${28 * zoom}px)` }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
              <button onClick={() => goNav(-1)} style={{ width: 40 * zoom, height: 40 * zoom, borderRadius: "50%", border: "none", background: "var(--md-surface-container)", cursor: "pointer", fontSize: 16 * zoom, color: "var(--md-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>&uarr;</button>
              <button onClick={() => goNav(1)} style={{ width: 40 * zoom, height: 40 * zoom, borderRadius: "50%", border: "none", background: "var(--md-surface-container)", cursor: "pointer", fontSize: 16 * zoom, color: "var(--md-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>&darr;</button>
            </div>
          </div>
        )}
        </div>

        {/* Global Map */}
        {showGlobalMap && !(isMobile && mobileTab === "timeline") && (
          <div style={isMobile ? {
            /* Mobile: full-screen map tab */
            padding: "12px",
            flex: 1,
          } : !isH ? {
            /* Desktop vertical layout: sticky side panel */
            width: "40%", maxWidth: 500, flexShrink: 0,
            position: "sticky", top: 16, alignSelf: "flex-start",
            padding: "0 16px 16px 0",
          } : {
            /* Desktop horizontal layout: full-width below timeline */
            padding: "24px 40px 0",
          }}>
            <Suspense fallback={<div style={{ height: 400, borderRadius: 12, background: "var(--md-surface-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--md-on-surface-variant)" }}>Caricamento mappa...</div>}>
              <GlobalMap
                events={sorted}
                onSelectEvent={id => { setSel(id); if (isMobile) setMobileTab("timeline"); }}
                height={isMobile ? "calc(100vh - 240px)" : (isH ? 350 : "calc(100vh - 260px)")}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* FAB - New event */}
      {mode !== "form" && (
        <button className="md-fab-extended" onClick={() => { setEditId(null); setForm(emptyForm); setRangeError(""); setMode("form"); }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuovo evento
        </button>
      )}

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
