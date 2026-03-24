/**
 * Плоское тело POST /experience (без вложенного experience).
 * Компания — текст; companyId: 0, если нет привязки к справочнику.
 */
export function buildExperienceCreateBody(studentId, row) {
  const body = {
    companyId: 0,
    position: row.position.trim(),
    additionalInfo: (row.additionalInfo || '').trim(),
    startDate: row.startDate || '',
    endDate: row.endDate || '',
  };
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
