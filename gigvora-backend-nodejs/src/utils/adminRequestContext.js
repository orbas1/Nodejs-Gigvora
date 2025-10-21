import { ValidationError } from './errors.js';

function normaliseRoles(input) {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input)
    ? input
    : `${input}`
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
  return Array.from(new Set(values.map((role) => role.toLowerCase())));
}

function normaliseIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req?.ip ?? null;
}

function resolveUserAgent(req) {
  if (typeof req?.get === 'function') {
    return req.get('user-agent') ?? null;
  }
  return req?.headers?.['user-agent'] ?? null;
}

function resolveActorId(candidate) {
  if (candidate == null) {
    return null;
  }
  const parsed = Number.parseInt(`${candidate}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function extractAdminActor(req = {}) {
  const user = req.user ?? {};

  const actorId =
    resolveActorId(user.id) ??
    resolveActorId(user.userId) ??
    resolveActorId(req.headers?.['x-user-id']) ??
    resolveActorId(req.headers?.['x-actor-id']) ??
    null;

  const headerEmail = req.headers?.['x-user-email'] ?? req.headers?.['x-user'];
  const actorEmailSource = user.email ?? user.username ?? headerEmail ?? null;
  const actorEmail = actorEmailSource ? `${actorEmailSource}`.trim().toLowerCase() || null : null;

  const names = [];
  if (user.firstName) {
    names.push(`${user.firstName}`.trim());
  }
  if (user.lastName) {
    names.push(`${user.lastName}`.trim());
  }
  let actorName = names.join(' ').trim();
  if (!actorName && user.fullName) {
    actorName = `${user.fullName}`.trim();
  }
  if (!actorName && user.name) {
    actorName = `${user.name}`.trim();
  }

  const roles = normaliseRoles(
    user.roles ??
      user.memberships ??
      req.headers?.['x-roles'] ??
      req.headers?.['x-role'] ??
      req.headers?.['x-gigvora-memberships'],
  );

  const ip = normaliseIp(req);
  const userAgent = resolveUserAgent(req);

  const descriptor = actorName || actorEmail || (actorId != null ? `admin:${actorId}` : 'system');
  const reference = actorEmail
    ? actorId != null
      ? `admin:${actorId} <${actorEmail}>`
      : actorEmail
    : actorId != null
    ? `admin:${actorId}`
    : 'system';

  return {
    actorId,
    actorEmail,
    actorName: actorName || null,
    roles,
    ip,
    userAgent,
    descriptor,
    reference,
  };
}

export function buildAuditMetadata(actor, extra = {}) {
  return {
    id: actor?.actorId ?? null,
    email: actor?.actorEmail ?? null,
    name: actor?.actorName ?? actor?.descriptor ?? 'system',
    roles: actor?.roles ?? [],
    ip: actor?.ip ?? null,
    userAgent: actor?.userAgent ?? null,
    at: new Date().toISOString(),
    ...extra,
  };
}

export function stampPayloadWithActor(payload = {}, actor = {}, options = {}) {
  const { setCreatedBy = false, setUpdatedBy = false, metadataKey = null, forceMetadata = false } = options;

  const stamped = { ...payload };
  const descriptor = actor?.descriptor ?? 'system';

  if (setCreatedBy && stamped.createdBy == null) {
    stamped.createdBy = descriptor;
  }
  if (setUpdatedBy) {
    stamped.updatedBy = descriptor;
  }

  if (metadataKey) {
    const hasOwnMetadata = Object.prototype.hasOwnProperty.call(payload, metadataKey);
    if (forceMetadata || hasOwnMetadata) {
      const existing = payload[metadataKey];
      const metadata = existing && typeof existing === 'object' && !Array.isArray(existing) ? { ...existing } : {};
      metadata.lastModifiedBy = buildAuditMetadata(actor);
      stamped[metadataKey] = metadata;
    }
  }

  return stamped;
}

export function coercePositiveInteger(value, label = 'identifier') {
  const parsed = typeof value === 'number' ? value : Number.parseInt(`${value}`, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

export default {
  extractAdminActor,
  buildAuditMetadata,
  stampPayloadWithActor,
  coercePositiveInteger,
};
