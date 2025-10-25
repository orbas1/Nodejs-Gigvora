import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { appCache } from '../utils/cache.js';

const REVOCATION_CACHE_PREFIX = 'auth:refresh:revoked:';
const INVALIDATION_CACHE_PREFIX = 'auth:refresh:invalidated:';
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MIN_REVOCATION_TTL_SECONDS = 60;

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

export function markRefreshTokenRevoked(refreshToken, { userId = null, reason = 'manual', context = null } = {}) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return null;
  }
  const expiresAt = resolveExpiryDate(refreshToken);
  const ttlSeconds = computeTtlSeconds(expiresAt);
  const key = buildRevocationKey(refreshToken);
  const payload = {
    userId: userId != null ? Number(userId) : null,
    reason,
    context: context ?? null,
    revokedAt: new Date().toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };
  appCache.set(key, payload, ttlSeconds);
  return payload;
}

export function isRefreshTokenRevoked(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return false;
  }
  const key = buildRevocationKey(refreshToken);
  return Boolean(appCache.get(key));
}

export function getRefreshTokenRevocation(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return null;
  }
  return appCache.get(buildRevocationKey(refreshToken)) ?? null;
}

export function invalidateRefreshTokensForUser(userId, { reason = 'manual', actorId = null } = {}) {
  if (!Number.isFinite(Number(userId))) {
    return null;
  }
  const key = buildInvalidationKey(Number(userId));
  const payload = {
    userId: Number(userId),
    reason,
    actorId: actorId != null ? Number(actorId) : null,
    invalidatedAt: new Date().toISOString(),
  };
  appCache.set(key, payload, DEFAULT_REFRESH_TTL_SECONDS);
  return payload;
}

export function getRefreshTokenInvalidation(userId) {
  if (!Number.isFinite(Number(userId))) {
    return null;
  }
  return appCache.get(buildInvalidationKey(Number(userId))) ?? null;
}

export function __dangerouslyResetRefreshTokenStore() {
  appCache.flushByPrefix(REVOCATION_CACHE_PREFIX);
  appCache.flushByPrefix(INVALIDATION_CACHE_PREFIX);
}

export default {
  markRefreshTokenRevoked,
  isRefreshTokenRevoked,
  getRefreshTokenRevocation,
  invalidateRefreshTokensForUser,
  getRefreshTokenInvalidation,
  __dangerouslyResetRefreshTokenStore,
};
