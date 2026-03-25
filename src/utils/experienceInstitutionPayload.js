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
  if (!Number.isFinite(educationIdNum) || educationIdNum <= 0) {
    throw new Error('Выберите educationId (связь с Education)');
  }

  const startYearNum = Number(row?.startYear);
  const endYearNum = Number(row?.endYear);
  if (!Number.isFinite(startYearNum) || !Number.isFinite(endYearNum)) {
    throw new Error('Укажите годы обучения (startYear/endYear)');
  }

  const body = {
    educationId: educationIdNum,
    studentId: normalizedStudentId,
    institution: {
      id: 0,
      startYear: startYearNum,
      endYear: endYearNum,
    },
  };
  return body;
}
