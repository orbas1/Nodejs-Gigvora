import { Op } from 'sequelize';

import {
  RuntimeAnnouncement,
  normaliseAnnouncementSeverity,
  normaliseAnnouncementStatus,
} from '../models/runtimeAnnouncement.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const ALLOWED_AUDIENCES = new Set([
  'public',
  'authenticated',
  'user',
  'provider',
  'company',
  'agency',
  'admin',
  'operations',
]);

const ALLOWED_CHANNELS = new Set(['web', 'mobile', 'email', 'sms', 'push', 'api']);

const DEFAULT_WINDOW_MINUTES = 90;
const MAX_WINDOW_MINUTES = 24 * 60;
const DEFAULT_LIMIT = 20;

function now() {
  return new Date();
}

function sanitizeText(value, { field, max = 2000, required = true }) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${field} is required.`);
    }
    return '';
  }
  const text = `${value}`.trim();
  if (!text && required) {
    throw new ValidationError(`${field} is required.`);
  }
  if (text.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters.`);
  }
  return text;
}

function toSlug(value, fallback = 'announcement') {
  const text = `${value}`.trim().toLowerCase();
  const base = text
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (base.length) {
    return base.slice(0, 140);
  }
  return `${fallback}-${Date.now()}`;
}

function sanitizeStringList(values, allowedSet, { fallback }) {
  if (!values) {
    return fallback;
  }
  const normalized = Array.isArray(values) ? values : [values];
  const cleaned = normalized
    .map((entry) => `${entry}`.trim().toLowerCase())
    .filter((entry) => entry.length > 0 && entry.length <= 120);

  if (!cleaned.length) {
    return fallback;
  }

  const filtered = allowedSet?.size
    ? cleaned.filter((entry) => allowedSet.has(entry))
    : cleaned;

  const unique = Array.from(new Set(filtered));
  return unique.length ? unique : fallback;
}

function sanitizeAudiences(audiences) {
  return sanitizeStringList(audiences, ALLOWED_AUDIENCES, { fallback: ['public'] });
}

function sanitizeChannels(channels) {
  return sanitizeStringList(channels, ALLOWED_CHANNELS, { fallback: ['web', 'mobile'] });
}

function coerceDate(value, { field, allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError(`${field} is required.`);
  }
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      throw new ValidationError(`${field} must be a valid date.`);
    }
    return value;
  }
  const parsed = Date.parse(`${value}`);
  if (Number.isNaN(parsed)) {
    throw new ValidationError(`${field} must be a valid date.`);
  }
  return new Date(parsed);
}

function assertChronology(startsAt, endsAt) {
  if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
    throw new ValidationError('The maintenance window end must be after the start time.');
  }
}

function normaliseMetadata(metadata) {
  if (metadata == null) {
    return {};
  }
  if (typeof metadata !== 'object') {
    throw new ValidationError('Metadata must be an object.');
  }
  return { ...metadata };
}

function resolveActorLabel(actor) {
  if (!actor) {
    return null;
  }
  if (typeof actor === 'string') {
    return actor;
  }
  const { id, email, type, name } = actor;
  if (email) {
    return email;
  }
  if (name) {
    return name;
  }
  if (id != null && type) {
    return `${type}:${id}`;
  }
  if (id != null) {
    return `user:${id}`;
  }
  return null;
}

function buildMutationPayload(payload = {}, { existing } = {}) {
  const baseline = existing ? existing.get({ plain: true }) : {};
  const title = sanitizeText(payload.title ?? baseline.title, { field: 'Title', max: 240 });
  const message = sanitizeText(payload.message ?? baseline.message, { field: 'Message', max: 5000 });
  const severity = normaliseAnnouncementSeverity(payload.severity ?? baseline.severity ?? 'info');
  const status = normaliseAnnouncementStatus(payload.status ?? baseline.status ?? 'draft');
  const slugInput = payload.slug ?? baseline.slug ?? toSlug(title);
  const slug = toSlug(slugInput, toSlug(title));
  const audiences = sanitizeAudiences(payload.audiences ?? baseline.audiences);
  const channels = sanitizeChannels(payload.channels ?? baseline.channels);
  const dismissible = payload.dismissible != null ? Boolean(payload.dismissible) : baseline.dismissible ?? true;
  const metadata = normaliseMetadata(payload.metadata ?? baseline.metadata ?? {});

  const startsAt = payload.startsAt != null ? coerceDate(payload.startsAt, { field: 'startsAt' }) : baseline.startsAt
    ? new Date(baseline.startsAt)
    : null;
  const endsAt = payload.endsAt != null ? coerceDate(payload.endsAt, { field: 'endsAt' }) : baseline.endsAt
    ? new Date(baseline.endsAt)
    : null;

  assertChronology(startsAt, endsAt);

  const record = {
    slug,
    title,
    message,
    severity,
    status,
    audiences,
    channels,
    dismissible,
    metadata,
    startsAt,
    endsAt,
  };

  const current = now();
  if (record.status === 'active') {
    record.startsAt = record.startsAt ?? current;
    if (record.endsAt && record.endsAt.getTime() <= current.getTime()) {
      throw new ValidationError('Active maintenance windows must end in the future.');
    }
  }

  if (record.status === 'scheduled') {
    record.startsAt = record.startsAt ?? current;
    if (record.startsAt.getTime() < current.getTime() - 60 * 1000) {
      throw new ValidationError('Scheduled maintenance windows must start in the future.');
    }
  }

  if (record.status === 'resolved') {
    record.endsAt = record.endsAt ?? current;
  }

  return record;
}

function matchesChannel(announcement, channel) {
  if (!channel) {
    return true;
  }
  const normalized = `${channel}`.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const channels = Array.isArray(announcement.channels)
    ? announcement.channels.map((entry) => `${entry}`.trim().toLowerCase())
    : [];
  if (!channels.length) {
    return true;
  }
  if (channels.includes('all')) {
    return true;
  }
  return channels.includes(normalized);
}

async function findAnnouncement(identifier) {
  if (identifier == null) {
    throw new NotFoundError('Announcement not found.');
  }
  let announcement = null;
  if (Number.isInteger(identifier) || (/^\d+$/.test(`${identifier}`) && `${identifier}`.length < 16)) {
    announcement = await RuntimeAnnouncement.findByPk(Number(identifier));
  }
  if (!announcement) {
    announcement = await RuntimeAnnouncement.findOne({ where: { slug: `${identifier}` } });
  }
  if (!announcement) {
    throw new NotFoundError('Announcement not found.');
  }
  return announcement;
}

export async function createAnnouncement(payload, { actor } = {}) {
  const record = buildMutationPayload(payload);
  const actorLabel = resolveActorLabel(actor);
  if (actorLabel) {
    record.createdBy = actorLabel;
    record.updatedBy = actorLabel;
  }
  const announcement = await RuntimeAnnouncement.create(record);
  return announcement.toPublicObject();
}

export async function updateAnnouncement(identifier, payload, { actor } = {}) {
  const announcement = await findAnnouncement(identifier);
  const mutation = buildMutationPayload(payload, { existing: announcement });
  const actorLabel = resolveActorLabel(actor);
  if (actorLabel) {
    mutation.updatedBy = actorLabel;
  }
  await announcement.update(mutation);
  return announcement.toPublicObject();
}

export async function updateAnnouncementStatus(identifier, status, { actor } = {}) {
  const announcement = await findAnnouncement(identifier);
  const normalizedStatus = normaliseAnnouncementStatus(status);
  const mutation = buildMutationPayload({ ...announcement.get({ plain: true }), status: normalizedStatus }, {
    existing: announcement,
  });
  const actorLabel = resolveActorLabel(actor);
  if (actorLabel) {
    mutation.updatedBy = actorLabel;
  }
  await announcement.update(mutation);
  return announcement.toPublicObject();
}

export async function listAnnouncements({
  status,
  audience,
  channel,
  includeResolved = true,
  limit = 50,
  offset = 0,
  search,
} = {}) {
  const where = {};
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    where.status = { [Op.in]: statuses.map((entry) => normaliseAnnouncementStatus(entry)) };
  } else if (!includeResolved) {
    where.status = { [Op.ne]: 'resolved' };
  }
  const options = {
    where,
    order: [
      ['startsAt', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
    offset: Math.max(Number(offset) || 0, 0),
  };

  const [announcements, total] = await Promise.all([
    RuntimeAnnouncement.findAll(options),
    RuntimeAnnouncement.count({ where }),
  ]);

  const searchTerm = search ? `${search}`.trim().toLowerCase() : null;

  const filtered = announcements
    .filter((announcement) => announcement.targetsAudience(audience))
    .filter((announcement) => matchesChannel(announcement, channel))
    .filter((announcement) => {
      if (!searchTerm) {
        return true;
      }
      const payload = `${announcement.slug} ${announcement.title} ${announcement.message}`.toLowerCase();
      return payload.includes(searchTerm);
    })
    .map((announcement) => announcement.toPublicObject());

  return {
    total,
    filteredCount: filtered.length,
    records: filtered,
  };
}

export async function getVisibleAnnouncements({
  audience,
  channel,
  windowMinutes = DEFAULT_WINDOW_MINUTES,
  includeResolved = false,
  limit = DEFAULT_LIMIT,
} = {}) {
  const normalizedWindow = Math.min(Math.max(Number(windowMinutes) || DEFAULT_WINDOW_MINUTES, 5), MAX_WINDOW_MINUTES);
  const lookAhead = new Date(now().getTime() + normalizedWindow * 60 * 1000);
  const currentTime = now();

  const candidates = await RuntimeAnnouncement.findAll({
    where: {
      [Op.and]: [
        includeResolved
          ? { status: { [Op.ne]: 'draft' } }
          : { status: { [Op.in]: ['active', 'scheduled'] } },
        {
          [Op.or]: [
            { startsAt: null },
            { startsAt: { [Op.lte]: lookAhead } },
          ],
        },
        {
          [Op.or]: [
            { endsAt: null },
            { endsAt: { [Op.gte]: currentTime } },
          ],
        },
      ],
    },
    order: [
      ['status', 'DESC'],
      ['startsAt', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  const filtered = candidates
    .filter((announcement) => announcement.targetsAudience(audience))
    .filter((announcement) => matchesChannel(announcement, channel))
    .filter((announcement) => {
      if (includeResolved) {
        return true;
      }
      if (announcement.status === 'resolved') {
        return false;
      }
      if (announcement.isActiveAt(currentTime)) {
        return true;
      }
      return announcement.isUpcomingWithin(normalizedWindow * 60 * 1000, currentTime);
    })
    .slice(0, Math.max(Number(limit) || DEFAULT_LIMIT, 1))
    .map((announcement) => announcement.toPublicObject());

  return {
    generatedAt: new Date().toISOString(),
    announcements: filtered,
    windowMinutes: normalizedWindow,
  };
}

export async function getAnnouncement(identifier) {
  const announcement = await findAnnouncement(identifier);
  return announcement.toPublicObject();
}

