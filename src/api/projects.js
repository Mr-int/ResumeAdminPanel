import { apiFetch } from './client.js';

export function getProject(id) {
  return apiFetch(`/admin/projects/${id}`, { method: 'GET' });
}

export function listProjects(q) {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiFetch(`/admin/projects${query}`, { method: 'GET' });
}

export function createProject(body) {
  return apiFetch('/admin/projects', { method: 'POST', json: body });
}

export function updateProject(id, body) {
  return apiFetch(`/admin/projects/${id}`, { method: 'PUT', json: body });
}

export function deleteProject(id) {
  return apiFetch(`/admin/projects/${id}`, { method: 'DELETE' });
}

export function reorderProjects(orderedIds) {
  return apiFetch('/admin/projects/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}

export function listProjectStudents(id) {
  return apiFetch(`/admin/projects/${id}/students`, { method: 'GET' });
}

export function bindProjectStudents(id, studentIds) {
  return apiFetch(`/admin/projects/${id}/students`, {
    method: 'POST',
    json: { studentIds },
  });
}

export function unbindProjectStudents(id, studentIds) {
  return apiFetch(`/admin/projects/${id}/students`, {
    method: 'DELETE',
    json: { studentIds },
  });
}
