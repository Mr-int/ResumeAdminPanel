import { API_BASE } from '../config.js';

/**
 * Ключ файла из `imagePath` / `StorageFileDTO.fileName`.
 * API: GET /main/photo/{image_path} — один path-параметр (имя или путь в хранилище).
 */
export function normalizeStorageImagePath(imagePath) {
  if (imagePath == null) return null;
  let path = String(imagePath).trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const withoutApi = path.replace(/^\/api\/main\/photo\//i, '');
  const withoutMain = withoutApi.replace(/^\/main\/photo\//i, '');
  path = withoutMain.replace(/^\/+/, '');
  return path || null;
}

/**
 * Публичный URL изображения для `<img src>` (same-origin `/api/...` через nginx/vite proxy).
 * Авторизация не нужна — endpoint permitAll.
 */
export function mainPhotoUrl(imagePath) {
  const path = normalizeStorageImagePath(imagePath);
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}/main/photo/${encodeURIComponent(path)}`;
}

/** Превью изображения проекта: внешний URL приоритетнее файла в хранилище. */
export function projectImagePreview(item) {
  if (!item || typeof item !== 'object') return null;
  const external = item.imageUrl?.trim();
  if (external) return external;
  return mainPhotoUrl(item.imagePath);
}
