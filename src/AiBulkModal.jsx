import { useState } from "react";
import { COLORS } from "./constants";

const emptyForm = {
  date: "", dateEnd: "", dateType: "day", isRange: false, isBC: false, isBCEnd: false,
  title: "", desc: "", icon: 0, color: COLORS[0], rangeColor: "#ef4444", thumbnail: null, image: null,
  showMap: false, location: null,
};

export default function AiBulkModal({ ai, onSave, onClose, nidRef }) {
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setProcessing(true);
    setError("");
    try {
      const events = await ai.generate("bulk", text.trim());
      if (!events.length) { setError("Nessun evento trovato nel testo."); return; }
      setResults(events.map(ev => ({ ...ev, _selected: true })));
    } catch (e) {
      setError(e.message || "Estrazione fallita. Prova con un testo più breve o strutturato.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = i => setResults(prev => prev.map((r, j) => j === i ? { ...r, _selected: !r._selected } : r));
  const toggleAll = () => {
    const allSelected = results.every(r => r._selected);
    setResults(prev => prev.map(r => ({ ...r, _selected: !allSelected })));
  };
  const updateField = (i, field, value) => setResults(prev => prev.map((r, j) => j === i ? { ...r, [field]: value } : r));

  const handleSave = () => {
    const selected = results.filter(r => r._selected);
    if (!selected.length) return;
    const newEvents = selected.map(r => ({
      ...emptyForm,
      date: r.date,
      title: r.title,
      desc: r.desc,
      isBC: r.isBC,
      id: nidRef.current++,
    }));
    onSave(newEvents);
    onClose();
  };

  const selectedCount = results ? results.filter(r => r._selected).length : 0;

  const inputSt = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1px solid var(--md-outline)", fontSize: 14,
    boxSizing: "border-box", background: "var(--md-surface-container-lowest)",
    fontFamily: "var(--md-font)", resize: "vertical",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 100, animation: "fadeIn 0.2s ease-out",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: "var(--md-surface-container-lowest)", borderRadius: 24,
        maxWidth: 560, width: "92%", maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)", zIndex: 101,
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--md-outline-variant)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>
              ✨
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--md-on-surface)", margin: 0 }}>
              Importa da Testo (AI)
            </h3>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {!results ? (
            <>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--md-on-surface-variant)", margin: "0 0 16px" }}>
                Incolla un testo lungo (articolo, appunti, cronologia&hellip;) e l&apos;AI estrarrà
                automaticamente tutti gli eventi con date e descrizioni.
              </p>

              {/* Model not loaded */}
              {!ai.ready && (
                <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "var(--md-surface-container)", border: "1px solid var(--md-outline-variant)", textAlign: "center" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--md-on-surface-variant)" }}>
                    Per usare questa funzione devi prima caricare il modello AI (~1.5 GB).
                  </p>
                  <button
                    onClick={ai.loadModel}
                    disabled={ai.loading}
                    className="md-btn"
                    style={{
                      padding: "10px 20px", borderRadius: 9999, border: "none", fontSize: 14, fontWeight: 600, cursor: ai.loading ? "default" : "pointer",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", opacity: ai.loading ? 0.7 : 1,
                    }}
                  >
                    {ai.loading ? `Caricamento (${ai.progress}%)…` : "Carica modello AI"}
                  </button>
                  {ai.loading && (
                    <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "var(--md-surface-container-high)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${ai.progress}%`, background: "var(--md-primary)", transition: "width 0.3s", borderRadius: 2 }} />
                    </div>
                  )}
                  {ai.error && <p style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>{ai.error}</p>}
                </div>
              )}

              {/* Textarea + extract button */}
              {ai.ready && (
                <>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={8}
                    placeholder="Incolla qui il testo da analizzare..."
                    style={inputSt}
                  />
                  {error && (
                    <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", fontSize: 13 }}>
                      {error}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {ai.ready && (
                  <button
                    onClick={handleExtract}
                    disabled={!text.trim() || processing}
                    className="md-btn"
                    style={{
                      flex: 1, padding: "14px 20px", border: "none", borderRadius: 12,
                      background: "var(--md-primary)", color: "var(--md-on-primary)",
                      fontSize: 15, fontWeight: 600, cursor: (!text.trim() || processing) ? "default" : "pointer",
                      opacity: (!text.trim() || processing) ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    {processing ? "Estrazione in corso…" : "Estrai Eventi"}
                  </button>
                )}
                <button onClick={onClose} style={{
                  padding: "14px 20px", border: "none", borderRadius: 12,
                  background: "transparent", color: "var(--md-on-surface-variant)",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}>
                  Annulla
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results preview */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: 14, color: "var(--md-on-surface-variant)", margin: 0 }}>
                  Trovati <strong>{results.length}</strong> eventi. Modifica o deseleziona prima di importare.
                </p>
                <button onClick={toggleAll} style={{
                  background: "none", border: "none", fontSize: 12, fontWeight: 600,
                  color: "var(--md-primary)", cursor: "pointer", whiteSpace: "nowrap", padding: "4px 8px",
                }}>
                  {results.every(r => r._selected) ? "Deseleziona tutti" : "Seleziona tutti"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "45vh", overflowY: "auto" }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: r._selected ? "var(--md-surface-container)" : "var(--md-surface-container-lowest)",
                    border: `1px solid ${r._selected ? "var(--md-primary)" : "var(--md-outline-variant)"}`,
                    opacity: r._selected ? 1 : 0.5,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={r._selected}
                        onChange={() => toggleSelect(i)}
                        style={{ accentColor: "var(--md-primary)", marginTop: 3, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input
                          value={r.title}
                          onChange={e => updateField(i, "title", e.target.value)}
                          style={{
                            width: "100%", border: "none", background: "transparent",
                            fontSize: 14, fontWeight: 600, color: "var(--md-on-surface)",
                            fontFamily: "var(--md-font)", padding: 0,
                            outline: "none", borderBottom: "1px solid transparent",
                          }}
                          onFocus={e => { e.target.style.borderBottomColor = "var(--md-primary)"; }}
                          onBlur={e => { e.target.style.borderBottomColor = "transparent"; }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <input
                            value={r.date}
                            onChange={e => updateField(i, "date", e.target.value)}
                            style={{
                              border: "none", background: "transparent",
                              fontSize: 12, color: "var(--md-primary)",
                              fontFamily: "var(--md-font)", padding: 0, width: 120,
                              outline: "none", borderBottom: "1px solid transparent",
                            }}
                            onFocus={e => { e.target.style.borderBottomColor = "var(--md-primary)"; }}
                            onBlur={e => { e.target.style.borderBottomColor = "transparent"; }}
                          />
                          {r.isBC && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--md-on-surface-variant)", background: "var(--md-surface-container-high)", padding: "2px 6px", borderRadius: 4 }}>
                              a.C.
                            </span>
                          )}
                        </div>
                        {r.desc && (
                          <p style={{ fontSize: 12, color: "var(--md-on-surface-variant)", margin: "4px 0 0", lineHeight: 1.4 }}>
                            {r.desc.length > 120 ? r.desc.slice(0, 120) + "…" : r.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
                <button
                  onClick={handleSave}
                  disabled={selectedCount === 0}
                  className="md-btn"
                  style={{
                    flex: 1, padding: "14px 20px", border: "none", borderRadius: 12,
                    background: "var(--md-primary)", color: "var(--md-on-primary)",
                    fontSize: 15, fontWeight: 600, cursor: selectedCount === 0 ? "default" : "pointer",
                    opacity: selectedCount === 0 ? 0.5 : 1,
                  }}
                >
                  Salva Selezionati ({selectedCount})
                </button>
                <button onClick={() => setResults(null)} style={{
                  padding: "14px 20px", border: "none", borderRadius: 12,
                  background: "transparent", color: "var(--md-on-surface-variant)",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}>
                  Indietro
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
