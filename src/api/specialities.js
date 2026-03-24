import { apiFetch, pageableQuery } from './client.js';

export function getSpeciality(id) {
  return apiFetch(`/speciality/${id}`, { method: 'GET' });
}

export function createSpeciality(body) {
  return apiFetch('/speciality', { method: 'POST', json: body });
}

export function updateSpeciality(id, body) {
  return apiFetch(`/speciality/${id}`, { method: 'PUT', json: body });
}

export function deleteSpeciality(id) {
  return apiFetch(`/speciality/${id}`, { method: 'DELETE' });
}

export function filterSpecialities(filter, page, size, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/speciality/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
