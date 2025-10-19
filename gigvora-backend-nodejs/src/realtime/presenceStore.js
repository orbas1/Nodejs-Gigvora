const FIVE_MINUTES_SECONDS = 5 * 60;

function createInMemoryPresenceStore({ logger }) {
  const presence = new Map();

  return {
    async trackJoin(userId, metadata) {
      const entries = presence.get(userId) ?? [];
      entries.push({ ...metadata, trackedAt: new Date().toISOString() });
      presence.set(userId, entries);
    },
    async trackLeave(userId, metadata, reason) {
      const entries = presence.get(userId) ?? [];
      const filtered = entries.filter((entry) => entry.socketId !== metadata.socketId);
      if (filtered.length === 0) {
        presence.delete(userId);
      } else {
        presence.set(userId, filtered);
      }
      if (reason && logger) {
        logger.debug({ userId, reason }, 'Realtime presence leave event recorded.');
      }
    },
    async setUserPresence(userId, payload) {
      presence.set(userId, payload);
    },
    async getUserPresence(userId) {
      return presence.get(userId) ?? [];
    },
  };
}

export function createPresenceStore({ redisClient, keyPrefix = 'gigvora:realtime:presence', logger }) {
  if (!redisClient) {
    return createInMemoryPresenceStore({ logger });
  }

  const summaryKey = (userId) => `${keyPrefix}:summary:${userId}`;
  const detailKey = (userId) => `${keyPrefix}:detail:${userId}`;

  return {
    async trackJoin(userId, metadata) {
      const key = detailKey(userId);
      await redisClient.hset(key, metadata.socketId, JSON.stringify({ ...metadata, trackedAt: new Date().toISOString() }));
      await redisClient.expire(key, FIVE_MINUTES_SECONDS);
    },
    async trackLeave(userId, metadata, reason) {
      const key = detailKey(userId);
      await redisClient.hdel(key, metadata.socketId);
      if (reason && logger) {
        logger.debug({ userId, reason }, 'Realtime presence leave event recorded.');
      }
    },
    async setUserPresence(userId, payload) {
      const key = summaryKey(userId);
      await redisClient.set(key, JSON.stringify(payload), 'EX', FIVE_MINUTES_SECONDS);
    },
    async getUserPresence(userId) {
      const key = summaryKey(userId);
      const raw = await redisClient.get(key);
      if (!raw) {
        return [];
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [];
      } catch (error) {
        logger?.warn({ err: error }, 'Failed to parse realtime presence payload.');
        return [];
      }
    },
  };
}

export default createPresenceStore;
