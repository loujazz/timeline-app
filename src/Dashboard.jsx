import { useState, useRef, useEffect } from "react";
import { COLORS } from "./constants";
import { compressImage } from "./imageUtils";

const CARD_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#0ea5e9",
];

function cardColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return CARD_COLORS[Math.abs(h) % CARD_COLORS.length];
}

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

export default function Dashboard({ timelines, onCreate, onOpen, onDelete, onUpdate, onHome, onGuide, onChangelog, onExport, onImport, exportDirty }) {
  const [name, setName] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  const coverInputRef = useRef(null);
  const [coverTarget, setCoverTarget] = useState(null);
  const importInputRef = useRef(null);
  const [importModal, setImportModal] = useState(null); // { fileData, incoming, hasConflicts }
  const [importResult, setImportResult] = useState(null); // { success, message }

  const handleImportFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = parsed.timelines || parsed;
        if (!Array.isArray(incoming)) throw new Error();
        const existingIds = new Set(timelines.map(t => t.id));
        const hasConflicts = incoming.some(t => existingIds.has(t.id));
        if (hasConflicts || timelines.length > 0) {
          setImportModal({ fileData: ev.target.result, incoming, hasConflicts });
        } else {
          // Empty dashboard, just import directly
          const res = onImport(ev.target.result, "replace");
          setImportResult(res.success
            ? { success: true, message: `Importate ${res.count} timeline con successo!` }
            : { success: false, message: res.error });
        }
      } catch {
        setImportResult({ success: false, message: "File non valido o corrotto" });
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const doImport = mode => {
    if (!importModal) return;
    const res = onImport(importModal.fileData, mode);
    setImportModal(null);
    setImportResult(res.success
      ? { success: true, message: mode === "replace"
          ? `Sostituite tutte le timeline con ${res.count} dal backup.`
          : `Merge completato: aggiunte le nuove timeline.` }
      : { success: false, message: res.error });
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    setShowNew(false);
  };

  const handleKey = e => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") { setShowNew(false); setName(""); }
  };

  useEffect(() => {
    if (menuOpen === null) return;
    const close = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  // Auto-dismiss import result toast
  useEffect(() => {
    if (!importResult) return;
    const t = setTimeout(() => setImportResult(null), 3500);
    return () => clearTimeout(t);
  }, [importResult]);

  const fmtDate = d => new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });

  const setCoverColor = (tl, color) => {
    onUpdate(tl.id, { coverColor: color, coverImage: null });
    setMenuOpen(null);
  };

  const handleCoverImage = (tl) => {
    setCoverTarget(tl.id);
    coverInputRef.current?.click();
  };

  const onCoverFile = e => {
    const f = e.target.files[0];
    if (!f || !coverTarget) return;
    const r = new FileReader();
    r.onload = async ev => {
      const compressed = await compressImage(ev.target.result);
      if (coverTarget) onUpdate(coverTarget, { coverImage: compressed });
      setCoverTarget(null);
    };
    r.readAsDataURL(f);
    e.target.value = "";
  };

  // Resolve cover background for a timeline
  const coverBg = tl => {
    if (tl.coverImage) return { background: `url(${tl.coverImage}) center/cover no-repeat` };
    return { background: tl.coverColor || cardColor(tl.id) };
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--md-font)", color: "var(--md-on-surface)", background: "var(--md-surface)", overflowX: "hidden" }}>
      <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverFile} style={{ display: "none" }} />
      <input ref={importInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: "none" }} />

      {/* Top bar */}
      <div style={{
        padding: "24px 16px", maxWidth: 1100, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {onHome && (
            <button onClick={onHome} className="md-btn" title="Home" style={{
              width: 40, height: 40, borderRadius: 12, border: "none", padding: 0, flexShrink: 0,
              background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-high)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--md-surface-container)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
          )}
          {onGuide && (
            <button onClick={onGuide} className="md-btn" title="Guida" style={{
              width: 40, height: 40, borderRadius: 12, border: "none", padding: 0, flexShrink: 0,
              background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-high)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--md-surface-container)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </button>
          )}
          {onChangelog && (
            <button onClick={onChangelog} className="md-btn" title="Novità" style={{
              width: 40, height: 40, borderRadius: 12, border: "none", padding: 0, flexShrink: 0,
              background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-high)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--md-surface-container)"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: 30, display: "block", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--md-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Le mie Timeline</h1>
              <p style={{ marginTop: 2, fontSize: 13, color: "var(--md-on-surface-variant)" }}>
                {timelines.length === 0 ? "Crea la tua prima timeline" : `${timelines.length} timeline`}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Export button with semaphore */}
          {onExport && (
            <button
              className="md-btn md-btn-outlined"
              onClick={onExport}
              title="Esporta backup"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Esporta
              {/* Semaphore dot */}
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: exportDirty ? "#f59e0b" : "#10b981",
                display: "inline-block", flexShrink: 0,
                boxShadow: exportDirty ? "0 0 6px #f59e0b80" : "0 0 6px #10b98180",
                transition: "all 0.3s",
              }} title={exportDirty ? "Modifiche non esportate" : "Backup aggiornato"} />
            </button>
          )}

          {/* Import button */}
          {onImport && (
            <button
              className="md-btn md-btn-outlined"
              onClick={() => importInputRef.current?.click()}
              title="Importa backup"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Importa
            </button>
          )}

          <button
            className="md-btn md-btn-filled"
            onClick={() => setShowNew(true)}
            style={{ display: showNew ? "none" : "inline-flex", flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuova Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 80px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Create inline form */}
        {showNew && (
          <div style={{
            padding: "16px 16px", borderRadius: 16, background: "var(--md-surface-container-lowest)",
            boxShadow: "var(--md-elev2)", marginBottom: 24,
            display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
            animation: "scaleIn 0.2s ease-out",
          }}>
            <input
              autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
              placeholder="Nome della nuova timeline..."
              className="md-input" style={{ flex: "1 1 200px", minWidth: 0 }}
            />
            <button className="md-btn md-btn-filled" onClick={handleCreate} disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.5, cursor: name.trim() ? "pointer" : "default" }}
            >Crea</button>
            <button className="md-btn md-btn-outlined" onClick={() => { setShowNew(false); setName(""); }}>Annulla</button>
          </div>
        )}

        {/* Card Grid */}
        <div className="dashboard-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {timelines.map((tl, idx) => (
            <div key={tl.id} className="md-card" style={{
              cursor: "pointer",
              animation: `fadeIn 0.3s ease-out ${idx * 0.05}s backwards`,
            }} onClick={() => onOpen(tl.id)}>

              {/* Cover Header */}
              <div style={{
                height: 100, ...coverBg(tl), position: "relative",
                padding: "20px 20px 0", display: "flex", flexDirection: "column", justifyContent: "flex-end",
              }}>
                {/* Dark overlay for text readability on cover images */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "inherit",
                  background: tl.coverImage
                    ? "rgba(0,0,0,0.45)"
                    : "none",
                  pointerEvents: "none",
                }} />
                <h3 style={{
                  position: "relative", zIndex: 1,
                  color: "#fff", fontSize: 18, fontWeight: 600,
                  lineHeight: 1.3, marginBottom: 14,
                  textShadow: tl.coverImage ? "0 1px 6px rgba(0,0,0,0.5)" : "0 1px 3px rgba(0,0,0,0.3)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{tl.name}</h3>

                {/* Three-dot menu */}
                <div style={{ position: "absolute", top: 10, right: 10 }} ref={menuOpen === tl.id ? menuRef : null}>
                  <button className="card-menu-btn" onClick={e => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === tl.id ? null : tl.id);
                  }} style={{ color: "rgba(255,255,255,0.9)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/></svg>
                  </button>

                  {menuOpen === tl.id && (
                    <div style={{
                      position: "absolute", top: 40, right: 0, minWidth: 200,
                      background: "var(--md-surface-container-lowest)",
                      borderRadius: 12, boxShadow: "var(--md-elev3)",
                      padding: "6px 0", zIndex: 20,
                      animation: "scaleIn 0.15s ease-out",
                    }} onClick={e => e.stopPropagation()}>

                      {/* Cover color picker */}
                      <div style={{ padding: "8px 16px 10px" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--md-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Colore copertina</span>
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          {CARD_COLORS.map(c => (
                            <div key={c} onClick={() => setCoverColor(tl, c)} style={{
                              width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer",
                              border: `2px solid ${(tl.coverColor || cardColor(tl.id)) === c && !tl.coverImage ? "#fff" : "transparent"}`,
                              boxShadow: (tl.coverColor || cardColor(tl.id)) === c && !tl.coverImage ? `0 0 0 1.5px ${c}` : "none",
                              transition: "all 0.15s",
                            }} />
                          ))}
                        </div>
                      </div>

                      <div style={{ height: 1, background: "var(--md-outline-variant)", margin: "4px 0" }} />

                      {/* Upload cover image */}
                      <button onClick={() => { handleCoverImage(tl); setMenuOpen(null); }} style={{
                        width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                        textAlign: "left", fontSize: 14, cursor: "pointer", color: "var(--md-on-surface)",
                        fontFamily: "var(--md-font)", display: "flex", alignItems: "center", gap: 10,
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-low)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Immagine copertina
                      </button>

                      {/* Remove cover image if set */}
                      {tl.coverImage && (
                        <button onClick={() => { onUpdate(tl.id, { coverImage: null }); setMenuOpen(null); }} style={{
                          width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                          textAlign: "left", fontSize: 14, cursor: "pointer", color: "var(--md-on-surface-variant)",
                          fontFamily: "var(--md-font)", display: "flex", alignItems: "center", gap: 10,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-low)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Rimuovi immagine
                        </button>
                      )}

                      <div style={{ height: 1, background: "var(--md-outline-variant)", margin: "4px 0" }} />

                      <button onClick={() => { setMenuOpen(null); onOpen(tl.id); }} style={{
                        width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                        textAlign: "left", fontSize: 14, cursor: "pointer", color: "var(--md-on-surface)",
                        fontFamily: "var(--md-font)", display: "flex", alignItems: "center", gap: 10,
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--md-surface-container-low)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Modifica
                      </button>
                      <button onClick={() => { setMenuOpen(null); onDelete(tl.id); }} style={{
                        width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                        textAlign: "left", fontSize: 14, cursor: "pointer", color: "#ef4444",
                        fontFamily: "var(--md-font)", display: "flex", alignItems: "center", gap: 10,
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Elimina
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "16px 20px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--md-on-surface-variant)", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {fmtDate(tl.createdAt)}
                  </span>
                  <span style={{
                    padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
                    background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)",
                  }}>
                    {tl.events.length} eventi
                  </span>
                </div>
                {tl.events.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                    {tl.events.slice(0, 8).map((ev, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color || "var(--md-outline)" }} />
                    ))}
                    {tl.events.length > 8 && (
                      <span style={{ fontSize: 10, color: "var(--md-on-surface-variant)", marginLeft: 2 }}>+{tl.events.length - 8}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {timelines.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--md-on-surface-variant)" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3, marginBottom: 16 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style={{ fontSize: 16, fontWeight: 500 }}>Nessuna timeline ancora</p>
            <p style={{ fontSize: 14, marginTop: 6, opacity: 0.7 }}>Clicca "Nuova Timeline" per iniziare</p>
          </div>
        )}
      </div>

      {/* Import conflict modal */}
      {importModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          animation: "fadeIn 0.2s ease-out",
        }} onClick={() => setImportModal(null)}>
          <div style={{
            background: "var(--md-surface-container-lowest)", borderRadius: 20,
            padding: "28px 28px 20px", maxWidth: 420, width: "90%",
            boxShadow: "var(--md-elev3)", animation: "scaleIn 0.2s ease-out",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--md-on-surface)" }}>
              Importa Archivio
            </h3>
            <p style={{ fontSize: 14, color: "var(--md-on-surface-variant)", lineHeight: 1.5, marginBottom: 6 }}>
              Il file contiene <strong>{importModal.incoming.length}</strong> timeline.
            </p>
            {importModal.hasConflicts && (
              <p style={{ fontSize: 13, color: "#f59e0b", lineHeight: 1.5, marginBottom: 6 }}>
                Alcune timeline hanno lo stesso ID di quelle esistenti.
              </p>
            )}
            <p style={{ fontSize: 14, color: "var(--md-on-surface-variant)", lineHeight: 1.5, marginBottom: 20 }}>
              Cosa vuoi fare?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="md-btn md-btn-filled" onClick={() => doImport("merge")} style={{ width: "100%", justifyContent: "center" }}>
                Unisci (Merge) — aggiungi solo le nuove
              </button>
              <button className="md-btn md-btn-outlined" onClick={() => doImport("replace")} style={{ width: "100%", justifyContent: "center", color: "#ef4444", borderColor: "#ef4444" }}>
                Sostituisci tutto con il backup
              </button>
              <button className="md-btn md-btn-outlined" onClick={() => setImportModal(null)} style={{ width: "100%", justifyContent: "center" }}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import result toast */}
      {importResult && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: importResult.success ? "#10b981" : "#ef4444", color: "#fff",
          padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 1001,
          animation: "fadeIn 0.2s ease-out", cursor: "pointer",
        }} onClick={() => setImportResult(null)}>
          {importResult.message}
        </div>
      )}
    </div>
  );
}
