import { apiFetch, pageableQuery } from './client.js';

export function getSkill(id) {
  return apiFetch(`/skill/${id}`, { method: 'GET' });
}

export function createSkill(body) {
  return apiFetch('/skill', { method: 'POST', json: body });
}

export function updateSkill(id, body) {
  return apiFetch(`/skill/${id}`, { method: 'PUT', json: body });
}

export function deleteSkill(id) {
  return apiFetch(`/skill/${id}`, { method: 'DELETE' });
}

export function filterSkills(filter, page, size, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/skill/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
