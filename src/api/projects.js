import { apiFetch } from './client.js';
import { isValidUuid } from '../utils/studentId.js';

function requireProjectId(id) {
  if (!isValidUuid(id)) {
    throw new Error('Некорректный ID проекта');
  }
  return id;
}

export function getProject(id) {
  return apiFetch(`/admin/projects/${requireProjectId(id)}`, { method: 'GET' });
}

export function listProjects(q) {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiFetch(`/admin/projects${query}`, { method: 'GET' });
}

export function createProject(body) {
  return apiFetch('/admin/projects', { method: 'POST', json: body });
}

export function updateProject(id, body) {
  return apiFetch(`/admin/projects/${requireProjectId(id)}`, { method: 'PUT', json: body });
}

export function deleteProject(id) {
  return apiFetch(`/admin/projects/${requireProjectId(id)}`, { method: 'DELETE' });
}

export function reorderProjects(orderedIds) {
  return apiFetch('/admin/projects/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}

export function listProjectStudents(id) {
  return apiFetch(`/admin/projects/${requireProjectId(id)}/students`, { method: 'GET' });
}

export function bindProjectStudents(id, studentIds) {
  const projectId = requireProjectId(id);
  const ids = Array.isArray(studentIds) ? studentIds.filter(isValidUuid) : [];
  if (!ids.length) {
    throw new Error('Не выбраны студенты с корректным UUID');
  }
  return apiFetch(`/admin/projects/${projectId}/students`, {
    method: 'POST',
    json: { studentIds: ids },
  });
}

export function unbindProjectStudents(id, studentIds) {
  const projectId = requireProjectId(id);
  const ids = Array.isArray(studentIds) ? studentIds.filter(isValidUuid) : [];
  if (!ids.length) {
    throw new Error('Не указан студент для отвязки');
  }
  return apiFetch(`/admin/projects/${projectId}/students`, {
    method: 'DELETE',
    json: { studentIds: ids },
  });
}
