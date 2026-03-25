/**
 * Плоское тело POST /experience (без вложенного experience).
 * Компания — текст; companyId: 0, если нет привязки к справочнику.
 */
export function buildExperienceCreateBody(studentId, row) {
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

  const body = {
    companyId: 0,
    position: row.position.trim(),
    additionalInfo: (row.additionalInfo || '').trim(),
  };
  if (startDateRaw) body.startDate = startDateRaw;
  if (endDateRaw) body.endDate = endDateRaw;

  const companyName = (row.companyName ?? row.company ?? '').trim();
  if (companyName) {
    body.companyName = companyName;
    body.company = companyName;
  }
  if (studentId != null && String(studentId) !== '') {
    body.studentId = String(studentId);
  }
  return body;
}

/**
 * Плоское тело POST /institution: заведение текстом, educationId: 0 при отсутствии справочника.
 */
export function buildInstitutionCreateBody(studentId, row) {
  const body = {
    educationId: 0,
    startYear: Number(row.startYear),
    endYear: Number(row.endYear),
  };
  const name = (row.institutionName ?? row.institution ?? '').trim();
  if (name) {
    body.institutionName = name;
    body.institution = name;
  }
  if (studentId != null && String(studentId) !== '') {
    body.studentId = String(studentId);
  }
  return body;
}
