import { apiFetch, pageableQuery } from './client.js';

export function createStudent(body) {
  return apiFetch('/student', { method: 'POST', json: body });
}

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

export function updateStudent(id, body) {
  return apiFetch(`/student/${id}`, { method: 'PUT', json: body });
}
