/**
 * Плоское тело POST /experience (без вложенного experience).
 * Контракт: companyId > 0, studentId (UUID/строка), position/additionalInfo/startDate/endDate.
 */
export function buildExperienceCreateBody(studentId, row) {
  const normalizedStudentId = (() => {
    if (studentId == null) return '';
    const s = String(studentId).trim();
    if (!s) return '';
    if (s.toLowerCase() === 'nan') return '';
    return s;
  })();

  const startDateRaw = row?.startDate ?? '';
  const endDateRaw = row?.endDate ?? '';

  const isValidLocalDate = (v) =>
    typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

  if (startDateRaw && !isValidLocalDate(startDateRaw)) {
    throw new Error(`Некорректная дата (startDate): ${startDateRaw}`);
  }
  if (endDateRaw && !isValidLocalDate(endDateRaw)) {
    throw new Error(`Некорректная дата (endDate): ${endDateRaw}`);
  }

  const companyIdNum = Number(row?.companyId);
  if (!Number.isFinite(companyIdNum) || companyIdNum <= 0) {
    throw new Error('companyId должен быть больше 0');
  }

  const body = {
    companyId: companyIdNum,
    position: row.position.trim(),
    additionalInfo: (row.additionalInfo || '').trim(),
  };
  if (startDateRaw) body.startDate = startDateRaw;
  if (endDateRaw) body.endDate = endDateRaw;

  if (normalizedStudentId) body.studentId = normalizedStudentId;
  return body;
}

/**
 * Плоское тело POST /institution.
 * Контракт: educationId > 0, studentId (UUID/строка), startYear/endYear.
 */
export function buildInstitutionCreateBody(studentId, row) {
  const normalizedStudentId = (() => {
    if (studentId == null) return '';
    const s = String(studentId).trim();
    if (!s) return '';
    if (s.toLowerCase() === 'nan') return '';
    return s;
  })();

  const educationIdNum = Number(row?.educationId);
  if (!Number.isFinite(educationIdNum) || educationIdNum <= 0) {
    throw new Error('educationId должен быть больше 0');
  }

  const body = {
    educationId: educationIdNum,
    startYear: Number(row.startYear),
    endYear: Number(row.endYear),
  };
  if (normalizedStudentId) body.studentId = normalizedStudentId;
  return body;
}
