/**
 * Compress a data URL image by resizing and converting to JPEG.
 * @param {string} dataUrl - The original data URL
 * @param {number} maxWidth - Maximum width in pixels (default 1200)
 * @param {number} quality - JPEG quality 0-1 (default 0.75)
 * @returns {Promise<string>} Compressed data URL
 */
export function compressImage(dataUrl, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
