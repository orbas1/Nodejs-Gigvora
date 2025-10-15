const HISTORY_LIMIT = 12;
const MAX_TRACKED_KEYS = 250;
const MAX_WINDOW_KEYS = 200;

let config = {
  windowMs: 60_000,
  max: 300,
};

let currentWindow = createWindow(Date.now());
let history = [];
let lifetime = createLifetime();
let keyTotals = new Map();
let lastLimitTriggeredAt = null;

function createWindow(startTimestamp) {
  return {
    startedAt: startTimestamp,
    hits: 0,
    allowed: 0,
    blocked: 0,
    keyActivity: new Map(),
  };
}

function createLifetime() {
  return {
    hits: 0,
    allowed: 0,
    blocked: 0,
    firstSeenAt: null,
    lastSeenAt: null,
    lastBlockedAt: null,
  };
}

function toIso(timestamp) {
  return new Date(timestamp).toISOString();
}

function normaliseKey(key) {
  if (!key) {
    return 'anonymous';
  }
  return String(key);
}

function sanitisePath(path) {
  if (!path) {
    return '/';
  }
  const cleaned = `${path}`.split('?')[0];
  return cleaned || '/';
}

function ensureWindow(now = Date.now()) {
  if (now - currentWindow.startedAt < config.windowMs) {
    return;
  }

  const endedAt = now;
  const summary = {
    startedAt: toIso(currentWindow.startedAt),
    endedAt: toIso(endedAt),
    hits: currentWindow.hits,
    allowed: currentWindow.allowed,
    blocked: currentWindow.blocked,
    activeKeys: currentWindow.keyActivity.size,
  };

  history = [summary, ...history].slice(0, HISTORY_LIMIT);
  currentWindow = createWindow(now);
}

function pruneKeyMap(map, limit = MAX_TRACKED_KEYS) {
  if (map.size <= limit) {
    return;
  }

  let oldestKey = null;
  let oldestTimestamp = null;

  for (const [key, record] of map.entries()) {
    if (!record.lastSeenAt) {
      oldestKey = key;
      oldestTimestamp = -Infinity;
      break;
    }
    const time = Date.parse(record.lastSeenAt);
    if (oldestTimestamp == null || time < oldestTimestamp) {
      oldestTimestamp = time;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    map.delete(oldestKey);
  }
}

function updateRouteStats(record, method, path, timestamp, { blocked = false } = {}) {
  if (!record.routes) {
    record.routes = [];
  }

  const verb = (method || 'GET').toUpperCase();
  const descriptor = `${verb} ${path}`;
  let routeRecord = record.routes.find((entry) => entry.route === descriptor);

  if (!routeRecord) {
    routeRecord = { route: descriptor, hits: 0, blocked: 0, lastSeenAt: null };
    record.routes.push(routeRecord);
  }

  routeRecord.hits += 1;
  if (blocked) {
    routeRecord.blocked += 1;
  }
  routeRecord.lastSeenAt = toIso(timestamp);
  record.routes.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
  record.routes = record.routes.slice(0, 5);
}

function getKeyRecord(map, key, timestamp) {
  const iso = toIso(timestamp);
  let record = map.get(key);
  if (!record) {
    record = {
      key,
      hits: 0,
      allowed: 0,
      blocked: 0,
      firstSeenAt: iso,
      lastSeenAt: iso,
      lastBlockedAt: null,
      routes: [],
    };
    map.set(key, record);
  }
  if (!record.firstSeenAt) {
    record.firstSeenAt = iso;
  }
  record.lastSeenAt = iso;
  return record;
}

export function configureRateLimitMetrics({ windowMs, max } = {}) {
  if (Number.isFinite(windowMs) && windowMs > 0) {
    config.windowMs = windowMs;
  }
  if (Number.isFinite(max) && max > 0) {
    config.max = max;
  }
  resetRateLimitMetrics();
}

export function resetRateLimitMetrics() {
  currentWindow = createWindow(Date.now());
  history = [];
  lifetime = createLifetime();
  keyTotals = new Map();
  lastLimitTriggeredAt = null;
}

function touchLifetime(timestamp) {
  const iso = toIso(timestamp);
  if (!lifetime.firstSeenAt) {
    lifetime.firstSeenAt = iso;
  }
  lifetime.lastSeenAt = iso;
}

export function recordRateLimitAttempt({ key, method, path, timestamp = Date.now() }) {
  const normalisedKey = normaliseKey(key);
  const normalisedPath = sanitisePath(path);
  ensureWindow(timestamp);

  lifetime.hits += 1;
  touchLifetime(timestamp);

  currentWindow.hits += 1;

  const totalRecord = getKeyRecord(keyTotals, normalisedKey, timestamp);
  totalRecord.hits += 1;
  updateRouteStats(totalRecord, method, normalisedPath, timestamp);
  pruneKeyMap(keyTotals, MAX_TRACKED_KEYS);

  const windowRecord = getKeyRecord(currentWindow.keyActivity, normalisedKey, timestamp);
  windowRecord.hits += 1;
  updateRouteStats(windowRecord, method, normalisedPath, timestamp);
  pruneKeyMap(currentWindow.keyActivity, MAX_WINDOW_KEYS);
}

export function recordRateLimitSuccess({ key, timestamp = Date.now() }) {
  const normalisedKey = normaliseKey(key);
  ensureWindow(timestamp);

  lifetime.allowed += 1;
  touchLifetime(timestamp);

  const totalRecord = getKeyRecord(keyTotals, normalisedKey, timestamp);
  totalRecord.allowed += 1;

  const windowRecord = getKeyRecord(currentWindow.keyActivity, normalisedKey, timestamp);
  windowRecord.allowed += 1;

  currentWindow.allowed += 1;
}

export function recordRateLimitBlocked({ key, method, path, timestamp = Date.now() }) {
  const normalisedKey = normaliseKey(key);
  const normalisedPath = sanitisePath(path);
  ensureWindow(timestamp);

  lifetime.blocked += 1;
  lifetime.lastBlockedAt = toIso(timestamp);
  touchLifetime(timestamp);

  const totalRecord = getKeyRecord(keyTotals, normalisedKey, timestamp);
  totalRecord.blocked += 1;
  totalRecord.lastBlockedAt = toIso(timestamp);
  updateRouteStats(totalRecord, method, normalisedPath, timestamp, { blocked: true });

  const windowRecord = getKeyRecord(currentWindow.keyActivity, normalisedKey, timestamp);
  windowRecord.blocked += 1;
  windowRecord.lastBlockedAt = toIso(timestamp);
  updateRouteStats(windowRecord, method, normalisedPath, timestamp, { blocked: true });

  currentWindow.blocked += 1;
  lastLimitTriggeredAt = toIso(timestamp);
}

function cloneRoutes(routes = []) {
  return routes.map((route) => ({
    route: route.route,
    hits: route.hits,
    blocked: route.blocked,
    lastSeenAt: route.lastSeenAt,
  }));
}

function cloneKeyRecord(record) {
  return {
    key: record.key,
    hits: record.hits,
    allowed: record.allowed,
    blocked: record.blocked,
    firstSeenAt: record.firstSeenAt,
    lastSeenAt: record.lastSeenAt,
    lastBlockedAt: record.lastBlockedAt ?? null,
    routes: cloneRoutes(record.routes),
  };
}

function buildCurrentWindowSummary(now = Date.now()) {
  const windowEndsAt = currentWindow.startedAt + config.windowMs;
  const elapsedMs = Math.max(1, now - currentWindow.startedAt);
  const requestsPerSecond = Number((currentWindow.hits / (elapsedMs / 1000)).toFixed(2));
  const activeKeys = Array.from(currentWindow.keyActivity.values());

  let busiestKey = null;
  let busiestHits = 0;

  activeKeys.forEach((record) => {
    if (record.hits > busiestHits) {
      busiestKey = record;
      busiestHits = record.hits;
    }
  });

  const approachingThreshold = config.max * 0.8;
  const approachingLimit = activeKeys
    .filter((record) => record.hits >= approachingThreshold)
    .sort((a, b) => b.hits - a.hits)
    .map((record) => ({
      key: record.key,
      hits: record.hits,
      allowed: record.allowed,
      blocked: record.blocked,
      utilisation: Number(Math.min(1, record.hits / config.max).toFixed(2)),
      lastSeenAt: record.lastSeenAt,
    }));

  return {
    startedAt: toIso(currentWindow.startedAt),
    endsAt: toIso(windowEndsAt),
    hits: currentWindow.hits,
    allowed: currentWindow.allowed,
    blocked: currentWindow.blocked,
    activeKeys: currentWindow.keyActivity.size,
    busiestKey: busiestKey ? cloneKeyRecord(busiestKey) : null,
    approachingLimit: approachingLimit.slice(0, 5),
    blockedRatio: currentWindow.hits
      ? Number((currentWindow.blocked / currentWindow.hits).toFixed(3))
      : 0,
    requestsPerSecond,
  };
}

export function getRateLimitSnapshot(now = Date.now()) {
  ensureWindow(now);

  const topConsumers = Array.from(keyTotals.values())
    .sort((a, b) => {
      if (b.blocked !== a.blocked) {
        return b.blocked - a.blocked;
      }
      if (b.hits !== a.hits) {
        return b.hits - a.hits;
      }
      const bSeen = b.lastSeenAt ? Date.parse(b.lastSeenAt) : 0;
      const aSeen = a.lastSeenAt ? Date.parse(a.lastSeenAt) : 0;
      return bSeen - aSeen;
    })
    .slice(0, 15)
    .map((record) => cloneKeyRecord(record));

  return {
    config: { ...config },
    currentWindow: buildCurrentWindowSummary(now),
    history: history.map((entry) => ({ ...entry })),
    lifetime: { ...lifetime },
    topConsumers,
    lastLimitTriggeredAt,
  };
}

export default {
  configureRateLimitMetrics,
  resetRateLimitMetrics,
  recordRateLimitAttempt,
  recordRateLimitSuccess,
  recordRateLimitBlocked,
  getRateLimitSnapshot,
};

