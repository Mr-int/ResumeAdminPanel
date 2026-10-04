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
