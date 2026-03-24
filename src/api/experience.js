import { apiFetch, pageableQuery } from './client.js';

export function createExperience(body) {
  return apiFetch('/experience', { method: 'POST', json: body });
}

export function updateExperience(id, body) {
  return apiFetch(`/experience/${id}`, { method: 'PUT', json: body });
}

export function deleteExperience(id) {
  return apiFetch(`/experience/${id}`, { method: 'DELETE' });
}

export function filterExperience(filter, page = 0, size = 50, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/experience/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
