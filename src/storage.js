const DB_NAME = "timeline-app-db";
const DB_VERSION = 1;
const STORE_NAME = "timelines";
const MIGRATION_KEY = "timeline-app-migrated-to-idb";
const LS_STORAGE_KEY = "timeline-app-data";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadTimelines() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTimelines(timelines) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const tl of timelines) {
      store.put(tl);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function initializeStorage() {
  const migrated = localStorage.getItem(MIGRATION_KEY);

  let timelines = await loadTimelines();

  // If IndexedDB is empty and not yet migrated, try localStorage
  if ((!timelines || timelines.length === 0) && !migrated) {
    const raw = localStorage.getItem(LS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await saveTimelines(parsed);
          timelines = parsed;
        }
      } catch { /* corrupted localStorage, ignore */ }
    }
    localStorage.setItem(MIGRATION_KEY, Date.now().toString());
  }

  // Clean up old localStorage data after successful migration
  if (migrated && timelines.length > 0) {
    try { localStorage.removeItem(LS_STORAGE_KEY); } catch { /* ignore */ }
  }

  return timelines || [];
}

// Fallback for browsers without IndexedDB
export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
