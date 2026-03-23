import { apiFetch, pageableQuery } from './client.js';

export function getStudent(id) {
  return apiFetch(`/student/${id}`, { method: 'GET' });
}

export function filterStudents(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/student/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}

export function filterStudentCards(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/student/cardsFilter${q}`, {
    method: 'POST',
    json: filter,
  });
}

export function deleteStudent(id) {
  return apiFetch(`/student/${id}`, { method: 'DELETE' });
}
