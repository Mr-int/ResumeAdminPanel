import { apiFetch } from './client.js';

/** Сессия основного сайта (STUDENT / RECRUITER). */
export function siteLogin(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    json: { username, password },
  });
}

export function siteRefresh() {
  return apiFetch('/auth/refresh', { method: 'POST' });
}

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

function sessionFromMe(data, realm) {
  const role = data?.role;
  if (realm === 'admin' && role !== 'ADMIN') {
    throw new Error('Сессия админ-панели недоступна для этой роли.');
  }
  if (realm === 'site' && role !== 'RECRUITER') {
    throw new Error('Вход работодателя недоступен для этой роли.');
  }
  return { role, realm, user: data };
}

/** Восстановление сессии при загрузке SPA. */
export async function restoreSession() {
  try {
    await adminRefresh();
    const { data } = await getAdminMe();
    if (data?.role === 'ADMIN') {
      return sessionFromMe(data, 'admin');
    }
  } catch (e) {
    if (e.status === 401) {
      // нет админ-cookie — пробуем сессию сайта
    } else if (e.status !== 403) {
      throw e;
    }
  }

  try {
    await siteRefresh();
    const { data } = await getSiteMe();
    if (data?.role === 'RECRUITER') {
      return sessionFromMe(data, 'site');
    }
    if (data?.role) {
      throw new Error(
        `Роль «${data.role}» не поддерживается в этой панели. Нужен ADMIN или RECRUITER.`
      );
    }
  } catch (e) {
    if (e.status === 401) throw e;
    if (e.message?.includes('не поддерживается')) throw e;
    throw e;
  }

  throw new Error('Сессия не найдена');
}

/** Логин: сначала админ, при 403 — работодатель через /auth/login. */
export async function loginAndEstablishSession(username, password) {
  try {
    await adminLogin(username, password);
    try {
      await adminRefresh();
    } catch {
      throw new Error(
        'Вход выполнен, но админ-сессия не сохранилась. Проверьте прокси /api и cookie.'
      );
    }
    const { data } = await getAdminMe();
    return sessionFromMe(data, 'admin');
  } catch (adminErr) {
    if (adminErr.status === 401) {
      throw new Error('Неверный логин или пароль');
    }
    if (adminErr.status !== 403) {
      throw adminErr;
    }
  }

  try {
    await siteLogin(username, password);
    try {
      await siteRefresh();
    } catch {
      throw new Error(
        'Вход выполнен, но сессия не сохранилась. Проверьте прокси /api и cookie.'
      );
    }
    const { data } = await getSiteMe();
    return sessionFromMe(data, 'site');
  } catch (siteErr) {
    if (siteErr.status === 401) {
      throw new Error('Неверный логин или пароль');
    }
    if (siteErr.status === 403) {
      throw new Error(
        'Нет доступа. Администраторы входят здесь; работодатели — после одобрения аккаунта.'
      );
    }
    throw siteErr;
  }
}

export async function logoutSession(realm) {
  if (realm === 'admin') {
    await adminLogout();
    return;
  }
  await siteLogout();
}
