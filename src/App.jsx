import { useState, useEffect, useCallback } from "react";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import TimelineEditor from "./TimelineEditor";

const STORAGE_KEY = "timeline-app-data";

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timelines));
}

export default function App() {
  const [timelines, setTimelines] = useState(loadData);
  const [activeId, setActiveId] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  // Persist on every change
  useEffect(() => {
    saveData(timelines);
  }, [timelines]);

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
  };

  const handleDelete = id => {
    setTimelines(prev => prev.filter(t => t.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleUpdate = useCallback(updated => {
    setTimelines(prev => prev.map(t => t.id === updated.id ? updated : t));
  }, []);

  const activeTl = timelines.find(t => t.id === activeId);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (activeTl) {
    return (
      <TimelineEditor
        key={activeTl.id}
        timeline={activeTl}
        onUpdate={handleUpdate}
        onBack={() => setActiveId(null)}
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
    />
  );
}
