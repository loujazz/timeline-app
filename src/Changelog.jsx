import { useState } from "react";

/* ===== Accordion Section ===== */
function Section({ icon, title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{
      background: "var(--md-surface-container-lowest)",
      border: "1px solid var(--md-outline-variant)",
      borderRadius: 16, overflow: "hidden",
      transition: "box-shadow 0.25s",
      boxShadow: open ? "var(--md-elev1)" : "none",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "18px 22px", border: "none", background: "transparent",
        display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        fontFamily: "var(--md-font)", textAlign: "left",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "var(--md-primary-container)", color: "var(--md-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--md-on-surface)" }}>{title}</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth="2" strokeLinecap="round"
          style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          padding: "0 22px 22px", paddingLeft: 76,
          fontSize: 14, lineHeight: 1.75, color: "var(--md-on-surface-variant)",
          animation: "fadeIn 0.2s ease-out",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

const Li = ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>;

const RocketIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;

const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

export default function Changelog({ onClose }) {
  return (
    <div style={{
      minHeight: "100vh", fontFamily: "var(--md-font)",
      background: "var(--md-surface)", color: "var(--md-on-surface)",
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(250,249,253,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--md-outline-variant)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <button onClick={onClose} className="md-btn" style={{
          width: 40, height: 40, borderRadius: 12, border: "none", padding: 0,
          background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: 28, display: "block" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Novit&agrave;</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px", display: "flex", flexDirection: "column", gap: 14 }}>

        <Section icon={<RocketIcon />} title="v1.0 — Febbraio 2026" defaultOpen>
          <p style={{ margin: "0 0 12px", fontWeight: 600, color: "var(--md-on-surface)" }}>
            Prima release stabile
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Creazione e gestione di timeline multiple dalla Dashboard</Li>
            <Li>Visualizzazione orizzontale e verticale degli eventi</Li>
            <Li>Supporto date precise, mesi, anni e periodi (range)</Li>
            <Li>Supporto date a.C. (avanti Cristo)</Li>
            <Li>Upload immagini e thumbnail per ogni evento</Li>
            <Li>Estrazione automatica GPS dalle foto (geotagging)</Li>
            <Li>Mappa geografica per singolo evento e mappa globale</Li>
            <Li>Contenuti multimediali: embed YouTube, Vimeo e link nelle descrizioni</Li>
            <Li>Personalizzazione copertina timeline (colore o immagine)</Li>
            <Li>Navigazione unificata con menu hamburger su tutti i dispositivi</Li>
            <Li>Export/Import archivio completo con gestione conflitti (merge/replace)</Li>
            <Li>Semaforo backup: indicatore visivo modifiche non esportate</Li>
            <Li>Avviso alla chiusura se ci sono modifiche non salvate nel backup</Li>
            <Li>Supporto PWA: icona personalizzata su home screen (iOS e Android)</Li>
            <Li>Deploy duale: GitHub Pages e Vercel</Li>
            <Li>Vercel Analytics integrato</Li>
            <Li>Guida interattiva integrata nell'app</Li>
            <Li>Licenza CC BY-NC 4.0</Li>
          </ul>
        </Section>

      </div>
    </div>
  );
}
