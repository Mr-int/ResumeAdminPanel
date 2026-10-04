import { apiFetch, pageableQuery } from './client.js';
import { pageItems } from '../lib/pageable.js';

const FETCH_CHUNK = 100;

export function filterRecruiters(filter, page, size, fetchOptions = {}) {
  const q = pageableQuery(page, size);
  return apiFetch(`/recruiter/filter${q}`, {
    method: 'POST',
    json: filter,
    ...fetchOptions,
  });
}

/** Все страницы POST /recruiter/filter (API не фильтрует по email). */
export async function fetchAllRecruiters(filter = {}, fetchOptions = {}) {
  const all = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const { data } = await filterRecruiters(filter, page, FETCH_CHUNK, fetchOptions);
    all.push(...pageItems(data));
    totalPages = data?.totalPages ?? 1;
    page += 1;
  }

  return all;
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
