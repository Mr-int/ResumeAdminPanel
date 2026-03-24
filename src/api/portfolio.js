import { apiFetch, pageableQuery } from './client.js';

export function createPortfolio(body) {
  return apiFetch('/portfolio', { method: 'POST', json: body });
}

export function updatePortfolio(id, body) {
  return apiFetch(`/portfolio/${id}`, { method: 'PUT', json: body });
}

export function deletePortfolio(id) {
  return apiFetch(`/portfolio/${id}`, { method: 'DELETE' });
}

export function filterPortfolio(filter, page = 0, size = 50, sort) {
  const q = pageableQuery(page, size, sort);
  return apiFetch(`/portfolio/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
