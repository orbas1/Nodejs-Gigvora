import { Op } from 'sequelize';
import { UserRefreshSession } from '../models/index.js';
import { normalizeGeoLocation, normalizeLocationString } from '../utils/location.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseSessionContext(rawContext) {
  let context = rawContext;
  if (typeof context === 'string') {
    try {
      context = JSON.parse(context);
    } catch (error) {
      context = null;
    }
  }

  if (!context || typeof context !== 'object') {
    return { context: null, additional: {}, location: null, timezone: null };
  }

  const additional = context.additional && typeof context.additional === 'object' ? context.additional : context;
  const locationCandidate = additional.location ?? additional.geo ?? additional.coordinates ?? null;
  let location = null;

  if (locationCandidate && typeof locationCandidate === 'object') {
    location = normalizeGeoLocation(locationCandidate);
  } else if (typeof locationCandidate === 'string') {
    const label = normalizeLocationString(locationCandidate, { maxLength: 255 });
    location = label ? { label } : null;
  }

  const timezone = normalizeLocationString(
    additional.timezone ?? additional.timeZone ?? additional.tz ?? location?.timezone ?? null,
    { maxLength: 120 },
  );

  return { context, additional, location, timezone: timezone ?? null };
}

function buildLocationLabel(location) {
  if (!location) {
    return null;
  }
  const parts = [];
  if (location.label) {
    parts.push(location.label);
  }
  const secondary = [];
  if (location.city && !parts.includes(location.city)) {
    secondary.push(location.city);
  }
  if (location.region && !secondary.includes(location.region)) {
    secondary.push(location.region);
  }
  const country = location.country ?? location.countryCode ?? null;
  if (country && !secondary.includes(country)) {
    secondary.push(country);
  }
  if (!parts.length && secondary.length) {
    parts.push(secondary.join(', '));
  } else if (secondary.length) {
    parts.push(secondary.join(', '));
  }
  return parts.length ? parts.join(' • ') : null;
}

function sanitiseSession(record) {
  const plain = typeof record.get === 'function' ? record.get({ plain: true }) : record;
  const context = parseSessionContext(plain.context);
  const locationLabel = buildLocationLabel(context.location);
  const riskScore = Number.isFinite(Number(plain.riskScore)) ? Number(plain.riskScore) : 0;
  const riskSignals = Array.isArray(plain.riskSignals) ? plain.riskSignals : [];
  const lastActiveSource = plain.updatedAt ?? plain.createdAt ?? null;

  return {
    id: plain.id,
    userId: plain.userId,
    deviceLabel: plain.deviceLabel ?? context.additional?.deviceLabel ?? null,
    ipAddress: plain.ipAddress ?? null,
    userAgent: plain.userAgent ?? null,
    location: context.location,
    locationLabel: locationLabel ?? context.location?.label ?? null,
    timezone: context.timezone ?? context.location?.timezone ?? null,
    riskLevel: plain.riskLevel ?? 'low',
    riskScore,
    riskSignals,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    revokedAt: plain.revokedAt ? new Date(plain.revokedAt).toISOString() : null,
    revokedReason: plain.revokedReason ?? null,
    revokedById: plain.revokedById ?? null,
    lastActiveAt: lastActiveSource ? new Date(lastActiveSource).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    current: Boolean(plain.current ?? false),
  };
}

function computeStats(sessions) {
  if (!Array.isArray(sessions) || !sessions.length) {
    return { totalActive: 0, highRiskCount: 0, mediumRiskCount: 0, expiringSoonCount: 0, lastActiveAt: null };
  }

  const now = Date.now();
  let highRisk = 0;
  let mediumRisk = 0;
  let expiringSoon = 0;
  let latestActivity = null;

  sessions.forEach((session) => {
    if (session.riskLevel === 'high') {
      highRisk += 1;
    } else if (session.riskLevel === 'medium') {
      mediumRisk += 1;
    }

    if (session.expiresAt) {
      const expiresAt = Date.parse(session.expiresAt);
      if (Number.isFinite(expiresAt) && expiresAt - now <= 1000 * 60 * 60 * 24 * 3) {
        expiringSoon += 1;
      }
    }

    if (session.lastActiveAt) {
      const activity = Date.parse(session.lastActiveAt);
      if (Number.isFinite(activity) && (latestActivity == null || activity > latestActivity)) {
        latestActivity = activity;
      }
    }
  });

  return {
    totalActive: sessions.length,
    highRiskCount: highRisk,
    mediumRiskCount: mediumRisk,
    expiringSoonCount: expiringSoon,
    lastActiveAt: latestActivity ? new Date(latestActivity).toISOString() : null,
  };
}

function sanitiseRevocationContext(context) {
  if (!context || typeof context !== 'object') {
    return null;
  }
  const payload = {};
  if (context.ipAddress) {
    const value = String(context.ipAddress).trim();
    if (value) {
      payload.ipAddress = value.slice(0, 128);
    }
  }
  if (context.userAgent) {
    const value = String(context.userAgent).trim();
    if (value) {
      payload.userAgent = value.slice(0, 1024);
    }
  }
  if (context.note) {
    const value = String(context.note).trim();
    if (value) {
      payload.note = value.slice(0, 255);
    }
  }
  return Object.keys(payload).length ? payload : null;
}

export async function listActiveSessions(userId, { limit = 25, includeExpired = false } = {}) {
  const numericUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }

  const where = { userId: numericUserId, revokedAt: { [Op.is]: null } };
  if (!includeExpired) {
    where[Op.or] = [{ expiresAt: { [Op.is]: null } }, { expiresAt: { [Op.gt]: new Date() } }];
  }

  const size = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 100) : undefined;
  const records = await UserRefreshSession.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: size,
  });

  const sessions = records.map((record) => sanitiseSession(record));
  return { items: sessions, stats: computeStats(sessions) };
}

export async function revokeUserSession(userId, sessionId, { actorId = null, reason = 'user_revoked', context = {} } = {}) {
  const numericUserId = Number.parseInt(userId, 10);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  const numericSessionId = Number.parseInt(sessionId, 10);
  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) {
    throw new ValidationError('sessionId must be a positive integer.');
  }

  const session = await UserRefreshSession.findOne({ where: { id: numericSessionId, userId: numericUserId } });
  if (!session) {
    throw new NotFoundError('Session not found.');
  }

  const sanitizedReason = reason ? String(reason).trim().slice(0, 120) : 'user_revoked';
  const revocationContext = sanitiseRevocationContext(context);

  let updatedSession = session;
  if (!session.revokedAt) {
    updatedSession = await session.update({
      revokedAt: new Date(),
      revokedReason: sanitizedReason || 'user_revoked',
      revokedById: actorId != null ? Number(actorId) : null,
      revocationContext,
    });
  }

  return sanitiseSession(updatedSession);
}

export default {
  listActiveSessions,
  revokeUserSession,
};
