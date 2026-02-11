const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
    title: "Editing Intuitivo",
    desc: "Aggiungi, modifica e organizza eventi con un click. Date flessibili con granularità anno, mese, giorno e ora, supporto a.C. e periodi con inizio/fine.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    ),
    title: "Accessibilità Integrata",
    desc: "Ascolta la tua storia. Sintesi vocale nativa per ogni evento, rendendo la tua timeline inclusiva e accessibile a tutti.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Visualizzazione Dinamica",
    desc: "Layout orizzontale e verticale con zoom da 50% a 200%. Barre colorate per i periodi e dot personalizzabili con icone o immagini.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: "Contenuti Multimediali",
    desc: "Incorpora video YouTube, mappe Google Maps, Spotify e qualsiasi iframe. Proporzioni adattive automatiche dentro ogni evento.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Multi-Timeline",
    desc: "Dashboard stile Google Classroom per gestire più timeline. Copertine personalizzabili con colori o immagini a tua scelta.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Formattazione Rich Text",
    desc: "Supporto markdown nelle descrizioni: grassetto, corsivo e link. Il testo si integra con video e mappe incorporati.",
  },
];

const logoSrc = `${import.meta.env.BASE_URL}logo-outatimeline.svg`;

export default function LandingPage({ onEnter, onGuide }) {
  return (
    <div style={{ fontFamily: "var(--md-font)", color: "var(--md-on-surface)", background: "var(--md-surface)" }}>

      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav" style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 40px",
        background: "rgba(250,249,253,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--md-outline-variant)",
      }}>
        <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: 36, maxWidth: 180, display: "block", mixBlendMode: "multiply" }} />
        <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" style={{ fontSize: 14, color: "var(--md-on-surface-variant)", textDecoration: "none", fontWeight: 500 }}>Features</a>
          {onGuide && <button onClick={onGuide} className="md-btn" style={{ fontSize: 14, color: "var(--md-on-surface-variant)", background: "transparent", border: "none", fontWeight: 500, padding: 0, cursor: "pointer" }}>Guida</button>}
          <a href="#about" style={{ fontSize: 14, color: "var(--md-on-surface-variant)", textDecoration: "none", fontWeight: 500 }}>Info</a>
          <button onClick={onEnter} className="md-btn md-btn-filled" style={{ padding: "8px 20px", fontSize: 13 }}>
            Inizia ora
          </button>
        </div>
        {/* Mobile CTA only */}
        <button onClick={onEnter} className="md-btn md-btn-filled landing-nav-mobile-cta" style={{ padding: "8px 16px", fontSize: 13, display: "none" }}>
          Inizia
        </button>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero" style={{
        maxWidth: 1100, margin: "0 auto", padding: "80px 40px 60px",
        display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 400px", minWidth: 300 }}>
          <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: "clamp(64px, 10vw, 96px)", marginBottom: 24, display: "block", mixBlendMode: "multiply" }} />
          <h1 style={{
            fontSize: "clamp(36px, 5vw, 54px)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-1px", margin: "0 0 20px",
            background: "linear-gradient(135deg, var(--md-primary) 0%, var(--md-secondary) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Visualizza il tempo,<br />racconta la tua storia.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--md-on-surface-variant)", margin: "0 0 32px", maxWidth: 480 }}>
            Crea timeline interattive e accessibili per progetti, storia o eventi personali. Semplice, potente, tuo.
          </p>
          <button onClick={onEnter} className="md-btn md-btn-filled" style={{
            padding: "14px 32px", fontSize: 16, borderRadius: 9999,
            background: "linear-gradient(135deg, var(--md-primary), #818cf8)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}>
            Crea la tua Timeline Gratuita
          </button>
        </div>

        {/* Hero visual — stylized app mockup */}
        <div style={{ flex: "1 1 400px", minWidth: 300, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "100%", maxWidth: 480, borderRadius: 20, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.06)",
            background: "var(--md-surface-container-lowest)", border: "1px solid var(--md-outline-variant)",
          }}>
            {/* Fake app bar */}
            <div style={{ height: 44, background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
              <span style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "0.3px" }}>OutaTimeline</span>
            </div>
            {/* Fake timeline preview */}
            <div style={{ padding: "28px 20px 24px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", padding: "0 8px" }}>
                <div style={{ position: "absolute", left: 8, right: 8, top: "50%", height: 2, background: "var(--md-outline-variant)", borderRadius: 1 }} />
                {["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"].map((c, i) => (
                  <div key={i} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {i % 2 === 0 && <div style={{ width: 56, height: 8, borderRadius: 4, background: "var(--md-surface-container-high)" }} />}
                    <div style={{
                      width: i === 2 ? 22 : 14, height: i === 2 ? 22 : 14, borderRadius: "50%",
                      background: c, border: i === 2 ? `3px solid ${c}33` : "2px solid #fff",
                      boxShadow: i === 2 ? `0 0 0 4px ${c}15` : "none",
                      transition: "all 0.3s",
                    }} />
                    {i % 2 === 1 && <div style={{ width: 48, height: 8, borderRadius: 4, background: "var(--md-surface-container-high)" }} />}
                  </div>
                ))}
              </div>
              {/* Fake range bar */}
              <div style={{ position: "relative", marginTop: 6, paddingLeft: 8 }}>
                <div style={{ width: "38%", height: 3, borderRadius: 2, background: "#ec4899", opacity: 0.5, marginLeft: "20%" }} />
              </div>
              {/* Fake cards row */}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                {["#6366f1", "#ec4899", "#10b981"].map((c, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: 10, overflow: "hidden", boxShadow: "var(--md-elev1)" }}>
                    <div style={{ height: 28, background: c }} />
                    <div style={{ padding: "8px 10px", background: "var(--md-surface-container-lowest)" }}>
                      <div style={{ width: "80%", height: 6, borderRadius: 3, background: "var(--md-surface-container-high)", marginBottom: 4 }} />
                      <div style={{ width: "50%", height: 5, borderRadius: 3, background: "var(--md-surface-container)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{
        maxWidth: 1100, margin: "0 auto", padding: "60px 40px 80px",
      }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 12 }}>Features</h2>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--md-on-surface-variant)", marginBottom: 48, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Tutto quello che ti serve per creare timeline professionali, interattive e accessibili.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "28px 24px", borderRadius: 16,
              background: "var(--md-surface-container-lowest)",
              border: "1px solid var(--md-outline-variant)",
              transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--md-elev2)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                background: "var(--md-primary-container)", color: "var(--md-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--md-on-surface-variant)", margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ABOUT / CTA ===== */}
      <section id="about" style={{
        background: "linear-gradient(135deg, var(--md-primary) 0%, #818cf8 100%)",
        padding: "60px 40px", textAlign: "center",
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Pronto a iniziare?</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 28, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          Nessuna registrazione, nessun costo. I tuoi dati restano nel tuo browser.
        </p>
        <button onClick={onEnter} className="md-btn" style={{
          padding: "14px 36px", fontSize: 16, fontWeight: 600, borderRadius: 9999,
          background: "#fff", color: "var(--md-primary)", border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", cursor: "pointer",
        }}>
          Crea la tua Timeline
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        padding: "24px 40px", textAlign: "center",
        borderTop: "1px solid var(--md-outline-variant)",
        background: "var(--md-surface-container-lowest)",
      }}>
        <p style={{ fontSize: 13, color: "var(--md-on-surface-variant)", margin: 0 }}>
  OutaTimeline &mdash; Gratuita e open source
        </p>
      </footer>
    </div>
  );
}
