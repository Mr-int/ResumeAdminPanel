import { apiFetch, pageableQuery } from './client.js';

export function createInstitution(body) {
  return apiFetch('/institution', { method: 'POST', json: body });
}

export function updateInstitution(id, body) {
  return apiFetch(`/institution/${id}`, { method: 'PUT', json: body });
}

export function deleteInstitution(id) {
  return apiFetch(`/institution/${id}`, { method: 'DELETE' });
}

export function filterInstitutions(filter, page = 0, size = 50, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/institution/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
