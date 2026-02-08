import { useState, useRef, useEffect } from "react";
import { ICONS, COLORS } from "./constants";
import EventModal from "./EventModal";

const emptyForm = { date: "", title: "", desc: "", icon: 0, color: COLORS[0], thumbnail: null, image: null };

export default function TimelineEditor({ timeline, onUpdate, onBack }) {
  const [events, setEvents] = useState(timeline.events);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const thumbRef = useRef(null);
  const imageRef = useRef(null);
  const lineRef = useRef(null);
  const nid = useRef(Date.now());
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    onUpdate({ ...timeline, events });
  }, [events]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.date || !form.title) return;
    if (editId !== null) {
      setEvents(ev => ev.map(e => e.id === editId ? { ...e, ...form } : e));
      setEditId(null);
    } else {
      setEvents(ev => [...ev, { ...form, id: nid.current++ }]);
    }
    setForm(emptyForm);
    setMode("view");
  };

  const startEdit = e => {
    setForm({ date: e.date, title: e.title, desc: e.desc, icon: e.icon, color: e.color, thumbnail: e.thumbnail || null, image: e.image || null });
    setEditId(e.id);
    setSel(null);
    setMode("form");
  };

  const cancel = () => {
    setEditId(null);
    setForm(emptyForm);
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
      if (e.key === "ArrowRight") { e.preventDefault(); goNav(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goNav(-1); }
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
  const fmtDate = d => new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });

  // For timeline dots: use thumbnail, fall back to image for backward compat
  const getDotImage = ev => ev.thumbnail || ev.image;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#111", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .node:hover .dot { transform:scale(1.4); }
        .node .dot { transition:transform 0.2s; }
        ::-webkit-scrollbar { height:0; width:0; }
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
        <div style={{ display: "flex", gap: 8 }}>
          {mode === "form" ? (
            <button onClick={cancel} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#666" }}>Annulla</button>
          ) : (
            <button onClick={() => { setEditId(null); setForm(emptyForm); setMode("form"); }} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Nuovo evento</button>
          )}
        </div>
      </div>

      {/* Form */}
      {mode === "form" && (
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #f0f0f0", animation: "fadeIn 0.3s ease-out" }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Data</label>
                <input type="date" value={form.date} onChange={e => setF("date", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Titolo</label>
                <input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="Nome dell'evento" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
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
              {/* Thumbnail upload */}
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

              {/* Full image upload */}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 0" }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", color: "#ccc", padding: 60 }}>
            <p style={{ fontSize: 15 }}>Nessun evento. Aggiungi il primo.</p>
          </div>
        ) : (
          <>
            {/* Horizontal timeline */}
            <div ref={lineRef} style={{ overflowX: "auto", padding: "0 40px 20px", scrollBehavior: "smooth" }}>
              <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", position: "relative", padding: "80px 60px 80px" }}>
                <div style={{ position: "absolute", left: 60, right: 60, top: "50%", height: 1, background: "#ddd" }} />

                {sorted.map((ev, i) => {
                  const active = sel === ev.id;
                  const dotImg = getDotImage(ev);
                  return (
                    <div key={ev.id} data-id={ev.id} className="node" onClick={() => setSel(active ? null : ev.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: 120, marginRight: i < sorted.length - 1 ? 40 : 0 }}>
                      {/* Top label (alternating) */}
                      <div style={{ position: "absolute", bottom: "calc(50% + 20px)", textAlign: "center", width: 140, transition: "all 0.3s", opacity: active ? 1 : 0.5 }}>
                        {i % 2 === 0 && <>
                          <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{fmtDate(ev.date)}</div>
                          <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                        </>}
                      </div>

                      {/* Dot / Thumbnail */}
                      {dotImg ? (
                        <div className="dot" style={{ width: active ? 44 : 32, height: active ? 44 : 32, borderRadius: "50%", background: `url(${dotImg}) center/cover`, border: active ? `3px solid ${ev.color}` : "2px solid #e0e0e0", boxShadow: active ? `0 0 0 4px ${ev.color}20` : "none", transition: "all 0.3s", zIndex: 2 }} />
                      ) : (
                        <div className="dot" style={{ width: active ? 16 : 10, height: active ? 16 : 10, borderRadius: "50%", background: active ? ev.color : "#ccc", border: active ? `3px solid ${ev.color}33` : "3px solid #fff", boxShadow: active ? `0 0 0 4px ${ev.color}15` : "none", transition: "all 0.3s", zIndex: 2 }} />
                      )}

                      {/* Bottom label (alternating) */}
                      <div style={{ position: "absolute", top: "calc(50% + 20px)", textAlign: "center", width: 140, transition: "all 0.3s", opacity: active ? 1 : 0.5 }}>
                        {i % 2 === 1 && <>
                          <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{fmtDate(ev.date)}</div>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nav arrows */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
              <button onClick={() => goNav(-1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&larr;</button>
              <button onClick={() => goNav(1)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 16, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>&rarr;</button>
            </div>
          </>
        )}
      </div>

      {/* Event detail modal */}
      {selEv && (
        <EventModal
          event={selEv}
          onClose={() => setSel(null)}
          onEdit={startEdit}
          onDelete={remove}
        />
      )}
    </div>
  );
}
