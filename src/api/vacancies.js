import { apiFetch, pageableQuery } from './client.js';

export function filterVacancies(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/admin/vacancies/filter${q}`, {
    method: 'POST',
    json: filter ?? {},
  });
}

export function getVacancy(id) {
  return apiFetch(`/admin/vacancies/${id}`, { method: 'GET' });
}

export function approveVacancy(id) {
  return apiFetch(`/admin/vacancies/${id}/approve`, { method: 'POST' });
}

export function rejectVacancy(id, body) {
  return apiFetch(`/admin/vacancies/${id}/reject`, {
    method: 'POST',
    json: body ?? {},
  });
}

export function reorderVacancies(orderedIds) {
  return apiFetch('/admin/vacancies/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}

export function patchVacancyVitrina(id, body) {
  return apiFetch(`/admin/vacancies/${id}/vitrina`, {
    method: 'PATCH',
    json: body,
  });
}
