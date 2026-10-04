const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID студента из карточки / DTO (разные имена полей в API). */
export function resolveStudentId(record) {
  if (record == null) return null;

  if (typeof record === 'string') {
    const s = record.trim();
    return isValidUuid(s) ? s : null;
  }

  if (typeof record !== 'object') return null;

  const candidates = [
    record.id,
    record.studentId,
    record.studentUuid,
    record.student_id,
    record.student?.id,
    record.student?.studentId,
  ];

  for (const v of candidates) {
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s === 'undefined' || s === 'null') continue;
    if (UUID_RE.test(s)) return s;
  }

  return null;
}

export function isValidUuid(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return s !== '' && s !== 'undefined' && UUID_RE.test(s);
}

export function filterValidUuids(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim()).filter(isValidUuid))];
}
