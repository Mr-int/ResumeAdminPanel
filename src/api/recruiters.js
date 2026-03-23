import { apiFetch, pageableQuery } from './client.js';

export function filterRecruiters(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/recruiter/filter${q}`, {
    method: 'POST',
    json: filter,
  });
}
