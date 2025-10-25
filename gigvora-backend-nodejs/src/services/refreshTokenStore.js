import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { domainRegistry } from '../models/index.js';
import { appCache } from '../utils/cache.js';

const REVOCATION_CACHE_PREFIX = 'auth:refresh:revoked:';
const INVALIDATION_CACHE_PREFIX = 'auth:refresh:invalidated:';
const SESSION_CACHE_PREFIX = 'auth:refresh:session:';
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MIN_REVOCATION_TTL_SECONDS = 60;

const authModels = (() => {
  try {
    return domainRegistry.getContextModels('auth');
  } catch (error) {
    return {};
  }
})();

const UserRefreshSession = authModels.UserRefreshSession ?? null;
const UserRefreshInvalidation = authModels.UserRefreshInvalidation ?? null;
const supportsPersistence = Boolean(UserRefreshSession && UserRefreshInvalidation);
const isProduction = process.env.NODE_ENV === 'production';

const RISK_SEVERITY_ORDER = { low: 1, medium: 2, high: 3 };
const RISK_SEVERITY_SCORE = { low: 20, medium: 60, high: 90 };

if (!supportsPersistence && isProduction) {
  throw new Error(
    'Persistent refresh-token storage is required in production. Ensure Sequelize models are registered before importing refreshTokenStore.',
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function resolveExpiryDate(refreshToken) {
  const decoded = jwt.decode(refreshToken);
  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    return null;
  }
  const expiresAt = new Date(decoded.exp * 1000);
  return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
}

function computeTtlSeconds(expiresAt) {
  if (!(expiresAt instanceof Date)) {
    return DEFAULT_REFRESH_TTL_SECONDS;
  }
  const diffMs = expiresAt.getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return MIN_REVOCATION_TTL_SECONDS;
  }
  return Math.max(MIN_REVOCATION_TTL_SECONDS, Math.round(diffMs / 1000));
}

function buildRevocationKey(refreshToken) {
  return `${REVOCATION_CACHE_PREFIX}${hashToken(refreshToken)}`;
}

function buildInvalidationKey(userId) {
  return `${INVALIDATION_CACHE_PREFIX}${userId}`;
}

function buildSessionKey(refreshToken) {
  return `${SESSION_CACHE_PREFIX}${hashToken(refreshToken)}`;
}

function sanitiseContext(context) {
  if (!context || typeof context !== 'object') {
    return null;
  }
  const payload = {};
  if (context.ipAddress) {
    payload.ipAddress = `${context.ipAddress}`.slice(0, 128);
  }
  if (context.userAgent) {
    payload.userAgent = `${context.userAgent}`.slice(0, 1024);
  }
  const additional = { ...context };
  delete additional.ipAddress;
  delete additional.userAgent;
  if (Object.keys(additional).length > 0) {
    payload.additional = additional;
  }
  return Object.keys(payload).length ? payload : null;
}

function truncateString(value, maxLength) {
  if (value == null) {
    return null;
  }
  const stringified = `${value}`.trim();
  if (!stringified) {
    return null;
  }
  if (!Number.isFinite(Number(maxLength)) || maxLength <= 0) {
    return stringified;
  }
  return stringified.slice(0, maxLength);
}

function deriveDeviceLabel(rawContext, userAgent) {
  const labelCandidate =
    rawContext?.deviceLabel ||
    rawContext?.device?.label ||
    rawContext?.device?.name ||
    rawContext?.deviceName ||
    rawContext?.clientName;

  if (labelCandidate) {
    const label = truncateString(labelCandidate, 180);
    if (label) {
      return label;
    }
  }

  if (typeof userAgent === 'string') {
    if (/iphone|ipad|ios/i.test(userAgent)) {
      return 'iOS device';
    }
    if (/android/i.test(userAgent)) {
      return 'Android device';
    }
    if (/macintosh|mac os/i.test(userAgent)) {
      return 'macOS browser';
    }
    if (/windows/i.test(userAgent)) {
      return 'Windows browser';
    }
    if (/linux/i.test(userAgent)) {
      return 'Linux browser';
    }
    return truncateString(userAgent, 180);
  }

  return null;
}

function deriveDeviceFingerprint(rawContext, userAgent, ipAddress) {
  const explicitFingerprint =
    rawContext?.deviceFingerprint ||
    rawContext?.fingerprint ||
    rawContext?.sessionFingerprint ||
    rawContext?.device?.fingerprint ||
    rawContext?.additional?.deviceFingerprint ||
    rawContext?.additional?.fingerprint;

  if (explicitFingerprint && typeof explicitFingerprint === 'string' && explicitFingerprint.trim()) {
    return hashToken(explicitFingerprint.trim());
  }

  const parts = new Set();
  [
    rawContext?.device?.id,
    rawContext?.deviceId,
    rawContext?.hardwareId,
    rawContext?.installationId,
    rawContext?.sessionId,
    rawContext?.browserId,
    rawContext?.additional?.deviceId,
    rawContext?.additional?.hardwareId,
    rawContext?.additional?.sessionId,
    userAgent,
    ipAddress,
  ].forEach((value) => {
    if (typeof value === 'string' && value.trim()) {
      parts.add(value.trim());
    }
  });

  if (parts.size === 0) {
    return null;
  }

  return hashToken(Array.from(parts).join('|'));
}

function normaliseRiskSignals(signals = []) {
  if (!Array.isArray(signals)) {
    return [];
  }
  const seen = new Set();
  return signals
    .map((signal) => {
      const code = truncateString(signal?.code ?? 'unspecified', 120) ?? 'unspecified';
      const severity = ['high', 'medium', 'low'].includes(signal?.severity)
        ? signal.severity
        : 'medium';
      const message = truncateString(signal?.message ?? '', 400);
      const observedAt = signal?.observedAt ? new Date(signal.observedAt).toISOString() : new Date().toISOString();
      const metadata = signal?.metadata && typeof signal.metadata === 'object' ? signal.metadata : undefined;
      return metadata
        ? { code, severity, message, observedAt, metadata }
        : { code, severity, message, observedAt };
    })
    .filter((signal) => {
      const key = `${signal.code}:${signal.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function extractContextMetadata(rawContext) {
  let context = rawContext;
  if (typeof context === 'string') {
    try {
      context = JSON.parse(context);
    } catch (error) {
      context = null;
    }
  }

  if (!context || typeof context !== 'object') {
    return { context: null, additional: {}, location: null, timezone: null, riskHints: null };
  }

  const additional = context.additional && typeof context.additional === 'object' ? context.additional : context;
  const location =
    typeof additional.location === 'object'
      ? additional.location
      : typeof additional.geo === 'object'
        ? additional.geo
        : null;
  const timezone = additional.timezone || additional.timeZone || additional.tz || null;
  const riskHints = additional.riskHints || additional.risk || null;

  return { context, additional, location, timezone, riskHints };
}

function extractSessionMetadata(session) {
  const { location, timezone, riskHints } = extractContextMetadata(session?.context ?? null);
  return {
    location,
    timezone,
    riskHints,
    userAgent: session?.userAgent ?? null,
    ipAddress: session?.ipAddress ?? null,
  };
}

async function evaluateSessionRisk({
  userId,
  deviceFingerprint,
  context = {},
  ipAddress = null,
  userAgent = null,
}) {
  const signals = [];
  const now = new Date().toISOString();
  const resolvedIp = truncateString(ipAddress ?? context.ipAddress, 128);
  const resolvedUserAgent = truncateString(userAgent ?? context.userAgent, 1024);
  const { location, timezone, riskHints } = extractContextMetadata(context);

  if (!deviceFingerprint) {
    signals.push({
      code: 'missing_fingerprint',
      severity: 'high',
      message: 'No device fingerprint provided for refresh session.',
      observedAt: now,
    });
  }

  let recentSessions = [];
  if (supportsPersistence && Number.isFinite(Number(userId)) && Number(userId) > 0) {
    recentSessions = await UserRefreshSession.findAll({
      where: { userId: Number(userId) },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
  }

  if (deviceFingerprint && recentSessions.length > 0) {
    const seenFingerprints = new Set(
      recentSessions.map((session) => session.deviceFingerprint).filter((value) => typeof value === 'string' && value),
    );
    if (!seenFingerprints.has(deviceFingerprint)) {
      signals.push({
        code: 'new_device_fingerprint',
        severity: 'medium',
        message: 'Refresh requested from a new device fingerprint.',
        observedAt: now,
      });
    }
  }

  if (resolvedIp && recentSessions.length > 0) {
    const seenIps = new Set(
      recentSessions.map((session) => session.ipAddress).filter((value) => typeof value === 'string' && value),
    );
    if (!seenIps.has(resolvedIp)) {
      signals.push({
        code: 'new_ip_address',
        severity: 'medium',
        message: 'Refresh requested from an IP address that has not been seen recently.',
        observedAt: now,
        metadata: resolvedIp ? { ipAddress: resolvedIp } : undefined,
      });
    }
  }

  const previousSession = recentSessions.find((session) => session.deviceFingerprint === deviceFingerprint) ?? recentSessions[0] ?? null;

  if (previousSession) {
    const previousMeta = extractSessionMetadata(previousSession);

    if (location?.countryCode && previousMeta.location?.countryCode && location.countryCode !== previousMeta.location.countryCode) {
      signals.push({
        code: 'country_change',
        severity: 'high',
        message: `Refresh attempted from ${location.countryCode}, last session was ${previousMeta.location.countryCode}.`,
        observedAt: now,
        metadata: { from: previousMeta.location.countryCode, to: location.countryCode },
      });
    }

    if (timezone && previousMeta.timezone && timezone !== previousMeta.timezone) {
      signals.push({
        code: 'timezone_shift',
        severity: 'medium',
        message: 'Session timezone differs from the last known session.',
        observedAt: now,
        metadata: { from: previousMeta.timezone, to: timezone },
      });
    }

    if (
      resolvedUserAgent &&
      previousMeta.userAgent &&
      resolvedUserAgent.slice(0, 120) !== previousMeta.userAgent.slice(0, 120)
    ) {
      signals.push({
        code: 'user_agent_variation',
        severity: 'low',
        message: 'User agent changed compared to the last session for this device.',
        observedAt: now,
      });
    }
  }

  const structuredHints = riskHints && typeof riskHints === 'object' ? riskHints : {};
  if (structuredHints.suspectedProxy || structuredHints.anonymousNetwork) {
    signals.push({
      code: 'anonymous_network',
      severity: 'high',
      message: 'Session originated from a proxy, VPN, or anonymous network.',
      observedAt: now,
    });
  }

  if (structuredHints.failedLoginCount && Number(structuredHints.failedLoginCount) >= 3) {
    signals.push({
      code: 'recent_failed_logins',
      severity: 'medium',
      message: 'Multiple failed login attempts preceded this refresh.',
      observedAt: now,
      metadata: { failedLogins: Number(structuredHints.failedLoginCount) },
    });
  }

  if (structuredHints.impossibleTravel === true) {
    signals.push({
      code: 'impossible_travel',
      severity: 'high',
      message: 'Detected impossible travel between prior and current session locations.',
      observedAt: now,
    });
  }

  if (context.riskScore && Number(context.riskScore) >= 80) {
    signals.push({
      code: 'upstream_high_risk',
      severity: 'high',
      message: 'Upstream risk engine classified this session as high risk.',
      observedAt: now,
      metadata: { riskScore: Number(context.riskScore) },
    });
  }

  if (signals.length === 0 && recentSessions.length === 0) {
    signals.push({
      code: 'first_session',
      severity: 'low',
      message: 'First refresh session recorded for this account.',
      observedAt: now,
    });
  }

  const normalisedSignals = normaliseRiskSignals(signals);
  const riskScore = normalisedSignals.length
    ? Math.max(...normalisedSignals.map((signal) => RISK_SEVERITY_SCORE[signal.severity] ?? 40))
    : 0;

  let riskLevel = 'low';
  if (riskScore >= 80) {
    riskLevel = 'high';
  } else if (riskScore >= 50) {
    riskLevel = 'medium';
  }

  return {
    level: riskLevel,
    score: riskScore,
    signals: normalisedSignals,
  };
}

function serialiseRevocationRecord(record, fallback = {}) {
  if (!record) {
    return null;
  }
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const revokedAt = plain.revokedAt ? new Date(plain.revokedAt).toISOString() : fallback.revokedAt ?? null;
  const expiresAt = plain.expiresAt ? new Date(plain.expiresAt).toISOString() : fallback.expiresAt ?? null;
  return {
    userId: plain.userId ?? fallback.userId ?? null,
    reason: plain.revokedReason ?? fallback.reason ?? 'manual',
    context: plain.revocationContext ?? fallback.context ?? null,
    revokedAt,
    expiresAt,
    replacedByTokenHash: plain.replacedByTokenHash ?? fallback.replacedByTokenHash ?? null,
  };
}

async function persistRefreshSession(refreshToken, { userId, context = null } = {}) {
  if (!refreshToken || !Number.isFinite(Number(userId))) {
    return null;
  }
  const numericUserId = Number(userId);
  const expiresAt = resolveExpiryDate(refreshToken);
  const ttlSeconds = computeTtlSeconds(expiresAt ?? undefined);
  const cacheKey = buildSessionKey(refreshToken);
  const rawContext = context && typeof context === 'object' ? context : {};
  const ipAddress = truncateString(rawContext?.ipAddress, 128);
  const userAgent = truncateString(rawContext?.userAgent, 1024);
  const deviceFingerprint = deriveDeviceFingerprint(rawContext, userAgent, ipAddress);
  const deviceLabel = deriveDeviceLabel(rawContext, userAgent);
  const risk = await evaluateSessionRisk({
    userId: numericUserId,
    deviceFingerprint,
    context: rawContext,
    ipAddress,
    userAgent,
  });
  const riskSignals = Array.isArray(risk.signals) ? risk.signals : [];
  const sanitisedContext = sanitiseContext(rawContext);

  const payload = {
    userId: numericUserId,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    context: sanitisedContext,
    deviceFingerprint,
    deviceLabel,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskSignals,
  };
  appCache.set(cacheKey, payload, ttlSeconds);

  if (!supportsPersistence) {
    return payload;
  }

  const tokenHash = hashToken(refreshToken);
  const attributes = {
    userId: numericUserId,
    tokenHash,
    ipAddress,
    userAgent,
    context: sanitisedContext,
    expiresAt: expiresAt ?? null,
    deviceFingerprint,
    deviceLabel,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskSignals,
  };

  let session = await UserRefreshSession.findOne({ where: { tokenHash } });

  if (session) {
    await session.update(attributes);
  } else {
    session = await UserRefreshSession.create(attributes);
  }

  if (session && session.revokedAt) {
    const revocation = serialiseRevocationRecord(session);
    if (revocation) {
      appCache.set(buildRevocationKey(refreshToken), revocation, ttlSeconds);
    }
  }

  return attributes;
}

async function markRefreshTokenRevoked(
  refreshToken,
  { userId = null, reason = 'manual', context = null, actorId = null, replacedByToken = null } = {},
) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return null;
  }
  const expiresAt = resolveExpiryDate(refreshToken);
  const ttlSeconds = computeTtlSeconds(expiresAt ?? undefined);
  const cacheKey = buildRevocationKey(refreshToken);
  const payload = {
    userId: userId != null ? Number(userId) : null,
    reason,
    context: sanitiseContext(context),
    revokedAt: new Date().toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    replacedByTokenHash: replacedByToken ? hashToken(replacedByToken) : null,
  };

  if (!supportsPersistence) {
    appCache.set(cacheKey, payload, ttlSeconds);
    return payload;
  }

  const tokenHash = hashToken(refreshToken);
  const update = {
    revokedAt: new Date(),
    revokedReason: reason,
    revokedById: actorId != null ? Number(actorId) : null,
    revocationContext: sanitiseContext(context),
    replacedByTokenHash: replacedByToken ? hashToken(replacedByToken) : null,
  };

  const [count, [updated]] = await UserRefreshSession.update(update, {
    where: { tokenHash },
    returning: true,
  });

  let record = updated ?? null;

  if (!count && userId != null) {
    record = await UserRefreshSession.create({
      userId: Number(userId),
      tokenHash,
      expiresAt: expiresAt ?? null,
      revokedAt: update.revokedAt,
      revokedReason: reason,
      revokedById: update.revokedById,
      revocationContext: update.revocationContext,
      replacedByTokenHash: update.replacedByTokenHash,
    });
  }

  const serialised = serialiseRevocationRecord(record, payload) ?? payload;
  appCache.set(cacheKey, serialised, ttlSeconds);
  return serialised;
}

async function isRefreshTokenRevoked(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return false;
  }
  const cacheKey = buildRevocationKey(refreshToken);
  if (appCache.get(cacheKey)) {
    return true;
  }
  if (!supportsPersistence) {
    return false;
  }
  const tokenHash = hashToken(refreshToken);
  const session = await UserRefreshSession.findOne({ where: { tokenHash } });
  if (!session || !session.revokedAt) {
    return false;
  }
  const expiresAt = resolveExpiryDate(refreshToken);
  const ttlSeconds = computeTtlSeconds(expiresAt ?? undefined);
  const payload = serialiseRevocationRecord(session);
  if (payload) {
    appCache.set(cacheKey, payload, ttlSeconds);
  }
  return true;
}

async function getRefreshTokenRevocation(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return null;
  }
  const cacheKey = buildRevocationKey(refreshToken);
  const cached = appCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (!supportsPersistence) {
    return null;
  }
  const tokenHash = hashToken(refreshToken);
  const session = await UserRefreshSession.findOne({ where: { tokenHash } });
  if (!session || !session.revokedAt) {
    return null;
  }
  const expiresAt = resolveExpiryDate(refreshToken);
  const ttlSeconds = computeTtlSeconds(expiresAt ?? undefined);
  const payload = serialiseRevocationRecord(session);
  if (payload) {
    appCache.set(cacheKey, payload, ttlSeconds);
    return payload;
  }
  return null;
}

async function invalidateRefreshTokensForUser(
  userId,
  { reason = 'manual', actorId = null, context = null } = {},
) {
  if (!Number.isFinite(Number(userId))) {
    return null;
  }
  const numericId = Number(userId);
  const now = new Date();
  const payload = {
    userId: numericId,
    reason,
    actorId: actorId != null ? Number(actorId) : null,
    context: sanitiseContext(context),
    invalidatedAt: now.toISOString(),
  };

  appCache.set(buildInvalidationKey(numericId), payload, DEFAULT_REFRESH_TTL_SECONDS);

  if (!supportsPersistence) {
    return payload;
  }

  await UserRefreshSession.update(
    {
      revokedAt: now,
      revokedReason: reason,
      revokedById: payload.actorId,
      revocationContext: payload.context,
    },
    {
      where: { userId: numericId, revokedAt: null },
    },
  );

  const invalidation = await UserRefreshInvalidation.create({
    userId: numericId,
    reason,
    actorId: payload.actorId,
    context: payload.context,
    invalidatedAt: now,
  });

  const serialised = typeof invalidation.get === 'function' ? invalidation.get({ plain: true }) : invalidation;
  const normalised = {
    userId: serialised.userId,
    reason: serialised.reason,
    actorId: serialised.actorId,
    context: serialised.context,
    invalidatedAt: new Date(serialised.invalidatedAt).toISOString(),
  };

  appCache.set(buildInvalidationKey(numericId), normalised, DEFAULT_REFRESH_TTL_SECONDS);
  return normalised;
}

async function getRefreshTokenInvalidation(userId) {
  if (!Number.isFinite(Number(userId))) {
    return null;
  }
  const numericId = Number(userId);
  const cacheKey = buildInvalidationKey(numericId);
  const cached = appCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (!supportsPersistence) {
    return null;
  }
  const invalidation = await UserRefreshInvalidation.findOne({
    where: { userId: numericId },
    order: [['invalidatedAt', 'DESC']],
  });
  if (!invalidation) {
    return null;
  }
  const serialised = invalidation.get({ plain: true });
  const payload = {
    userId: serialised.userId,
    reason: serialised.reason,
    actorId: serialised.actorId,
    context: serialised.context,
    invalidatedAt: new Date(serialised.invalidatedAt).toISOString(),
  };
  appCache.set(cacheKey, payload, DEFAULT_REFRESH_TTL_SECONDS);
  return payload;
}

async function __dangerouslyResetRefreshTokenStore() {
  appCache.flushByPrefix(REVOCATION_CACHE_PREFIX);
  appCache.flushByPrefix(INVALIDATION_CACHE_PREFIX);
  appCache.flushByPrefix(SESSION_CACHE_PREFIX);
  if (supportsPersistence) {
    await UserRefreshSession.destroy({ where: {} });
    await UserRefreshInvalidation.destroy({ where: {} });
  }
}

export {
  persistRefreshSession,
  markRefreshTokenRevoked,
  isRefreshTokenRevoked,
  getRefreshTokenRevocation,
  invalidateRefreshTokensForUser,
  getRefreshTokenInvalidation,
  __dangerouslyResetRefreshTokenStore,
};
