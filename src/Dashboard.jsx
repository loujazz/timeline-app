import { useState } from "react";

export default function Dashboard({ timelines, onCreate, onOpen, onDelete }) {
  const [name, setName] = useState("");
  const [showNew, setShowNew] = useState(false);

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

  const fmtDate = d => new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#111" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .tl-card { transition: all 0.2s; }
        .tl-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "32px 32px 0", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Le mie Timeline</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#999" }}>
              {timelines.length === 0 ? "Crea la tua prima timeline" : `${timelines.length} timeline`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px 60px", maxWidth: 800, margin: "0 auto" }}>

        {/* Create new timeline */}
        {showNew ? (
          <div style={{
            padding: 20, borderRadius: 12, border: "1px solid #e0e0e0",
            marginBottom: 20, animation: "fadeIn 0.2s ease-out",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nome della nuova timeline..."
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 8,
                border: "1px solid #e0e0e0", fontSize: 14, outline: "none",
              }}
            />
            <button onClick={handleCreate} disabled={!name.trim()} style={{
              padding: "10px 22px", borderRadius: 8, border: "none",
              background: name.trim() ? "#111" : "#e0e0e0", color: "#fff",
              cursor: name.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 500,
            }}>Crea</button>
            <button onClick={() => { setShowNew(false); setName(""); }} style={{
              padding: "10px 16px", borderRadius: 8, border: "1px solid #e0e0e0",
              background: "#fff", cursor: "pointer", fontSize: 13, color: "#666",
            }}>Annulla</button>
          </div>
        ) : (
          <button onClick={() => setShowNew(true)} style={{
            width: "100%", padding: "18px 20px", borderRadius: 12,
            border: "2px dashed #d0d0d0", background: "transparent",
            cursor: "pointer", fontSize: 14, color: "#888", marginBottom: 20,
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.color = "#555"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0d0d0"; e.currentTarget.style.color = "#888"; }}
          >
            + Crea Nuova Timeline
          </button>
        )}

        {/* Timeline list */}
        <div style={{ display: "grid", gap: 12 }}>
          {timelines.map(tl => (
            <div key={tl.id} className="tl-card" style={{
              padding: "20px 24px", borderRadius: 12, border: "1px solid #f0f0f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              animation: "fadeIn 0.3s ease-out",
            }} onClick={() => onOpen(tl.id)}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{tl.name}</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#999" }}>
                  {tl.events.length} eventi &middot; Creata il {fmtDate(tl.createdAt)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Color dots preview */}
                <div style={{ display: "flex", gap: 3 }}>
                  {tl.events.slice(0, 5).map((ev, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color || "#ccc" }} />
                  ))}
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(tl.id); }} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1px solid #fee2e2",
                  background: "#fff", cursor: "pointer", fontSize: 12, color: "#ef4444",
                  marginLeft: 8,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >Elimina</button>
                <span style={{ fontSize: 18, color: "#ccc" }}>&rsaquo;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
