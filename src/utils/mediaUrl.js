import { API_BASE } from '../config.js';

/** URL превью файла из хранилища (`GET /main/photo/{image_path}`). */
export function mainPhotoUrl(imagePath) {
  if (imagePath == null) return null;
  const path = String(imagePath).trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const encoded = encodeURIComponent(path);
  return `${API_BASE}/main/photo/${encoded}`;
}

/** Превью изображения проекта: внешний URL приоритетнее файла в хранилище. */
export function projectImagePreview(item) {
  if (!item || typeof item !== 'object') return null;
  const external = item.imageUrl?.trim();
  if (external) return external;
  return mainPhotoUrl(item.imagePath);
}
