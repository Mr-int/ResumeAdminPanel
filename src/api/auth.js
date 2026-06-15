import { apiFetch } from './client.js';

export function login(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    json: { username, password },
  });
}

export function refresh() {
  return apiFetch('/auth/refresh', { method: 'POST' });
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function getRecruiterMe() {
  return apiFetch('/recruiter/me', { method: 'GET' });
}

async function probeAdminAccess() {
  const probes = [
    () => apiFetch('/admin/projects', { method: 'GET' }),
    () =>
      apiFetch('/user/filter?page=0&size=1', {
        method: 'POST',
        json: {},
      }),
  ];

  for (const probe of probes) {
    try {
      await probe();
      return true;
    } catch (e) {
      if (e.status === 401) throw e;
    }
  }
  return false;
}

async function probeRecruiterAccess() {
  try {
    await getRecruiterMe();
    return true;
  } catch (e) {
    if (e.status === 401) throw e;
    // Профиль работодателя ещё не оформлен — роль всё равно RECRUITER.
    if (e.status === 404) return true;
  }
  return false;
}

/**
 * ADMIN — доступ к /admin/* или /user/filter.
 * RECRUITER — профиль работодателя или /vacancies/mine.
 */
export async function detectSessionRole() {
  const [adminOk, recruiterOk] = await Promise.all([
    probeAdminAccess(),
    probeRecruiterAccess(),
  ]);

  if (adminOk) return 'ADMIN';
  if (recruiterOk) return 'RECRUITER';

  throw new Error(
    'Нет доступа к панели. Учётная запись должна быть администратором или работодателем с оформленным профилем.'
  );
}

/** Логин + проверка, что cookie-сессия реально работает. */
export async function loginAndEstablishSession(username, password) {
  await login(username, password);
  try {
    await refresh();
  } catch {
    throw new Error(
      'Вход выполнен, но сессия не сохранилась. Обновите страницу или обратитесь к администратору (прокси /api и cookie).'
    );
  }
  return detectSessionRole();
}
