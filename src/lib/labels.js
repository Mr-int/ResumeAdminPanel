/** Подписи ролей для UI */
export const ROLE_LABELS = {
  ADMIN: 'Администратор',
  STUDENT: 'Студент',
  RECRUITER: 'Рекрутер',
};

export const REQUEST_STATUS_LABELS = {
  CREATION: 'Создание',
  SYNC: 'Синхронизация',
  WAITING: 'Ожидание ответа',
  EXPECTATION: 'Ожидание',
  STUDENT_CONFIRMED: 'Студент принял',
  RECRUITER_CONFIRMED: 'Рекрутер подтвердил',
  SUCCESS: 'Успешно',
  REFUSAL: 'Отклонено',
};

export const VACANCY_STATUS_LABELS = {
  PENDING_REVIEW: 'На модерации',
  PUBLISHED: 'Опубликована',
  REJECTED: 'Отклонена',
  DRAFT: 'Черновик',
  CLOSED: 'Закрыта',
  ARCHIVED: 'В архиве',
};

export const REGISTRATION_STATUS_LABELS = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

export const COURSE_LABELS = {
  NEW: 'Новый (модерация)',
  FIRST: '1 курс',
  SECOND: '2 курс',
  THIRD: '3 курс',
  FOURTH: '4 курс',
  FIFTH: '5 курс',
  GRADUATE: 'Выпускник',
};

export const BUSyness_LABELS = {
  FREE: 'Свободен',
  PART_TIME: 'Частичная занятость',
  FULL_TIME: 'Полная занятость',
};

export function labelOf(map, key, fallback = '—') {
  if (key == null || key === '') return fallback;
  return map[key] ?? key;
}
