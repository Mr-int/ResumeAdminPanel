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
  const [role, setRole] = useState(null);

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
        const sessionRole = await authApi.detectSessionRole();
        if (!cancelled) {
          resetUnauthorizedRedirect();
          setRole(sessionRole);
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setAuthenticated(false);
        }
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
    const sessionRole = await authApi.detectSessionRole();
    resetUnauthorizedRedirect();
    setRole(sessionRole);
    setAuthenticated(true);
    return sessionRole;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      resetUnauthorizedRedirect();
      setRole(null);
      setAuthenticated(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      role,
      isRecruiter: role === 'RECRUITER',
      isAdmin: role === 'ADMIN',
      login,
      logout,
    }),
    [ready, authenticated, role, login, logout]
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
