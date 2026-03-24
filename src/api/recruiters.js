import { apiFetch, pageableQuery } from './client.js';

export function filterRecruiters(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/recruiter/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}

export function getRecruiter(id) {
  return apiFetch(`/recruiter/${id}`, { method: 'GET' });
}

export function updateRecruiter(id, body) {
  return apiFetch(`/recruiter/${id}`, { method: 'PUT', json: body });
}

export function patchRecruiter(id, body) {
  return apiFetch(`/recruiter/${id}`, { method: 'PATCH', json: body });
}

export function deleteRecruiter(id) {
  return apiFetch(`/recruiter/${id}`, { method: 'DELETE' });
}
