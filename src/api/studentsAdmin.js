import { apiFetch } from './client.js';

export function reorderStudents(orderedIds) {
  return apiFetch('/admin/students/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}

export function bulkStudentVisibility(body) {
  return apiFetch('/admin/students/bulk-visibility', {
    method: 'POST',
    json: body,
  });
}

export function sendStudentMail(body) {
  return apiFetch('/admin/students/mail', {
    method: 'POST',
    json: body,
  });
}

export function listStudentProfileVersions(id) {
  return apiFetch(`/admin/students/${id}/profile-versions`, { method: 'GET' });
}

export function getPublishedSnapshot(id) {
  return apiFetch(`/admin/students/${id}/published-snapshot`, { method: 'GET' });
}
