import { apiFetch } from './client.js';

export function analyticsSummary(body) {
  return apiFetch('/admin/analytics/summary', { method: 'POST', json: body });
}

export function entityPopulation(body) {
  return apiFetch('/admin/analytics/entity-population', {
    method: 'POST',
    json: body ?? {},
  });
}
