const VARIANTS = {
  default: 'status-badge--default',
  pending: 'status-badge--pending',
  success: 'status-badge--success',
  danger: 'status-badge--danger',
  warning: 'status-badge--warning',
  info: 'status-badge--info',
};

export function StatusBadge({ children, variant = 'default' }) {
  const cls = VARIANTS[variant] ?? VARIANTS.default;
  return <span className={`status-badge ${cls}`}>{children}</span>;
}

export function requestStatusVariant(status) {
  if (status === 'SUCCESS' || status === 'STUDENT_CONFIRMED' || status === 'RECRUITER_CONFIRMED') {
    return 'success';
  }
  if (status === 'REFUSAL') return 'danger';
  if (status === 'WAITING' || status === 'EXPECTATION') return 'pending';
  return 'default';
}

export function vacancyStatusVariant(status) {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING_REVIEW') return 'pending';
  if (status === 'DRAFT') return 'info';
  return 'default';
}

export function registrationStatusVariant(status) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'pending';
  return 'default';
}
