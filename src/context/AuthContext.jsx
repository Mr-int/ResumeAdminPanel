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
import { resetRecruiterDirectory } from '../lib/recruiterDirectory.js';
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
  const [realm, setRealm] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthenticated(false);
      setRole(null);
      setRealm(null);
      setUser(null);
      navigate('/login', { replace: true });
    });
    return () => clearUnauthorizedHandler();
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authApi.restoreSession();
        if (!cancelled) {
          resetUnauthorizedRedirect();
          setRole(session.role);
          setRealm(session.realm);
          setUser(session.user);
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setRealm(null);
          setUser(null);
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
    const session = await authApi.loginAndEstablishSession(username, password);
    resetUnauthorizedRedirect();
    setRole(session.role);
    setRealm(session.realm);
    setUser(session.user);
    setAuthenticated(true);
    return session.role;
  }, []);

  const logout = useCallback(async () => {
    const currentRealm = realm;
    try {
      if (currentRealm) {
        await authApi.logoutSession(currentRealm);
      }
    } finally {
      resetRecruiterDirectory();
      resetUnauthorizedRedirect();
      setRole(null);
      setRealm(null);
      setUser(null);
      setAuthenticated(false);
    }
  }, [realm]);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      role,
      realm,
      user,
      isRecruiter: role === 'RECRUITER',
      isAdmin: role === 'ADMIN',
      login,
      logout,
    }),
    [ready, authenticated, role, realm, user, login, logout]
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
