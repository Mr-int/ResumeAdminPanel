import { apiFetch, pageableQuery } from './client.js';

export function filterRecruiterRegistrations(filter, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/admin/recruiter-registration-requests/filter${q}`, {
    method: 'POST',
    json: filter ?? {},
  });
}

export function approveRecruiterRegistration(id) {
  return apiFetch(`/admin/recruiter-registration-requests/${id}/approve`, {
    method: 'POST',
  });
}

export function rejectRecruiterRegistration(id, body) {
  return apiFetch(`/admin/recruiter-registration-requests/${id}/reject`, {
    method: 'POST',
    json: body ?? {},
  });
}
