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
