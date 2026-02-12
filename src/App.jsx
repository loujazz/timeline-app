import { useState, useEffect, useCallback } from "react";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import TimelineEditor from "./TimelineEditor";
import Guide from "./Guide";
import Changelog from "./Changelog";

const STORAGE_KEY = "timeline-app-data";
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

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [sampleTimeline];
}

function saveData(timelines) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timelines));
  } catch (e) {
    console.warn("Salvataggio fallito (spazio insufficiente):", e.message);
  }
}

export default function App() {
  const [timelines, setTimelines] = useState(loadData);
  const [activeId, setActiveId] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  // Track whether data changed since last export
  const getExportDirty = () => {
    const exp = localStorage.getItem(EXPORT_TS_KEY);
    const mod = localStorage.getItem(MODIFY_TS_KEY);
    if (!exp) return true; // never exported
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

  // Persist on every change
  useEffect(() => {
    saveData(timelines);
  }, [timelines]);

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

  const handleUpdate = useCallback(updated => {
    setTimelines(prev => prev.map(t => t.id === updated.id ? updated : t));
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
      const incoming = parsed.timelines || parsed; // support raw array or wrapped
      if (!Array.isArray(incoming)) throw new Error("Formato non valido");

      if (mode === "replace") {
        setTimelines(incoming);
      } else {
        // merge: add new timelines, skip duplicates by id
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

  if (showGuide) {
    return <Guide onClose={closeGuide} />;
  }

  if (showChangelog) {
    return <Changelog onClose={closeChangelog} />;
  }

  const activeTl = timelines.find(t => t.id === activeId);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} onGuide={openGuide} onChangelog={openChangelog} />;
  }

  if (activeTl) {
    return (
      <TimelineEditor
        key={activeTl.id}
        timeline={activeTl}
        onUpdate={handleUpdate}
        onBack={() => setActiveId(null)}
        onGuide={openGuide}
      />
    );
  }

  return (
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
