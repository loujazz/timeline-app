import { useState, useRef, useCallback } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const MODEL_ID = "gemma-2-2b-it-q4f16_1-MLC";

const SYSTEM_PROMPT_SINGLE = `You are a JSON event extractor. The user gives you a text describing a historical or personal event. Extract exactly one event and return ONLY a JSON object with these fields:
- "date": ISO date string (YYYY-MM-DD, or YYYY-MM, or YYYY). For BC dates use negative year like "-0044-03-15"
- "title": short event title in Italian (italiano) (max 60 chars)
- "desc": brief description in Italian (italiano) (1-2 sentences)
- "isBC": boolean, true only if the date is Before Christ

Return ONLY the JSON object. No markdown, no explanation, no extra text.`;

const SYSTEM_PROMPT_BULK = `You are a JSON event extractor. The user gives you a long text. Extract ALL distinct events with dates and return ONLY a JSON array of objects, each with:
- "date": ISO date string (YYYY-MM-DD, or YYYY-MM, or YYYY). For BC dates use negative year like "-0044-03-15"
- "title": short event title in Italian (italiano) (max 60 chars)
- "desc": brief description in Italian (italiano) (1-2 sentences)
- "isBC": boolean, true only if the date is Before Christ

Return ONLY the JSON array. No markdown, no explanation, no extra text.`;

/**
 * Strip markdown fences, preamble text, and trailing text to isolate JSON.
 */
function cleanJsonResponse(raw) {
  let text = raw.trim();
  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Find first [ or { — strip any preamble text before it
  const firstBracket = text.search(/[[\{]/);
  if (firstBracket > 0) text = text.slice(firstBracket);
  // Find last ] or } — strip any trailing text after it
  const lastClose = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
  if (lastClose >= 0) text = text.slice(0, lastClose + 1);
  return text;
}

/**
 * Normalize an AI-returned event object into { date, title, desc, isBC }.
 * Handles negative-year dates (e.g. "-0044-03-15") and missing fields.
 */
function normalizeEvent(obj) {
  const raw = String(obj.date || "");
  let date = raw;
  let isBC = !!obj.isBC;

  // Handle negative year from AI (e.g. "-0044-03-15")
  if (raw.startsWith("-")) {
    isBC = true;
    date = raw.slice(1); // remove leading minus → "0044-03-15"
  }

  return {
    date,
    title: String(obj.title || "").slice(0, 80),
    desc: String(obj.desc || ""),
    isBC,
  };
}

const webGpuSupported = typeof navigator !== "undefined" && !!navigator.gpu;

export default function useLocalAI() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const engineRef = useRef(null);

  const loadModel = useCallback(async () => {
    if (engineRef.current || loading) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          setProgress(Math.round((report.progress || 0) * 100));
        },
      });
      engineRef.current = engine;
      setReady(true);
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("WebGPU") || msg.includes("gpu")) {
        setError("WebGPU non disponibile. Usa Chrome 113+ o Edge 113+.");
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("Failed to fetch")) {
        setError("Errore di rete. Controlla la connessione e riprova.");
      } else if (msg.includes("storage") || msg.includes("quota")) {
        setError("Spazio insufficiente. Il modello richiede ~1.5 GB.");
      } else {
        setError(`Errore nel caricamento del modello AI: ${msg}`);
      }
      engineRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const generate = useCallback(async (mode, text) => {
    if (!engineRef.current) throw new Error("Modello non caricato");
    const systemPrompt = mode === "bulk" ? SYSTEM_PROMPT_BULK : SYSTEM_PROMPT_SINGLE;

    // Try up to 2 times — on retry, add explicit JSON reminder
    for (let attempt = 0; attempt < 2; attempt++) {
      const userContent = attempt === 0
        ? text
        : text + "\n\nIMPORTANT: respond with ONLY valid JSON, no other text.";

      const response = await engineRef.current.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: mode === "bulk" ? 2048 : 512,
      });

      const raw = response.choices[0]?.message?.content || "";
      try {
        const cleaned = cleanJsonResponse(raw);
        const parsed = JSON.parse(cleaned);

        if (mode === "bulk") {
          if (!Array.isArray(parsed)) throw new Error("not array");
          return parsed.map(normalizeEvent);
        }
        return normalizeEvent(parsed);
      } catch {
        if (attempt === 1) {
          throw new Error("Impossibile estrarre dati dal testo. Prova a riformulare.");
        }
        // first attempt failed — retry
      }
    }
  }, []);

  const unload = useCallback(async () => {
    if (engineRef.current) {
      try { await engineRef.current.unload(); } catch { /* ignore */ }
      engineRef.current = null;
    }
    setReady(false);
    setProgress(0);
    setError(null);
  }, []);

  return { ready, loading, progress, error, webGpuSupported, loadModel, generate, unload };
}
