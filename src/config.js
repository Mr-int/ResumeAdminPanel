/**
 * Базовый URL API (без завершающего слэша).
 *
 * По умолчанию `/api` — запросы на тот же origin, nginx проксирует на бэкенд (без CORS).
 *
 * Важно для продакшена: не задавайте полный URL вида https://api.example.com
 * при деплое на admin.example.com — браузер заблокирует запросы (CORS).
 * Сборка: VITE_API_URL=/api (или не задавать). Прокси: API_UPSTREAM на сервере.
 */
function resolveApiBase() {
  const raw = import.meta.env.VITE_API_URL;

  if (raw === undefined || raw === '' || raw === 'same-origin') {
    return '/api';
  }

  const configured = String(raw).replace(/\/$/, '');

  // Чужой origin (прод или dev без vite proxy) — только относительный /api
  if (typeof window !== 'undefined' && /^https?:\/\//i.test(configured)) {
    try {
      const apiOrigin = new URL(configured).origin;
      if (apiOrigin !== window.location.origin) {
        return '/api';
      }
    } catch {
      return '/api';
    }
  }

  return configured;
}

export const API_BASE = resolveApiBase();
