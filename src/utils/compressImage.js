function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };
    img.src = url;
  });
}

async function encodeJpegFromFile(file, maxEdge, quality) {
  const mimeType = 'image/jpeg';
  const img = await loadImageFromFile(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) {
    throw new Error('Пустое изображение');
  }
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas недоступен');
  }
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Не удалось сжать изображение'))),
      mimeType,
      quality
    );
  });
  const base = (file.name.replace(/\.[^.]+$/, '') || 'photo').replace(/[^\w.-]+/g, '_');
  return new File([blob], `${base}.jpg`, { type: mimeType });
}

/**
 * Уменьшает изображение и конвертирует в JPEG, чтобы уложиться в лимиты загрузки.
 * @param {File} file
 * @param {{ maxEdge?: number, quality?: number }} [opts]
 * @returns {Promise<File>}
 */
export async function compressImageForUpload(file, opts = {}) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const passes = [
    { maxEdge: opts.maxEdge ?? 1600, quality: opts.quality ?? 0.82 },
    { maxEdge: 1280, quality: 0.76 },
    { maxEdge: 1024, quality: 0.7 },
    { maxEdge: 800, quality: 0.65 },
  ];

  let best = null;
  let lastErr;
  for (const p of passes) {
    try {
      const out = await encodeJpegFromFile(file, p.maxEdge, p.quality);
      best = out;
      if (out.size <= 450 * 1024) {
        return out;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (best) {
    return best;
  }
  if (lastErr) {
    throw lastErr;
  }
  return file;
}
