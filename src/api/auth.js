import { apiFetch } from './client.js';

export function login(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    json: { username, password },
  });
}

export function refresh() {
  return apiFetch('/auth/refresh', { method: 'POST' });
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function getRecruiterMe() {
  return apiFetch('/recruiter/me', { method: 'GET' });
}

/** RECRUITER, если есть профиль рекрутёра; иначе ADMIN (модератор). */
export async function detectSessionRole() {
  try {
    await getRecruiterMe();
    return 'RECRUITER';
  } catch (e) {
    if (e.status === 401) throw e;
    return 'ADMIN';
  }
}
