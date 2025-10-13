import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient.js';

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
      if (parsed.tokens) {
        apiClient.setAuthTokens(parsed.tokens);
      }
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('Unable to read stored session', error);
    return null;
  }
}

function normalizeMemberships(value) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  const unique = [...new Set(source.filter(Boolean))];
  if (unique.length === 0) {
    unique.push('user');
  }
  return unique;
}

function normalizeSessionPayload(payload) {
  if (!payload) {
    return null;
  }

  if (payload.session) {
    return normalizeSessionPayload(payload.session);
  }

  const user = payload.user ?? payload;
  if (!user) {
    return null;
  }

  const firstName = user.firstName ?? payload.firstName;
  const lastName = user.lastName ?? payload.lastName;
  const email = user.email ?? payload.email ?? null;
  const name = user.name ?? [firstName, lastName].filter(Boolean).join(' ').trim() || email || 'Gigvora member';
  const memberships = normalizeMemberships(user.memberships ?? payload.memberships ?? user.userType ?? payload.userType);
  const primaryDashboard = user.primaryDashboard ?? payload.primaryDashboard ?? memberships[0];
  const tokens = payload.tokens ?? (payload.accessToken || payload.refreshToken
    ? {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expiresAt: payload.expiresAt ?? null,
      }
    : null);

  const session = {
    id: user.id ?? payload.id ?? null,
    email,
    firstName,
    lastName,
    name,
    userType: user.userType ?? payload.userType ?? memberships[0] ?? 'user',
    memberships,
    primaryDashboard,
    avatarSeed: user.avatarSeed ?? payload.avatarSeed ?? name,
    title: user.title ?? payload.title ?? null,
    location: user.location ?? payload.location ?? null,
    twoFactorEnabled: user.twoFactorEnabled ?? payload.twoFactorEnabled ?? true,
    twoFactorMethod: user.twoFactorMethod ?? payload.twoFactorMethod ?? 'email',
    lastLoginAt: user.lastLoginAt ?? payload.lastLoginAt ?? null,
    tokens,
    isAuthenticated: true,
  };

  return session;
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

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.isAuthenticated),
      login: (payload = {}) => {
        const normalized = normalizeSessionPayload(payload);
        if (!normalized) {
          return null;
        }
        setSession(normalized);
        if (normalized.tokens) {
          apiClient.setAuthTokens(normalized.tokens);
        } else {
          apiClient.clearAuthTokens();
        }
        return normalized;
      },
      logout: () => {
        apiClient.clearAuthTokens();
        setSession(null);
      },
      updateSession: (updates = {}) => {
        setSession((previous) => {
          const base = previous ?? { isAuthenticated: true };
          const merged = normalizeSessionPayload({ ...base, ...updates });
          if (merged?.tokens) {
            apiClient.setAuthTokens(merged.tokens);
          } else {
            apiClient.clearAuthTokens();
          }
          return merged;
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
