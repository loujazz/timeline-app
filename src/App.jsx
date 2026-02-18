import { useState, useEffect, useCallback, useRef } from "react";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import TimelineEditor from "./TimelineEditor";
import Guide from "./Guide";
import Changelog from "./Changelog";
import { initializeStorage, saveTimelines, loadFromLocalStorage } from "./storage";
import useLocalAI from "./useLocalAI";

const EXPORT_TS_KEY = "timeline-app-last-export";
const MODIFY_TS_KEY = "timeline-app-last-modified";

const sampleTimeline = {
  id: "demo",
  name: "Timeline di Esempio",
  precision: "days",
  dateStart: "",
  dateEnd: "",
  createdAt: new Date().toISOString(),
  events: [
    { id: 1, date: "2020-01-15", title: "Inizio Progetto", desc: "Il viaggio è iniziato con un'idea rivoluzionaria", icon: 0, color: "#111", thumbnail: null, image: null },
    { id: 2, date: "2021-06-20", title: "Prima Milestone", desc: "Raggiunto il primo traguardo importante", icon: 4, color: "#111", thumbnail: null, image: null },
    { id: 3, date: "2023-03-10", title: "Lancio Pubblico", desc: "Il prodotto è finalmente disponibile per tutti", icon: 3, color: "#111", thumbnail: null, image: null },
    { id: 4, date: "2024-09-01", title: "Espansione Globale", desc: "Apertura verso nuovi mercati internazionali", icon: 5, color: "#111", thumbnail: null, image: null },
  ],
};

export default function App() {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const ai = useLocalAI();

  // Initialize from IndexedDB (with localStorage migration)
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        let data = await initializeStorage();
        if (data.length === 0) data = [sampleTimeline];
        if (!cancelled) setTimelines(data);
      } catch (e) {
        console.warn("IndexedDB failed, falling back to localStorage:", e);
        if (!cancelled) {
          const fallback = loadFromLocalStorage();
          setTimelines(fallback.length > 0 ? fallback : [sampleTimeline]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Debounced save to IndexedDB
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveTimelines(timelines);
        setStorageError(null);
      } catch (e) {
        setStorageError(`Salvataggio fallito: ${e.message}`);
        console.error("Save failed:", e);
      }
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [timelines, loading]);

  // Track whether data changed since last export
  const getExportDirty = () => {
    const exp = localStorage.getItem(EXPORT_TS_KEY);
    const mod = localStorage.getItem(MODIFY_TS_KEY);
    if (!exp) return true;
    if (!mod) return false;
    return Number(mod) > Number(exp);
  };
  const [exportDirty, setExportDirty] = useState(getExportDirty);

  const markModified = () => {
    const now = Date.now().toString();
    localStorage.setItem(MODIFY_TS_KEY, now);
    setExportDirty(true);
  };

  const markExported = () => {
    const now = Date.now().toString();
    localStorage.setItem(EXPORT_TS_KEY, now);
    setExportDirty(false);
  };

  // beforeunload warning if dirty
  useEffect(() => {
    if (!exportDirty) return;
    const handler = e => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [exportDirty]);

  const handleCreate = name => {
    const newTl = {
      id: `tl-${Date.now()}`,
      name,
      precision: "days",
      dateStart: "",
      dateEnd: "",
      coverColor: "",
      coverImage: null,
      createdAt: new Date().toISOString(),
      events: [],
    };
    setTimelines(prev => [newTl, ...prev]);
    setActiveId(newTl.id);
    markModified();
  };

  const handleDelete = id => {
    setTimelines(prev => prev.filter(t => t.id !== id));
    if (activeId === id) setActiveId(null);
    markModified();
  };

  const handleUpdate = useCallback((id, patch) => {
    setTimelines(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    markModified();
  }, []);

  // Export all timelines as JSON backup
  const handleExport = () => {
    const data = {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      timelines,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${date}_outatimeline_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    markExported();
  };

  // Import timelines from JSON backup
  const handleImport = (fileData, mode) => {
    try {
      const parsed = JSON.parse(fileData);
      const incoming = parsed.timelines || parsed;
      if (!Array.isArray(incoming)) throw new Error("Formato non valido");

      if (mode === "replace") {
        setTimelines(incoming);
      } else {
        setTimelines(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newOnes = incoming.filter(t => !existingIds.has(t.id));
          return [...prev, ...newOnes];
        });
      }
      markModified();
      return { success: true, count: incoming.length };
    } catch {
      return { success: false, error: "File non valido o corrotto" };
    }
  };

  const openGuide = () => setShowGuide(true);
  const closeGuide = () => setShowGuide(false);

  const [showChangelog, setShowChangelog] = useState(false);
  const openChangelog = () => setShowChangelog(true);
  const closeChangelog = () => setShowChangelog(false);

  // Loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "var(--md-font)",
        color: "var(--md-on-surface-variant)",
      }}>
        <p>Caricamento...</p>
      </div>
    );
  }

  // Determine content
  let content;
  const activeTl = timelines.find(t => t.id === activeId);

  if (showGuide) {
    content = <Guide onClose={closeGuide} />;
  } else if (showChangelog) {
    content = <Changelog onClose={closeChangelog} />;
  } else if (showLanding) {
    content = <LandingPage onEnter={() => setShowLanding(false)} onGuide={openGuide} onChangelog={openChangelog} />;
  } else if (activeTl) {
    content = (
      <TimelineEditor
        key={activeTl.id}
        timeline={activeTl}
        onUpdate={handleUpdate}
        onBack={() => setActiveId(null)}
        onGuide={openGuide}
        ai={ai}
      />
    );
  } else {
    content = (
      <Dashboard
        timelines={timelines}
        onCreate={handleCreate}
        onOpen={setActiveId}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onHome={() => setShowLanding(true)}
        onGuide={openGuide}
        onChangelog={openChangelog}
        onExport={handleExport}
        onImport={handleImport}
        exportDirty={exportDirty}
      />
    );
  }

  return (
    <>
      {content}
      {storageError && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#ef4444", color: "#fff",
          padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 2000,
          maxWidth: "90%", textAlign: "center",
        }}>
          {storageError}
          <button onClick={() => setStorageError(null)} style={{
            marginLeft: 12, background: "none", border: "none",
            color: "#fff", cursor: "pointer", fontSize: 16,
          }}>&times;</button>
        </div>
      )}
    </>
  );
}
