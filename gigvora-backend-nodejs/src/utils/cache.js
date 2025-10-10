import crypto from 'crypto';

const DEFAULT_TTL_SECONDS = Number.parseInt(process.env.CACHE_TTL_SECONDS ?? '120', 10);

class MemoryCache {
  constructor({ defaultTtlSeconds = DEFAULT_TTL_SECONDS, maxEntries = 5000 } = {}) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.maxEntries = maxEntries;
    this.store = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  get(key) {
    const cached = this.store.get(key);
    if (!cached) {
      this.metrics.misses += 1;
      return undefined;
    }

    if (cached.expiresAt !== 0 && cached.expiresAt < Date.now()) {
      this.store.delete(key);
      this.metrics.misses += 1;
      return undefined;
    }

    this.metrics.hits += 1;
    return cached.value;
  }

  set(key, value, ttlSeconds = this.defaultTtlSeconds) {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.metrics.evictions += 1;
      }
    }

    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.store.set(key, { value, expiresAt });
    return value;
  }

  delete(key) {
    this.store.delete(key);
  }

  flushByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async remember(key, ttlSeconds, resolver) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await resolver();
    this.set(key, value, ttlSeconds);
    return value;
  }

  stats() {
    return { ...this.metrics, size: this.store.size };
  }
}

export function buildCacheKey(namespace, payload) {
  const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `${namespace}:${hash}`;
}

export const appCache = new MemoryCache();

export default {
  MemoryCache,
  buildCacheKey,
  appCache,
};
