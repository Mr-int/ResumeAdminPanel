export const EVENT_TYPE_LABELS = {
  PAGE_VIEW: 'Посещение',
  REGISTRATION_STARTED: 'Начало регистрации',
  REGISTRATION_COMPLETED: 'Регистрация',
  ACCOUNT_APPROVED: 'Одобрение',
  ACCOUNT_REJECTED: 'Отказ',
  APPLICATION_SUBMITTED: 'Отклик',
  REQUEST_SUBMITTED: 'Заявка',
  CHAT_MESSAGE_SENT: 'Сообщение',
  CHAT_TU_CONFIRMED: 'Чат подтверждён',
  CHAT_TU_REJECTED: 'Чат отклонён',
  CHAT_SUCCESS: 'Успешный чат',
  EMAIL_SENT: 'Письмо',
  STUDENT_PROFILE_CHANGED: 'Изменение анкеты',
};

export const EVENT_FILTERS = [
  { id: '', label: 'Все' },
  { id: 'STUDENT_PROFILE_CHANGED', label: 'Изменение анкеты' },
  { id: 'ACCOUNT_APPROVED', label: 'Одобрение' },
  { id: 'ACCOUNT_REJECTED', label: 'Отказ' },
  { id: 'EMAIL_SENT', label: 'Письмо' },
  { id: 'PAGE_VIEW', label: 'Посещение' },
  { id: 'REGISTRATION_STARTED', label: 'Начало регистрации' },
  { id: 'REGISTRATION_COMPLETED', label: 'Регистрация' },
  { id: 'APPLICATION_SUBMITTED', label: 'Отклик' },
  { id: 'REQUEST_SUBMITTED', label: 'Заявка' },
  { id: 'CHAT_MESSAGE_SENT', label: 'Сообщение' },
  { id: 'CHAT_TU_CONFIRMED', label: 'Чат подтверждён' },
  { id: 'CHAT_TU_REJECTED', label: 'Чат отклонён' },
  { id: 'CHAT_SUCCESS', label: 'Успешный чат' },
];

const SECTION_LABELS = {
  photo: 'фото',
  portfolio: 'портфолио',
  experience: 'опыт',
  education: 'учёбу',
  card: 'анкету',
};

const ACTION_LABELS = {
  create: 'Добавил',
  update: 'Изменил',
  delete: 'Удалил',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultAnalyticsPeriod() {
  const to = new Date();
  to.setDate(to.getDate() + 1);
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: toInputValue(from), to: toInputValue(to) };
}

export function toApiDateTime(value) {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
}

export function eventTypeLabel(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType || 'Событие';
}

export function formatOccurredAt(value) {
  if (!value) return '—';
  return String(value).replace('T', ' ').slice(0, 16);
}

function formatPayloadValue(value) {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function eventSummary(event) {
  const payload = event?.payload ?? {};
  if (event?.eventType === 'STUDENT_PROFILE_CHANGED') {
    const action = ACTION_LABELS[payload.action] || 'Изменил';
    const section = SECTION_LABELS[payload.section] || 'анкету';
    const fields = Array.isArray(payload.fields) && payload.fields.length
      ? `: ${payload.fields.join(', ')}`
      : '';
    return `${action} ${section}${fields}`;
  }
  if (event?.eventType === 'ACCOUNT_APPROVED') return 'Аккаунт одобрен';
  if (event?.eventType === 'ACCOUNT_REJECTED') {
    return payload.reasonCode ? `Отказ: ${payload.reasonCode}` : 'Аккаунт отклонён';
  }
  if (event?.eventType === 'EMAIL_SENT') {
    const subject = payload.subject ? ` — ${payload.subject}` : '';
    const failed = payload.success === false ? ' (не отправлено)' : '';
    return `${payload.kind || 'Письмо'}${subject}${failed}`;
  }
  const keys = Object.keys(payload).slice(0, 3);
  if (!keys.length) return event?.path || 'Событие';
  return keys.map((key) => `${key}: ${formatPayloadValue(payload[key])}`).join(' · ');
}
