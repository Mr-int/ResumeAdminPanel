import { apiFetch, pageableQuery } from './client.js';

export function createCompany(body) {
  return apiFetch('/company', { method: 'POST', json: body });
}

export function updateCompany(id, body) {
  return apiFetch(`/company/${id}`, { method: 'PUT', json: body });
}

export function deleteCompany(id) {
  return apiFetch(`/company/${id}`, { method: 'DELETE' });
}

export function filterCompanies(filter, page = 0, size = 50, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/company/filter${q}`, { method: 'POST', json: filter });
}

