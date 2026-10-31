import { apiFetch } from './client.js';

export function siteLogout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function getSiteMe() {
  return apiFetch('/auth/me', { method: 'GET' });
}

/** Сессия админ-панели (только ADMIN). */
export function adminLogin(username, password) {
  return apiFetch('/auth/admin/login', {
    method: 'POST',
    json: { username, password },
  });
}

export function adminRefresh() {
  return apiFetch('/auth/admin/refresh', { method: 'POST' });
}

export function adminLogout() {
  return apiFetch('/auth/admin/logout', { method: 'POST' });
}

export function getAdminMe() {
  return apiFetch('/auth/admin/me', { method: 'GET' });
}

function sessionFromAdminMe(data) {
  if (data?.role !== 'ADMIN') {
    throw new Error('Сессия админ-панели недоступна для этой роли.');
  }
  return { role: data.role, realm: 'admin', user: data };
}

/** Восстановление сессии при загрузке SPA. Админ — только cookie /auth/admin. */
export async function restoreSession() {
  try {
    await adminRefresh();
    const { data } = await getAdminMe();
    if (data?.role === 'ADMIN') {
      return sessionFromAdminMe(data);
    }
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) {
      throw e;
    }
  }

  try {
    const { data } = await getSiteMe();
    if (data?.role === 'STUDENT' || data?.role === 'RECRUITER') {
      return { redirectToSite: true };
    }
  } catch (e) {
    if (e.status === 401) {
      throw e;
    }
    throw e;
  }

  throw new Error('Сессия не найдена');
}

/** Логин только администратора. */
export async function loginAndEstablishSession(username, password) {
  try {
    await adminLogin(username, password);
  } catch (adminErr) {
    if (adminErr.status === 401) {
      throw new Error('Неверный логин или пароль');
    }
    if (adminErr.status === 403) {
      throw new Error('Нет доступа. Вход только для администратора.');
    }
    throw adminErr;
  }

  try {
    await adminRefresh();
  } catch {
    throw new Error(
      'Вход выполнен, но админ-сессия не сохранилась. Проверьте прокси /api и cookie.'
    );
  }
  const { data } = await getAdminMe();
  return sessionFromAdminMe(data);
}

export async function logoutSession(realm) {
  if (realm === 'admin') {
    await adminLogout();
    return;
  }
  await siteLogout();
}
