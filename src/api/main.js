import { apiFetch } from './client.js';

export function getStatus() {
  return apiFetch('/main/status', { method: 'GET' });
}
