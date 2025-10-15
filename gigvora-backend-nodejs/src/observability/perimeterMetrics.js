const perimeterState = new Map();

function ensureEntry(origin) {
  const key = origin || 'unknown';
  if (!perimeterState.has(key)) {
    perimeterState.set(key, {
      origin: key,
      attempts: 0,
      firstBlockedAt: null,
      lastBlockedAt: null,
      paths: new Map(),
    });
  }
  return perimeterState.get(key);
}

function normalisePath(path, method) {
  const safePath = typeof path === 'string' && path.length > 0 ? path.split('?')[0] : '/';
  const safeMethod = typeof method === 'string' && method.length > 0 ? method.toUpperCase() : 'GET';
  return `${safeMethod} ${safePath}`;
}

export function recordBlockedOrigin(origin, { path, method } = {}) {
  const entry = ensureEntry(origin);
  const now = new Date();
  entry.attempts += 1;
  entry.lastBlockedAt = now.toISOString();
  if (!entry.firstBlockedAt) {
    entry.firstBlockedAt = entry.lastBlockedAt;
  }

  const route = normalisePath(path, method);
  const pathStats = entry.paths.get(route) ?? { count: 0, lastSeenAt: null };
  pathStats.count += 1;
  pathStats.lastSeenAt = entry.lastBlockedAt;
  entry.paths.set(route, pathStats);

  return {
    entry: {
      origin: entry.origin,
      attempts: entry.attempts,
      firstBlockedAt: entry.firstBlockedAt,
      lastBlockedAt: entry.lastBlockedAt,
      paths: Array.from(entry.paths.entries()).map(([routeKey, stats]) => ({
        route: routeKey,
        count: stats.count,
        lastSeenAt: stats.lastSeenAt,
      })),
    },
  };
}

export function getPerimeterSnapshot() {
  const blockedOrigins = Array.from(perimeterState.values())
    .map((entry) => ({
      origin: entry.origin,
      attempts: entry.attempts,
      firstBlockedAt: entry.firstBlockedAt,
      lastBlockedAt: entry.lastBlockedAt,
      paths: Array.from(entry.paths.entries()).map(([route, stats]) => ({
        route,
        count: stats.count,
        lastSeenAt: stats.lastSeenAt,
      })),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const totalBlocked = blockedOrigins.reduce((acc, entry) => acc + entry.attempts, 0);

  return {
    totalBlocked,
    lastBlockedAt: blockedOrigins[0]?.lastBlockedAt ?? null,
    blockedOrigins,
  };
}

export function resetPerimeterMetrics() {
  perimeterState.clear();
}

export default {
  recordBlockedOrigin,
  getPerimeterSnapshot,
  resetPerimeterMetrics,
};
