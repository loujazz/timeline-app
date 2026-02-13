import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ICONS, COLORS } from "./constants";
import EventModal from "./EventModal";
import exifr from "exifr";
import useIsMobile from "./useIsMobile";

const LocationPicker = lazy(() => import("./LocationPicker"));
const GlobalMap = lazy(() => import("./GlobalMap"));

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

const SheetIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M10 9H8"/></svg>;

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
  const [showCsvHelp, setShowCsvHelp] = useState(false); // Stato per il popup CSV
  
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
  const getPreviewImage = ev => ev.image;
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
  const csvRef = useRef(null);
  const onCoverFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => updateTimeline({ coverImage: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  // CSV import
  const [csvToast, setCsvToast] = useState(null);
  const onCsvFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setCsvToast("File CSV vuoto o non valido"); setTimeout(() => setCsvToast(null), 3500); return; }
        const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
        const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
        const iData = headers.indexOf("data");
        const iTitolo = headers.indexOf("titolo");
        const iDesc = headers.indexOf("descrizione");
        if (iData === -1 || iTitolo === -1) { setCsvToast("Colonne 'Data' e 'Titolo' obbligatorie"); setTimeout(() => setCsvToast(null), 3500); return; }
        const newEvents = [];
        for (let r = 1; r < lines.length; r++) {
          const cols = lines[r].split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
          const rawDate = cols[iData] || "";
          const title = cols[iTitolo] || "";
          if (!title) continue;
          // Parse DD/MM/YYYY → YYYY-MM-DD
          let date = "";
          const m = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) date = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
          else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) date = rawDate;
          newEvents.push({ ...emptyForm, date, title, desc: iDesc !== -1 ? (cols[iDesc] || "") : "", id: nid.current++ });
        }
        if (newEvents.length === 0) { setCsvToast("Nessun evento trovato nel CSV"); setTimeout(() => setCsvToast(null), 3500); return; }
        setEvents(ev => [...ev, ...newEvents]);
        setCsvToast(`Caricati ${newEvents.length} eventi da CSV`);
        setTimeout(() => setCsvToast(null), 3500);
      } catch { setCsvToast("Errore nella lettura del CSV"); setTimeout(() => setCsvToast(null), 3500); }
    };
    reader.readAsText(f);
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
      <input ref={csvRef} type="file" accept=".csv,.tsv,.txt" onChange={onCsvFile} style={{ display: "none" }} />

      {/* Large cover banner (Google Classroom style) */}
      <div style={{
        ...coverBgStyle, position: "relative",
        minHeight: isMobile ? 120 : 180, padding: isMobile ? "0 12px" : "0 32px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderRadius: "0 0 16px 16px",
      }}>
        {/* Dark gradient overlay for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)", borderRadius: "inherit" }} />

        {/* Top Navbar */}
        <div style={{
          position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 16, zIndex: 10
        }}>
          {/* Back button */}
          <button className="md-btn md-btn-text" onClick={onBack} style={{ color: "white", minWidth: "auto", padding: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Right actions */}
          <div style={{ display: "flex", gap: 8 }}>
            {!isMobile && (
              <>
                <button className="md-btn md-btn-text" onClick={() => setShowGlobalMap(!showGlobalMap)} style={{ color: "white" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                  {showGlobalMap ? "Nascondi Mappa" : "Mappa Globale"}
                </button>
                <button className="md-btn md-btn-text" onClick={() => setShowSettings(!showSettings)} style={{ color: "white" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
              </>
            )}
            <button className="md-btn md-btn-text" onClick={() => setShowCsvHelp(true)} style={{ color: "white" }} title="Carica CSV">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </button>
            <button className="md-btn md-btn-text" onClick={() => coverImgRef.current.click()} style={{ color: "white" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
          </div>
        </div>

        {/* Title area */}
        <div style={{ position: "relative", marginBottom: 24, zIndex: 10 }}>
          <input
            value={timeline.title}
            onChange={e => updateTimeline({ title: e.target.value })}
            style={{
              background: "transparent", border: "none", color: "white", fontSize: isMobile ? 28 : 36, fontWeight: 700,
              width: "100%", textShadow: "0 2px 4px rgba(0,0,0,0.3)", outline: "none",
              fontFamily: "var(--md-font-display)", letterSpacing: "-0.5px"
            }}
          />
          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>
            <span>{events.length} eventi</span>
            <span>•</span>
            <span>Creato il {new Date(timeline.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Settings (Below header) */}
      <div style={{
        padding: "12px 20px", borderBottom: "1px solid var(--md-outline-variant)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        background: "var(--md-surface)", position: "sticky", top: 0, zIndex: 900
      }}>
        {/* View toggles */}
        <div style={{ display: "flex", background: "var(--md-surface-container)", borderRadius: 10, padding: 4 }}>
          <button onClick={() => setLayout("horizontal")} style={{
            padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
            background: layout === "horizontal" ? "var(--md-surface)" : "transparent",
            color: layout === "horizontal" ? "var(--md-primary)" : "var(--md-on-surface-variant)",
            boxShadow: layout === "horizontal" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            <span style={{ display: isMobile ? "none" : "inline" }}>Orizzontale</span>
          </button>
          <button onClick={() => setLayout("vertical")} style={{
            padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
            background: layout === "vertical" ? "var(--md-surface)" : "transparent",
            color: layout === "vertical" ? "var(--md-primary)" : "var(--md-on-surface-variant)",
            boxShadow: layout === "vertical" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            <span style={{ display: isMobile ? "none" : "inline" }}>Verticale</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--md-on-surface-variant)", textTransform: "uppercase" }}>Zoom</span>
          <div style={{ display: "flex", alignItems: "center", background: "var(--md-surface-container)", borderRadius: 999 }}>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&minus;</button>
            <span style={{ fontSize: 12, fontWeight: 600, width: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
          <button onClick={() => setZoom(1)} style={{ fontSize: 12, fontWeight: 600, color: "var(--md-primary)", background: "transparent", border: "none", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
        
        {/* Mobile Tabs */}
        {isMobile && showGlobalMap && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--md-outline-variant)" }}>
            {[ {key: "timeline", label: "Timeline"}, {key: "map", label: "Mappa"} ].map(tab => (
              <button key={tab.key} onClick={() => setMobileTab(tab.key)} style={{
                flex: 1, padding: 12, background: "var(--md-surface)", border: "none", 
                fontWeight: mobileTab === tab.key ? 600 : 400,
                borderBottom: mobileTab === tab.key ? "2px solid var(--md-primary)" : "2px solid transparent",
                color: mobileTab === tab.key ? "var(--md-primary)" : "var(--md-on-surface-variant)"
              }}>{tab.label}</button>
            ))}
          </div>
        )}

        {/* Map Panel (Desktop: Sidebar, Mobile: Tab) */}
        {showGlobalMap && (!isMobile || mobileTab === "map") && (
          <div style={{
            width: isMobile ? "100%" : 400, flexShrink: 0,
            borderRight: isMobile ? "none" : "1px solid var(--md-outline-variant)",
            height: isMobile ? "calc(100vh - 200px)" : "auto",
            position: "relative"
          }}>
            <Suspense fallback={<div style={{ padding: 20 }}>Caricamento mappa...</div>}>
              <GlobalMap events={sorted} onSelect={id => { setSel(id); if (isMobile) setMobileTab("timeline"); }} />
            </Suspense>
          </div>
        )}

        {/* Timeline View */}
        {(!isMobile || mobileTab === "timeline") && (
          <div style={{ flex: 1, overflow: "auto", position: "relative", padding: "40px 20px" }}>
            
            {/* Horizontal Layout */}
            {isH ? (
              <div ref={lineRef} style={{
                display: "flex", alignItems: "flex-start", gap: 60 * zoom,
                minWidth: "min-content", padding: "0 50vw", position: "relative", paddingTop: 80
              }}>
                {/* Central Line */}
                <div style={{ position: "absolute", top: 127, left: 0, right: 0, height: 2, background: "var(--md-outline-variant)", zIndex: 0 }} />
                
                {sorted.map((ev, i) => {
                  const active = sel === ev.id;
                  const span = getRangeSpan(ev, i);
                  return (
                    <div key={ev.id} data-id={ev.id} onClick={() => setSel(active ? null : ev.id)} style={{
                      position: "relative", flexShrink: 0, width: 220 * zoom,
                      display: "flex", flexDirection: "column", alignItems: "center",
                      cursor: "pointer", zIndex: 1
                    }}>
                      {/* Date Label */}
                      <div style={{
                        marginBottom: 16, fontSize: 13, fontWeight: 600, color: "var(--md-on-surface-variant)",
                        background: "var(--md-surface)", padding: "2px 8px", borderRadius: 4
                      }}>
                        {fmtEventShort(ev)}
                      </div>

                      {/* Dot & Range Bar */}
                      <div style={{ position: "relative", width: "100%", height: 20, display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {/* Range Bar */}
                        {ev.isRange && span > 0 && (
                          <div style={{
                            position: "absolute", left: "50%", top: 8, height: 4,
                            width: `calc(100% * ${span} + ${(60 * zoom) * span}px)`,
                            background: ev.rangeColor, borderRadius: 2, opacity: 0.6, pointerEvents: "none"
                          }} />
                        )}
                        {/* Dot */}
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", background: ev.color,
                          border: active ? `4px solid white` : `2px solid white`,
                          boxShadow: active ? `0 0 0 2px ${ev.color}, 0 4px 8px rgba(0,0,0,0.2)` : "0 2px 4px rgba(0,0,0,0.1)",
                          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          transform: active ? "scale(1.2)" : "scale(1)",
                          zIndex: 2, overflow: "hidden"
                        }}>
                          {getDotImage(ev) && <img src={getDotImage(ev)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                      </div>

                      {/* Card */}
                      <div style={{
                        marginTop: 20, width: "100%", background: "var(--md-surface-container-low)",
                        borderRadius: 12, padding: 12, border: "1px solid transparent",
                        borderColor: active ? "var(--md-primary)" : "var(--md-outline-variant)",
                        boxShadow: active ? "var(--md-elev2)" : "none",
                        transition: "all 0.2s", transform: active ? "translateY(-4px)" : "none"
                      }}>
                        {getPreviewImage(ev) && (
                          <div style={{ height: 100 * zoom, marginBottom: 8, borderRadius: 8, overflow: "hidden", background: "#eee" }}>
                             <img src={getPreviewImage(ev)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <h3 style={{ margin: "0 0 4px", fontSize: 14 * zoom, fontWeight: 700, lineHeight: 1.3 }}>{ev.title}</h3>
                        <div style={{ fontSize: 18 }}>{ICONS[ev.icon]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Vertical Layout
              <div ref={lineRef} style={{ maxWidth: 600, margin: "0 auto", position: "relative", padding: "20px 0" }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 29, width: 2, background: "var(--md-outline-variant)" }} />
                
                {sorted.map(ev => {
                  const active = sel === ev.id;
                  return (
                    <div key={ev.id} data-id={ev.id} onClick={() => setSel(active ? null : ev.id)} style={{
                      display: "flex", gap: 24, marginBottom: 32, cursor: "pointer", position: "relative"
                    }}>
                      {/* Dot */}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", background: ev.color,
                        flexShrink: 0, marginTop: 4, zIndex: 1, position: "relative", left: 20,
                        border: active ? `4px solid white` : `2px solid white`,
                        boxShadow: active ? `0 0 0 2px ${ev.color}` : "0 2px 4px rgba(0,0,0,0.1)",
                        transform: active ? "scale(1.2)" : "scale(1)", transition: "all 0.2s"
                      }}>
                        {getDotImage(ev) && <img src={getDotImage(ev)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>

                      {/* Content */}
                      <div style={{
                        flex: 1, background: active ? "var(--md-surface-container)" : "var(--md-surface)",
                        borderRadius: 12, padding: 16, border: "1px solid",
                        borderColor: active ? "var(--md-primary)" : "var(--md-outline-variant)",
                        boxShadow: active ? "var(--md-elev1)" : "none", transition: "all 0.2s"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                           <span style={{ fontSize: 12, fontWeight: 600, color: ev.color, textTransform: "uppercase" }}>{fmtEventShort(ev)}</span>
                           <span>{ICONS[ev.icon]}</span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{ev.title}</h3>
                        {active && ev.desc && (
                           <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--md-on-surface-variant)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                             {ev.desc.replace(/<[^>]*>?/gm, '')}
                           </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB: Add Event */}
      <button className="md-btn md-btn-filled" onClick={() => startEdit(emptyForm)} style={{
        position: "fixed", bottom: 24, right: 24, borderRadius: 16, padding: "16px 20px",
        boxShadow: "var(--md-elev2)", zIndex: 800
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span style={{ marginLeft: 8, fontWeight: 600 }}>Nuovo evento</span>
      </button>

      {/* Event Details Modal */}
      {selEv && mode === "view" && (
        <EventModal
          event={selEv}
          onClose={() => setSel(null)}
          onEdit={() => startEdit(selEv)}
          onDelete={() => remove(selEv.id)}
        />
      )}

      {/* Edit Form Drawer */}
      {mode === "form" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "flex-end"
        }} onClick={cancel}>
          <div style={{
            width: isMobile ? "100%" : 420, height: "100%", background: "var(--md-surface)",
            padding: 24, boxSizing: "border-box", overflowY: "auto",
            animation: "slideInRight 0.25s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 24px" }}>{editId !== null ? "Modifica evento" : "Nuovo evento"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
               {/* Date Section */}
               <div style={{ background: "var(--md-surface-container-low)", padding: 16, borderRadius: 12 }}>
                 <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                   {DATE_TYPES.map(t => (
                     <button key={t.value} onClick={() => setF("dateType", t.value)} style={{
                       flex: 1, padding: "6px 0", fontSize: 12, borderRadius: 6, border: "none", cursor: "pointer",
                       background: form.dateType === t.value ? "var(--md-primary)" : "var(--md-surface-container-high)",
                       color: form.dateType === t.value ? "white" : "var(--md-on-surface)"
                     }}>{t.label}</button>
                   ))}
                 </div>
                 
                 {renderDateField(form.date, e => setF("date", e.target.value), form.isBC, v => setF("isBC", v), "Data evento")}
                 
                 <div style={{ marginTop: 12 }}>
                   <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                     <input type="checkbox" checked={form.isRange} onChange={e => setF("isRange", e.target.checked)} />
                     È un periodo (durata)
                   </label>
                 </div>

                 {form.isRange && (
                   <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--md-outline-variant)" }}>
                     {renderDateField(form.dateEnd, e => setF("dateEnd", e.target.value), form.isBCEnd, v => setF("isBCEnd", v), "Data fine")}
                     <div style={{ marginTop: 8 }}>
                       <label style={labelSt}>Colore barra durata</label>
                       <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                         {RANGE_COLORS.map(c => (
                           <div key={c} onClick={() => setF("rangeColor", c)} style={{
                             width: 20, height: 20, borderRadius: 4, background: c, cursor: "pointer",
                             border: form.rangeColor === c ? "2px solid var(--md-on-surface)" : "1px solid transparent"
                           }} />
                         ))}
                       </div>
                     </div>
                   </div>
                 )}
                 {rangeError && <div style={{ color: "var(--md-error)", fontSize: 12, marginTop: 8 }}>{rangeError}</div>}
               </div>

               {/* Title & Desc */}
               <div>
                 <label style={labelSt}>Titolo</label>
                 <input value={form.title} onChange={e => setF("title", e.target.value)} style={inputSt} placeholder="Es. Scoperta dell'America" />
               </div>
               <div>
                 <label style={labelSt}>Descrizione</label>
                 <textarea value={form.desc} onChange={e => setF("desc", e.target.value)} style={{ ...inputSt, minHeight: 80, resize: "vertical" }} placeholder="Dettagli, link, note..." />
               </div>

               {/* Appearance */}
               <div>
                 <label style={labelSt}>Icona e Colore</label>
                 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                   <select value={form.icon} onChange={e => setF("icon", Number(e.target.value))} style={{ ...inputSt, width: "auto" }}>
                     {ICONS.map((ic, i) => <option key={i} value={i}>Icona {i+1}</option>)}
                   </select>
                   <div style={{ display: "flex", gap: 4 }}>
                     {COLORS.map(c => (
                       <div key={c} onClick={() => setF("color", c)} style={{
                         width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                         boxShadow: form.color === c ? "0 0 0 2px var(--md-surface), 0 0 0 4px var(--md-primary)" : "none"
                       }} />
                     ))}
                   </div>
                 </div>
               </div>

               {/* Images */}
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                 <div>
                   <label style={labelSt}>Icona Timeline</label>
                   <div onClick={() => thumbRef.current.click()} style={{
                     height: 80, background: "var(--md-surface-container-high)", borderRadius: 8,
                     display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative"
                   }}>
                     {form.thumbnail ? <img src={form.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12 }}>Scegli...</span>}
                     {form.thumbnail && <div onClick={e => { e.stopPropagation(); setF("thumbnail", null); }} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</div>}
                   </div>
                   <input ref={thumbRef} type="file" accept="image/*" onChange={onFileFor("thumbnail")} style={{ display: "none" }} />
                 </div>
                 <div>
                   <label style={labelSt}>Immagine Popup</label>
                   <div onClick={() => imageRef.current.click()} style={{
                     height: 80, background: "var(--md-surface-container-high)", borderRadius: 8,
                     display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative"
                   }}>
                     {form.image ? <img src={form.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12 }}>Scegli...</span>}
                     {form.image && <div onClick={e => { e.stopPropagation(); setF("image", null); }} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</div>}
                   </div>
                   <input ref={imageRef} type="file" accept="image/*" onChange={onFileFor("image")} style={{ display: "none" }} />
                 </div>
               </div>
               
               {/* Location */}
               <LocationPicker
                 location={form.location}
                 showMap={form.showMap}
                 onLocationChange={loc => setF("location", loc)}
                 onToggleMap={v => setF("showMap", v)}
               />
               
               {/* Actions */}
               <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                 <button onClick={cancel} style={{ flex: 1, padding: 12, borderRadius: 100, border: "1px solid var(--md-outline)", background: "transparent", fontWeight: 600, cursor: "pointer" }}>Annulla</button>
                 <button onClick={save} style={{ flex: 1, padding: 12, borderRadius: 100, border: "none", background: "var(--md-primary)", color: "var(--md-on-primary)", fontWeight: 600, cursor: "pointer" }}>Salva</button>
               </div>

            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && (
        <div style={{
           position: "fixed", top: 60, right: 20, width: 280, background: "var(--md-surface)",
           borderRadius: 16, padding: 16, boxShadow: "var(--md-elev2)", zIndex: 1000,
           border: "1px solid var(--md-outline-variant)"
        }}>
           <h4 style={{ margin: "0 0 12px" }}>Impostazioni Timeline</h4>
           <div style={{ marginBottom: 12 }}>
             <label style={labelSt}>Arco Temporale Globale</label>
             <div style={{ fontSize: 12, color: "var(--md-on-surface-variant)", marginBottom: 8 }}>
               Definisci inizio e fine per scalare correttamente la timeline.
             </div>
             <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
               <input placeholder="Inizio (es. 1900)" value={timeline.dateStart || ""} onChange={e => updateTimeline({ dateStart: e.target.value })} style={inputSt} />
               <button onClick={() => updateTimeline({ dateStartBC: !timeline.dateStartBC })} style={{ border: "1px solid var(--md-outline)", background: timeline.dateStartBC ? "var(--md-primary-container)" : "transparent", borderRadius: 4, cursor: "pointer" }}>a.C.</button>
             </div>
             <div style={{ display: "flex", gap: 8 }}>
               <input placeholder="Fine (es. 2000)" value={timeline.dateEnd || ""} onChange={e => updateTimeline({ dateEnd: e.target.value })} style={inputSt} />
               <button onClick={() => updateTimeline({ dateEndBC: !timeline.dateEndBC })} style={{ border: "1px solid var(--md-outline)", background: timeline.dateEndBC ? "var(--md-primary-container)" : "transparent", borderRadius: 4, cursor: "pointer" }}>a.C.</button>
             </div>
           </div>
           
           <div style={{ marginBottom: 12 }}>
             <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
               <input type="checkbox" checked={timeline.showPreviews !== false} onChange={e => updateTimeline({ showPreviews: e.target.checked })} />
               Mostra anteprima immagini nelle card
             </label>
           </div>
           
           <button onClick={() => setShowSettings(false)} style={{ width: "100%", padding: 8, background: "var(--md-surface-container-high)", border: "none", borderRadius: 8, cursor: "pointer" }}>Chiudi</button>
        </div>
      )}

      {/* CSV HELP MODAL */}
      {showCsvHelp && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }} onClick={() => setShowCsvHelp(false)}>
          <div style={{
            background: "var(--md-surface)", width: "100%", maxWidth: 500,
            borderRadius: 24, padding: 24, border: "1px solid var(--md-outline-variant)",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)"
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 12, background: "var(--md-primary-container)", 
                color: "var(--md-primary)", display: "flex", alignItems: "center", justifyContent: "center" 
              }}>
                <SheetIcon />
              </div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Importa da CSV</h3>
            </div>

            <p style={{ lineHeight: 1.6, color: "var(--md-on-surface-variant)", marginBottom: 16 }}>
              Stai per importare una lista di eventi. Per un risultato perfetto, assicurati che il tuo file CSV abbia queste tre colonne:
              <br/><strong>Data, Titolo, Descrizione</strong>.
            </p>

            <div style={{ background: "var(--md-surface-container-lowest)", padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 13 }}>
              <strong>Suggerimento Pro:</strong><br/>
              Puoi generare questo file automaticamente usando <strong>NotebookLM</strong>. 
              {onGuide ? (
                <>
                  <button onClick={() => { setShowCsvHelp(false); onGuide(); }} style={{ 
                    background: "none", border: "none", padding: 0, marginLeft: 6, 
                    color: "var(--md-primary)", textDecoration: "underline", cursor: "pointer", fontWeight: 600 
                  }}>
                    Leggi la guida completa
                  </button> per copiare il prompt esatto.
                </>
              ) : (
                <span> Controlla la Guida per il prompt esatto.</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCsvHelp(false)} style={{
                padding: "10px 18px", borderRadius: 100, border: "none", 
                background: "transparent", color: "var(--md-on-surface-variant)", 
                cursor: "pointer", fontWeight: 500
              }}>
                Annulla
              </button>
              <button onClick={() => {
                setShowCsvHelp(false);
                if(csvRef.current) csvRef.current.click();
              }} style={{
                padding: "10px 24px", borderRadius: 100, border: "none", 
                background: "var(--md-primary)", color: "var(--md-on-primary)", 
                cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}>
                Seleziona File CSV
              </button>
            </div>

          </div>
        </div>
      )}

      {csvToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--md-inverse-surface)", color: "var(--md-inverse-on-surface)",
          padding: "12px 24px", borderRadius: 999, fontSize: 14, boxShadow: "var(--md-elev2)", zIndex: 3000
        }}>
          {csvToast}
        </div>
      )}
    </div>
  );
}
