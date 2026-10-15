/**
 * Базовый URL API (без завершающего слэша).
 *
 * По умолчанию `/api/v1` — запросы на тот же origin, nginx проксирует на бэкенд (без CORS).
 *
 * Важно для продакшена: не задавайте полный URL вида https://api.example.com
 * при деплое на admin.example.com — браузер заблокирует запросы (CORS).
 * Сборка: VITE_API_URL=/api/v1 (или не задавать). Прокси: API_UPSTREAM на сервере.
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL;

  if (raw === undefined || raw === '' || raw === 'same-origin') {
    return '/api/v1';
  }

  const configured = String(raw).replace(/\/$/, '');

  // Чужой origin (прод или dev без vite proxy) — только относительный /api
  if (typeof window !== 'undefined' && /^https?:\/\//i.test(configured)) {
    try {
      const apiOrigin = new URL(configured).origin;
      if (apiOrigin !== window.location.origin) {
        return '/api/v1';
      }
    } catch {
      return '/api/v1';
    }
  }

  return configured;
}

export const API_BASE = resolveApiBase();

/** Публичный сайт резюме (без завершающего слэша). */
export const SITE_BASE_URL = String(
  import.meta.env.VITE_SITE_URL || 'https://singularity-resume.ru'
).replace(/\/$/, '');

function normalizePrefix(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '/') return '';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.replace(/\/$/, '');
}

/**
 * Публичный префикс анкеты.
 * Прод: `/studentsResume/...`. Площадка plt: `/plt/studentsResume/...`.
 * Локальный vite не открыт по `/plt/admin/`, поэтому в dev префикс берётся из
 * `VITE_SITE_PATH`, а если его нет — `/plt`.
 */
function publicSitePrefix() {
  const explicit = import.meta.env.VITE_SITE_PATH;
  if (explicit != null && String(explicit).trim() !== '') {
    return normalizePrefix(explicit);
  }

  const hints = [
    import.meta.env.BASE_URL,
    import.meta.env.VITE_API_URL,
    typeof window !== 'undefined' ? window.location.pathname : '',
  ];
  if (hints.some((value) => String(value || '').includes('/plt'))) {
    return '/plt';
  }

  if (import.meta.env.DEV) return '/plt';
  return '';
}

export function studentResumeUrl(studentId) {
  return `${SITE_BASE_URL}${publicSitePrefix()}/studentsResume/${studentId}`;
}
