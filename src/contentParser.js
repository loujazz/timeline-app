// Content parser: auto-embed YouTube/Vimeo/iframes + markdown-lite formatting
// No external dependencies. Input is plain text, output is array of blocks.

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function extractYouTubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

// Google Drive: extract file ID from share/open links
function extractDriveFileId(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
    || url.match(/drive\.google\.com\/open\?id=([\w-]+)/)
    || url.match(/drive\.google\.com\/uc\?.*id=([\w-]+)/);
  return m ? m[1] : null;
}

// Whitelist of allowed iframe domains
const ALLOWED_IFRAME_HOSTS = [
  "www.google.com",
  "google.com",
  "maps.google.com",
  "open.spotify.com",
  "docs.google.com",
  "calendar.google.com",
  "bandcamp.com",
  "w.soundcloud.com",
  "soundcloud.com",
  "embed.music.apple.com",
  "www.openstreetmap.org",
  "umap.openstreetmap.fr",
  "padlet.com",
  "www.canva.com",
  "codepen.io",
  "player.twitch.tv",
  "clips.twitch.tv",
  "www.dailymotion.com",
  "geo.dailymotion.com",
];

// Extract src from <iframe> tag and validate domain
function extractIframeSrc(line) {
  const m = line.match(/<iframe\s[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!m) return null;
  const src = m[1];
  try {
    const parsed = new URL(src);
    if (ALLOWED_IFRAME_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
      // Detect aspect ratio hint from domain
      const isMap = parsed.hostname.includes("google.com") && parsed.pathname.includes("/maps")
        || parsed.hostname.includes("openstreetmap");
      const isAudio = parsed.hostname.includes("spotify") || parsed.hostname.includes("soundcloud")
        || parsed.hostname.includes("bandcamp") || parsed.hostname.includes("music.apple");
      return { src, aspect: isMap ? "map" : isAudio ? "audio" : "video" };
    }
  } catch { /* invalid URL */ }
  return null;
}

function parseMarkdown(escaped) {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

const URL_RE = /https?:\/\/[^\s]+/;

export function parseContent(rawText) {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const blocks = [];
  let textBuf = [];

  const flushText = () => {
    if (textBuf.length) {
      const html = textBuf.map(l => parseMarkdown(escapeHtml(l))).join("<br>");
      blocks.push({ type: "text", html });
      textBuf = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for <iframe> tags first (before escaping)
    if (/<iframe\s/i.test(trimmed)) {
      const iframe = extractIframeSrc(trimmed);
      if (iframe) {
        flushText();
        blocks.push({ type: "embed", provider: "iframe", src: iframe.src, aspect: iframe.aspect });
        continue;
      }
    }

    const urlMatch = trimmed.match(URL_RE);

    if (urlMatch) {
      const url = urlMatch[0];
      const ytId = extractYouTubeId(url);
      const vimeoId = extractVimeoId(url);

      if (ytId) {
        const before = trimmed.slice(0, urlMatch.index).trim();
        const after = trimmed.slice(urlMatch.index + url.length).trim();
        if (before) textBuf.push(before);
        flushText();
        blocks.push({ type: "embed", provider: "youtube", videoId: ytId });
        if (after) textBuf.push(after);
        continue;
      }
      if (vimeoId) {
        const before = trimmed.slice(0, urlMatch.index).trim();
        const after = trimmed.slice(urlMatch.index + url.length).trim();
        if (before) textBuf.push(before);
        flushText();
        blocks.push({ type: "embed", provider: "vimeo", videoId: vimeoId });
        if (after) textBuf.push(after);
        continue;
      }
      const driveId = extractDriveFileId(url);
      if (driveId) {
        const before = trimmed.slice(0, urlMatch.index).trim();
        const after = trimmed.slice(urlMatch.index + url.length).trim();
        if (before) textBuf.push(before);
        flushText();
        blocks.push({ type: "embed", provider: "gdrive", fileId: driveId });
        if (after) textBuf.push(after);
        continue;
      }
    }

    textBuf.push(line);
  }

  flushText();
  return blocks;
}
