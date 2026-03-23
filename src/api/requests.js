import { apiFetch, pageableQuery } from './client.js';

export function getRequest(id) {
  return apiFetch(`/request/${id}`, { method: 'GET' });
}

export function filterRequests(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/request/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}

export function deleteRequest(id) {
  return apiFetch(`/request/${id}`, { method: 'DELETE' });
}
