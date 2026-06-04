import { apiFetch } from './client.js';

export function listAccountApprovals(role, page, size) {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('size', String(size));
  if (role) p.set('role', role);
  return apiFetch(`/admin/account-approvals?${p.toString()}`, { method: 'GET' });
}

export function approveAccount(userId) {
  return apiFetch(`/admin/account-approvals/${userId}/approve`, { method: 'POST' });
}

export function rejectAccount(userId, body) {
  return apiFetch(`/admin/account-approvals/${userId}/reject`, {
    method: 'POST',
    json: body ?? {},
  });
}
