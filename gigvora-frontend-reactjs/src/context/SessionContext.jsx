import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../services/apiClient.js';
import { fetchCurrentSession, refreshSession as refreshAuthSession } from '../services/auth.js';

const STORAGE_KEY = 'gigvora:web:session';
const BROADCAST_CHANNEL = 'gigvora:session';

const defaultValue = {
  session: null,
  isAuthenticated: false,
  roleKeys: [],
  permissionKeys: [],
  featureFlags: {},
  activeFeatureFlags: [],
  featureFlagMetadata: {},
  hasRole: () => false,
  hasPermission: () => false,
  isFeatureEnabled: () => false,
  getFeatureFlag: () => null,
  login: () => null,
  logout: () => {},
  updateSession: () => {},
  refreshSession: async () => null,
  reloadSession: async () => null,
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

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractProfileMeta(subject) {
  const profile = subject?.Profile ?? subject?.profile ?? subject?.userProfile ?? null;
  return {
    avatarUrl: profile?.avatarUrl ?? null,
    avatarSeed: profile?.avatarSeed ?? null,
  };
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeFeatureFlagEntry(raw) {
  if (raw instanceof Map) {
    return normalizeFeatureFlagEntry(Object.fromEntries(raw));
  }

  if (raw == null) {
    return {
      enabled: false,
      variant: null,
      reason: null,
      expiresAt: null,
      metadata: {},
      rolloutPercentage: null,
      segments: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  if (typeof raw === 'boolean') {
    return {
      enabled: raw,
      variant: null,
      reason: null,
      expiresAt: null,
      metadata: {},
      rolloutPercentage: null,
      segments: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  if (typeof raw === 'string') {
    const variant = raw.trim();
    return {
      enabled: true,
      variant: variant || null,
      reason: null,
      expiresAt: null,
      metadata: {},
      rolloutPercentage: null,
      segments: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  if (typeof raw === 'number') {
    return {
      enabled: raw > 0,
      variant: null,
      reason: null,
      expiresAt: null,
      metadata: {},
      rolloutPercentage: Number.isFinite(raw) ? raw : null,
      segments: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  if (typeof raw !== 'object') {
    return {
      enabled: Boolean(raw),
      variant: null,
      reason: null,
      expiresAt: null,
      metadata: {},
      rolloutPercentage: null,
      segments: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  const metadata = {};
  if (raw.metadata && typeof raw.metadata === 'object') {
    Object.entries(raw.metadata).forEach(([key, value]) => {
      metadata[key] = value;
    });
  }
  if (raw.description) {
    metadata.description = `${raw.description}`;
  }
  if (raw.variantMetadata && typeof raw.variantMetadata === 'object') {
    metadata.variantMetadata = raw.variantMetadata;
  }
  if (raw.conditions) {
    metadata.conditions = raw.conditions;
  }

  const segments = [];
  const audienceEntries = Array.isArray(raw.audiences)
    ? raw.audiences
    : Array.isArray(raw.assignments)
      ? raw.assignments
      : [];
  audienceEntries.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const type = entry.audienceType ?? entry.type ?? null;
    const value = entry.audienceValue ?? entry.value ?? null;
    if (!type && !value) {
      return;
    }
    segments.push({
      type: type ? `${type}`.toLowerCase() : null,
      value: value != null ? `${value}` : null,
      rolloutPercentage:
        entry.rolloutPercentage != null && Number.isFinite(Number(entry.rolloutPercentage))
          ? Number(entry.rolloutPercentage)
          : null,
      expiresAt: toIsoDate(entry.expiresAt ?? entry.endsAt ?? null),
    });
  });

  if (raw.audienceType || raw.audienceValue) {
    segments.push({
      type: raw.audienceType ? `${raw.audienceType}`.toLowerCase() : null,
      value: raw.audienceValue != null ? `${raw.audienceValue}` : null,
      rolloutPercentage:
        raw.rolloutPercentage != null && Number.isFinite(Number(raw.rolloutPercentage))
          ? Number(raw.rolloutPercentage)
          : null,
      expiresAt: toIsoDate(raw.expiresAt ?? null),
    });
  }

  const normalized = {
    enabled:
      raw.enabled != null
        ? raw.enabled !== false
        : raw.status
          ? !['disabled', 'inactive', 'archived'].includes(`${raw.status}`.toLowerCase())
          : Boolean(raw.rolloutPercentage ? Number(raw.rolloutPercentage) > 0 : true),
    variant: typeof raw.variant === 'string' ? raw.variant.trim() || null : null,
    reason: typeof raw.reason === 'string' ? raw.reason.trim() || null : null,
    expiresAt: toIsoDate(raw.expiresAt ?? raw.expiry ?? raw.endsAt ?? null),
    metadata,
    rolloutPercentage:
      raw.rolloutPercentage != null && Number.isFinite(Number(raw.rolloutPercentage))
        ? Number(raw.rolloutPercentage)
        : raw.metadata?.rolloutPercentage != null && Number.isFinite(Number(raw.metadata.rolloutPercentage))
          ? Number(raw.metadata.rolloutPercentage)
          : null,
    segments,
    updatedAt: toIsoDate(raw.updatedAt ?? null),
    createdAt: toIsoDate(raw.createdAt ?? null),
  };

  return normalized;
}

function normalizeFeatureFlags(value) {
  const map = {};

  const assignEntry = (rawKey, rawValue) => {
    const key = normaliseKey(rawKey);
    if (!key) {
      return;
    }
    map[key] = normalizeFeatureFlagEntry(rawValue);
  };

  if (!value) {
    return { map, keys: [], enabledKeys: [] };
  }

  if (value instanceof Map) {
    value.forEach((entry, key) => assignEntry(key, entry));
    const keys = Object.keys(map);
    return { map, keys, enabledKeys: keys.filter((key) => map[key].enabled) };
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === 'string') {
        assignEntry(entry, true);
      } else if (entry && typeof entry === 'object') {
        assignEntry(entry.key ?? entry.flag ?? entry.name ?? entry.id ?? null, entry);
      }
    });
    const keys = Object.keys(map);
    return { map, keys, enabledKeys: keys.filter((key) => map[key].enabled) };
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([rawKey, rawValue]) => assignEntry(rawKey, rawValue));
    if (value.key && !map[normaliseKey(value.key)]) {
      assignEntry(value.key, value);
    }
    const keys = Object.keys(map);
    return { map, keys, enabledKeys: keys.filter((key) => map[key].enabled) };
  }

  if (typeof value === 'string') {
    assignEntry(value, true);
  }

  const keys = Object.keys(map);
  return { map, keys, enabledKeys: keys.filter((key) => map[key].enabled) };
}

function mergeFeatureFlagMaps(current, incoming) {
  if (incoming === null) {
    return {};
  }
  if (incoming === undefined) {
    return current ?? {};
  }
  const currentMap = normalizeFeatureFlags(current).map;
  const incomingMap = normalizeFeatureFlags(incoming).map;
  if (!Object.keys(incomingMap).length) {
    return currentMap;
  }
  return { ...currentMap, ...incomingMap };
}

function resolveStoredAuthTokens() {
  if (typeof apiClient?.getAuthTokens === 'function') {
    try {
      const tokens = apiClient.getAuthTokens();
      return {
        accessToken: tokens?.accessToken ?? null,
        refreshToken: tokens?.refreshToken ?? null,
        expiresAt: toIsoDate(tokens?.expiresAt ?? null),
      };
    } catch (error) {
      console.warn('Unable to read stored auth tokens', error);
    }
  }
  return { accessToken: null, refreshToken: null, expiresAt: null };
}

function extractTokensFromSource(source, { fallbackToStorage = false } = {}) {
  if (!source) {
    return fallbackToStorage ? resolveStoredAuthTokens() : { accessToken: null, refreshToken: null, expiresAt: null };
  }

  const tokens = typeof source.tokens === 'object' && source.tokens !== null ? source.tokens : {};
  const accessToken = tokens.accessToken ?? source.accessToken ?? null;
  const refreshToken = tokens.refreshToken ?? source.refreshToken ?? null;
  const expiresAt = tokens.expiresAt ?? source.tokenExpiresAt ?? source.expiresAt ?? null;

  if (!accessToken && !refreshToken && !expiresAt && fallbackToStorage) {
    return resolveStoredAuthTokens();
  }

  return {
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
    expiresAt: toIsoDate(expiresAt),
  };
}

function mergeTokenState(previous, updates) {
  const baseTokens = extractTokensFromSource(previous, { fallbackToStorage: true });
  const updateTokens = extractTokensFromSource(updates, { fallbackToStorage: false });
  return {
    accessToken: updateTokens.accessToken ?? baseTokens.accessToken ?? null,
    refreshToken: updateTokens.refreshToken ?? baseTokens.refreshToken ?? null,
    expiresAt: updateTokens.expiresAt ?? baseTokens.expiresAt ?? null,
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
  const rawTokens = value.tokens ??
    (value.accessToken || value.refreshToken || value.tokenExpiresAt || value.expiresAt
      ? {
          accessToken: value.accessToken ?? null,
          refreshToken: value.refreshToken ?? null,
          expiresAt: value.tokenExpiresAt ?? value.expiresAt ?? null,
        }
      : null);

  const normalizedTokens = rawTokens
    ? {
        accessToken: rawTokens.accessToken ?? null,
        refreshToken: rawTokens.refreshToken ?? null,
        expiresAt: toIsoDate(rawTokens.expiresAt ?? value.tokenExpiresAt ?? value.expiresAt ?? null),
      }
    : null;

  const { map: normalizedFeatureFlags, keys: featureFlagKeys, enabledKeys: activeFeatureFlags } = normalizeFeatureFlags(
    value.featureFlags ?? value.flagMap ?? value.flags ?? null,
  );

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
    tokens: normalizedTokens,
    accessToken: normalizedTokens?.accessToken ?? value.accessToken ?? null,
    refreshToken: normalizedTokens?.refreshToken ?? value.refreshToken ?? null,
    tokenExpiresAt:
      normalizedTokens?.expiresAt ?? toIsoDate(value.tokenExpiresAt ?? value.expiresAt ?? null),
    isAuthenticated: value.isAuthenticated !== false,
    featureFlags: normalizedFeatureFlags,
    featureFlagKeys,
    activeFeatureFlags,
    featureFlagsUpdatedAt: toIsoDate(
      value.featureFlagsUpdatedAt ?? value.featureFlagsFetchedAt ?? value.updatedAt ?? null,
    ),
    featureFlagsFetchedAt: toIsoDate(value.featureFlagsFetchedAt ?? value.fetchedAt ?? null),
    sessionFetchedAt: toIsoDate(value.sessionFetchedAt ?? value.fetchedAt ?? null),
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
    featureFlags: payload.featureFlags ?? user.featureFlags ?? payload.flags ?? null,
    featureFlagsUpdatedAt: payload.featureFlagsUpdatedAt ?? payload.featureFlagsFetchedAt ?? payload.updatedAt ?? null,
    featureFlagsFetchedAt: payload.featureFlagsFetchedAt ?? null,
    sessionFetchedAt: payload.fetchedAt ?? null,
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

  const broadcastRef = useRef(null);
  const suppressBroadcastRef = useRef(false);
  const refreshTimeoutRef = useRef(null);
  const refreshPromiseRef = useRef(null);
  const bootstrapPromiseRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const applySessionPayload = useCallback(
    (payload, { replace = false, broadcast = true } = {}) => {
      if (!broadcast) {
        suppressBroadcastRef.current = true;
      }

      let normalizedResult = null;
      setSession((previous) => {
        if (payload == null) {
          normalizedResult = null;
          return null;
        }

        if (isPlainObject(payload) && Object.keys(payload).length === 0) {
          normalizedResult = previous ?? null;
          return previous ?? null;
        }

        const base = replace ? null : previous;
        const mergedTokens = mergeTokenState(base, payload);
        const mergedFeatureFlags = mergeFeatureFlagMaps(base?.featureFlags ?? null, payload.featureFlags);
        const composed = normalizeSessionValue({
          ...(base ?? {}),
          ...(isPlainObject(payload) ? payload : {}),
          tokens: mergedTokens,
          accessToken: mergedTokens.accessToken ?? null,
          refreshToken: mergedTokens.refreshToken ?? null,
          tokenExpiresAt: mergedTokens.expiresAt ?? null,
          featureFlags: mergedFeatureFlags,
        });
        if (!composed) {
          const fallback = replace ? null : previous ?? null;
          normalizedResult = fallback;
          return fallback;
        }
        normalizedResult = composed;
        return composed;
      });
      return normalizedResult;
    },
    [],
  );

  const logout = useCallback(() => {
    clearRefreshTimer();
    apiClient.clearAuthTokens();
    apiClient.clearAccessToken();
    apiClient.clearRefreshToken();
    suppressBroadcastRef.current = false;
    setSession(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('gigvora:web:auth:accessToken');
    }
  }, [clearRefreshTimer]);

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return undefined;
    }
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastRef.current = channel;
    channel.onmessage = (event) => {
      if (!event?.data) {
        return;
      }
      if (event.data.type === 'session:update') {
        applySessionPayload(event.data.session, { replace: true, broadcast: false });
      } else if (event.data.type === 'session:clear') {
        suppressBroadcastRef.current = true;
        logout();
      }
    };
    return () => {
      channel.close();
      broadcastRef.current = null;
    };
  }, [applySessionPayload, logout]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = (event) => {
      if (event.storageArea !== window.localStorage || event.key !== STORAGE_KEY) {
        return;
      }
      if (event.newValue === event.oldValue) {
        return;
      }
      if (!event.newValue) {
        suppressBroadcastRef.current = true;
        logout();
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue);
        if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
          return;
        }
        applySessionPayload(parsed, { replace: true, broadcast: false });
      } catch (error) {
        console.warn('Failed to hydrate session from storage event', error);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [applySessionPayload, logout]);

  useEffect(() => {
    if (!broadcastRef.current) {
      return;
    }
    if (suppressBroadcastRef.current) {
      suppressBroadcastRef.current = false;
      return;
    }
    try {
      if (session) {
        broadcastRef.current.postMessage({ type: 'session:update', session });
      } else {
        broadcastRef.current.postMessage({ type: 'session:clear' });
      }
    } catch (error) {
      console.warn('Unable to broadcast session update', error);
    }
  }, [session]);

  const refreshSessionState = useCallback(() => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const tokens = mergeTokenState(session, {});
    const refreshToken = tokens.refreshToken;
    if (!refreshToken) {
      logout();
      return Promise.resolve(null);
    }

    const promise = refreshAuthSession(refreshToken)
      .then((response) => {
        const payload = response?.session ?? response;
        if (!payload) {
          throw new Error('Refresh response missing session payload.');
        }
        return applySessionPayload(payload, { replace: true });
      })
      .catch((error) => {
        console.warn('Failed to refresh session', error);
        logout();
        throw error;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    refreshPromiseRef.current = promise;
    return promise;
  }, [applySessionPayload, logout, session]);

  useEffect(() => {
    clearRefreshTimer();
    if (!session?.isAuthenticated) {
      return undefined;
    }
    const expiresAt = toIsoDate(session?.tokenExpiresAt);
    if (!expiresAt) {
      return undefined;
    }
    const expiryDate = new Date(expiresAt);
    if (Number.isNaN(expiryDate.getTime())) {
      return undefined;
    }
    const leadTime = 60 * 1000;
    const msUntilRefresh = expiryDate.getTime() - Date.now() - leadTime;
    if (!Number.isFinite(msUntilRefresh)) {
      return undefined;
    }
    if (msUntilRefresh <= 0) {
      refreshSessionState().catch(() => {});
      return undefined;
    }
    refreshTimeoutRef.current = setTimeout(() => {
      refreshSessionState().catch(() => {});
    }, Math.max(5 * 1000, msUntilRefresh));
    return () => {
      clearRefreshTimer();
    };
  }, [session?.tokenExpiresAt, session?.isAuthenticated, refreshSessionState, clearRefreshTimer]);

  const reloadSession = useCallback(
    async (params = {}) => {
      try {
        const response = await fetchCurrentSession(params);
        const payload = response?.session ?? response;
        if (!payload) {
          throw new Error('Session payload missing.');
        }
        return applySessionPayload(payload, { replace: false });
      } catch (error) {
        if (error?.status === 401) {
          logout();
        } else {
          console.warn('Failed to reload session', error);
        }
        throw error;
      }
    },
    [applySessionPayload, logout],
  );

  useEffect(() => {
    if (session) {
      return;
    }
    const stored = resolveStoredAuthTokens();
    if (!stored.accessToken && !stored.refreshToken) {
      return;
    }
    let cancelled = false;
    if (bootstrapPromiseRef.current) {
      return;
    }

    const promise = fetchCurrentSession()
      .then((response) => {
        if (cancelled) {
          return null;
        }
        const payload = response?.session ?? response;
        if (!payload) {
          return null;
        }
        return applySessionPayload(payload, { replace: true });
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn('Failed to hydrate session', error);
        }
        return null;
      })
      .finally(() => {
        if (!cancelled) {
          bootstrapPromiseRef.current = null;
        }
      });

    bootstrapPromiseRef.current = promise;

    return () => {
      cancelled = true;
    };
  }, [applySessionPayload, session]);

  const roleKeys = useMemo(() => session?.roleKeys ?? [], [session?.roleKeys]);
  const permissionKeys = useMemo(() => session?.permissionKeys ?? [], [session?.permissionKeys]);
  const roleKeySet = useMemo(() => new Set(roleKeys.map(normaliseKey).filter(Boolean)), [roleKeys]);
  const permissionKeySet = useMemo(
    () => new Set(permissionKeys.map(normaliseKey).filter(Boolean)),
    [permissionKeys],
  );

  const featureFlags = useMemo(() => session?.featureFlags ?? {}, [session?.featureFlags]);
  const activeFeatureFlags = useMemo(
    () => session?.activeFeatureFlags ?? [],
    [session?.activeFeatureFlags],
  );
  const featureFlagMetadata = useMemo(() => {
    const metadata = {};
    Object.entries(featureFlags).forEach(([key, entry]) => {
      metadata[key] = entry?.metadata ?? {};
    });
    return metadata;
  }, [featureFlags]);

  const hasRole = useCallback((role) => roleKeySet.has(normaliseKey(role)), [roleKeySet]);

  const hasPermission = useCallback(
    (permission) => permissionKeySet.has(normaliseKey(permission)),
    [permissionKeySet],
  );

  const isFeatureEnabled = useCallback(
    (flagKey, defaultValue = false) => {
      const key = normaliseKey(flagKey);
      if (!key) {
        return Boolean(defaultValue);
      }
      const entry = featureFlags[key];
      if (!entry) {
        return Boolean(defaultValue);
      }
      return entry.enabled ?? Boolean(defaultValue);
    },
    [featureFlags],
  );

  const getFeatureFlag = useCallback(
    (flagKey) => {
      const key = normaliseKey(flagKey);
      if (!key) {
        return null;
      }
      return featureFlags[key] ?? null;
    },
    [featureFlags],
  );

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.isAuthenticated),
      roleKeys,
      permissionKeys,
      roles: session?.roles ?? [],
      permissions: session?.permissions ?? [],
      featureFlags,
      activeFeatureFlags,
      featureFlagMetadata,
      hasRole,
      hasPermission,
      isFeatureEnabled,
      getFeatureFlag,
      login: (payload = {}) => {
        const normalized = normalizeSessionPayload(payload);
        if (!normalized) {
          return null;
        }
        return applySessionPayload(normalized, { replace: true });
      },
      logout,
      updateSession: (updates = {}) => applySessionPayload({ isAuthenticated: true, ...updates }),
      refreshSession: refreshSessionState,
      reloadSession,
    }),
    [
      activeFeatureFlags,
      applySessionPayload,
      featureFlags,
      featureFlagMetadata,
      getFeatureFlag,
      hasPermission,
      hasRole,
      isFeatureEnabled,
      logout,
      permissionKeys,
      refreshSessionState,
      reloadSession,
      roleKeys,
      session,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export default SessionContext;
