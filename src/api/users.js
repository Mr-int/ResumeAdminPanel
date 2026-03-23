import { apiFetch, pageableQuery } from './client.js';

export function createUser(body) {
  return apiFetch('/user', { method: 'POST', json: body });
}

export function filterUsers(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/user/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}

export function deleteUser(id) {
  return apiFetch(`/user/${id}`, { method: 'DELETE' });
}
