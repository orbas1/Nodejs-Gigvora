import { getRateLimitSnapshot } from './rateLimitMetrics.js';
import { getPerimeterSnapshot } from './perimeterMetrics.js';
import { getWebApplicationFirewallSnapshot } from '../security/webApplicationFirewall.js';
import { getDatabasePoolSnapshot } from '../services/databaseLifecycleService.js';

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cloneArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => ({ ...entry }));
}

export function normaliseRateLimitSnapshot(raw = {}) {
  const lifetime = raw.lifetime ?? {};
  const currentWindow = raw.currentWindow ?? {};
  return {
    lifetime: {
      hits: toNumber(lifetime.hits),
      allowed: toNumber(lifetime.allowed),
      blocked: toNumber(lifetime.blocked),
    },
    currentWindow: {
      activeKeys: toNumber(currentWindow.activeKeys),
      blockedRatio: toNumber(currentWindow.blockedRatio),
      requestsPerSecond: toNumber(currentWindow.requestsPerSecond),
      windowStartedAt: toIsoDate(currentWindow.windowStartedAt),
    },
    topBlockedConsumers: cloneArray(raw.topBlockedConsumers ?? []).map((consumer) => ({
      id: consumer.id ?? consumer.key ?? null,
      hits: toNumber(consumer.hits),
      blocked: toNumber(consumer.blocked),
      lastBlockedAt: toIsoDate(consumer.lastBlockedAt),
    })),
    generatedAt: toIsoDate(raw.generatedAt) ?? new Date().toISOString(),
  };
}

export function normaliseWafSnapshot(raw = {}) {
  return {
    evaluatedRequests: toNumber(raw.evaluatedRequests),
    blockedRequests: toNumber(raw.blockedRequests),
    recentBlocks: cloneArray(raw.recentBlocks ?? []).map((entry) => ({
      referenceId: entry.referenceId ?? null,
      ip: entry.ip ?? null,
      origin: entry.origin ?? null,
      method: entry.method ?? null,
      path: entry.path ?? null,
      reason: entry.reason ?? null,
      matchedRules: cloneArray(entry.matchedRules ?? []).map((rule) => ({
        id: rule.id ?? null,
        description: rule.description ?? null,
      })),
      detectedAt: toIsoDate(entry.detectedAt),
      userAgent: entry.userAgent ?? null,
    })),
    autoBlock: {
      totalTriggered: toNumber(raw.autoBlock?.totalTriggered),
      active: cloneArray(raw.autoBlock?.active ?? []).map((entry) => ({
        ip: entry.ip ?? null,
        blockedAt: toIsoDate(entry.blockedAt),
        expiresAt: toIsoDate(entry.expiresAt),
        hits: toNumber(entry.hits),
      })),
      ttlSeconds: toNumber(raw.autoBlock?.ttlSeconds, null),
    },
    lastBlockedAt: toIsoDate(raw.lastBlockedAt),
    generatedAt: toIsoDate(raw.generatedAt) ?? new Date().toISOString(),
  };
}

export function normalisePerimeterSnapshot(raw = {}) {
  return {
    totalBlocked: toNumber(raw.totalBlocked),
    blockedOrigins: cloneArray(raw.blockedOrigins ?? []).map((entry) => ({
      origin: entry.origin ?? null,
      blockedAt: toIsoDate(entry.blockedAt),
      lastPath: entry.lastPath ?? null,
      lastMethod: entry.lastMethod ?? null,
    })),
    lastBlockedAt: toIsoDate(raw.lastBlockedAt),
    generatedAt: toIsoDate(raw.generatedAt) ?? new Date().toISOString(),
  };
}

export function normaliseDatabasePoolSnapshot(raw = {}) {
  return {
    vendor: raw.vendor ?? null,
    size: toNumber(raw.size),
    available: toNumber(raw.available),
    borrowed: toNumber(raw.borrowed),
    pending: toNumber(raw.pending),
    lastEvent: raw.lastEvent ?? null,
    updatedAt: toIsoDate(raw.updatedAt),
  };
}

export function normaliseProfileEngagementQueueSnapshot(raw = {}) {
  return {
    pending: toNumber(raw.pending),
    stuck: toNumber(raw.stuck),
    failed: toNumber(raw.failed),
    intervalSeconds: toNumber(raw.intervalMs, 0) / 1000,
    nextScheduledAt: toIsoDate(raw.nextScheduledAt),
    generatedAt: toIsoDate(raw.generatedAt) ?? new Date().toISOString(),
  };
}

export default {
  normaliseRateLimitSnapshot,
  normalisePerimeterSnapshot,
  normaliseWafSnapshot,
  normaliseDatabasePoolSnapshot,
  normaliseProfileEngagementQueueSnapshot,
};
