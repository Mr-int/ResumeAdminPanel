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
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}
