import { API_BASE } from '../config.js';

/**
 * @param {string} path - путь от корня API, например /auth/login
 * @param {RequestInit & { json?: unknown }} [options]
 */
export async function apiFetch(path, options = {}) {
  const { json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    credentials: 'include',
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const contentType = res.headers.get('content-type') ?? '';
  let data = null;

  if (res.status !== 204) {
    const text = await res.text();
    if (text && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } else if (text) {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && (data.message || data.error)
        ? data.message || data.error
        : `HTTP ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return { res, data };
}

/** Spring Pageable в query: page, size (sort опционально). */
export function pageableQuery(page, size, sort) {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('size', String(size));
  if (sort?.length) {
    sort.forEach((s) => p.append('sort', s));
  }
  return `?${p.toString()}`;
}
