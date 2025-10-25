import { randomUUID } from 'node:crypto';

import dataset from './data/company-calendar.json' with { type: 'json' };

const DEFAULT_EVENT_BLUEPRINTS = Array.isArray(dataset.events) ? dataset.events : [];
export const DEFAULT_WORKSPACES = (Array.isArray(dataset.workspaces) ? dataset.workspaces : []).map((workspace) => ({
  id: Number.parseInt(`${workspace.id}`, 10),
  slug: workspace.slug ? `${workspace.slug}`.trim() : null,
  name: `${workspace.name}`.trim(),
  timezone: workspace.timezone ? `${workspace.timezone}` : 'UTC',
  defaultCurrency: workspace.defaultCurrency ? `${workspace.defaultCurrency}`.trim() : 'USD',
  membershipRole: workspace.membershipRole ? `${workspace.membershipRole}`.trim() : 'admin',
}));

function computeDateFromOffset(now, offsetHours) {
  if (typeof offsetHours !== 'number' || Number.isNaN(offsetHours)) {
    return null;
  }
  return new Date(now + offsetHours * 60 * 60 * 1000);
}

function resolveDate(value, now, fallback) {
  if (!value && value !== 0) {
    return fallback ?? null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return computeDateFromOffset(now, value) ?? fallback ?? null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? null;
  }
  return parsed;
}

function resolveEndsAt(now, blueprint, startsAt) {
  if (blueprint.endsAt) {
    return resolveDate(blueprint.endsAt, now, null);
  }
  if (typeof blueprint.endOffsetHours === 'number') {
    return computeDateFromOffset(now, blueprint.endOffsetHours);
  }
  if (typeof blueprint.durationMinutes === 'number' && startsAt instanceof Date) {
    const minutes = Math.max(0, blueprint.durationMinutes);
    return new Date(startsAt.getTime() + minutes * 60 * 1000);
  }
  if (typeof blueprint.durationHours === 'number' && startsAt instanceof Date) {
    return new Date(startsAt.getTime() + Math.max(0, blueprint.durationHours) * 60 * 60 * 1000);
  }
  return null;
}

function sanitizeParticipants(participants = []) {
  if (!Array.isArray(participants)) {
    return undefined;
  }
  const list = participants
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
      return { name, email, role };
    })
    .filter(Boolean);
  return list.length ? list.slice(0, 20) : undefined;
}

function sanitizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return undefined;
  }
  const list = attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const label = attachment.label ? `${attachment.label}`.trim() : undefined;
      const url = attachment.url ? `${attachment.url}`.trim() : undefined;
      if (!label && !url) {
        return null;
      }
      return { label, url };
    })
    .filter(Boolean);
  return list.length ? list.slice(0, 20) : undefined;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  const cleaned = {
    relatedEntityId:
      metadata.relatedEntityId != null && Number.isFinite(Number(metadata.relatedEntityId))
        ? Number(metadata.relatedEntityId)
        : undefined,
    relatedEntityType: metadata.relatedEntityType ? `${metadata.relatedEntityType}`.trim() : undefined,
    relatedEntityName: metadata.relatedEntityName ? `${metadata.relatedEntityName}`.trim() : undefined,
    relatedUrl: metadata.relatedUrl ? `${metadata.relatedUrl}`.trim() : undefined,
    ownerId:
      metadata.ownerId != null && Number.isFinite(Number(metadata.ownerId)) ? Number(metadata.ownerId) : undefined,
    ownerName: metadata.ownerName ? `${metadata.ownerName}`.trim() : undefined,
    ownerEmail: metadata.ownerEmail ? `${metadata.ownerEmail}`.trim().toLowerCase() : undefined,
    notes: metadata.notes ? `${metadata.notes}`.trim() : undefined,
    visibility: metadata.visibility ? `${metadata.visibility}`.trim().toLowerCase() : undefined,
    participants: sanitizeParticipants(metadata.participants ?? metadata.attendees),
    attachments: sanitizeAttachments(metadata.attachments),
    color: metadata.color ? `${metadata.color}`.trim() : undefined,
    seedSource: metadata.seedSource ? `${metadata.seedSource}`.trim() : undefined,
  };

  return Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value != null));
}

export function normaliseMetadata(metadata) {
  return sanitizeMetadata(metadata);
}

function toPositiveInteger(value, fallback = null) {
  const numeric = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
}

function createEventFromBlueprint(blueprint, now) {
  const startDate = resolveDate(blueprint.startsAt ?? blueprint.startOffsetHours, now, new Date(now));
  const endDate = resolveEndsAt(now, blueprint, startDate);
  const timestamp = new Date(now).toISOString();
  const id = toPositiveInteger(blueprint.id);

  return {
    id: id ?? randomUUID(),
    workspaceId: toPositiveInteger(blueprint.workspaceId, 0),
    title: `${blueprint.title}`.trim(),
    eventType: `${blueprint.eventType}`.trim().toLowerCase(),
    status: blueprint.status ? `${blueprint.status}`.trim().toLowerCase() : 'scheduled',
    startsAt: startDate ? startDate.toISOString() : timestamp,
    endsAt: endDate ? endDate.toISOString() : null,
    location: blueprint.location ? `${blueprint.location}` : null,
    metadata: sanitizeMetadata(blueprint.metadata),
    createdAt: blueprint.createdAt ? `${blueprint.createdAt}` : timestamp,
    updatedAt: blueprint.updatedAt ? `${blueprint.updatedAt}` : timestamp,
  };
}

export function createDefaultEvents(now = Date.now()) {
  if (!DEFAULT_EVENT_BLUEPRINTS.length) {
    return [];
  }
  return DEFAULT_EVENT_BLUEPRINTS.map((blueprint) => createEventFromBlueprint(blueprint, now));
}

export function normaliseEventFixtures(events, { now = Date.now(), allowEmpty = false } = {}) {
  if (!Array.isArray(events)) {
    return createDefaultEvents(now);
  }

  if (events.length === 0 && !allowEmpty) {
    return createDefaultEvents(now);
  }

  if (events.length === 0) {
    return [];
  }

  return events.map((event) => {
    const startDate = resolveDate(event.startsAt ?? event.startOffsetHours ?? event.offsetHours, now, new Date(now));
    const endDate = resolveEndsAt(now, event, startDate);
    const createdAt = resolveDate(event.createdAt, now, new Date(now));
    const updatedAt = resolveDate(event.updatedAt, now, createdAt ?? new Date(now));

    return {
      id: toPositiveInteger(event.id, randomUUID()),
      workspaceId: toPositiveInteger(event.workspaceId, 0),
      title: `${event.title}`.trim(),
      eventType: `${event.eventType}`.trim().toLowerCase(),
      status: event.status ? `${event.status}`.trim().toLowerCase() : 'scheduled',
      startsAt: startDate ? startDate.toISOString() : new Date(now).toISOString(),
      endsAt: endDate ? endDate.toISOString() : null,
      location: event.location ? `${event.location}` : null,
      metadata: sanitizeMetadata(event.metadata),
      createdAt: createdAt ? createdAt.toISOString() : new Date(now).toISOString(),
      updatedAt: updatedAt ? updatedAt.toISOString() : new Date(now).toISOString(),
    };
  });
}
