/** datetime-local → LocalDateTime для API (YYYY-MM-DDTHH:mm:ss). */
export function toApiDateTime(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length === 16) return `${v}:00`;
  return v;
}

/** LocalDateTime с API → значение для datetime-local. */
export function fromApiDateTime(value) {
  if (!value) return '';
  const s = String(value);
  return s.length >= 16 ? s.slice(0, 16) : s;
}
