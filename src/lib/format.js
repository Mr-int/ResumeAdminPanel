export function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function shortUuid(value) {
  if (!value) return '—';
  const s = String(value);
  return s.length > 12 ? `${s.slice(0, 8)}…` : s;
}
