import { useState } from "react";

/* ===== Accordion Item ===== */
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
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--md-on-surface)" }}>{title}</span>
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

/* ===== Sub-heading ===== */
const H = ({ children }) => <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--md-on-surface)", margin: "16px 0 6px" }}>{children}</h4>;
const P = ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>;
const Code = ({ children }) => <code style={{ background: "var(--md-surface-container)", padding: "2px 8px", borderRadius: 6, fontSize: 13, fontFamily: "monospace" }}>{children}</code>;
const Li = ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>;

/* ===== Icons ===== */
const InfoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const LayoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const EditIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
const VideoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const A11yIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const HelpIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const logoSrc = `${import.meta.env.BASE_URL}logo-outatimeline.svg`;

/* ===== Main Component ===== */
export default function Guide({ onClose }) {
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
        <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: 28, display: "block", mixBlendMode: "multiply" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Guida &amp; FAQ</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 80px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Logo + manual title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src={logoSrc} alt="OutaTimeline Logo" style={{ height: 64, display: "inline-block", marginBottom: 8, mixBlendMode: "multiply" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--md-on-surface-variant)" }}>Manuale Utente</p>
        </div>

        {/* ===== INTRO ===== */}
        <Section icon={<InfoIcon />} title="Cos'è OutaTimeline?" defaultOpen>
          <P>
            <strong>OutaTimeline</strong> è un&apos;applicazione web gratuita per creare timeline interattive,
            visivamente coinvolgenti e accessibili. Il suo obiettivo è rendere il tempo
            <em> visibile e navigabile</em>: dalla cronologia storica ai piani di progetto,
            ogni evento prende vita in una linea del tempo che puoi personalizzare, arricchire
            con contenuti multimediali e condividere.
          </P>
          <P>
            L&apos;app funziona interamente nel tuo browser &mdash; non richiede registrazione,
            non invia dati a server esterni e i tuoi progetti restano salvati localmente sul tuo dispositivo.
          </P>
        </Section>

        {/* ===== DASHBOARD ===== */}
        <Section icon={<LayoutIcon />} title="Gestione delle Timeline">
          <H>Creare una nuova timeline</H>
          <P>
            Dalla <strong>Dashboard</strong>, clicca il pulsante <strong>&ldquo;Nuova Timeline&rdquo;</strong> in alto a destra.
            Inserisci un nome e premi <strong>Crea</strong>. La timeline apparirà come una card colorata nella griglia.
          </P>

          <H>Personalizzare la copertina</H>
          <P>
            Ogni timeline ha una copertina colorata. Per cambiarla, clicca i <strong>tre puntini</strong> (&bull;&bull;&bull;)
            sulla card e scegli tra:
          </P>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><strong>Colore</strong> &mdash; seleziona uno degli 8 colori nella palette.</Li>
            <Li><strong>Immagine</strong> &mdash; carica un&apos;immagine dal tuo dispositivo che diventerà lo sfondo della copertina.</Li>
          </ul>
          <P>
            La stessa copertina appare anche come <strong>banner grande</strong> quando entri nella timeline
            (stile Google Classroom). Anche lì puoi cambiare colore o immagine dalla toolbar in alto.
          </P>

          <H>La Dashboard</H>
          <P>
            La Dashboard mostra tutte le tue timeline in una <strong>griglia responsive</strong>.
            Ogni card mostra il nome, la data di creazione, il numero di eventi e i colori usati.
            Clicca su una card per aprirla. Usa i tre puntini per modificare, eliminare o cambiare copertina.
          </P>
          <P>
            Il pulsante <strong>Home</strong> (icona casetta) in alto a sinistra ti riporta alla pagina iniziale.
          </P>
        </Section>

        {/* ===== EDITOR ===== */}
        <Section icon={<EditIcon />} title="L'Editor di Eventi">
          <H>Aggiungere un evento</H>
          <P>
            All&apos;interno di una timeline, clicca il pulsante <strong>&ldquo;+ Nuovo evento&rdquo;</strong> (FAB in basso a destra).
            Si aprirà il form di creazione.
          </P>

          <H>Precisione temporale</H>
          <P>L&apos;app supporta quattro livelli di precisione per le date:</P>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><strong>Anno</strong> &mdash; ideale per timeline storiche (es. &ldquo;1492&rdquo;).</Li>
            <Li><strong>Mese</strong> &mdash; per eventi mensili (es. &ldquo;marzo 2024&rdquo;).</Li>
            <Li><strong>Giorno</strong> &mdash; la precisione predefinita (es. &ldquo;15 gen 2025&rdquo;).</Li>
            <Li><strong>Ora</strong> &mdash; per eventi con orario preciso (es. &ldquo;15 gen 2025, 14:30&rdquo;).</Li>
          </ul>
          <P>
            Puoi anche indicare date <strong>a.C.</strong> (avanti Cristo) con l&apos;apposito pulsante,
            perfetto per timeline di storia antica.
          </P>

          <H>Periodi (intervalli di tempo)</H>
          <P>
            Attiva la casella <strong>&ldquo;Periodo&rdquo;</strong> per definire un evento con una data di inizio e una di fine.
            Sulla timeline apparirà una <strong>barra colorata</strong> che indica la durata del periodo.
            Puoi scegliere il colore della barra con i pallini colorati accanto alla casella.
          </P>

          <H>Campi dell&apos;evento</H>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><strong>Titolo</strong> &mdash; il nome dell&apos;evento, mostrato sulla timeline e nel popup.</Li>
            <Li><strong>Descrizione</strong> &mdash; testo libero con supporto per formattazione e contenuti multimediali (vedi sezione dedicata).</Li>
            <Li><strong>Icona</strong> &mdash; scegli tra 8 icone tematiche (stella, cuore, bandiera, razzo&hellip;).</Li>
            <Li><strong>Colore</strong> &mdash; il colore del dot sulla timeline.</Li>
            <Li><strong>Icona Timeline</strong> &mdash; carica un&apos;immagine circolare che sostituisce il dot.</Li>
            <Li><strong>Immagine Popup</strong> &mdash; un&apos;immagine grande mostrata nella parte superiore del popup evento.</Li>
          </ul>

          <H>Layout e Zoom</H>
          <P>
            Dalla toolbar nella copertina puoi scegliere tra layout <strong>Orizzontale</strong> e <strong>Verticale</strong>.
            Usa i controlli <strong>− / +</strong> per regolare lo zoom dal 50% al 200%.
          </P>
        </Section>

        {/* ===== EMBEDDING ===== */}
        <Section icon={<VideoIcon />} title="Contenuti Multimediali (Embedding)">
          <P>
            La descrizione degli eventi supporta l&apos;incorporamento automatico di contenuti multimediali.
            Basta incollare un link o un codice iframe nel campo descrizione.
          </P>

          <H>Video YouTube e Vimeo</H>
          <P>Incolla semplicemente il link del video nella descrizione:</P>
          <div style={{ background: "var(--md-surface-container)", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontFamily: "monospace", margin: "0 0 10px", overflowX: "auto" }}>
            https://www.youtube.com/watch?v=dQw4w9WgXcQ
          </div>
          <P>
            L&apos;app riconosce automaticamente i formati YouTube (<Code>watch</Code>, <Code>youtu.be</Code>,
            <Code>shorts</Code>, <Code>embed</Code>) e Vimeo, e li trasforma in un player video
            responsive 16:9 direttamente nel popup dell&apos;evento.
          </P>

          <H>Google Drive (Audio e Video)</H>
          <P>
            Puoi incorporare file audio e video ospitati su <strong>Google Drive</strong>. Ecco come fare:
          </P>
          <ol style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><strong>Carica il file</strong> su Google Drive (video MP4, audio MP3, ecc.).</Li>
            <Li>Clicca col tasto destro sul file &rarr; <strong>&ldquo;Condividi&rdquo;</strong>.</Li>
            <Li><strong style={{ color: "var(--md-primary)" }}>Importante:</strong> in &ldquo;Accesso generale&rdquo;,
              seleziona <strong>&ldquo;Chiunque abbia il link&rdquo;</strong>. Senza questo passaggio il player non funzionerà.</Li>
            <Li>Copia il link di condivisione e incollalo nella descrizione dell&apos;evento.</Li>
          </ol>
          <div style={{ background: "var(--md-surface-container)", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontFamily: "monospace", margin: "0 0 10px", overflowX: "auto" }}>
            https://drive.google.com/file/d/1AbCdEfG_hIjK/view?usp=sharing
          </div>
          <P>
            L&apos;app trasforma automaticamente il link nel formato <Code>/preview</Code> necessario per
            la riproduzione in-app. Funziona sia con file video che audio.
          </P>

          <H>Mappe, Musica e Altro</H>
          <P>
            Puoi anche incollare codice <Code>&lt;iframe&gt;</Code> copiato da questi servizi:
          </P>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><strong>Google Maps</strong> &mdash; incorpora una mappa interattiva (proporzioni 4:3).</Li>
            <Li><strong>Spotify / SoundCloud / Bandcamp</strong> &mdash; incorpora player musicali.</Li>
            <Li><strong>Apple Music, Twitch, Dailymotion, CodePen, Canva</strong> e altri.</Li>
          </ul>
          <P>
            Per motivi di sicurezza, sono accettati solo iframe provenienti da domini verificati.
            Link da domini sconosciuti vengono mostrati come testo normale.
          </P>

          <H>Formattazione del testo</H>
          <P>La descrizione supporta anche formattazione markdown leggera:</P>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li><Code>**testo**</Code> &rarr; <strong>grassetto</strong></Li>
            <Li><Code>*testo*</Code> &rarr; <em>corsivo</em></Li>
            <Li><Code>[testo](url)</Code> &rarr; link cliccabile</Li>
          </ul>
          <P>Puoi combinare testo formattato e contenuti multimediali nella stessa descrizione.</P>
        </Section>

        {/* ===== ACCESSIBILITY ===== */}
        <Section icon={<A11yIcon />} title="Funzioni Speciali e Accessibilità">
          <H>Lettura Vocale (Text-to-Speech)</H>
          <P>
            Ogni evento ha un pulsante <strong>altoparlante</strong> accanto al titolo nel popup.
            Cliccandolo, l&apos;app legge ad alta voce il titolo e la descrizione dell&apos;evento
            utilizzando la sintesi vocale nativa del browser in italiano.
          </P>
          <P>
            La lettura ignora automaticamente link, iframe e codice markdown per una narrazione naturale.
            Clicca nuovamente il pulsante (icona stop) per interrompere la lettura in qualsiasi momento.
            La lettura si ferma anche chiudendo il popup.
          </P>

          <H>Navigazione da tastiera</H>
          <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
            <Li>Layout orizzontale: <strong>Freccia destra / sinistra</strong> per navigare tra gli eventi.</Li>
            <Li>Layout verticale: <strong>Freccia su / giù</strong> per navigare tra gli eventi.</Li>
            <Li><strong>Esc</strong> per deselezionare l&apos;evento corrente o chiudere il popup.</Li>
          </ul>

          <H>Zoom</H>
          <P>
            I controlli <strong>− / +</strong> nella toolbar permettono di ingrandire o ridurre
            la timeline dal 50% al 200%. Tutti gli elementi (dot, testo, spaziatura, barre) vengono
            scalati proporzionalmente. Il pulsante <strong>Reset</strong> riporta allo zoom 100%.
          </P>
        </Section>

        {/* ===== FAQ ===== */}
        <Section icon={<HelpIcon />} title="Domande Frequenti (FAQ)">
          <H>Dove vengono salvati i miei dati?</H>
          <P>
            Tutti i dati sono salvati nel <strong>localStorage</strong> del tuo browser, direttamente sul
            tuo dispositivo. Nessun dato viene inviato a server esterni. Questo significa che i tuoi
            progetti sono privati al 100%, ma anche che se cancelli i dati del browser o cambi
            dispositivo, le timeline non saranno disponibili automaticamente.
          </P>

          <H>Posso usare l&apos;app offline?</H>
          <P>
            L&apos;app è una <strong>Web App</strong> che funziona nel browser. Una volta caricata la pagina,
            le funzioni principali (creazione, modifica, navigazione) funzionano anche senza connessione.
            I contenuti incorporati (video YouTube, mappe, ecc.) richiedono però una connessione attiva
            per essere visualizzati.
          </P>

          <H>Come posso esportare il mio lavoro?</H>
          <P>
            Al momento l&apos;app salva tutto in localStorage. Per un backup manuale puoi copiare
            il contenuto della chiave <Code>timeline-app-data</Code> dagli Strumenti Sviluppatore
            del browser (tab Application &rarr; Local Storage). Funzionalità di esportazione/importazione
            dedicate sono in fase di valutazione per una versione futura.
          </P>

          <H>I video di Google Drive non si riproducono. Cosa faccio?</H>
          <P>
            Verifica che il file su Drive sia condiviso con l&apos;opzione <strong>&ldquo;Chiunque abbia il link&rdquo;</strong>.
            Se il file è impostato su &ldquo;Con restrizioni&rdquo;, il player non potrà accedere al contenuto.
          </P>

          <H>L&apos;app è gratuita?</H>
          <P>
            Sì, OutaTimeline è completamente gratuita e open source. Non ci sono costi nascosti,
            abbonamenti o limitazioni sulle funzionalità.
          </P>
        </Section>

      </div>
    </div>
  );
}
