/**
 * Базовый URL API (без завершающего слэша).
 * По умолчанию `/api` — same-origin прокси в nginx (без CORS).
 * Для прямого доступа: VITE_API_URL=https://test-api.singularity-resume.ru
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined || raw === '' || raw === 'same-origin') {
    return '/api';
  }
  return String(raw).replace(/\/$/, '');
}

export const API_BASE = resolveApiBase();
