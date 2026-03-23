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
