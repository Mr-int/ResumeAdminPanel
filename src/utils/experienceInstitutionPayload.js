/**
 * Плоское тело POST /experience (без вложенного experience).
 * Контракт (реальный бэк): companyId > 0 (int64), studentId (UUID/строка),
 * position/additionalInfo/startDate/endDate.
 *
 * Примечание: companyName тоже можно передавать как fallback/для читаемости,
 * если бэк допускает лишние поля.
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
  const companyName = String(row?.companyName ?? '').trim();

  const body = {
    companyId: companyIdNum,
    position: row.position.trim(),
    additionalInfo: (row.additionalInfo || '').trim(),
  };
  if (companyName) body.companyName = companyName;
  if (startDateRaw) body.startDate = startDateRaw;
  if (endDateRaw) body.endDate = endDateRaw;

  if (normalizedStudentId) body.studentId = normalizedStudentId;
  return body;
}

/**
 * Плоское тело POST /institution (образование студента).
 * Контракт (OpenAPI): institution (строка), webUrl/additionalInfo, startYear/endYear, studentId.
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
  const startYearNum = Number(row?.startYear);
  const endYearNum = Number(row?.endYear);

  const body = {};
  if (normalizedStudentId) body.studentId = normalizedStudentId;

  // Старый контракт (если есть связь с Education)
  if (Number.isFinite(educationIdNum) && educationIdNum > 0) {
    body.educationId = educationIdNum;
  }

  // Новый/плоский контракт Institution
  if (String(row?.institution ?? '').trim() !== '') {
    body.institution = String(row.institution).trim();
  }
  if (String(row?.webUrl ?? '').trim() !== '') {
    body.webUrl = String(row.webUrl).trim();
  }
  if (String(row?.additionalInfo ?? '').trim() !== '') {
    body.additionalInfo = String(row.additionalInfo).trim();
  }
  if (Number.isFinite(startYearNum)) body.startYear = startYearNum;
  if (Number.isFinite(endYearNum)) body.endYear = endYearNum;

  return body;
}
