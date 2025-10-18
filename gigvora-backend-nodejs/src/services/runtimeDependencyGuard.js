import logger from '../utils/logger.js';
import {
  markDependencyHealthy,
  markDependencyUnavailable,
  markDependencyDegraded,
} from '../lifecycle/runtimeHealth.js';
import { getPlatformSettings } from './platformSettingsService.js';
import { getVisibleAnnouncements } from './runtimeMaintenanceService.js';
import { ServiceUnavailableError } from '../utils/errors.js';

const CACHE_TTL_MS = 30_000;

const REQUIRED_PAYMENT_FIELDS = {
  stripe: [
    ['stripe', 'publishableKey'],
    ['stripe', 'secretKey'],
    ['stripe', 'webhookSecret'],
  ],
  escrow_com: [
    ['escrow_com', 'apiKey'],
    ['escrow_com', 'apiSecret'],
  ],
};

const REQUIRED_STORAGE_FIELDS = {
  cloudflare_r2: [
    ['cloudflare_r2', 'accountId'],
    ['cloudflare_r2', 'accessKeyId'],
    ['cloudflare_r2', 'secretAccessKey'],
    ['cloudflare_r2', 'bucket'],
    ['cloudflare_r2', 'endpoint'],
  ],
};

const dependencyCache = {
  payments: { snapshot: null, expiresAt: 0, promise: null },
  compliance: { snapshot: null, expiresAt: 0, promise: null },
};

const maintenanceCache = { snapshot: null, expiresAt: 0, promise: null };

function resolveLogger(provided) {
  if (provided && typeof provided.info === 'function') {
    return provided;
  }
  return logger;
}

function isCacheValid(entry) {
  return entry.snapshot && entry.expiresAt > Date.now();
}

function normaliseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readSettingSegment(tree, segments = []) {
  return segments.reduce((current, segment) => {
    if (!current) return undefined;
    return current[segment];
  }, tree);
}

function cloneSnapshot(snapshot = {}) {
  return JSON.parse(JSON.stringify(snapshot));
}

function extractBlockingAnnouncements(announcements, keys = []) {
  if (!Array.isArray(announcements) || announcements.length === 0 || keys.length === 0) {
    return [];
  }
  const expected = new Set(keys.map((key) => normaliseString(key).toLowerCase()).filter(Boolean));
  if (!expected.size) {
    return [];
  }

  return announcements.filter((announcement) => {
    const metadata = announcement?.metadata ?? {};
    const candidates = [];
    const pushCandidates = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => pushCandidates(entry));
        return;
      }
      if (typeof value === 'string') {
        value
          .split(',')
          .map((entry) => normaliseString(entry).toLowerCase())
          .filter(Boolean)
          .forEach((entry) => candidates.push(entry));
      }
    };

    pushCandidates(metadata.blocks);
    pushCandidates(metadata.blockedFeatures);
    pushCandidates(metadata.impacts);
    pushCandidates(metadata.impactedFeatures);
    pushCandidates(metadata.affects);

    return candidates.some((candidate) => expected.has(candidate));
  });
}

async function loadMaintenanceSnapshot({ forceRefresh = false, log } = {}) {
  if (!forceRefresh && maintenanceCache.promise) {
    return maintenanceCache.promise;
  }
  if (!forceRefresh && isCacheValid(maintenanceCache)) {
    return maintenanceCache.snapshot;
  }

  const fetchPromise = getVisibleAnnouncements({
    audience: 'operations',
    channel: 'api',
    includeResolved: false,
    windowMinutes: 6 * 60,
  })
    .then((snapshot) => {
      maintenanceCache.snapshot = snapshot;
      maintenanceCache.expiresAt = Date.now() + CACHE_TTL_MS;
      return snapshot;
    })
    .catch((error) => {
      const resolvedLogger = resolveLogger(log);
      resolvedLogger.warn({ err: error }, 'Failed to refresh maintenance snapshot for dependency guard');
      maintenanceCache.snapshot = { announcements: [], generatedAt: new Date().toISOString() };
      maintenanceCache.expiresAt = Date.now() + CACHE_TTL_MS;
      return maintenanceCache.snapshot;
    })
    .finally(() => {
      maintenanceCache.promise = null;
    });

  maintenanceCache.promise = fetchPromise;
  return fetchPromise;
}

function buildSnapshot({
  dependency,
  status,
  provider,
  reason = null,
  missing = [],
  blockingAnnouncements = [],
  metadata = {},
}) {
  return {
    dependency,
    status,
    provider,
    reason,
    missing,
    blockingAnnouncements: blockingAnnouncements.map((announcement) => announcement.slug),
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

function shouldBypassDependencyGuard() {
  return process.env.DISABLE_RUNTIME_DEPENDENCY_GUARD === 'true' || process.env.NODE_ENV === 'test';
}

function buildBypassedSnapshot(dependency) {
  return buildSnapshot({
    dependency,
    status: 'ok',
    provider: 'bypassed',
    reason: null,
    metadata: { bypassed: true },
  });
}

async function evaluatePaymentDependency({ forceRefresh = false, log } = {}) {
  if (shouldBypassDependencyGuard()) {
    const snapshot = buildBypassedSnapshot('paymentsGateway');
    dependencyCache.payments.snapshot = snapshot;
    dependencyCache.payments.expiresAt = Date.now() + CACHE_TTL_MS;
    return snapshot;
function isDependencyGuardDisabled() {
  return process.env.DISABLE_DEPENDENCY_GUARD === 'true' || process.env.NODE_ENV === 'test';
}

async function evaluatePaymentDependency({ forceRefresh = false, log } = {}) {
  if (isDependencyGuardDisabled()) {
    return buildSnapshot({
      dependency: 'paymentsGateway',
      status: 'ok',
      provider: 'test',
      reason: null,
    });
  }
  if (!forceRefresh && dependencyCache.payments.promise) {
    return dependencyCache.payments.promise;
  }
  if (!forceRefresh && isCacheValid(dependencyCache.payments)) {
    return dependencyCache.payments.snapshot;
  }

  const resolvedLogger = resolveLogger(log);

  const evaluationPromise = (async () => {
    let settings;
    try {
      settings = await getPlatformSettings();
    } catch (error) {
      resolvedLogger.error({ err: error }, 'Unable to load platform settings for payment dependency guard');
      const snapshot = buildSnapshot({
        dependency: 'paymentsGateway',
        status: 'error',
        reason: 'Unable to load platform settings',
        provider: null,
      });
      markDependencyUnavailable('paymentsGateway', error, { reason: snapshot.reason });
      return snapshot;
    }

    const payments = settings?.payments ?? {};
    const provider = normaliseString(payments.provider || 'stripe').toLowerCase();
    const requiredSegments = REQUIRED_PAYMENT_FIELDS[provider];

    if (!requiredSegments) {
      const message = provider
        ? `Unsupported payment provider configured: ${provider}`
        : 'No payment provider configured';
      const snapshot = buildSnapshot({
        dependency: 'paymentsGateway',
        status: 'error',
        reason: message,
        provider: provider || null,
      });
      markDependencyUnavailable('paymentsGateway', new Error(message), { provider });
      return snapshot;
    }

    const missing = requiredSegments
      .map((segments) => segments.map((segment) => normaliseString(segment)))
      .filter((segments) => segments.every(Boolean))
      .filter((segments) => {
        const value = readSettingSegment(payments, segments);
        if (typeof value === 'string') {
          return value.trim().length === 0;
        }
        return value == null;
      })
      .map((segments) => segments.join('.'));

    if (missing.length) {
      const message = `Missing payment credentials: ${missing.join(', ')}`;
      const snapshot = buildSnapshot({
        dependency: 'paymentsGateway',
        status: 'error',
        provider,
        reason: message,
        missing,
      });
      markDependencyUnavailable('paymentsGateway', new Error(message), {
        provider,
        missing,
      });
      return snapshot;
    }

    const maintenanceSnapshot = await loadMaintenanceSnapshot({ forceRefresh, log: resolvedLogger });
    const blocking = extractBlockingAnnouncements(maintenanceSnapshot?.announcements ?? [], [
      'payments',
      'finance',
      'wallets',
    ]);

    if (blocking.length) {
      const snapshot = buildSnapshot({
        dependency: 'paymentsGateway',
        status: 'degraded',
        provider,
        reason: 'Payments operating in read-only mode while maintenance completes.',
        blockingAnnouncements: blocking,
        metadata: { provider },
      });
      markDependencyDegraded(
        'paymentsGateway',
        new Error('Active maintenance window blocking payments'),
        {
          provider,
          blocking: snapshot.blockingAnnouncements,
        },
      );
      return snapshot;
    }

    const snapshot = buildSnapshot({
      dependency: 'paymentsGateway',
      status: 'ok',
      provider,
    });
    markDependencyHealthy('paymentsGateway', { provider });
    return snapshot;
  })()
    .then((snapshot) => {
      dependencyCache.payments.snapshot = cloneSnapshot(snapshot);
      dependencyCache.payments.expiresAt = Date.now() + CACHE_TTL_MS;
      return snapshot;
    })
    .catch((error) => {
      resolvedLogger.error({ err: error }, 'Unhandled error evaluating payment dependency');
      const snapshot = buildSnapshot({
        dependency: 'paymentsGateway',
        status: 'error',
        provider: null,
        reason: error?.message || 'Unexpected error evaluating payments dependency',
      });
      markDependencyUnavailable('paymentsGateway', error);
      dependencyCache.payments.snapshot = cloneSnapshot(snapshot);
      dependencyCache.payments.expiresAt = Date.now() + CACHE_TTL_MS;
      return snapshot;
    })
    .finally(() => {
      dependencyCache.payments.promise = null;
    });

  dependencyCache.payments.promise = evaluationPromise;
  return evaluationPromise;
}

async function evaluateComplianceDependency({ forceRefresh = false, log } = {}) {
  if (shouldBypassDependencyGuard()) {
    const snapshot = buildBypassedSnapshot('complianceProviders');
    dependencyCache.compliance.snapshot = snapshot;
    dependencyCache.compliance.expiresAt = Date.now() + CACHE_TTL_MS;
    return snapshot;
  if (isDependencyGuardDisabled()) {
    return buildSnapshot({
      dependency: 'complianceProviders',
      status: 'ok',
      provider: 'test',
      reason: null,
    });
  }
  if (!forceRefresh && dependencyCache.compliance.promise) {
    return dependencyCache.compliance.promise;
  }
  if (!forceRefresh && isCacheValid(dependencyCache.compliance)) {
    return dependencyCache.compliance.snapshot;
  }

  const resolvedLogger = resolveLogger(log);

  const evaluationPromise = (async () => {
    let settings;
    try {
      settings = await getPlatformSettings();
    } catch (error) {
      resolvedLogger.error({ err: error }, 'Unable to load platform settings for compliance dependency guard');
      const snapshot = buildSnapshot({
        dependency: 'complianceVault',
        status: 'error',
        reason: 'Unable to load platform settings',
      });
      markDependencyUnavailable('complianceVault', error, { reason: snapshot.reason });
      return snapshot;
    }

    const storage = settings?.storage ?? {};
    const provider = normaliseString(storage.provider || 'cloudflare_r2').toLowerCase();
    const requiredSegments = REQUIRED_STORAGE_FIELDS[provider];

    if (!requiredSegments) {
      const message = provider
        ? `Unsupported storage provider configured: ${provider}`
        : 'No storage provider configured';
      const snapshot = buildSnapshot({
        dependency: 'complianceVault',
        status: 'error',
        provider,
        reason: message,
      });
      markDependencyUnavailable('complianceVault', new Error(message), { provider });
      return snapshot;
    }

    const missing = requiredSegments
      .map((segments) => segments.map((segment) => normaliseString(segment)))
      .filter((segments) => segments.every(Boolean))
      .filter((segments) => {
        const value = readSettingSegment(storage, segments);
        if (typeof value === 'string') {
          return value.trim().length === 0;
        }
        return value == null;
      })
      .map((segments) => segments.join('.'));

    if (missing.length) {
      const message = `Missing compliance storage credentials: ${missing.join(', ')}`;
      const snapshot = buildSnapshot({
        dependency: 'complianceVault',
        status: 'error',
        provider,
        reason: message,
        missing,
      });
      markDependencyUnavailable('complianceVault', new Error(message), {
        provider,
        missing,
      });
      return snapshot;
    }

    const maintenanceSnapshot = await loadMaintenanceSnapshot({ forceRefresh, log: resolvedLogger });
    const blocking = extractBlockingAnnouncements(maintenanceSnapshot?.announcements ?? [], [
      'compliance',
      'documents',
      'governance',
    ]);

    if (blocking.length) {
      const snapshot = buildSnapshot({
        dependency: 'complianceVault',
        status: 'degraded',
        provider,
        reason: 'Compliance locker write operations paused during maintenance.',
        blockingAnnouncements: blocking,
        metadata: { provider },
      });
      markDependencyDegraded(
        'complianceVault',
        new Error('Active maintenance window blocking compliance document writes'),
        {
          provider,
          blocking: snapshot.blockingAnnouncements,
        },
      );
      return snapshot;
    }

    const snapshot = buildSnapshot({
      dependency: 'complianceVault',
      status: 'ok',
      provider,
    });
    markDependencyHealthy('complianceVault', { provider });
    return snapshot;
  })()
    .then((snapshot) => {
      dependencyCache.compliance.snapshot = cloneSnapshot(snapshot);
      dependencyCache.compliance.expiresAt = Date.now() + CACHE_TTL_MS;
      return snapshot;
    })
    .catch((error) => {
      resolvedLogger.error({ err: error }, 'Unhandled error evaluating compliance dependency');
      const snapshot = buildSnapshot({
        dependency: 'complianceVault',
        status: 'error',
        provider: null,
        reason: error?.message || 'Unexpected error evaluating compliance dependency',
      });
      markDependencyUnavailable('complianceVault', error);
      dependencyCache.compliance.snapshot = cloneSnapshot(snapshot);
      dependencyCache.compliance.expiresAt = Date.now() + CACHE_TTL_MS;
      return snapshot;
    })
    .finally(() => {
      dependencyCache.compliance.promise = null;
    });

  dependencyCache.compliance.promise = evaluationPromise;
  return evaluationPromise;
}

export async function refreshPaymentDependencyHealth({ forceRefresh = false, logger: providedLogger } = {}) {
  return evaluatePaymentDependency({ forceRefresh, log: providedLogger });
}

export async function refreshComplianceDependencyHealth({
  forceRefresh = false,
  logger: providedLogger,
} = {}) {
  return evaluateComplianceDependency({ forceRefresh, log: providedLogger });
}

function buildErrorPayload(snapshot, { feature, requestId }) {
  return {
    dependency: snapshot.dependency,
    provider: snapshot.provider,
    status: snapshot.status,
    reason: snapshot.reason,
    missing: snapshot.missing,
    blockingAnnouncements: snapshot.blockingAnnouncements,
    feature,
    requestId,
  };
}

export async function assertPaymentInfrastructureOperational({
  feature = 'payments',
  forceRefresh = false,
  logger: providedLogger,
  requestId,
} = {}) {
  const log = resolveLogger(providedLogger);
  const snapshot = await refreshPaymentDependencyHealth({ forceRefresh, logger: log });
  if (snapshot.status === 'ok') {
    return snapshot;
  }
  const payload = buildErrorPayload(snapshot, { feature, requestId });
  const message =
    snapshot.status === 'degraded'
      ? 'Payments are temporarily operating in read-only mode while maintenance completes.'
      : 'Payments are currently unavailable while we restore connectivity with the provider.';
  if (snapshot.status === 'degraded') {
    log.warn(payload, message);
  } else {
    log.error(payload, message);
  }
  throw new ServiceUnavailableError(message, payload);
}

export async function assertComplianceInfrastructureOperational({
  feature = 'compliance',
  forceRefresh = false,
  logger: providedLogger,
  requestId,
} = {}) {
  const log = resolveLogger(providedLogger);
  const snapshot = await refreshComplianceDependencyHealth({ forceRefresh, logger: log });
  if (snapshot.status === 'ok') {
    return snapshot;
  }
  const payload = buildErrorPayload(snapshot, { feature, requestId });
  const message =
    snapshot.status === 'degraded'
      ? 'Compliance document updates are paused while maintenance is in progress.'
      : 'Compliance document storage is unavailable while we recover connectivity.';
  if (snapshot.status === 'degraded') {
    log.warn(payload, message);
  } else {
    log.error(payload, message);
  }
  throw new ServiceUnavailableError(message, payload);
}

export async function warmRuntimeDependencyHealth({
  logger: providedLogger,
  forceRefresh = false,
} = {}) {
  const log = resolveLogger(providedLogger);
  await Promise.allSettled([
    refreshPaymentDependencyHealth({ forceRefresh, logger: log }),
    refreshComplianceDependencyHealth({ forceRefresh, logger: log }),
  ]);
}

export function __dangerousResetDependencyGuardCache() {
  dependencyCache.payments = { snapshot: null, expiresAt: 0, promise: null };
  dependencyCache.compliance = { snapshot: null, expiresAt: 0, promise: null };
  maintenanceCache.snapshot = null;
  maintenanceCache.expiresAt = 0;
  maintenanceCache.promise = null;
}

export default {
  assertPaymentInfrastructureOperational,
  assertComplianceInfrastructureOperational,
  refreshPaymentDependencyHealth,
  refreshComplianceDependencyHealth,
  warmRuntimeDependencyHealth,
};
