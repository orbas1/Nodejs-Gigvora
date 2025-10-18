import { Op } from 'sequelize';
import {
  AgencyCalendarEvent,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  User,
} from '../models/index.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const EVENT_TYPES = new Set(['project', 'interview', 'gig', 'mentorship', 'volunteering']);
const EVENT_STATUSES = new Set(['planned', 'confirmed', 'completed', 'cancelled', 'tentative']);
const EVENT_VISIBILITIES = new Set(['internal', 'client', 'public']);

const ALLOWED_ROLES = new Set(['agency', 'agency_admin', 'admin']);

function normaliseString(value) {
  if (value == null) {
    return '';
  }
  if (typeof value !== 'string') {
    return String(value);
  }
  return value.trim();
}

function toNullableString(value) {
  const normalised = normaliseString(value);
  return normalised.length ? normalised : null;
}

function toPositiveInteger(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeWorkspaceRecord(workspace) {
  if (!workspace) {
    return null;
  }
  const plain = workspace.get ? workspace.get({ plain: true }) : workspace;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone ?? null,
    defaultCurrency: plain.defaultCurrency ?? null,
  };
}

function normalizeArrayOfStrings(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => normaliseString(entry))
      .map((entry) => entry.toLowerCase())
      .filter(Boolean);
  }
  return normaliseString(value)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function normaliseGuestEmails(value) {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value)
    ? value
    : normaliseString(value)
        .split(/[,;\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean);

  return Array.from(
    new Set(
      items
        .map((entry) => entry.toLowerCase())
        .filter((entry) => entry.length <= 255),
    ),
  );
}

function normaliseReminderOffsets(value) {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value)
    ? value
    : normaliseString(value)
        .split(/[,;\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);

  return Array.from(
    new Set(
      items
        .map((entry) => Number.parseInt(entry, 10))
        .filter((entry) => Number.isFinite(entry) && entry >= 0 && entry <= 10080),
    ),
  ).sort((a, b) => a - b);
}

function normaliseAttachments(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') {
          return { label: null, url: entry.trim() };
        }
        const label = toNullableString(entry.label ?? entry.name ?? entry.title ?? null);
        const url = toNullableString(entry.url ?? entry.href ?? null);
        if (!url) {
          return null;
        }
        return { label, url };
      })
      .filter(Boolean);
  }

  const lines = normaliseString(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const [labelPart, urlPart] = line.split('|').map((part) => part.trim());
      const url = urlPart ?? labelPart;
      if (!url) {
        return null;
      }
      const label = urlPart ? labelPart : null;
      return { label: toNullableString(label), url: toNullableString(url) };
    })
    .filter(Boolean);
}

async function resolveWorkspace({ workspaceId, workspaceSlug } = {}, { actorId, actorRole } = {}) {
  if (!actorId) {
    throw new AuthenticationError('Authentication required to manage agency calendar events.');
  }

  const normalisedRole = actorRole ? String(actorRole).toLowerCase() : null;
  if (!ALLOWED_ROLES.has(normalisedRole)) {
    throw new AuthorizationError('You do not have permission to manage the agency calendar.');
  }

  async function ensureAccess(workspaceInstance) {
    if (!workspaceInstance) {
      return null;
    }
    if (normalisedRole === 'admin') {
      return workspaceInstance;
    }
    if (workspaceInstance.ownerId === actorId) {
      return workspaceInstance;
    }

    const membership = await ProviderWorkspaceMember.count({
      where: { workspaceId: workspaceInstance.id, userId: actorId },
    });
    if (membership === 0) {
      throw new AuthorizationError('You do not have access to this agency workspace.');
    }
    return workspaceInstance;
  }

  if (workspaceId || workspaceSlug) {
    const where = { type: 'agency' };
    if (workspaceId) where.id = workspaceId;
    if (workspaceSlug) where.slug = workspaceSlug;

    const explicitWorkspace = await ProviderWorkspace.findOne({ where });
    if (!explicitWorkspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
    return ensureAccess(explicitWorkspace);
  }

  if (normalisedRole === 'admin') {
    const firstWorkspace = await ProviderWorkspace.findOne({
      where: { type: 'agency' },
      order: [['createdAt', 'ASC']],
    });
    if (!firstWorkspace) {
      throw new NotFoundError('No agency workspaces exist yet.');
    }
    return firstWorkspace;
  }

  const ownedWorkspace = await ProviderWorkspace.findOne({
    where: { type: 'agency', ownerId: actorId },
    order: [['createdAt', 'ASC']],
  });
  if (ownedWorkspace) {
    return ownedWorkspace;
  }

  const memberWorkspace = await ProviderWorkspaceMember.findOne({
    where: { userId: actorId },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        where: { type: 'agency' },
        required: true,
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  if (!memberWorkspace?.workspace) {
    throw new AuthorizationError('No agency workspace is linked to your account yet.');
  }

  return memberWorkspace.workspace;
}

function buildEventWhereClause({ workspaceId, types, status, from, to }) {
  const where = { workspaceId };

  if (types?.length) {
    const validTypes = types.filter((type) => EVENT_TYPES.has(String(type).toLowerCase()));
    if (validTypes.length) {
      where.eventType = { [Op.in]: validTypes };
    }
  }

  if (status && typeof status === 'string') {
    const normalisedStatus = status.toLowerCase();
    if (EVENT_STATUSES.has(normalisedStatus)) {
      where.status = normalisedStatus;
    } else if (normalisedStatus === 'active') {
      const now = new Date();
      where[Op.or] = [
        { startsAt: { [Op.gte]: now } },
        {
          endsAt: {
            [Op.gte]: now,
          },
        },
        {
          endsAt: {
            [Op.is]: null,
          },
          startsAt: {
            [Op.lte]: now,
          },
          status: { [Op.in]: ['planned', 'confirmed', 'tentative'] },
        },
      ];
    }
  }

  const startDate = parseDate(from);
  const endDate = parseDate(to);

  if (startDate && endDate) {
    where.startsAt = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.startsAt = { [Op.gte]: startDate };
  } else if (endDate) {
    where.startsAt = { [Op.lte]: endDate };
  }

  return where;
}

function computeSummary(events = []) {
  const summary = {
    total: events.length,
    byType: {},
    byStatus: {},
    upcomingToday: 0,
    requiresAttention: 0,
    nextEvent: null,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let nextEvent = null;

  events.forEach((event) => {
    const type = event.eventType;
    const status = event.status;
    if (type) {
      summary.byType[type] = (summary.byType[type] ?? 0) + 1;
    }
    if (status) {
      summary.byStatus[status] = (summary.byStatus[status] ?? 0) + 1;
    }

    const startDate = event.startsAt ? new Date(event.startsAt) : null;
    if (startDate && startDate >= today && startDate < tomorrow) {
      summary.upcomingToday += 1;
    }
    if (
      startDate &&
      startDate <= new Date() &&
      ['planned', 'tentative'].includes(status ?? '')
    ) {
      summary.requiresAttention += 1;
    }

    if (startDate && (!nextEvent || startDate < new Date(nextEvent.startsAt))) {
      nextEvent = event;
    }
  });

  summary.nextEvent = nextEvent;
  return summary;
}

function normaliseEventPayload(payload = {}, { isUpdate = false } = {}) {
  const title = toNullableString(payload.title);
  const description = toNullableString(payload.description);
  const notes = toNullableString(payload.notes);

  const eventType = toNullableString(payload.eventType)?.toLowerCase();
  const status = toNullableString(payload.status)?.toLowerCase();
  const visibility = toNullableString(payload.visibility)?.toLowerCase();

  const relatedEntityType = toNullableString(payload.relatedEntityType)?.toLowerCase();
  const relatedEntityId = toPositiveInteger(payload.relatedEntityId);

  const location = toNullableString(payload.location);
  const meetingUrl = toNullableString(payload.meetingUrl);
  const coverImageUrl = toNullableString(payload.coverImageUrl);
  const timezone = toNullableString(payload.timezone);
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  const isAllDay = Boolean(payload.isAllDay);
  const startsAt = parseDate(payload.startsAt ?? payload.startDate);
  const endsAt = parseDate(payload.endsAt ?? payload.endDate);

  if (!isUpdate && !title) {
    throw new ValidationError('Event title is required.');
  }
  if (!isUpdate && !eventType) {
    throw new ValidationError('Event type is required.');
  }
  if (!isUpdate && !startsAt) {
    throw new ValidationError('Event start date is required.');
  }

  if (eventType && !EVENT_TYPES.has(eventType)) {
    throw new ValidationError('Unsupported event type provided.');
  }
  if (status && !EVENT_STATUSES.has(status)) {
    throw new ValidationError('Unsupported event status provided.');
  }
  if (visibility && !EVENT_VISIBILITIES.has(visibility)) {
    throw new ValidationError('Unsupported visibility option provided.');
  }

  if (startsAt && endsAt && startsAt > endsAt) {
    throw new ValidationError('The event end time must be after the start time.');
  }

  return {
    ...(title !== null ? { title } : {}),
    ...(description !== null ? { description } : {}),
    ...(notes !== null ? { notes } : {}),
    ...(eventType ? { eventType } : {}),
    ...(status ? { status } : {}),
    ...(visibility ? { visibility } : {}),
    ...(relatedEntityType ? { relatedEntityType } : { relatedEntityType: null }),
    ...(relatedEntityId ? { relatedEntityId } : { relatedEntityId: null }),
    ...(location !== null ? { location } : {}),
    ...(meetingUrl !== null ? { meetingUrl } : {}),
    ...(coverImageUrl !== null ? { coverImageUrl } : {}),
    ...(timezone !== null ? { timezone } : {}),
    ...(metadata ? { metadata } : { metadata: null }),
    ...(startsAt ? { startsAt } : {}),
    ...(endsAt || (isAllDay && startsAt) ? { endsAt: endsAt ?? startsAt } : { endsAt: null }),
    isAllDay,
    attachments: normaliseAttachments(payload.attachments ?? payload.resources),
    guestEmails: normaliseGuestEmails(payload.guestEmails ?? payload.guests),
    reminderOffsets: normaliseReminderOffsets(payload.reminderOffsets ?? payload.reminders),
  };
}

export async function listAgencyCalendarEvents(
  { workspaceId, workspaceSlug, types, status, from, to } = {},
  context = {},
) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug }, context);

  const typeFilters = normalizeArrayOfStrings(types);
  const where = buildEventWhereClause({ workspaceId: workspace.id, types: typeFilters, status, from, to });

  const events = await AgencyCalendarEvent.findAll({
    where,
    order: [
      ['startsAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  const eventRecords = events.map((event) => event.toPublicObject());
  const summary = computeSummary(eventRecords);

  const members = await ProviderWorkspaceMember.findAll({
    where: { workspaceId: workspace.id },
    include: [
      {
        model: User,
        as: 'member',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: true,
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  const collaborators = members.map((member) => {
    const plain = member.get({ plain: true });
    return {
      id: plain.member?.id ?? null,
      firstName: plain.member?.firstName ?? null,
      lastName: plain.member?.lastName ?? null,
      email: plain.member?.email ?? null,
      role: plain.role ?? null,
      status: plain.status ?? null,
    };
  });

  return {
    workspace: sanitizeWorkspaceRecord(workspace),
    filters: {
      types: typeFilters,
      status: status ?? null,
      from: from ?? null,
      to: to ?? null,
    },
    events: eventRecords,
    summary,
    collaborators,
    options: {
      types: Array.from(EVENT_TYPES),
      statuses: Array.from(EVENT_STATUSES),
      visibilities: Array.from(EVENT_VISIBILITIES),
    },
  };
}

export async function getAgencyCalendarEvent(eventId, { workspaceId, workspaceSlug } = {}, context = {}) {
  const numericId = toPositiveInteger(eventId);
  if (!numericId) {
    throw new ValidationError('A valid event identifier is required.');
  }

  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug }, context);

  const event = await AgencyCalendarEvent.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  return {
    workspace: sanitizeWorkspaceRecord(workspace),
    event: event.toPublicObject(),
  };
}

export async function createAgencyCalendarEvent(payload = {}, context = {}) {
  const workspace = await resolveWorkspace(
    { workspaceId: payload.workspaceId, workspaceSlug: payload.workspaceSlug },
    context,
  );

  const attributes = normaliseEventPayload(payload, { isUpdate: false });

  if (!attributes.startsAt) {
    throw new ValidationError('A start date is required to schedule an event.');
  }

  const event = await AgencyCalendarEvent.create({
    ...attributes,
    workspaceId: workspace.id,
    createdById: context.actorId,
  });

  return {
    workspace: sanitizeWorkspaceRecord(workspace),
    event: event.toPublicObject(),
  };
}

export async function updateAgencyCalendarEvent(eventId, payload = {}, context = {}) {
  const numericId = toPositiveInteger(eventId);
  if (!numericId) {
    throw new ValidationError('A valid event identifier is required.');
  }

  const workspace = await resolveWorkspace(
    { workspaceId: payload.workspaceId, workspaceSlug: payload.workspaceSlug },
    context,
  );

  const event = await AgencyCalendarEvent.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }

  const attributes = normaliseEventPayload(payload, { isUpdate: true });

  await event.update(attributes);

  return {
    workspace: sanitizeWorkspaceRecord(workspace),
    event: event.toPublicObject(),
  };
}

export async function deleteAgencyCalendarEvent(eventId, payload = {}, context = {}) {
  const numericId = toPositiveInteger(eventId);
  if (!numericId) {
    throw new ValidationError('A valid event identifier is required.');
  }

  const workspace = await resolveWorkspace(
    { workspaceId: payload.workspaceId, workspaceSlug: payload.workspaceSlug },
    context,
  );

  const deleted = await AgencyCalendarEvent.destroy({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!deleted) {
    throw new NotFoundError('Calendar event not found.');
  }

  return { success: true };
}

export default {
  listAgencyCalendarEvents,
  getAgencyCalendarEvent,
  createAgencyCalendarEvent,
  updateAgencyCalendarEvent,
  deleteAgencyCalendarEvent,
};

