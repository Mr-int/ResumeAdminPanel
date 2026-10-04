/** @type {(() => void) | null} */
let handler = null;
let redirecting = false;

export function setUnauthorizedHandler(fn) {
  handler = fn;
}

export function clearUnauthorizedHandler() {
  handler = null;
}

export function resetUnauthorizedRedirect() {
  redirecting = false;
}

/**
 * Сессия истекла или нет прав — один раз уводим на /login.
 */
export function notifyUnauthorized() {
  if (redirecting) return;
  redirecting = true;
  if (handler) {
    handler();
    return;
  }
  const loginPath = `${import.meta.env.BASE_URL}login`;
  if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
    window.location.replace(loginPath);
  }
}
