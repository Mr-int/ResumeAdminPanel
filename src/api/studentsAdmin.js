import { apiFetch } from './client.js';

export function reorderStudents(orderedIds) {
  return apiFetch('/admin/students/reorder', {
    method: 'POST',
    json: { orderedIds },
  });
}
