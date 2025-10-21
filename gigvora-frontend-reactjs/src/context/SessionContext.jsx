import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient.js';

const STORAGE_KEY = 'gigvora:web:session';

const defaultValue = {
  session: null,
  isAuthenticated: false,
  roleKeys: [],
  permissionKeys: [],
  hasRole: () => false,
  hasPermission: () => false,
  login: () => {},
  logout: () => {},
  updateSession: () => {},
};

function normaliseKey(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object' && 'key' in value) {
    return normaliseKey(value.key);
  }

  const stringified = typeof value === 'string' ? value : String(value);
  const trimmed = stringified.trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/[^a-z0-9]+/g, '_');
}

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

function normalizeMemberships(value) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  const normalized = source
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  if (!normalized.length) {
    return ['user'];
  }
  return Array.from(new Set(normalized));
}

function extractProfileMeta(subject) {
  const profile = subject?.Profile ?? subject?.profile ?? subject?.userProfile ?? null;
  return {
    avatarUrl: profile?.avatarUrl ?? null,
    avatarSeed: profile?.avatarSeed ?? null,
  };
}

function normalizeSessionValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const roles = normalizeStringList(value.roles ?? value.memberships ?? []);
  const memberships = normalizeMemberships(value.memberships ?? roles);
  const permissions = normalizeStringList(value.permissions ?? []);
  const capabilities = normalizeStringList(value.capabilities ?? []);

  const roleCandidates = [];
  const permissionCandidates = [];

  const pushValues = (target, candidate) => {
    if (!candidate) {
      return;
    }
    if (Array.isArray(candidate) || candidate instanceof Set) {
      candidate.forEach((entry) => {
        if (typeof entry === 'string' && entry.trim()) {
          target.push(entry);
        }
      });
      return;
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      target.push(candidate);
    }
  };

  pushValues(roleCandidates, memberships);
  pushValues(roleCandidates, roles);
  pushValues(roleCandidates, value.primaryDashboard);
  pushValues(roleCandidates, value.accountTypes);
  pushValues(roleCandidates, value.activeMembership);
  pushValues(roleCandidates, value.userType);
  pushValues(roleCandidates, value.roleKeys);

  pushValues(permissionCandidates, permissions);
  pushValues(permissionCandidates, capabilities);
  pushValues(permissionCandidates, value.grants);
  pushValues(permissionCandidates, value.scopes);
  pushValues(permissionCandidates, value.features);
  pushValues(permissionCandidates, value.permissionKeys);

  let primaryDashboard = typeof value.primaryDashboard === 'string' ? value.primaryDashboard.trim() : '';
  if (!primaryDashboard) {
    primaryDashboard = memberships[0] ?? 'user';
  }

  const email = value.email ?? null;
  const derivedName = [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
  const name = value.name ?? (derivedName || email || 'Gigvora member');

  const profileMeta = extractProfileMeta(value);
  const tokens = value.tokens ??
    (value.accessToken || value.refreshToken
      ? {
          accessToken: value.accessToken ?? null,
          refreshToken: value.refreshToken ?? null,
          expiresAt: value.tokenExpiresAt ?? value.expiresAt ?? null,
        }
      : null);

  const normalized = {
    ...value,
    name,
    email,
    roles,
    permissions,
    capabilities,
    memberships,
    roleKeys: Array.from(new Set(roleCandidates.map(normaliseKey).filter(Boolean))),
    permissionKeys: Array.from(new Set(permissionCandidates.map(normaliseKey).filter(Boolean))),
    primaryDashboard,
    avatarUrl: value.avatarUrl ?? profileMeta.avatarUrl ?? null,
    avatarSeed: value.avatarSeed ?? profileMeta.avatarSeed ?? name ?? email ?? 'Gigvora member',
    tokens,
    accessToken: tokens?.accessToken ?? value.accessToken ?? null,
    refreshToken: tokens?.refreshToken ?? value.refreshToken ?? null,
    tokenExpiresAt: tokens?.expiresAt ?? value.tokenExpiresAt ?? value.expiresAt ?? null,
    isAuthenticated: value.isAuthenticated !== false,
  };

  if (normalized.primaryDashboard && !normalized.memberships.includes(normalized.primaryDashboard)) {
    normalized.memberships = [normalized.primaryDashboard, ...normalized.memberships];
  }

  return normalized;
}

function normalizeSessionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.session) {
    return normalizeSessionPayload(payload.session);
  }

  const user = payload.user ?? payload;
  const firstName = user.firstName ?? payload.firstName ?? null;
  const lastName = user.lastName ?? payload.lastName ?? null;
  const email = user.email ?? payload.email ?? null;
  const displayName = user.name ?? payload.name ?? [firstName, lastName].filter(Boolean).join(' ').trim();
  const memberships = normalizeMemberships(user.memberships ?? payload.memberships ?? user.userType ?? payload.userType);
  const primaryDashboard = user.primaryDashboard ?? payload.primaryDashboard ?? memberships[0];
  const profileMeta = extractProfileMeta(user) ?? extractProfileMeta(payload);

  const tokens = payload.tokens ??
    user.tokens ??
    (payload.accessToken || payload.refreshToken || user.accessToken || user.refreshToken
      ? {
          accessToken: payload.accessToken ?? user.accessToken ?? null,
          refreshToken: payload.refreshToken ?? user.refreshToken ?? null,
          expiresAt: payload.expiresAt ?? payload.tokenExpiresAt ?? user.expiresAt ?? user.tokenExpiresAt ?? null,
        }
      : null);

  const session = {
    id: user.id ?? payload.id ?? null,
    email,
    firstName,
    lastName,
    name: displayName || email || 'Gigvora member',
    userType: user.userType ?? payload.userType ?? memberships[0] ?? 'user',
    memberships,
    primaryDashboard,
    avatarUrl: user.avatarUrl ?? profileMeta.avatarUrl ?? payload.avatarUrl ?? null,
    avatarSeed:
      user.avatarSeed ?? profileMeta.avatarSeed ?? payload.avatarSeed ?? displayName ?? email ?? 'Gigvora member',
    title: user.title ?? payload.title ?? null,
    location: user.location ?? payload.location ?? null,
    roles: normalizeStringList(payload.roles ?? user.roles ?? []),
    permissions: normalizeStringList(payload.permissions ?? user.permissions ?? []),
    capabilities: normalizeStringList(payload.capabilities ?? user.capabilities ?? []),
    grants: normalizeStringList(payload.grants ?? user.grants ?? []),
    scopes: normalizeStringList(payload.scopes ?? user.scopes ?? []),
    features: normalizeStringList(payload.features ?? user.features ?? []),
    tokens,
    accessToken: tokens?.accessToken ?? payload.accessToken ?? user.accessToken ?? null,
    refreshToken: tokens?.refreshToken ?? payload.refreshToken ?? user.refreshToken ?? null,
    tokenExpiresAt:
      tokens?.expiresAt ?? payload.expiresAt ?? payload.tokenExpiresAt ?? user.expiresAt ?? user.tokenExpiresAt ?? null,
    isAuthenticated: true,
  };

  return normalizeSessionValue(session);
}

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
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.tokens) {
      apiClient.setAuthTokens(parsed.tokens);
    } else if (parsed.accessToken || parsed.refreshToken) {
      apiClient.setAuthTokens({
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null,
        expiresAt: parsed.tokenExpiresAt ?? null,
      });
    }

    return normalizeSessionValue(parsed);
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

const SessionContext = createContext(defaultValue);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    const tokens = session?.tokens ??
      (session?.accessToken || session?.refreshToken || session?.tokenExpiresAt
        ? {
            accessToken: session?.accessToken ?? null,
            refreshToken: session?.refreshToken ?? null,
            expiresAt: session?.tokenExpiresAt ?? null,
          }
        : null);

    if (tokens && (tokens.accessToken || tokens.refreshToken || tokens.expiresAt)) {
      apiClient.setAuthTokens(tokens);
    } else {
      apiClient.clearAuthTokens();
    }
  }, [session?.tokens, session?.accessToken, session?.refreshToken, session?.tokenExpiresAt]);

  const roleKeys = useMemo(() => session?.roleKeys ?? [], [session?.roleKeys]);
  const permissionKeys = useMemo(() => session?.permissionKeys ?? [], [session?.permissionKeys]);

  const roleKeySet = useMemo(() => new Set(roleKeys.map(normaliseKey).filter(Boolean)), [roleKeys]);
  const permissionKeySet = useMemo(
    () => new Set(permissionKeys.map(normaliseKey).filter(Boolean)),
    [permissionKeys],
  );

  const hasRole = useCallback((role) => roleKeySet.has(normaliseKey(role)), [roleKeySet]);

  const hasPermission = useCallback(
    (permission) => permissionKeySet.has(normaliseKey(permission)),
    [permissionKeySet],
  );

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.isAuthenticated),
      roleKeys,
      permissionKeys,
      roles: session?.roles ?? [],
      permissions: session?.permissions ?? [],
      hasRole,
      hasPermission,
      login: (payload = {}) => {
        const normalized = normalizeSessionPayload(payload);
        if (!normalized) {
          return null;
        }
        setSession(normalized);
        return normalized;
      },
      logout: () => {
        apiClient.clearAuthTokens();
        apiClient.clearAccessToken();
        apiClient.clearRefreshToken();
        setSession(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('gigvora:web:auth:accessToken');
        }
      },
      updateSession: (updates = {}) => {
        setSession((previous) => {
          const base = previous ?? { isAuthenticated: true };
          const tokens =
            updates.tokens ??
            base.tokens ??
            (updates.accessToken || updates.refreshToken || updates.tokenExpiresAt
              ? {
                  accessToken: updates.accessToken ?? base.accessToken ?? null,
                  refreshToken: updates.refreshToken ?? base.refreshToken ?? null,
                  expiresAt: updates.tokenExpiresAt ?? base.tokenExpiresAt ?? null,
                }
              : null);

          return normalizeSessionValue({
            ...base,
            ...updates,
            tokens,
            accessToken: tokens?.accessToken ?? updates.accessToken ?? base.accessToken ?? null,
            refreshToken: tokens?.refreshToken ?? updates.refreshToken ?? base.refreshToken ?? null,
            tokenExpiresAt: tokens?.expiresAt ?? updates.tokenExpiresAt ?? base.tokenExpiresAt ?? null,
          });
        });
      },
    }),
    [hasPermission, hasRole, permissionKeys, roleKeys, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export default SessionContext;
