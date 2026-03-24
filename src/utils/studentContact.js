/** Первое непустое строковое значение из списка ключей объекта. */
function pickStr(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Читает контакты из ответа GET /student/{id} (учитываем разные имена полей в API).
 */
export function contactFieldsFromStudentDto(data) {
  if (!data || typeof data !== 'object') {
    return { email: '', phoneNumber: '', telegramUsername: '' };
  }
  const nested = [data, data.profile, data.user, data.student].filter(
    (x) => x && typeof x === 'object'
  );
  let email = '';
  let phone = '';
  let tg = '';
  for (const o of nested) {
    if (!email) email = pickStr(o, ['email', 'mail', 'eMail', 'e_mail']);
    if (!phone) {
      phone = pickStr(o, [
        'phoneNumber',
        'phone',
        'mobilePhone',
        'mobile',
        'telephone',
        'phone_number',
      ]);
    }
    if (!tg) {
      tg = pickStr(o, [
        'telegramUsername',
        'telegram',
        'telegramNick',
        'tgUsername',
        'telegram_username',
      ]);
    }
  }
  return { email, phoneNumber: phone, telegramUsername: tg };
}

/**
 * Тело для PUT/POST студента: дублируем частые алиасы, чтобы бэкенд принял поле.
 */
export function contactFieldsToApiPayload(form) {
  const email = form.email?.trim() ?? '';
  const phone = form.phoneNumber?.trim() ?? '';
  const telegram = form.telegramUsername?.trim() ?? '';
  const out = {};
  if (email) {
    out.email = email;
  }
  if (phone) {
    out.phoneNumber = phone;
    out.phone = phone;
  }
  if (telegram) {
    out.telegramUsername = telegram;
    out.telegram = telegram;
  }
  return out;
}
