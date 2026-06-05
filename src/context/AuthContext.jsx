import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth.js';
import {
  clearUnauthorizedHandler,
  resetUnauthorizedRedirect,
  setUnauthorizedHandler,
} from '../lib/unauthorized.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthenticated(false);
      navigate('/login', { replace: true });
    });
    return () => clearUnauthorizedHandler();
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authApi.refresh();
        if (!cancelled) {
          resetUnauthorizedRedirect();
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    await authApi.login(username, password);
    resetUnauthorizedRedirect();
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      resetUnauthorizedRedirect();
      setAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      login,
      logout,
    }),
    [ready, authenticated, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
