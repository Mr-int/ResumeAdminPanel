export function studentUserId(student, pendingByStudentId) {
  const direct =
    student?.userId ?? student?.user?.id ?? student?.user?.userId ?? student?.accountId;
  if (direct != null && String(direct).trim() !== '') return String(direct);
  const pending = pendingByStudentId?.get(String(student?.id));
  return pending?.userId != null ? String(pending.userId) : null;
}

export function studentAccountStatus(student, pendingByStudentId) {
  const direct = student?.accountStatus ?? student?.user?.accountStatus;
  if (direct) return direct;
  const pending = pendingByStudentId?.get(String(student?.id));
  if (pending) return pending.accountStatus ?? 'PENDING_APPROVAL';
  return 'APPROVED';
}

export function isPendingApproval(status) {
  return status === 'PENDING_APPROVAL' || status === 'PENDING';
}

export function accountStatusVariant(status) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (isPendingApproval(status)) return 'pending';
  return 'default';
}
