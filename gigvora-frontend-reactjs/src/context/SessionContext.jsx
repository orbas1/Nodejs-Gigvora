import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient.js';

const STORAGE_KEY = 'gigvora:web:session';

const defaultValue = {
  session: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateSession: () => {},
};

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set();
  value.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return;
    }
    unique.add(trimmed);
  });
  return Array.from(unique);
}

function normalizeSessionValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const normalizedRoles = normalizeStringList(value.roles ?? value.memberships);
  const normalizedMemberships = normalizeStringList(value.memberships);
  const normalizedPermissions = normalizeStringList(value.permissions);
  const normalizedCapabilities = normalizeStringList(value.capabilities);

  const session = {
    ...value,
    roles: normalizedRoles,
    permissions: normalizedPermissions,
    capabilities: normalizedCapabilities,
    memberships: normalizedMemberships,
  };

  if (typeof session.primaryDashboard === 'string') {
    const trimmed = session.primaryDashboard.trim();
    if (trimmed && !session.memberships.includes(trimmed)) {
      session.memberships = [trimmed, ...session.memberships];
    }
  }

  if (!session.memberships.length) {
    session.memberships = normalizedRoles.length ? normalizedRoles : ['user'];
  } else {
    session.memberships = normalizeStringList(session.memberships);
  }

  session.isAuthenticated = Boolean(session.isAuthenticated);

  return session;
}

const SessionContext = createContext(defaultValue);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return normalizeSessionValue(parsed);
    }
    return null;
  } catch (error) {
    console.warn('Unable to read stored session', error);
    return null;
  }
}

function persistSession(value) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to persist session', error);
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  useEffect(() => {
    setSession((previous) => previous ?? readStoredSession());
  }, []);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    if (!session?.accessToken) {
      apiClient.clearAccessToken();
    } else {
      apiClient.storeAccessToken(session.accessToken);
    }
  }, [session?.accessToken]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.isAuthenticated),
      login: (payload = {}) => {
        const nextSession =
          normalizeSessionValue({
            ...payload,
            isAuthenticated: true,
          }) ?? { isAuthenticated: true };
        const nextSession = {
          isAuthenticated: true,
          ...payload,
        };
        if (payload.accessToken) {
          apiClient.storeAccessToken(payload.accessToken);
        }
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        setSession(null);
        apiClient.clearAccessToken();
      },
      updateSession: (updates = {}) => {
        setSession((previous) => {
          const base = previous ?? { isAuthenticated: true };
          return normalizeSessionValue({ ...base, ...updates }) ?? base;
          if (!previous) {
            if (updates.accessToken) {
              apiClient.storeAccessToken(updates.accessToken);
            } else if (updates.accessToken === null) {
              apiClient.clearAccessToken();
            }
            return { isAuthenticated: true, ...updates };
          }
          if (updates.accessToken) {
            apiClient.storeAccessToken(updates.accessToken);
          } else if (updates.accessToken === null) {
            apiClient.clearAccessToken();
          }
          return { ...previous, ...updates };
        });
      },
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export default SessionContext;
