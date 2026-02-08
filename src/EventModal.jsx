import { useEffect } from "react";
import { ICONS } from "./constants";

export default function EventModal({ event, onClose, onEdit, onDelete }) {
  const fmtDate = d => new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });

  // Close on Escape key
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdrop = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "modalFadeIn 0.2s ease-out",
      padding: 20,
    }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div style={{
        background: "#fff", borderRadius: 16, maxWidth: 520, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", position: "relative",
        animation: "modalSlideUp 0.3s ease-out", overflow: "hidden",
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          width: 32, height: 32, borderRadius: "50%",
          border: "none", background: "rgba(0,0,0,0.05)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: "#666", transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
        >
          &times;
        </button>

        {/* Image header */}
        {event.image && (
          <div style={{
            width: "100%", height: 220,
            background: `url(${event.image}) center/cover`,
            borderBottom: "1px solid #f0f0f0",
          }} />
        )}

        {/* Content */}
        <div style={{ padding: event.image ? "24px 28px 20px" : "32px 28px 20px" }}>
          {/* Icon + Color badge (when no image) */}
          {!event.image && (
            <div style={{
              width: 52, height: 52, borderRadius: 12, marginBottom: 16,
              background: `${event.color}10`, display: "flex",
              alignItems: "center", justifyContent: "center", color: event.color,
            }}>
              <div style={{ transform: "scale(1.3)" }}>{ICONS[event.icon]?.svg}</div>
            </div>
          )}

          <div style={{ fontSize: 13, color: "#999", marginBottom: 6 }}>{fmtDate(event.date)}</div>
          <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px", paddingRight: 32 }}>{event.title}</h2>

          {event.desc && (
            <p style={{ margin: 0, fontSize: 15, color: "#555", lineHeight: 1.7 }}>{event.desc}</p>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
            <button onClick={() => { onClose(); onEdit(event); }} style={{
              padding: "7px 18px", borderRadius: 8, border: "1px solid #e0e0e0",
              background: "#fff", cursor: "pointer", fontSize: 13, color: "#555", fontWeight: 500,
              transition: "all 0.15s",
            }}>Modifica</button>
            <button onClick={() => { onClose(); onDelete(event.id); }} style={{
              padding: "7px 18px", borderRadius: 8, border: "1px solid #fee2e2",
              background: "#fff", cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 500,
              transition: "all 0.15s",
            }}>Elimina</button>
          </div>
        </div>
      </div>
    </div>
  );
}
