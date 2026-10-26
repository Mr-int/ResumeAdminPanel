/** Коды и формулировки совпадают с AccountRejectionReason на бэкенде. */
export const ACCOUNT_REJECTION_REASONS = [
  { code: 'INCOMPLETE_PROFILE', label: 'Анкета заполнена недостаточно' },
  { code: 'INVALID_DATA', label: 'Данные или контакты выглядят некорректно' },
  { code: 'NOT_ELIGIBLE', label: 'Аккаунт не подходит под правила площадки' },
  { code: 'DUPLICATE', label: 'Такой аккаунт уже есть' },
  { code: 'OTHER', label: 'Другая причина' },
];

export const OTHER_REJECTION_REASON = 'OTHER';

export function accountRejectBody(reasonCode, comment) {
  const code = String(reasonCode || '').trim();
  const text = String(comment || '').trim();
  if (!code) {
    return { error: 'Укажите причину отказа' };
  }
  if (code === OTHER_REJECTION_REASON && !text) {
    return { error: 'Укажите комментарий' };
  }
  if (text.length > 2000) {
    return { error: 'Комментарий длиннее 2000 символов' };
  }
  const body = { reasonCode: code };
  if (text) body.comment = text;
  return { body };
}
