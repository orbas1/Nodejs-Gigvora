import { Op } from 'sequelize';
import {
  RecruitingCalendarEvent,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import calendarContract from '../../../shared-contracts/domain/platform/calendar/constants.js';

const {
  COMPANY_CALENDAR_EVENT_TYPES,
  COMPANY_CALENDAR_EVENT_TYPE_SET,
  normalizeCompanyCalendarEventType,
} = calendarContract;

const SUPPORTED_EVENT_TYPES = COMPANY_CALENDAR_EVENT_TYPES;
const SUPPORTED_EVENT_TYPE_SET = COMPANY_CALENDAR_EVENT_TYPE_SET;
const READ_ONLY_ROLES = new Set(['viewer']);
const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_LOOKAHEAD_DAYS = 45;
const MAX_EVENTS_LIMIT = 500;
const DEFAULT_LIMIT = 250;

function normaliseEventType(value) {
  const normalised = normalizeCompanyCalendarEventType(value);
  if (!normalised || !SUPPORTED_EVENT_TYPE_SET.has(normalised)) {
    return null;
  }
  return normalised;
}

function normaliseEventTypes(input) {
  if (!input) {
    return [];
  }
  const source = Array.isArray(input) ? input : `${input}`.split(',');
  const unique = new Set();
  source
    .map((value) => normaliseEventType(value))
    .filter(Boolean)
    .forEach((value) => unique.add(value));
  return Array.from(unique);
}

function pruneUndefined(object) {
  if (!object || typeof object !== 'object') {
    return undefined;
  }
  return Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter((item) => item != null);
      if (filtered.length) {
        accumulator[key] = filtered;
      }
      return accumulator;
    }
    if (typeof value === 'object') {
      const nested = pruneUndefined(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function extractActorRoles(actor) {
  const roles = new Set();
  if (!actor) {
    return roles;
  }
  const push = (role) => {
    if (!role) {
      return;
    }
    const normalized = `${role}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (normalized) {
      roles.add(normalized);
    }
  };

  if (Array.isArray(actor.roles)) {
    actor.roles.forEach(push);
  }
  if (Array.isArray(actor.memberships)) {
    actor.memberships.forEach((membership) => {
      if (!membership) {
        return;
      }
      if (typeof membership === 'string') {
        push(membership);
        return;
      }
      push(membership.role);
      push(membership.workspaceRole);
    });
  }
  push(actor.userType);

  return roles;
}

async function fetchWorkspace({ workspaceId, workspaceSlug }) {
  const where = { type: 'company' };
  if (workspaceId != null) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    where.id = parsed;
  } else if (workspaceSlug != null) {
    const slug = `${workspaceSlug}`.trim();
    if (!slug) {
      throw new ValidationError('workspaceSlug must be a non-empty string.');
    }
    where.slug = slug;
  } else {
    throw new ValidationError('workspaceId or workspaceSlug is required.');
  }

  const workspace = await ProviderWorkspace.findOne({
    where,
    attributes: ['id', 'name', 'slug', 'timezone', 'defaultCurrency'],
  });

  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }

  return workspace;
}

async function ensureWorkspaceAccess({ workspaceId, workspaceSlug, actor, requireWrite = false }) {
  const workspace = await fetchWorkspace({ workspaceId, workspaceSlug });

  const actorRoles = extractActorRoles(actor);
  if (actorRoles.has('admin')) {
    return { workspace, membershipRole: 'admin' };
  }

  if (!actor?.id) {
    throw new AuthorizationError('Company workspace access requires authentication.');
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: {
      workspaceId: workspace.id,
      userId: actor.id,
      status: 'active',
    },
  });

  if (!membership) {
    throw new AuthorizationError('You do not have access to this workspace.');
  }

  const normalizedRole = `${membership.role ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'staff';

  if (requireWrite && READ_ONLY_ROLES.has(normalizedRole) && !actorRoles.has('company_admin')) {
    throw new AuthorizationError('Your workspace role is read-only.');
  }

  return { workspace, membershipRole: normalizedRole };
}

function sanitizeParticipants(participants = []) {
  if (!Array.isArray(participants)) {
    return undefined;
  }
  const cleaned = participants
    .map((participant) => {
      if (!participant || typeof participant !== 'object') {
        return null;
      }
      const name = participant.name ? `${participant.name}`.trim() : undefined;
      const email = participant.email ? `${participant.email}`.trim().toLowerCase() : undefined;
      const role = participant.role ? `${participant.role}`.trim() : undefined;
      if (!name && !email && !role) {
        return null;
      }
      return pruneUndefined({ name, email, role });
    })
    .filter(Boolean);
  return cleaned.length ? cleaned.slice(0, 20) : undefined;
}

function sanitizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return undefined;
  }
  const cleaned = attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const label = attachment.label ? `${attachment.label}`.trim() : undefined;
      const url = attachment.url ? `${attachment.url}`.trim() : undefined;
      if (!label && !url) {
        return null;
      }
      return pruneUndefined({ label, url });
    })
    .filter(Boolean);
  return cleaned.length ? cleaned.slice(0, 20) : undefined;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const allowedVisibility = new Set(['internal', 'hiring_team', 'confidential', 'public']);
  const visibility = metadata.visibility
    ? `${metadata.visibility}`
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
    : undefined;

  const cleaned = pruneUndefined({
    relatedEntityId:
      metadata.relatedEntityId != null && Number.isFinite(Number(metadata.relatedEntityId))
        ? Number(metadata.relatedEntityId)
        : undefined,
    relatedEntityType: metadata.relatedEntityType ? `${metadata.relatedEntityType}`.trim() : undefined,
    relatedEntityName: metadata.relatedEntityName ? `${metadata.relatedEntityName}`.trim() : undefined,
    relatedUrl: metadata.relatedUrl ? `${metadata.relatedUrl}`.trim() : undefined,
    ownerId:
      metadata.ownerId != null && Number.isFinite(Number(metadata.ownerId))
        ? Number(metadata.ownerId)
        : undefined,
    ownerName: metadata.ownerName ? `${metadata.ownerName}`.trim() : undefined,
    ownerEmail: metadata.ownerEmail ? `${metadata.ownerEmail}`.trim().toLowerCase() : undefined,
    notes: metadata.notes ? `${metadata.notes}`.trim() : undefined,
    visibility: visibility && allowedVisibility.has(visibility) ? visibility : undefined,
    attendees: sanitizeParticipants(metadata.attendees ?? metadata.participants),
    participants: sanitizeParticipants(metadata.participants),
    attachments: sanitizeAttachments(metadata.attachments),
    color: metadata.color ? `${metadata.color}`.trim() : undefined,
  });

  if (!cleaned || !Object.keys(cleaned).length) {
    return undefined;
  }
  if (cleaned.attendees && !cleaned.participants) {
    cleaned.participants = cleaned.attendees;
    delete cleaned.attendees;
  }
  return cleaned;
}

function determineStatus(startsAt, endsAt, now = new Date()) {
  const startTime = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const endTime = endsAt ? (endsAt instanceof Date ? endsAt : new Date(endsAt)) : null;
  if (Number.isNaN(startTime.getTime())) {
    return 'upcoming';
  }
  if (endTime && !Number.isNaN(endTime.getTime()) && endTime < now) {
    return 'completed';
  }
  if (startTime > now) {
    return 'upcoming';
  }
  return 'in_progress';
}

function toPublicEvent(record) {
  const plain = record.get({ plain: true });
  const startsAt = plain.startsAt ? new Date(plain.startsAt) : null;
  const endsAt = plain.endsAt ? new Date(plain.endsAt) : null;
  const durationMinutes = startsAt && endsAt ? Math.max(0, Math.round((endsAt - startsAt) / 60000)) : null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    title: plain.title,
    eventType: plain.eventType,
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null,
    location: plain.location ?? null,
    metadata: plain.metadata ?? {},
    durationMinutes,
    status: determineStatus(startsAt, endsAt),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function groupEventsByType(events) {
  const grouped = {};
  SUPPORTED_EVENT_TYPES.forEach((type) => {
    grouped[type] = [];
  });
  events.forEach((event) => {
    if (!grouped[event.eventType]) {
      grouped[event.eventType] = [];
    }
    grouped[event.eventType].push(event);
  });
  return grouped;
}

function buildSummary(events, { windowStart, windowEnd }) {
  const now = new Date();
  const totalsByType = SUPPORTED_EVENT_TYPES.reduce((accumulator, type) => {
    accumulator[type] = 0;
    return accumulator;
  }, {});

  const upcomingByType = {};
  let nextEvent = null;
  let overdueCount = 0;

  events.forEach((event) => {
    if (totalsByType[event.eventType] != null) {
      totalsByType[event.eventType] += 1;
    }
    const start = event.startsAt ? new Date(event.startsAt) : null;
    const end = event.endsAt ? new Date(event.endsAt) : null;

    if (event.status === 'completed' && end && end < now) {
      overdueCount += 1;
    }

    if (start && start >= now) {
      const existing = upcomingByType[event.eventType];
      if (!existing || new Date(existing.startsAt) > start) {
        upcomingByType[event.eventType] = event;
      }
      if (!nextEvent || new Date(nextEvent.startsAt) > start) {
        nextEvent = event;
      }
    }
  });

  return {
    totalsByType,
    upcomingByType,
    nextEvent,
    overdueCount,
    totalEvents: events.length,
    window: {
      from: windowStart ? windowStart.toISOString() : null,
      to: windowEnd ? windowEnd.toISOString() : null,
    },
  };
}

async function fetchAvailableWorkspaces(actor) {
  if (!actor?.id) {
    return [];
  }

  const memberships = await ProviderWorkspaceMember.findAll({
    where: { userId: actor.id, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        attributes: ['id', 'name', 'slug', 'type', 'timezone'],
        where: { type: 'company' },
        required: true,
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  return memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    timezone: membership.workspace.timezone,
    role: membership.role,
  }));
}

function resolveWindow({ from, to }) {
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : new Date(now.getTime() + DEFAULT_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime())) {
    throw new ValidationError('from must be a valid ISO-8601 datetime.');
  }
  if (Number.isNaN(end.getTime())) {
    throw new ValidationError('to must be a valid ISO-8601 datetime.');
  }
  return { start, end };
}

export async function getCompanyCalendarState({
  workspaceId,
  workspaceSlug,
  actor,
  from,
  to,
  types,
  limit,
  search,
}) {
  const { workspace, membershipRole } = await ensureWorkspaceAccess({
    workspaceId,
    workspaceSlug,
    actor,
    requireWrite: false,
  });

  const window = resolveWindow({ from, to });
  const eventTypes = normaliseEventTypes(types);
  const resolvedLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_EVENTS_LIMIT);

  const where = {
    workspaceId: workspace.id,
    startsAt: {
      [Op.between]: [window.start, window.end],
    },
  };

  if (eventTypes.length) {
    where.eventType = eventTypes;
  }

  if (search && `${search}`.trim().length) {
    const term = `%${search.trim().toLowerCase()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(
      sequelize.where(sequelize.fn('LOWER', sequelize.col('RecruitingCalendarEvent.title')), {
        [Op.like]: term,
      }),
    );
  }

  const records = await RecruitingCalendarEvent.findAll({
    where,
    order: [
      ['startsAt', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit: resolvedLimit,
  });

  const events = records.map((record) => toPublicEvent(record));
  const grouped = groupEventsByType(events);
  const summary = buildSummary(events, { windowStart: window.start, windowEnd: window.end });
  const availableWorkspaces = await fetchAvailableWorkspaces(actor);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      timezone: workspace.timezone,
      defaultCurrency: workspace.defaultCurrency,
      membershipRole,
    },
    filters: {
      from: window.start.toISOString(),
      to: window.end.toISOString(),
      types: eventTypes,
      limit: resolvedLimit,
      search: search ? `${search}`.trim() : null,
    },
    events,
    eventsByType: grouped,
    summary,
    meta: {
      availableWorkspaces,
      supportedEventTypes: SUPPORTED_EVENT_TYPES,
    },
  };
}

export async function createCompanyCalendarEvent({
  workspaceId,
  workspaceSlug,
  title,
  eventType,
  startsAt,
  endsAt,
  location,
  metadata,
  actor,
}) {
  const { workspace } = await ensureWorkspaceAccess({ workspaceId, workspaceSlug, actor, requireWrite: true });

  const normalizedType = normaliseEventType(eventType);
  if (!normalizedType) {
    throw new ValidationError('eventType is not supported.');
  }

  const startDate = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    throw new ValidationError('startsAt must be a valid ISO-8601 datetime.');
  }

  let endDate = null;
  if (endsAt) {
    const candidate = endsAt instanceof Date ? endsAt : new Date(endsAt);
    if (Number.isNaN(candidate.getTime())) {
      throw new ValidationError('endsAt must be a valid ISO-8601 datetime.');
    }
    if (candidate < startDate) {
      throw new ValidationError('endsAt must occur after startsAt.');
    }
    endDate = candidate;
  }

  const sanitizedMetadata = sanitizeMetadata(metadata);

  const record = await RecruitingCalendarEvent.create({
    workspaceId: workspace.id,
    title: `${title}`.trim(),
    eventType: normalizedType,
    startsAt: startDate,
    endsAt: endDate,
    location: location ? `${location}`.trim() : null,
    metadata: sanitizedMetadata ?? null,
  });

  return toPublicEvent(record);
}

export async function updateCompanyCalendarEvent({ eventId, payload, actor }) {
  if (!eventId || !Number.isInteger(Number(eventId))) {
    throw new ValidationError('eventId must be a positive integer.');
  }

  const record = await RecruitingCalendarEvent.findByPk(eventId);
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }

  await ensureWorkspaceAccess({ workspaceId: record.workspaceId, actor, requireWrite: true });

  if (payload.title != null) {
    const trimmed = `${payload.title}`.trim();
    if (!trimmed) {
      throw new ValidationError('title must be a non-empty string.');
    }
    record.title = trimmed;
  }

  if (payload.eventType != null) {
    const normalizedType = normaliseEventType(payload.eventType);
    if (!normalizedType) {
      throw new ValidationError('eventType is not supported.');
    }
    record.eventType = normalizedType;
  }

  if (payload.startsAt != null) {
    const startDate = payload.startsAt instanceof Date ? payload.startsAt : new Date(payload.startsAt);
    if (Number.isNaN(startDate.getTime())) {
      throw new ValidationError('startsAt must be a valid ISO-8601 datetime.');
    }
    record.startsAt = startDate;
    if (record.endsAt && new Date(record.endsAt) < startDate) {
      record.endsAt = null;
    }
  }

  if (payload.endsAt !== undefined) {
    if (payload.endsAt === null) {
      record.endsAt = null;
    } else {
      const endDate = payload.endsAt instanceof Date ? payload.endsAt : new Date(payload.endsAt);
      if (Number.isNaN(endDate.getTime())) {
        throw new ValidationError('endsAt must be a valid ISO-8601 datetime.');
      }
      if (record.startsAt && endDate < new Date(record.startsAt)) {
        throw new ValidationError('endsAt must occur after startsAt.');
      }
      record.endsAt = endDate;
    }
  }

  if (payload.location !== undefined) {
    record.location = payload.location ? `${payload.location}`.trim() : null;
  }

  if (payload.metadata !== undefined) {
    record.metadata = sanitizeMetadata(payload.metadata) ?? null;
  }

  await record.save();
  await record.reload();
  return toPublicEvent(record);
}

export async function deleteCompanyCalendarEvent({ eventId, actor }) {
  if (!eventId || !Number.isInteger(Number(eventId))) {
    throw new ValidationError('eventId must be a positive integer.');
  }

  const record = await RecruitingCalendarEvent.findByPk(eventId);
  if (!record) {
    throw new NotFoundError('Calendar event not found.');
  }

  await ensureWorkspaceAccess({ workspaceId: record.workspaceId, actor, requireWrite: true });
  await record.destroy();
  return { deleted: true };
}

export default {
  getCompanyCalendarState,
  createCompanyCalendarEvent,
  updateCompanyCalendarEvent,
  deleteCompanyCalendarEvent,
};
