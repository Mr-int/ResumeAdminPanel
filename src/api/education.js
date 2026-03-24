import { apiFetch, pageableQuery } from './client.js';

export function createEducation(body) {
  return apiFetch('/education', { method: 'POST', json: body });
}

export function updateEducation(id, body) {
  return apiFetch(`/education/${id}`, { method: 'PUT', json: body });
}

export function deleteEducation(id) {
  return apiFetch(`/education/${id}`, { method: 'DELETE' });
}

export function filterEducation(filter, page = 0, size = 50, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/education/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
