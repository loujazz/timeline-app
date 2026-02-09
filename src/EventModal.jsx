import { useEffect } from "react";
import { ICONS } from "./constants";

export default function EventModal({ event, fmtDate: fmtDateProp, onClose, onEdit, onDelete }) {
  const defaultFmt = ev => {
    const d = typeof ev === "string" ? ev : ev.date;
    return new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });
  };
  const fmtDate = fmtDateProp || defaultFmt;

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleBackdrop = e => {
    if (e.target === e.currentTarget) onClose();
  };

  const modalImage = event.image || event.thumbnail;

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "modalFadeIn 0.2s ease-out",
      padding: 20,
    }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp { from { opacity:0; transform:translateY(20px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>

      <div style={{
        background: "var(--md-surface-container-lowest)", borderRadius: 28, maxWidth: 520, width: "100%",
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative",
        animation: "modalSlideUp 0.3s cubic-bezier(0.2, 0, 0, 1)", overflow: "hidden",
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, zIndex: 2,
          width: 36, height: 36, borderRadius: "50%",
          border: "none", background: modalImage ? "rgba(255,255,255,0.85)" : "var(--md-surface-container)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: "var(--md-on-surface-variant)", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = modalImage ? "rgba(255,255,255,1)" : "var(--md-surface-container-high)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = modalImage ? "rgba(255,255,255,0.85)" : "var(--md-surface-container)"; }}
        >
          &times;
        </button>

        {/* Image */}
        {modalImage && (
          <div style={{
            width: "100%", height: 240, minHeight: 240, overflow: "hidden", flexShrink: 0,
            borderBottom: "1px solid var(--md-outline-variant)", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "var(--md-surface-container-low)",
          }}>
            <img src={modalImage} alt={event.title} style={{
              width: "100%", height: "100%", display: "block",
              objectFit: "cover",
            }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: modalImage ? "24px 28px 24px" : "32px 28px 24px", overflowY: "auto", flex: 1 }}>
          {/* Icon badge (when no image) */}
          {!modalImage && (
            <div style={{
              width: 52, height: 52, borderRadius: 16, marginBottom: 16,
              background: `${event.color}15`, display: "flex",
              alignItems: "center", justifyContent: "center", color: event.color,
            }}>
              <div style={{ transform: "scale(1.3)" }}>{ICONS[event.icon]?.svg}</div>
            </div>
          )}

          <div style={{ fontSize: 13, color: "var(--md-on-surface-variant)", marginBottom: 6 }}>{fmtDate(event)}</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px", paddingRight: 36, color: "var(--md-on-surface)" }}>{event.title}</h2>

          {event.desc && (
            <p style={{ margin: 0, fontSize: 15, color: "var(--md-on-surface-variant)", lineHeight: 1.7 }}>{event.desc}</p>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--md-outline-variant)", display: "flex", gap: 10 }}>
            <button className="md-btn md-btn-tonal" onClick={() => { onClose(); onEdit(event); }} style={{ fontSize: 13, padding: "8px 20px" }}>
              Modifica
            </button>
            <button className="md-btn md-btn-text" onClick={() => { onClose(); onDelete(event.id); }} style={{ fontSize: 13, color: "#ef4444", padding: "8px 20px" }}>
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
