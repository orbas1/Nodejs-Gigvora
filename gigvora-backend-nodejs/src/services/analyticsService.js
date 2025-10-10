import { Op } from 'sequelize';
import {
  sequelize,
  AnalyticsEvent,
  AnalyticsDailyRollup,
  ANALYTICS_ACTOR_TYPES,
} from '../models/index.js';
import { ValidationError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const EVENTS_CACHE_TTL = 30;
const ROLLUP_CACHE_TTL = 120;

function assertActorType(actorType) {
  if (!ANALYTICS_ACTOR_TYPES.includes(actorType)) {
    throw new ValidationError(`Unsupported actor type "${actorType}".`);
  }
}

export async function trackEvent(eventPayload) {
  const { eventName, userId = null, actorType = 'user', entityType = null, entityId = null, source = null, context = null, occurredAt = new Date() } = eventPayload;

  if (!eventName) {
    throw new ValidationError('eventName is required to record an analytics event.');
  }
  assertActorType(actorType);

  const event = await AnalyticsEvent.create({
    eventName,
    userId,
    actorType,
    entityType,
    entityId,
    source,
    context: context && typeof context === 'object' ? context : null,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    ingestedAt: new Date(),
  });

  appCache.flushByPrefix('analytics:events');
  return event.get({ plain: true });
}

export async function listEvents(filters = {}, pagination = {}) {
  const { page = 1, pageSize = 50 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 50, 1), 500);
  const offset = (safePage - 1) * safeSize;

  const cacheKey = buildCacheKey('analytics:events', { filters, safePage, safeSize });

  return appCache.remember(cacheKey, EVENTS_CACHE_TTL, async () => {
    const where = {};
    if (filters.eventName) {
      where.eventName = { [Op.iLike ?? Op.like]: `%${filters.eventName.trim()}%` };
    }
    if (filters.actorType) {
      assertActorType(filters.actorType);
      where.actorType = filters.actorType;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.occurredAt = {};
      if (filters.dateFrom) {
        where.occurredAt[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.occurredAt[Op.lte] = new Date(filters.dateTo);
      }
    }

    const { rows, count } = await AnalyticsEvent.findAndCountAll({
      where,
      order: [['occurredAt', 'DESC']],
      limit: safeSize,
      offset,
    });

    return {
      data: rows.map((row) => row.get({ plain: true })),
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
    };
  });
}

export async function upsertDailyRollup({ metricKey, date, dimensionHash, value, dimensions = {} }) {
  if (!metricKey || !date || !dimensionHash) {
    throw new ValidationError('metricKey, date, and dimensionHash are required.');
  }

  const rollup = await sequelize.transaction(async (trx) => {
    const [record] = await AnalyticsDailyRollup.findOrCreate({
      where: { metricKey, date, dimensionHash },
      defaults: {
        metricKey,
        date,
        dimensionHash,
        value,
        dimensions,
      },
      transaction: trx,
    });

    if (!record.isNewRecord) {
      record.value = value;
      record.dimensions = dimensions;
      await record.save({ transaction: trx });
    }

    return record;
  });

  appCache.flushByPrefix(`analytics:rollup:${metricKey}`);
  return rollup.get({ plain: true });
}

export async function getDailyRollup(metricKey, { dateFrom, dateTo, dimensionHash } = {}) {
  if (!metricKey) {
    throw new ValidationError('metricKey is required.');
  }

  const cacheKey = buildCacheKey(`analytics:rollup:${metricKey}`, { dateFrom, dateTo, dimensionHash });

  return appCache.remember(cacheKey, ROLLUP_CACHE_TTL, async () => {
    const where = { metricKey };
    if (dimensionHash) {
      where.dimensionHash = dimensionHash;
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date[Op.gte] = dateFrom;
      }
      if (dateTo) {
        where.date[Op.lte] = dateTo;
      }
    }

    const rows = await AnalyticsDailyRollup.findAll({
      where,
      order: [['date', 'ASC']],
    });

    return rows.map((row) => row.get({ plain: true }));
  });
}

export default {
  trackEvent,
  listEvents,
  upsertDailyRollup,
  getDailyRollup,
};
