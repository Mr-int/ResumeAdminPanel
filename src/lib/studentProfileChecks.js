const hasText = (value) => String(value ?? '').trim().length > 0;

const bioLongEnough = (bio) => String(bio ?? '').trim().length >= 30;

const skillCount = (student) => (Array.isArray(student?.skills) ? student.skills.length : 0);

function sharedChecks(student, emailVerified) {
  return [
    { id: 'photo', label: 'Фото', ok: hasText(student?.imagePath) },
    { id: 'bio', label: 'Описание от 30 символов', ok: bioLongEnough(student?.bio) },
    { id: 'firstName', label: 'Имя', ok: hasText(student?.firstName) },
    { id: 'lastName', label: 'Фамилия', ok: hasText(student?.lastName) },
    { id: 'speciality', label: 'Специальность', ok: hasText(student?.speciality) || student?.specialityId != null },
    { id: 'course', label: 'Курс', ok: hasText(student?.course) },
    { id: 'skills', label: 'Не меньше 5 навыков', ok: skillCount(student) >= 5 },
    { id: 'busyness', label: 'Тип занятости', ok: hasText(student?.busyness) },
    { id: 'city', label: 'Город', ok: hasText(student?.city) },
    { id: 'email', label: 'Почта подтверждена', ok: emailVerified === true },
  ];
}

function withRecords(base, records) {
  return [base[0], ...records, ...base.slice(1)];
}

/** Поля строки списка: анкета и три флага из очереди одобрений. */
export function listProfileChecks(student, emailVerified, flags) {
  const records = [
    { id: 'portfolio', label: 'Портфолио', ok: flags?.hasPortfolio === true },
    { id: 'experience', label: 'Опыт', ok: flags?.hasExperience === true },
    { id: 'education', label: 'Образование', ok: flags?.hasEducation === true },
  ];
  return withRecords(sharedChecks(student, emailVerified), records);
}

/** Полный набор для одобрения: поля списка плюс портфолио, опыт и образование. */
export function detailProfileChecks(student, emailVerified, extra) {
  const base = sharedChecks(student, emailVerified);
  const records = [
    { id: 'portfolio', label: 'Портфолио', ok: (extra?.portfolios?.length ?? 0) > 0 },
    { id: 'experience', label: 'Опыт', ok: (extra?.experiences?.length ?? 0) > 0 },
    { id: 'education', label: 'Образование', ok: (extra?.institutions?.length ?? 0) > 0 },
  ];
  return withRecords(base, records);
}

export function checksFilled(checks) {
  const done = checks.filter((item) => item.ok).length;
  return { done, total: checks.length, complete: done === checks.length && checks.length > 0 };
}
