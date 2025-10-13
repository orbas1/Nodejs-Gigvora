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
      return parsed;
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
    const accessToken = session?.accessToken ?? null;
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    } else {
      apiClient.clearAccessToken();
    }

    const refreshToken = session?.refreshToken ?? null;
    if (refreshToken) {
      apiClient.setRefreshToken(refreshToken);
    } else {
      apiClient.clearRefreshToken();
    }
  }, [session?.accessToken, session?.refreshToken]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.isAuthenticated),
      login: (payload = {}) => {
        const { accessToken, refreshToken, ...rest } = payload;
        if (accessToken) {
          apiClient.setAccessToken(accessToken);
        }
        if (refreshToken) {
          apiClient.setRefreshToken(refreshToken);
        }

        const nextSession = {
          isAuthenticated: true,
          ...rest,
          ...(accessToken ? { accessToken } : {}),
          ...(refreshToken ? { refreshToken } : {}),
        };
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        apiClient.clearAccessToken();
        apiClient.clearRefreshToken();
        setSession(null);
      },
      updateSession: (updates = {}) => {
        setSession((previous) => {
          const next = previous ? { ...previous } : { isAuthenticated: true };

          if (Object.prototype.hasOwnProperty.call(updates, 'accessToken')) {
            const nextAccess = updates.accessToken;
            if (nextAccess) {
              apiClient.setAccessToken(nextAccess);
            } else {
              apiClient.clearAccessToken();
            }
            next.accessToken = nextAccess;
          }

          if (Object.prototype.hasOwnProperty.call(updates, 'refreshToken')) {
            const nextRefresh = updates.refreshToken;
            if (nextRefresh) {
              apiClient.setRefreshToken(nextRefresh);
            } else {
              apiClient.clearRefreshToken();
            }
            next.refreshToken = nextRefresh;
          }

          return { ...next, ...updates };
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
