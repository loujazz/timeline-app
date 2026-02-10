import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from "react";
import { ICONS } from "./constants";
import { parseContent } from "./contentParser";

const LocationPicker = lazy(() => import("./LocationPicker"));

const ASPECT_CLASS = { video: "embed-container", map: "embed-container embed-container-map", audio: "embed-container embed-container-audio" };

function RichContent({ text }) {
  const blocks = useMemo(() => parseContent(text), [text]);
  return (
    <div className="rich-content">
      {blocks.map((b, i) =>
        b.type === "text" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: b.html }} />
        ) : b.type === "embed" && b.provider === "youtube" ? (
          <div key={i} className="embed-container">
            <iframe src={`https://www.youtube.com/embed/${b.videoId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube" />
          </div>
        ) : b.type === "embed" && b.provider === "vimeo" ? (
          <div key={i} className="embed-container">
            <iframe src={`https://player.vimeo.com/video/${b.videoId}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Vimeo" />
          </div>
        ) : b.type === "embed" && b.provider === "gdrive" ? (
          <div key={i} className="embed-container">
            <iframe src={`https://drive.google.com/file/d/${b.fileId}/preview`} allow="autoplay; encrypted-media" allowFullScreen title="Google Drive" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        ) : b.type === "embed" && b.provider === "iframe" ? (
          <div key={i} className={ASPECT_CLASS[b.aspect] || "embed-container"}>
            <iframe src={b.src} allowFullScreen title="Embed" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        ) : null
      )}
    </div>
  );
}

const SpeakerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);
const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const stop = useCallback(() => {
    if (synth) { synth.cancel(); setSpeaking(false); }
  }, [synth]);

  const speak = useCallback((text, lang = "it-IT") => {
    if (!synth) return;
    synth.cancel(); // prevent overlapping
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    // Try to find a voice matching the language
    const voices = synth.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
    if (match) utter.voice = match;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utter);
  }, [synth]);

  // Cleanup on unmount
  useEffect(() => () => { if (synth) synth.cancel(); }, [synth]);

  return { speaking, speak, stop };
}

export default function EventModal({ event, fmtDate: fmtDateProp, onClose, onEdit, onDelete }) {
  const defaultFmt = ev => {
    const d = typeof ev === "string" ? ev : ev.date;
    return new Date(d).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });
  };
  const fmtDate = fmtDateProp || defaultFmt;
  const { speaking, speak, stop } = useTTS();

  const handleSpeak = () => {
    if (speaking) { stop(); return; }
    // Strip markdown/html from desc for clean reading
    const cleanDesc = (event.desc || "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .trim();
    const text = `${event.title}. ${cleanDesc}`;
    speak(text, "it-IT");
  };

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { stop(); onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleBackdrop = e => {
    if (e.target === e.currentTarget) { stop(); onClose(); }
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
        <button onClick={() => { stop(); onClose(); }} style={{
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
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px", flex: 1, color: "var(--md-on-surface)" }}>{event.title}</h2>
            <button onClick={handleSpeak} className="md-btn" title={speaking ? "Ferma lettura" : "Leggi ad alta voce"} style={{
              width: 36, height: 36, borderRadius: "50%", border: "none", padding: 0, flexShrink: 0,
              background: speaking ? "var(--md-primary)" : "var(--md-surface-container)",
              color: speaking ? "var(--md-on-primary)" : "var(--md-on-surface-variant)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", cursor: "pointer", marginTop: 2,
            }}>
              {speaking ? <StopIcon /> : <SpeakerIcon />}
            </button>
          </div>

          {event.desc && <RichContent text={event.desc} />}

          {/* Map */}
          {event.showMap && event.location && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, color: "var(--md-on-surface-variant)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Posizione
              </div>
              <Suspense fallback={<div style={{ height: 200, borderRadius: 12, background: "var(--md-surface-container)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--md-on-surface-variant)" }}>Caricamento mappa...</div>}>
                <LocationPicker
                  lat={event.location.lat}
                  lng={event.location.lng}
                  readOnly
                  height={200}
                />
              </Suspense>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--md-outline-variant)", display: "flex", gap: 10 }}>
            <button className="md-btn md-btn-tonal" onClick={() => { stop(); onClose(); onEdit(event); }} style={{ fontSize: 13, padding: "8px 20px" }}>
              Modifica
            </button>
            <button className="md-btn md-btn-text" onClick={() => { stop(); onClose(); onDelete(event.id); }} style={{ fontSize: 13, color: "#ef4444", padding: "8px 20px" }}>
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
