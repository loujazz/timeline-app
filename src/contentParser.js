// Content parser: auto-embed YouTube/Vimeo + markdown-lite formatting
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
    const urlMatch = trimmed.match(URL_RE);

    if (urlMatch) {
      const url = urlMatch[0];
      const ytId = extractYouTubeId(url);
      const vimeoId = extractVimeoId(url);

      if (ytId) {
        // Text before the URL on the same line
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
    }

    textBuf.push(line);
  }

  flushText();
  return blocks;
}
