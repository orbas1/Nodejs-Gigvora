import { Op } from 'sequelize';
import {
  AdminTimeline,
  AdminTimelineEvent,
  ADMIN_TIMELINE_EVENT_STATUSES,
  ADMIN_TIMELINE_EVENT_TYPES,
  ADMIN_TIMELINE_STATUSES,
  ADMIN_TIMELINE_VISIBILITIES,
  sequelize,
} from '../models/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const TIMELINE_STATUS_SET = new Set(ADMIN_TIMELINE_STATUSES);
const VISIBILITY_SET = new Set(ADMIN_TIMELINE_VISIBILITIES);
const EVENT_STATUS_SET = new Set(ADMIN_TIMELINE_EVENT_STATUSES);
const EVENT_TYPE_SET = new Set(ADMIN_TIMELINE_EVENT_TYPES);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const LIKE_OPERATOR = ['postgres', 'postgresql'].includes(sequelize.getDialect()) ? Op.iLike : Op.like;

function slugify(value, fallback = 'timeline') {
  const base = `${value ?? ''}`.trim().toLowerCase();
  const sanitized = base
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (sanitized) {
    return sanitized;
  }
  return `${fallback}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureUniqueSlug(desiredSlug, { excludeId, transaction } = {}) {
  let candidate = slugify(desiredSlug);
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await AdminTimeline.findOne({ where, transaction, paranoid: false });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugify(desiredSlug)}-${suffix}`;
  }
}

function normalizePagination({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const currentPage = Number.isFinite(Number(page)) ? Math.max(1, Number.parseInt(page, 10)) : 1;
  const sizeCandidate = Number.isFinite(Number(pageSize)) ? Number.parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE;
  const normalizedPageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, sizeCandidate));
  const offset = (currentPage - 1) * normalizedPageSize;
  return { page: currentPage, pageSize: normalizedPageSize, offset };
}

function normalizeTags(input) {
  if (input == null) {
    return [];
  }
  const values = Array.isArray(input)
    ? input
    : `${input}`
        .split(',')
        .map((value) => value.trim());
  const unique = Array.from(new Set(values.filter((value) => value.length > 0 && value.length <= 80)));
  return unique;
}

function normalizeUrl(value) {
  if (!value) {
    return null;
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  if (!/^https?:\/\//i.test(text)) {
    return text;
  }
  return text;
}

function normalizeDate(input, { fieldName }) {
  if (input == null || input === '') {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function normalizeAttachments(input) {
  if (input == null) {
    return [];
  }
  const items = Array.isArray(input) ? input : [input];
  return items
    .map((item) => {
      if (!item) {
        return null;
      }
      if (typeof item === 'string') {
        const url = normalizeUrl(item);
        if (!url) {
          return null;
        }
        return { label: null, url };
      }
      if (typeof item === 'object') {
        const url = normalizeUrl(item.url ?? item.href ?? item.link ?? null);
        if (!url) {
          return null;
        }
        const label = item.label ?? item.title ?? null;
        const description = item.description ?? null;
        return {
          label: label ? `${label}`.trim() : null,
          url,
          description: description ? `${description}`.trim() : null,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 15);
}

function normalizeEventPayload(payload = {}, { isUpdate = false } = {}) {
  const result = {};
  if (!isUpdate || payload.title !== undefined) {
    const title = `${payload.title ?? ''}`.trim();
    if (!title) {
      throw new ValidationError('Event title is required.');
    }
    result.title = title;
  }
  if (payload.summary !== undefined) {
    result.summary = payload.summary ? `${payload.summary}`.trim() : null;
  }
  if (payload.description !== undefined) {
    result.description = payload.description ? `${payload.description}`.trim() : null;
  }
  if (payload.eventType !== undefined) {
    const type = `${payload.eventType}`.trim().toLowerCase();
    if (!EVENT_TYPE_SET.has(type)) {
      throw new ValidationError(`Event type must be one of: ${Array.from(EVENT_TYPE_SET).join(', ')}.`);
    }
    result.eventType = type;
  }
  if (payload.status !== undefined) {
    const status = `${payload.status}`.trim().toLowerCase();
    if (!EVENT_STATUS_SET.has(status)) {
      throw new ValidationError(`Event status must be one of: ${Array.from(EVENT_STATUS_SET).join(', ')}.`);
    }
    result.status = status;
  }
  if (payload.startDate !== undefined) {
    result.startDate = normalizeDate(payload.startDate, { fieldName: 'startDate' });
  }
  if (payload.dueDate !== undefined) {
    result.dueDate = normalizeDate(payload.dueDate, { fieldName: 'dueDate' });
  }
  if (payload.endDate !== undefined) {
    result.endDate = normalizeDate(payload.endDate, { fieldName: 'endDate' });
  }
  if (payload.ownerId !== undefined) {
    if (payload.ownerId == null || payload.ownerId === '') {
      result.ownerId = null;
    } else {
      const parsed = Number.parseInt(payload.ownerId, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new ValidationError('ownerId must be a valid integer.');
      }
      result.ownerId = parsed;
    }
  }
  if (payload.ownerName !== undefined) {
    result.ownerName = payload.ownerName ? `${payload.ownerName}`.trim() : null;
  }
  if (payload.ownerEmail !== undefined) {
    result.ownerEmail = payload.ownerEmail ? `${payload.ownerEmail}`.trim().toLowerCase() : null;
  }
  if (payload.location !== undefined) {
    result.location = payload.location ? `${payload.location}`.trim() : null;
  }
  if (payload.ctaLabel !== undefined) {
    result.ctaLabel = payload.ctaLabel ? `${payload.ctaLabel}`.trim() : null;
  }
  if (payload.ctaUrl !== undefined) {
    result.ctaUrl = normalizeUrl(payload.ctaUrl);
  }
  if (payload.tags !== undefined) {
    result.tags = normalizeTags(payload.tags);
  }
  if (payload.attachments !== undefined) {
    result.attachments = normalizeAttachments(payload.attachments);
  }
  if (payload.metadata !== undefined) {
    result.metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  }
  if (payload.orderIndex !== undefined) {
    const order = Number.parseInt(payload.orderIndex, 10);
    if (!Number.isInteger(order) || order < 0) {
      throw new ValidationError('orderIndex must be a non-negative integer.');
    }
    result.orderIndex = order;
  }
  return result;
}

function normalizeTimelinePayload(payload = {}, { isUpdate = false } = {}) {
  const result = {};
  if (!isUpdate || payload.name !== undefined) {
    const name = `${payload.name ?? ''}`.trim();
    if (!name) {
      throw new ValidationError('Timeline name is required.');
    }
    result.name = name;
  }
  if (payload.summary !== undefined) {
    result.summary = payload.summary ? `${payload.summary}`.trim() : null;
  }
  if (payload.description !== undefined) {
    result.description = payload.description ? `${payload.description}`.trim() : null;
  }
  if (payload.timelineType !== undefined) {
    result.timelineType = payload.timelineType ? `${payload.timelineType}`.trim().toLowerCase() : null;
  }
  if (payload.status !== undefined) {
    const status = `${payload.status}`.trim().toLowerCase();
    if (!TIMELINE_STATUS_SET.has(status)) {
      throw new ValidationError(`Status must be one of: ${Array.from(TIMELINE_STATUS_SET).join(', ')}.`);
    }
    result.status = status;
  }
  if (payload.visibility !== undefined) {
    const visibility = `${payload.visibility}`.trim().toLowerCase();
    if (!VISIBILITY_SET.has(visibility)) {
      throw new ValidationError(`Visibility must be one of: ${Array.from(VISIBILITY_SET).join(', ')}.`);
    }
    result.visibility = visibility;
  }
  if (payload.startDate !== undefined) {
    result.startDate = normalizeDate(payload.startDate, { fieldName: 'startDate' });
  }
  if (payload.endDate !== undefined) {
    result.endDate = normalizeDate(payload.endDate, { fieldName: 'endDate' });
  }
  if (payload.heroImageUrl !== undefined) {
    result.heroImageUrl = normalizeUrl(payload.heroImageUrl);
  }
  if (payload.thumbnailUrl !== undefined) {
    result.thumbnailUrl = normalizeUrl(payload.thumbnailUrl);
  }
  if (payload.tags !== undefined) {
    result.tags = normalizeTags(payload.tags);
  }
  if (payload.settings !== undefined) {
    result.settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : {};
  }
  if (!isUpdate && payload.slug) {
    result.slug = slugify(payload.slug);
  }
  if (isUpdate && payload.slug !== undefined) {
    result.slug = `${payload.slug}`.trim();
  }
  return result;
}

async function reloadTimeline(timeline, { transaction } = {}) {
  if (!timeline) {
    return null;
  }
  await timeline.reload({
    include: [
      {
        model: AdminTimelineEvent,
        as: 'events',
        separate: true,
        order: [
          ['orderIndex', 'ASC'],
          ['dueDate', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      { association: 'creator' },
      { association: 'updater' },
    ],
    transaction,
  });
  return timeline;
}

async function listTimelines(filters = {}) {
  const { search, status, visibility, timelineType, includeArchived = false } = filters;
  const pagination = normalizePagination(filters);
  const where = {};

  if (status) {
    const normalized = `${status}`.trim().toLowerCase();
    if (!TIMELINE_STATUS_SET.has(normalized)) {
      throw new ValidationError(`Invalid status filter. Allowed: ${Array.from(TIMELINE_STATUS_SET).join(', ')}.`);
    }
    where.status = normalized;
  } else if (!includeArchived) {
    where.status = { [Op.ne]: 'archived' };
  }

  if (visibility) {
    const normalized = `${visibility}`.trim().toLowerCase();
    if (!VISIBILITY_SET.has(normalized)) {
      throw new ValidationError(`Invalid visibility filter. Allowed: ${Array.from(VISIBILITY_SET).join(', ')}.`);
    }
    where.visibility = normalized;
  }

  if (timelineType) {
    where.timelineType = `${timelineType}`.trim().toLowerCase();
  }

  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    where[Op.or] = [
      { name: { [LIKE_OPERATOR]: term } },
      { summary: { [LIKE_OPERATOR]: term } },
      { description: { [LIKE_OPERATOR]: term } },
    ];
  }

  const { count, rows } = await AdminTimeline.findAndCountAll({
    where,
    limit: pagination.pageSize,
    offset: pagination.offset,
    order: [
      ['status', 'ASC'],
      ['startDate', 'ASC'],
      ['name', 'ASC'],
    ],
    include: [
      {
        model: AdminTimelineEvent,
        as: 'events',
        separate: true,
        order: [
          ['orderIndex', 'ASC'],
          ['dueDate', 'ASC'],
          ['id', 'ASC'],
        ],
      },
    ],
    distinct: true,
  });

  const results = rows.map((timeline) => timeline.toPublicObject());
  const pageCount = Math.ceil(count / pagination.pageSize) || 1;

  return {
    results,
    total: count,
    page: pagination.page,
    pageSize: pagination.pageSize,
    pageCount,
  };
}

async function getTimeline(timelineId) {
  const timeline = await AdminTimeline.findByPk(timelineId, {
    include: [
      {
        model: AdminTimelineEvent,
        as: 'events',
        separate: true,
        order: [
          ['orderIndex', 'ASC'],
          ['dueDate', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      { association: 'creator' },
      { association: 'updater' },
    ],
  });
  if (!timeline) {
    throw new NotFoundError('Timeline not found.');
  }
  return timeline.toPublicObject();
}

async function createTimeline(payload, { actorId } = {}) {
  const normalized = normalizeTimelinePayload(payload, { isUpdate: false });
  return sequelize.transaction(async (transaction) => {
    const slug = await ensureUniqueSlug(normalized.slug ?? normalized.name, { transaction });
    const timeline = await AdminTimeline.create(
      {
        ...normalized,
        slug,
        createdBy: actorId ?? null,
        updatedBy: actorId ?? null,
      },
      { transaction },
    );

    const eventPayloads = Array.isArray(payload.events) ? payload.events : [];
    if (eventPayloads.length) {
      const eventsToCreate = eventPayloads.map((event, index) => {
        const data = normalizeEventPayload(event, { isUpdate: false });
        return {
          ...data,
          timelineId: timeline.id,
          orderIndex: index,
        };
      });
      if (eventsToCreate.length) {
        await AdminTimelineEvent.bulkCreate(eventsToCreate, { transaction });
      }
    }

    await reloadTimeline(timeline, { transaction });
    return timeline.toPublicObject();
  });
}

async function updateTimeline(timelineId, payload, { actorId } = {}) {
  const timeline = await AdminTimeline.findByPk(timelineId);
  if (!timeline) {
    throw new NotFoundError('Timeline not found.');
  }
  const normalized = normalizeTimelinePayload(payload, { isUpdate: true });

  return sequelize.transaction(async (transaction) => {
    if (normalized.slug) {
      normalized.slug = await ensureUniqueSlug(normalized.slug, { excludeId: timeline.id, transaction });
    }
    timeline.set({
      ...normalized,
      updatedBy: actorId ?? timeline.updatedBy ?? null,
    });
    await timeline.save({ transaction });
    await reloadTimeline(timeline, { transaction });
    return timeline.toPublicObject();
  });
}

async function deleteTimeline(timelineId) {
  const timeline = await AdminTimeline.findByPk(timelineId);
  if (!timeline) {
    throw new NotFoundError('Timeline not found.');
  }
  await sequelize.transaction(async (transaction) => {
    await AdminTimelineEvent.destroy({ where: { timelineId }, transaction });
    await timeline.destroy({ transaction });
  });
}

async function createTimelineEvent(timelineId, payload) {
  const timeline = await AdminTimeline.findByPk(timelineId);
  if (!timeline) {
    throw new NotFoundError('Timeline not found.');
  }
  const normalized = normalizeEventPayload(payload, { isUpdate: false });
  return sequelize.transaction(async (transaction) => {
    const maxOrder = await AdminTimelineEvent.max('orderIndex', { where: { timelineId }, transaction });
    const desiredOrder = normalized.orderIndex ?? (Number.isInteger(maxOrder) ? maxOrder + 1 : 0);
    const event = await AdminTimelineEvent.create(
      {
        ...normalized,
        timelineId,
        orderIndex: Math.max(0, desiredOrder),
      },
      { transaction },
    );

    if (normalized.orderIndex !== undefined) {
      const events = await AdminTimelineEvent.findAll({
        where: { timelineId },
        order: [
          ['orderIndex', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction,
      });
      await Promise.all(
        events.map((item, index) => {
          if (item.orderIndex !== index) {
            item.orderIndex = index;
            return item.save({ transaction });
          }
          return null;
        }),
      );
    }

    await reloadTimeline(timeline, { transaction });
    return event.toPublicObject();
  });
}

async function updateTimelineEvent(timelineId, eventId, payload) {
  const event = await AdminTimelineEvent.findOne({ where: { id: eventId, timelineId } });
  if (!event) {
    throw new NotFoundError('Timeline event not found.');
  }
  const normalized = normalizeEventPayload(payload, { isUpdate: true });
  return sequelize.transaction(async (transaction) => {
    event.set(normalized);
    await event.save({ transaction });

    if (normalized.orderIndex !== undefined) {
      const events = await AdminTimelineEvent.findAll({
        where: { timelineId },
        order: [
          ['orderIndex', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction,
      });
      const reordered = events
        .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
        .map((item, index) => ({ event: item, index }));
      await Promise.all(
        reordered.map(({ event: item, index }) => {
          if (item.orderIndex !== index) {
            item.orderIndex = index;
            return item.save({ transaction });
          }
          return null;
        }),
      );
    }

    return event.toPublicObject();
  });
}

async function deleteTimelineEvent(timelineId, eventId) {
  const event = await AdminTimelineEvent.findOne({ where: { id: eventId, timelineId } });
  if (!event) {
    throw new NotFoundError('Timeline event not found.');
  }
  await sequelize.transaction(async (transaction) => {
    await event.destroy({ transaction });
    const events = await AdminTimelineEvent.findAll({
      where: { timelineId },
      order: [
        ['orderIndex', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction,
    });
    await Promise.all(
      events.map((item, index) => {
        if (item.orderIndex !== index) {
          item.orderIndex = index;
          return item.save({ transaction });
        }
        return null;
      }),
    );
  });
}

async function reorderTimelineEvents(timelineId, orderedIds = []) {
  const timeline = await AdminTimeline.findByPk(timelineId);
  if (!timeline) {
    throw new NotFoundError('Timeline not found.');
  }
  const ids = Array.isArray(orderedIds) ? orderedIds.map((id) => Number.parseInt(id, 10)).filter(Number.isFinite) : [];
  if (!ids.length) {
    return getTimeline(timelineId);
  }
  return sequelize.transaction(async (transaction) => {
    const events = await AdminTimelineEvent.findAll({
      where: { timelineId },
      transaction,
    });
    const eventMap = new Map(events.map((item) => [item.id, item]));
    const ordered = [];
    ids.forEach((id) => {
      const event = eventMap.get(id);
      if (event) {
        ordered.push(event);
        eventMap.delete(id);
      }
    });
    eventMap.forEach((event) => ordered.push(event));

    await Promise.all(
      ordered.map((event, index) => {
        if (event.orderIndex !== index) {
          event.orderIndex = index;
          return event.save({ transaction });
        }
        return null;
      }),
    );

    await reloadTimeline(timeline, { transaction });
    return timeline.toPublicObject();
  });
}

export default {
  listTimelines,
  getTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  reorderTimelineEvents,
};
