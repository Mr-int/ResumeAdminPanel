import { apiFetch } from './client.js';

export function listAccountApprovals(role, page, size, fetchOptions = {}) {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('size', String(size));
  if (role) p.set('role', role);
  return apiFetch(`/admin/account-approvals?${p.toString()}`, {
    method: 'GET',
    ...fetchOptions,
  });
}

export function listStudentAccounts(page, size, fetchOptions = {}) {
  const p = new URLSearchParams();
  p.set('page', String(page));
  p.set('size', String(size));
  return apiFetch(`/admin/account-approvals/students?${p.toString()}`, {
    method: 'GET',
    ...fetchOptions,
  });
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

export function setAccountEmailVerified(userId, emailVerified) {
  return apiFetch(`/admin/account-approvals/${userId}/email-verified`, {
    method: 'POST',
    json: { emailVerified },
  });
}

/** Все студенты со статусом аккаунта, ключ — studentId. */
export async function loadPendingStudentApprovals(fetchOptions = {}) {
  const byStudentId = new Map();
  let page = 0;
  const size = 100;
  for (;;) {
    const { data } = await listStudentAccounts(page, size, fetchOptions);
    const rows = data?.data ?? [];
    for (const user of rows) {
      if (user?.studentId == null || user?.id == null) continue;
      byStudentId.set(String(user.studentId), {
        userId: user.id,
        accountStatus: user.accountStatus || null,
        emailVerified: user.emailVerified === true,
      });
    }
    const totalPages = data?.totalPages ?? 1;
    if (page + 1 >= totalPages || !rows.length) break;
    page += 1;
    if (page > 500) break;
  }
  return byStudentId;
}

