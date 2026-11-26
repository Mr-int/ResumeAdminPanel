import { apiFetch, pageableQuery } from './client.js';
import { isValidUuid } from '../utils/studentId.js';

function requireId(id) {
  if (!isValidUuid(id)) {
    throw new Error('Некорректный ID заявки');
  }
  return id;
}

export function filterRecruitmentRequests(status, page, size) {
  const q = pageableQuery(page, size);
  return apiFetch(`/recruitment-requests/filter${q}`, {
    method: 'POST',
    json: status ? { status } : {},
  });
}

export function getRecruitmentRequest(id) {
  return apiFetch(`/recruitment-requests/${requireId(id)}`, { method: 'GET' });
}

export function createRecruitmentRequest(body) {
  return apiFetch('/recruitment-requests', { method: 'POST', json: body });
}

export function updateRecruitmentRequest(id, body) {
  return apiFetch(`/recruitment-requests/${requireId(id)}`, { method: 'PUT', json: body });
}

export function closeRecruitmentRequest(id) {
  return apiFetch(`/recruitment-requests/${requireId(id)}/close`, { method: 'POST' });
}

export function archiveRecruitmentRequest(id) {
  return apiFetch(`/recruitment-requests/${requireId(id)}/archive`, { method: 'POST' });
}

export function listRecruitmentResponses(id) {
  return apiFetch(`/recruitment-requests/${requireId(id)}/responses`, { method: 'GET' });
}

export function acceptRecruitmentResponse(id, responseId) {
  return apiFetch(
    `/recruitment-requests/${requireId(id)}/responses/${requireId(responseId)}/accept`,
    { method: 'POST' }
  );
}

export function rejectRecruitmentResponse(id, responseId) {
  return apiFetch(
    `/recruitment-requests/${requireId(id)}/responses/${requireId(responseId)}/reject`,
    { method: 'POST' }
  );
}
