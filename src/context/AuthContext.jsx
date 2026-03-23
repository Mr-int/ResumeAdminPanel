import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await authApi.refresh();
        if (!cancelled) setAuthenticated(true);
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
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
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
