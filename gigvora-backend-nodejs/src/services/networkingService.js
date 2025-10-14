import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  NetworkingSession,
  NetworkingSessionRotation,
  NetworkingSessionSignup,
  NetworkingBusinessCard,
  ProviderWorkspace,
  NETWORKING_SESSION_STATUSES,
  NETWORKING_SESSION_ACCESS_TYPES,
  NETWORKING_SESSION_VISIBILITIES,
  NETWORKING_SESSION_SIGNUP_STATUSES,
  NETWORKING_SESSION_SIGNUP_SOURCES,
  NETWORKING_BUSINESS_CARD_STATUSES,
  NETWORKING_ROTATION_STATUSES,
} from '../models/index.js';
import { AuthorizationError, ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'networking:sessions:list';
const RUNTIME_CACHE_NAMESPACE = 'networking:sessions:runtime';
const CACHE_TTL_SECONDS = 45;
const DEFAULT_ROTATION_SECONDS = 120;
const MIN_ROTATION_SECONDS = 60;
const MAX_ROTATION_SECONDS = 600;
const DEFAULT_SESSION_LENGTH_MINUTES = 30;
const DEFAULT_WAITLIST_LIMIT = 30;
const DEFAULT_PENALTY_RULES = {
  noShowThreshold: 2,
  cooldownDays: 14,
  penaltyWeight: 1,
};

function normaliseWorkspaceIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value));
}

function assertWorkspacePermission(companyId, authorizedWorkspaceIds = []) {
  const normalised = normaliseWorkspaceIds(authorizedWorkspaceIds);
  if (!normalised.length) {
    return normalised;
  }
  const numericCompanyId = Number(companyId);
  if (!Number.isFinite(numericCompanyId)) {
    throw new AuthorizationError('Workspace selection required for networking access.');
  }
  if (!normalised.includes(numericCompanyId)) {
    throw new AuthorizationError('You do not have permission to manage this networking workspace.');
  }
  return normalised;
}

function slugify(value, fallback = 'networking-session') {
  const base = `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length) {
    return base.slice(0, 80);
  }
  const random = crypto.randomUUID().split('-')[0];
  return `${fallback}-${random}`.replace(/[^a-z0-9-]+/g, '').slice(0, 80);
}

function toCents(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Price must be a numeric value.');
  }
  return Math.round(numeric * 100);
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Invalid date supplied.');
  }
  return parsed;
}

function secondsBetween(start, end) {
  if (!start || !end) {
    return null;
  }
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff)) {
    return null;
  }
  return Math.max(0, Math.round(diff / 1000));
}

function minutesBetween(start, end) {
  const seconds = secondsBetween(start, end);
  if (seconds == null) {
    return null;
  }
  return Math.round(seconds / 60);
}

function normaliseRotationDuration(value) {
  const numeric = Number(value ?? DEFAULT_ROTATION_SECONDS);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_ROTATION_SECONDS;
  }
  return Math.min(MAX_ROTATION_SECONDS, Math.max(MIN_ROTATION_SECONDS, Math.round(numeric)));
}

function normaliseSessionLengthMinutes({ startTime, endTime, sessionLengthMinutes }) {
  if (Number.isFinite(Number(sessionLengthMinutes)) && Number(sessionLengthMinutes) > 0) {
    return Math.round(Number(sessionLengthMinutes));
  }
  const start = toDate(startTime);
  const end = toDate(endTime);
  const minutes = minutesBetween(start, end);
  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes;
  }
  return DEFAULT_SESSION_LENGTH_MINUTES;
}

function ensureSession(session) {
  if (!session) {
    throw new NotFoundError('Networking session not found.');
  }
}

function ensureBusinessCard(card) {
  if (!card) {
    throw new NotFoundError('Networking business card not found.');
  }
}

function serialiseSession(session, { includeAssociations = true } = {}) {
  if (!session) {
    return null;
  }
  const base = session.toPublicObject();
  if (!includeAssociations) {
    return base;
  }
  const rotations = Array.isArray(session.rotations)
    ? session.rotations.map((rotation) =>
        typeof rotation.toPublicObject === 'function' ? rotation.toPublicObject() : rotation,
      )
    : [];
  const signups = Array.isArray(session.signups)
    ? session.signups.map((signup) =>
        typeof signup.toPublicObject === 'function' ? signup.toPublicObject() : signup,
      )
    : [];
  return {
    ...base,
    rotations,
    signups,
  };
}

function serialiseSignup(signup) {
  if (!signup) {
    return null;
  }
  return signup.toPublicObject();
}

function serialiseBusinessCard(card) {
  if (!card) {
    return null;
  }
  return card.toPublicObject();
}

function defaultVideoConfig(payload = {}) {
  const slotSeconds = normaliseRotationDuration(payload.rotationDurationSeconds);
  return {
    provider: 'gigvora-video',
    mode: 'peer_to_peer',
    layout: 'speed_networking',
    features: {
      screenShare: false,
      stageBroadcast: true,
      breakoutTimer: true,
      chat: true,
      businessCardSharing: true,
    },
    bitrate: {
      maxKbps: 900,
      adaptive: true,
    },
    clientLoadShare: 0.82,
    slotDurationSeconds: slotSeconds,
  };
}

function defaultShowcaseConfig(payload = {}) {
  return {
    heroImage: payload.heroImage ?? null,
    sessionHighlights: payload.sessionHighlights ?? [
      '2 or 5 minute rotations',
      'Browser-based video booths',
      'Automated pair shuffling',
    ],
    cta: payload.cta ?? 'Reserve your seat',
    hostTips: payload.hostTips ?? [
      'Set expectations in lobby chat before the first rotation.',
      'Use spotlight announcements between rounds for sponsor plugs.',
    ],
  };
}

function normalisePenaltyRules(input) {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_PENALTY_RULES };
  }
  const normalized = {
    ...DEFAULT_PENALTY_RULES,
    ...input,
  };
  normalized.noShowThreshold = Math.max(1, Math.round(Number(normalized.noShowThreshold) || DEFAULT_PENALTY_RULES.noShowThreshold));
  normalized.cooldownDays = Math.max(1, Math.round(Number(normalized.cooldownDays) || DEFAULT_PENALTY_RULES.cooldownDays));
  normalized.penaltyWeight = Math.max(1, Math.round(Number(normalized.penaltyWeight) || DEFAULT_PENALTY_RULES.penaltyWeight));
  return normalized;
}

function buildRotationSchedule({
  startTime,
  sessionLengthMinutes,
  rotationDurationSeconds,
  rotations = [],
}) {
  const start = startTime ? toDate(startTime) : null;
  const slotSeconds = normaliseRotationDuration(rotationDurationSeconds);
  const sessionMinutes = normaliseSessionLengthMinutes({ startTime, endTime: null, sessionLengthMinutes });
  if (Array.isArray(rotations) && rotations.length) {
    return rotations
      .map((rotation, index) => ({
        rotationNumber: rotation.rotationNumber ?? index + 1,
        durationSeconds: normaliseRotationDuration(rotation.durationSeconds ?? slotSeconds),
        startTime: rotation.startTime ?? (start ? new Date(start.getTime() + index * slotSeconds * 1000) : null),
        endTime: rotation.endTime ??
          (start ? new Date(start.getTime() + (index + 1) * slotSeconds * 1000) : null),
        seatingPlan: rotation.seatingPlan ?? {},
        hostNotes: rotation.hostNotes ?? null,
        pairingSeed: rotation.pairingSeed ?? null,
        status: rotation.status && NETWORKING_ROTATION_STATUSES.includes(rotation.status)
          ? rotation.status
          : 'scheduled',
      }))
      .filter((rotation) => rotation.rotationNumber != null);
  }

  const totalRotations = Math.max(1, Math.floor((sessionMinutes * 60) / slotSeconds));
  const schedule = [];
  for (let index = 0; index < totalRotations; index += 1) {
    const rotationStart = start ? new Date(start.getTime() + index * slotSeconds * 1000) : null;
    const rotationEnd = start ? new Date(start.getTime() + (index + 1) * slotSeconds * 1000) : null;
    schedule.push({
      rotationNumber: index + 1,
      durationSeconds: slotSeconds,
      startTime: rotationStart,
      endTime: rotationEnd,
      seatingPlan: {},
      hostNotes: null,
      pairingSeed: crypto.randomUUID(),
      status: 'scheduled',
    });
  }
  return schedule;
}

function summariseSessions(sessions = []) {
  const now = Date.now();
  const summary = {
    total: sessions.length,
    active: 0,
    upcoming: 0,
    completed: 0,
    draft: 0,
    cancelled: 0,
    averageJoinLimit: null,
    rotationDurationSeconds: null,
    registered: 0,
    waitlist: 0,
    checkedIn: 0,
    completedAttendees: 0,
    paid: 0,
    free: 0,
    revenueCents: 0,
    satisfactionAverage: null,
  };
  const joinLimits = [];
  const rotationDurations = [];
  const satisfactionScores = [];

  sessions.forEach((session) => {
    const status = session.status ?? session.get?.('status');
    const start = session.startTime ? new Date(session.startTime) : null;
    const end = session.endTime ? new Date(session.endTime) : null;
    if (status === 'draft') summary.draft += 1;
    if (status === 'cancelled') summary.cancelled += 1;
    if (status === 'in_progress') summary.active += 1;
    if (status === 'completed' || (end && end.getTime() < now)) summary.completed += 1;
    if (status === 'scheduled' && start && start.getTime() > now) summary.upcoming += 1;
    if (Number.isFinite(Number(session.joinLimit))) {
      joinLimits.push(Number(session.joinLimit));
    }
    if (Number.isFinite(Number(session.rotationDurationSeconds))) {
      rotationDurations.push(Number(session.rotationDurationSeconds));
    }
    const signups = Array.isArray(session.signups) ? session.signups : [];
    signups.forEach((signup) => {
      const signupStatus = signup.status ?? signup.get?.('status');
      if (signupStatus === 'registered') summary.registered += 1;
      if (signupStatus === 'waitlisted') summary.waitlist += 1;
      if (signupStatus === 'checked_in') summary.checkedIn += 1;
      if (signupStatus === 'completed') summary.completedAttendees += 1;
      if (signup.satisfactionScore != null) {
        const score = Number(signup.satisfactionScore);
        if (Number.isFinite(score)) {
          satisfactionScores.push(score);
        }
      }
    });
    if (session.accessType === 'paid') {
      summary.paid += 1;
      const price = Number(session.priceCents ?? 0);
      if (Number.isFinite(price)) {
        summary.revenueCents += price * Math.max(0, signupsCheckedInCount(signups));
      }
    } else {
      summary.free += 1;
    }
  });

  if (joinLimits.length) {
    const total = joinLimits.reduce((sum, value) => sum + value, 0);
    summary.averageJoinLimit = Math.round(total / joinLimits.length);
  }
  if (rotationDurations.length) {
    const total = rotationDurations.reduce((sum, value) => sum + value, 0);
    summary.rotationDurationSeconds = Math.round(total / rotationDurations.length);
  }
  if (satisfactionScores.length) {
    const total = satisfactionScores.reduce((sum, value) => sum + value, 0);
    summary.satisfactionAverage = Number((total / satisfactionScores.length).toFixed(2));
  }
  return summary;
}

function signupsCheckedInCount(signups = []) {
  return signups.filter((signup) => {
    const status = signup.status ?? signup.get?.('status');
    return status === 'checked_in' || status === 'completed';
  }).length;
}

async function ensureWorkspace(companyId) {
  if (companyId == null) {
    return null;
  }
  const workspace = await ProviderWorkspace.findByPk(companyId);
  if (!workspace) {
    throw new ValidationError('Referenced company workspace was not found.');
  }
  return workspace;
}

async function findSessionBySlug(slug, companyId, { transaction } = {}) {
  return NetworkingSession.findOne({
    where: {
      slug,
      ...(companyId ? { companyId } : {}),
    },
    transaction,
  });
}

async function countRecentPenalties({ companyId, participantId, participantEmail, cooldownDays, transaction }) {
  if (!participantId && !participantEmail) {
    return 0;
  }
  const since = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
  const where = {
    penaltyCount: { [Op.gt]: 0 },
    lastPenaltyAt: { [Op.gte]: since },
  };
  if (participantId) {
    where.participantId = participantId;
  }
  if (participantEmail) {
    where.participantEmail = participantEmail.toLowerCase();
  }
  if (companyId) {
    where['$session.companyId$'] = companyId;
  }
  return NetworkingSessionSignup.count({
    where,
    include: [
      {
        model: NetworkingSession,
        as: 'session',
        required: true,
      },
    ],
    transaction,
  });
}

function clearCaches({ companyId, sessionId }) {
  if (companyId != null) {
    appCache.flushByPrefix(`${CACHE_NAMESPACE}:`);
  }
  if (sessionId != null) {
    appCache.flushByPrefix(`${RUNTIME_CACHE_NAMESPACE}:`);
  }
}

export async function createNetworkingSession(payload = {}, { actorId, authorizedWorkspaceIds = [] } = {}) {
  const {
    companyId,
    title,
    description,
    status = 'draft',
    startTime,
    endTime,
    sessionLengthMinutes,
    rotationDurationSeconds,
    joinLimit,
    waitlistLimit,
    registrationOpensAt,
    registrationClosesAt,
    requiresApproval = false,
    accessType = 'free',
    price,
    priceCents,
    currency = 'USD',
    visibility = 'workspace',
    monetization = {},
    videoConfig = {},
    videoTelemetry = {},
    showcaseConfig = {},
    penaltyRules = {},
    hostControls = {},
    attendeeTools = {},
    followUpActions = {},
    lobbyInstructions,
    rotations,
    slug,
  } = payload;

  if (!title || !title.trim()) {
    throw new ValidationError('A session title is required.');
  }

  if (!NETWORKING_SESSION_STATUSES.includes(status)) {
    throw new ValidationError('Invalid session status provided.');
  }

  if (!NETWORKING_SESSION_ACCESS_TYPES.includes(accessType)) {
    throw new ValidationError('Invalid access type provided.');
  }

  if (!NETWORKING_SESSION_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('Invalid session visibility provided.');
  }

  assertWorkspacePermission(companyId, authorizedWorkspaceIds);

  const workspace = await ensureWorkspace(companyId);
  const slugCandidate = slugify(slug ?? title);
  const slotSeconds = normaliseRotationDuration(rotationDurationSeconds);
  const resolvedSessionLength = normaliseSessionLengthMinutes({ startTime, endTime, sessionLengthMinutes });
  const resolvedEnd = startTime ? new Date(toDate(startTime).getTime() + resolvedSessionLength * 60 * 1000) : toDate(endTime);
  const resolvedPriceCents = accessType === 'paid' ? toCents(price ?? priceCents ?? 0) : null;
  if (accessType === 'paid' && (resolvedPriceCents == null || resolvedPriceCents <= 0)) {
    throw new ValidationError('Paid sessions require a positive price.');
  }

  return sequelize.transaction(async (transaction) => {
    const existing = await findSessionBySlug(slugCandidate, companyId, { transaction });
    if (existing) {
      throw new ConflictError('A networking session with this slug already exists.');
    }

    const session = await NetworkingSession.create(
      {
        companyId: workspace ? workspace.id : null,
        createdById: actorId ?? null,
        updatedById: actorId ?? null,
        title: title.trim(),
        slug: slugCandidate,
        description: description ?? null,
        status,
        visibility,
        accessType,
        priceCents: resolvedPriceCents,
        currency,
        startTime: startTime ? toDate(startTime) : null,
        endTime: resolvedEnd,
        sessionLengthMinutes: resolvedSessionLength,
        rotationDurationSeconds: slotSeconds,
        joinLimit: Number.isFinite(Number(joinLimit)) ? Math.max(2, Math.round(Number(joinLimit))) : null,
        waitlistLimit: Number.isFinite(Number(waitlistLimit))
          ? Math.max(0, Math.round(Number(waitlistLimit)))
          : DEFAULT_WAITLIST_LIMIT,
        registrationOpensAt: registrationOpensAt ? toDate(registrationOpensAt) : null,
        registrationClosesAt: registrationClosesAt ? toDate(registrationClosesAt) : null,
        requiresApproval: Boolean(requiresApproval),
        lobbyInstructions: lobbyInstructions ?? null,
        followUpActions,
        hostControls: hostControls ?? {},
        attendeeTools: attendeeTools ?? {},
        penaltyRules: normalisePenaltyRules(penaltyRules),
        monetization: monetization ?? {},
        videoConfig: { ...defaultVideoConfig({ rotationDurationSeconds: slotSeconds }), ...videoConfig },
        videoTelemetry: videoTelemetry ?? {},
        showcaseConfig: defaultShowcaseConfig(showcaseConfig),
      },
      { transaction },
    );

    const schedule = buildRotationSchedule({
      startTime: session.startTime,
      sessionLengthMinutes: session.sessionLengthMinutes,
      rotationDurationSeconds: session.rotationDurationSeconds,
      rotations,
    });

    if (schedule.length) {
      await NetworkingSessionRotation.bulkCreate(
        schedule.map((rotation) => ({
          ...rotation,
          sessionId: session.id,
        })),
        { transaction },
      );
    }

    const reloaded = await NetworkingSession.findByPk(session.id, {
      include: [
        { model: NetworkingSessionRotation, as: 'rotations' },
        { model: NetworkingSessionSignup, as: 'signups' },
      ],
      transaction,
    });

    clearCaches({ companyId: session.companyId, sessionId: session.id });
    return serialiseSession(reloaded);
  });
}

export async function updateNetworkingSession(
  sessionId,
  payload = {},
  { actorId, authorizedWorkspaceIds = [] } = {},
) {
  const session = await NetworkingSession.findByPk(sessionId, {
    include: [
      { model: NetworkingSessionRotation, as: 'rotations' },
      { model: NetworkingSessionSignup, as: 'signups' },
    ],
  });
  ensureSession(session);
  assertWorkspacePermission(session.companyId, authorizedWorkspaceIds);

  const updates = {};
  if (payload.title != null) {
    updates.title = payload.title.trim();
  }
  if (payload.slug) {
    const newSlug = slugify(payload.slug);
    if (newSlug !== session.slug) {
      const existing = await findSessionBySlug(newSlug, session.companyId);
      if (existing && existing.id !== session.id) {
        throw new ConflictError('Another session already uses this slug.');
      }
      updates.slug = newSlug;
    }
  }
  if (payload.description !== undefined) {
    updates.description = payload.description ?? null;
  }
  if (payload.status && NETWORKING_SESSION_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.visibility && NETWORKING_SESSION_VISIBILITIES.includes(payload.visibility)) {
    updates.visibility = payload.visibility;
  }
  if (payload.accessType && NETWORKING_SESSION_ACCESS_TYPES.includes(payload.accessType)) {
    updates.accessType = payload.accessType;
    if (payload.accessType === 'paid' && session.priceCents == null && payload.price == null && payload.priceCents == null) {
      throw new ValidationError('Paid sessions require a price.');
    }
  }
  if (payload.startTime != null) {
    updates.startTime = payload.startTime ? toDate(payload.startTime) : null;
  }
  if (payload.endTime != null) {
    updates.endTime = payload.endTime ? toDate(payload.endTime) : null;
  }
  if (payload.sessionLengthMinutes != null) {
    updates.sessionLengthMinutes = normaliseSessionLengthMinutes({
      startTime: updates.startTime ?? session.startTime,
      endTime: updates.endTime ?? session.endTime,
      sessionLengthMinutes: payload.sessionLengthMinutes,
    });
  }
  if (payload.rotationDurationSeconds != null) {
    updates.rotationDurationSeconds = normaliseRotationDuration(payload.rotationDurationSeconds);
  }
  if (payload.joinLimit != null) {
    updates.joinLimit = Number.isFinite(Number(payload.joinLimit))
      ? Math.max(2, Math.round(Number(payload.joinLimit)))
      : null;
  }
  if (payload.waitlistLimit != null) {
    updates.waitlistLimit = Number.isFinite(Number(payload.waitlistLimit))
      ? Math.max(0, Math.round(Number(payload.waitlistLimit)))
      : DEFAULT_WAITLIST_LIMIT;
  }
  if (payload.registrationOpensAt !== undefined) {
    updates.registrationOpensAt = payload.registrationOpensAt ? toDate(payload.registrationOpensAt) : null;
  }
  if (payload.registrationClosesAt !== undefined) {
    updates.registrationClosesAt = payload.registrationClosesAt ? toDate(payload.registrationClosesAt) : null;
  }
  if (payload.requiresApproval !== undefined) {
    updates.requiresApproval = Boolean(payload.requiresApproval);
  }
  if (payload.lobbyInstructions !== undefined) {
    updates.lobbyInstructions = payload.lobbyInstructions ?? null;
  }
  if (payload.followUpActions !== undefined) {
    updates.followUpActions = payload.followUpActions ?? {};
  }
  if (payload.hostControls !== undefined) {
    updates.hostControls = payload.hostControls ?? {};
  }
  if (payload.attendeeTools !== undefined) {
    updates.attendeeTools = payload.attendeeTools ?? {};
  }
  if (payload.penaltyRules !== undefined) {
    updates.penaltyRules = normalisePenaltyRules(payload.penaltyRules);
  }
  if (payload.monetization !== undefined) {
    updates.monetization = payload.monetization ?? {};
  }
  if (payload.videoConfig !== undefined) {
    updates.videoConfig = { ...session.videoConfig, ...payload.videoConfig };
  }
  if (payload.videoTelemetry !== undefined) {
    updates.videoTelemetry = payload.videoTelemetry ?? {};
  }
  if (payload.showcaseConfig !== undefined) {
    updates.showcaseConfig = { ...session.showcaseConfig, ...payload.showcaseConfig };
  }
  if ((payload.price != null || payload.priceCents != null) && (updates.accessType ?? session.accessType) === 'paid') {
    updates.priceCents = toCents(payload.price ?? payload.priceCents);
    if (!updates.priceCents || updates.priceCents <= 0) {
      throw new ValidationError('Paid sessions require a positive price.');
    }
  }
  if (Object.keys(updates).length === 0 && !Array.isArray(payload.rotations)) {
    return serialiseSession(session);
  }

  return sequelize.transaction(async (transaction) => {
    if (Object.keys(updates).length) {
      updates.updatedById = actorId ?? session.updatedById ?? session.createdById ?? null;
      await session.update(updates, { transaction });
    }

    if (Array.isArray(payload.rotations)) {
      await NetworkingSessionRotation.destroy({ where: { sessionId: session.id }, transaction });
      const schedule = buildRotationSchedule({
        startTime: updates.startTime ?? session.startTime,
        sessionLengthMinutes: updates.sessionLengthMinutes ?? session.sessionLengthMinutes,
        rotationDurationSeconds: updates.rotationDurationSeconds ?? session.rotationDurationSeconds,
        rotations: payload.rotations,
      });
      if (schedule.length) {
        await NetworkingSessionRotation.bulkCreate(
          schedule.map((rotation) => ({ ...rotation, sessionId: session.id })),
          { transaction },
        );
      }
    }

    const reloaded = await NetworkingSession.findByPk(session.id, {
      include: [
        { model: NetworkingSessionRotation, as: 'rotations' },
        { model: NetworkingSessionSignup, as: 'signups' },
      ],
      transaction,
    });
    clearCaches({ companyId: reloaded.companyId, sessionId: reloaded.id });
    return serialiseSession(reloaded);
  });
}

export async function listNetworkingSessions(
  { companyId, status, includeMetrics = true, upcomingOnly = false, lookbackDays = 180 } = {},
  { authorizedWorkspaceIds = [] } = {},
) {
  const normalisedAuthorized = normaliseWorkspaceIds(authorizedWorkspaceIds);
  const scope = normalisedAuthorized.length
    ? normalisedAuthorized
        .slice()
        .sort((a, b) => a - b)
        .join('-')
    : 'global';

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, {
    companyId,
    status,
    includeMetrics,
    upcomingOnly,
    lookbackDays,
    scope,
  });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const where = {};
    if (normalisedAuthorized.length) {
      if (companyId != null) {
        assertWorkspacePermission(companyId, normalisedAuthorized);
        where.companyId = companyId;
      } else {
        where.companyId = { [Op.in]: normalisedAuthorized };
      }
    } else if (companyId != null) {
      where.companyId = companyId;
    }
    if (status && NETWORKING_SESSION_STATUSES.includes(status)) {
      where.status = status;
    }
    const since = new Date(Date.now() - Math.max(1, lookbackDays) * 24 * 60 * 60 * 1000);
    if (!upcomingOnly) {
      where.createdAt = { [Op.gte]: since };
    } else {
      where.startTime = { [Op.gte]: new Date() };
    }

    const sessions = await NetworkingSession.findAll({
      where,
      include: [
        { model: NetworkingSessionRotation, as: 'rotations' },
        { model: NetworkingSessionSignup, as: 'signups' },
      ],
      order: [
        ['startTime', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit: 200,
    });

    const serialised = sessions.map((session) => serialiseSession(session));
    const summary = includeMetrics ? summariseSessions(serialised) : null;
    return { sessions: serialised, summary };
  });
}

export async function getNetworkingSession(
  sessionId,
  { includeAssociations = true, authorizedWorkspaceIds = [] } = {},
) {
  const session = await NetworkingSession.findByPk(sessionId, {
    include: includeAssociations
      ? [
          { model: NetworkingSessionRotation, as: 'rotations' },
          { model: NetworkingSessionSignup, as: 'signups' },
        ]
      : [],
  });
  ensureSession(session);
  assertWorkspacePermission(session.companyId, authorizedWorkspaceIds);
  return serialiseSession(session, { includeAssociations });
}

export async function regenerateNetworkingRotations(sessionId, payload = {}, { authorizedWorkspaceIds = [] } = {}) {
  const session = await NetworkingSession.findByPk(sessionId);
  ensureSession(session);
  assertWorkspacePermission(session.companyId, authorizedWorkspaceIds);
  const schedule = buildRotationSchedule({
    startTime: payload.startTime ?? session.startTime,
    sessionLengthMinutes: payload.sessionLengthMinutes ?? session.sessionLengthMinutes,
    rotationDurationSeconds: payload.rotationDurationSeconds ?? session.rotationDurationSeconds,
    rotations: payload.rotations,
  });
  return sequelize.transaction(async (transaction) => {
    await NetworkingSessionRotation.destroy({ where: { sessionId }, transaction });
    if (schedule.length) {
      await NetworkingSessionRotation.bulkCreate(
        schedule.map((rotation) => ({ ...rotation, sessionId })),
        { transaction },
      );
    }
    const reloaded = await NetworkingSession.findByPk(sessionId, {
      include: [
        { model: NetworkingSessionRotation, as: 'rotations' },
        { model: NetworkingSessionSignup, as: 'signups' },
      ],
      transaction,
    });
    clearCaches({ companyId: reloaded.companyId, sessionId: reloaded.id });
    return serialiseSession(reloaded);
  });
}

export async function registerForNetworkingSession(sessionId, payload = {}) {
  const session = await NetworkingSession.findByPk(sessionId, {
    include: [{ model: NetworkingSessionSignup, as: 'signups' }],
  });
  ensureSession(session);

  const email = `${payload.participantEmail ?? payload.email ?? ''}`.trim().toLowerCase();
  if (!email) {
    throw new ValidationError('Participant email is required.');
  }
  const participantName = `${payload.participantName ?? payload.fullName ?? ''}`.trim();
  if (!participantName) {
    throw new ValidationError('Participant name is required.');
  }
  const participantId = payload.participantId ? Number(payload.participantId) : null;
  const penaltyRules = normalisePenaltyRules(session.penaltyRules);

  return sequelize.transaction(async (transaction) => {
    const existingSignup = session.signups.find(
      (signup) => signup.participantEmail === email || (participantId && signup.participantId === participantId),
    );
    if (existingSignup && existingSignup.status !== 'removed') {
      throw new ConflictError('This participant is already registered for the networking session.');
    }

    const penalties = await countRecentPenalties({
      companyId: session.companyId,
      participantId,
      participantEmail: email,
      cooldownDays: penaltyRules.cooldownDays,
      transaction,
    });

    if (penalties >= penaltyRules.noShowThreshold) {
      throw new ConflictError(
        'Participant is temporarily restricted from registering due to recent no-shows. Please review penalty policies.',
      );
    }

    let businessCardSnapshot = null;
    if (payload.businessCardId) {
      const card = await NetworkingBusinessCard.findByPk(payload.businessCardId, { transaction });
      ensureBusinessCard(card);
      if (participantId && card.ownerId !== participantId) {
        throw new ValidationError('Participants may only attach their own business card.');
      }
      businessCardSnapshot = card.toPublicObject();
    }

    const seatCount = session.signups.filter((signup) => signup.status !== 'removed' && signup.status !== 'waitlisted').length;
    const joinLimit = session.joinLimit ?? 0;
    const atCapacity = joinLimit > 0 && seatCount >= joinLimit;

    const signup = await NetworkingSessionSignup.create(
      {
        sessionId: session.id,
        participantId,
        participantEmail: email,
        participantName,
        status: atCapacity ? 'waitlisted' : 'registered',
        source: payload.source && NETWORKING_SESSION_SIGNUP_SOURCES.includes(payload.source)
          ? payload.source
          : 'self',
        businessCardId: payload.businessCardId ?? null,
        businessCardSnapshot,
        profileSnapshot: payload.profileSnapshot ?? null,
        metadata: payload.metadata ?? {},
        joinUrl: payload.joinUrl ?? null,
      },
      { transaction },
    );

    const reloaded = await NetworkingSessionSignup.findByPk(signup.id, { transaction });
    clearCaches({ companyId: session.companyId, sessionId: session.id });
    return serialiseSignup(reloaded);
  });
}

export async function updateNetworkingSignup(
  sessionId,
  signupId,
  payload = {},
  { authorizedWorkspaceIds = [] } = {},
) {
  const session = await NetworkingSession.findByPk(sessionId);
  ensureSession(session);
  assertWorkspacePermission(session.companyId, authorizedWorkspaceIds);

  const signup = await NetworkingSessionSignup.findOne({
    where: { id: signupId, sessionId },
  });
  if (!signup) {
    throw new NotFoundError('Networking session registration not found.');
  }

  const updates = {};
  if (payload.status && NETWORKING_SESSION_SIGNUP_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.participantName != null) {
    updates.participantName = payload.participantName.trim();
  }
  if (payload.joinUrl !== undefined) {
    updates.joinUrl = payload.joinUrl ?? null;
  }
  if (payload.seatNumber != null) {
    updates.seatNumber = Number.isFinite(Number(payload.seatNumber))
      ? Math.max(1, Math.round(Number(payload.seatNumber)))
      : null;
  }
  if (payload.checkedInAt !== undefined) {
    updates.checkedInAt = payload.checkedInAt ? toDate(payload.checkedInAt) : new Date();
    updates.status = updates.status ?? 'checked_in';
  }
  if (payload.completedAt !== undefined) {
    updates.completedAt = payload.completedAt ? toDate(payload.completedAt) : new Date();
    updates.status = updates.status ?? 'completed';
  }
  if (payload.businessCardId !== undefined) {
    if (payload.businessCardId == null) {
      updates.businessCardId = null;
      updates.businessCardSnapshot = null;
    } else {
      const card = await NetworkingBusinessCard.findByPk(payload.businessCardId);
      ensureBusinessCard(card);
      updates.businessCardId = card.id;
      updates.businessCardSnapshot = card.toPublicObject();
    }
  }
  if (payload.businessCardSnapshot !== undefined) {
    updates.businessCardSnapshot = payload.businessCardSnapshot;
  }
  if (payload.profileSnapshot !== undefined) {
    updates.profileSnapshot = payload.profileSnapshot;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }
  if (payload.profileSharedCount != null) {
    updates.profileSharedCount = Math.max(0, Math.round(Number(payload.profileSharedCount) || 0));
  }
  if (payload.connectionsSaved != null) {
    updates.connectionsSaved = Math.max(0, Math.round(Number(payload.connectionsSaved) || 0));
  }
  if (payload.messagesSent != null) {
    updates.messagesSent = Math.max(0, Math.round(Number(payload.messagesSent) || 0));
  }
  if (payload.followUpsScheduled != null) {
    updates.followUpsScheduled = Math.max(0, Math.round(Number(payload.followUpsScheduled) || 0));
  }
  if (payload.satisfactionScore != null) {
    const score = Number(payload.satisfactionScore);
    if (!Number.isFinite(score)) {
      throw new ValidationError('Satisfaction score must be a number.');
    }
    updates.satisfactionScore = Math.max(0, Math.min(5, Number(score.toFixed(2))));
  }
  if (payload.feedbackNotes !== undefined) {
    updates.feedbackNotes = payload.feedbackNotes ?? null;
  }

  return sequelize.transaction(async (transaction) => {
    if (updates.status === 'no_show') {
      updates.noShowCount = (signup.noShowCount ?? 0) + 1;
      updates.penaltyCount = (signup.penaltyCount ?? 0) + 1;
      updates.lastPenaltyAt = new Date();
    }
    if (updates.status === 'removed') {
      updates.joinUrl = null;
      updates.seatNumber = null;
    }
    await signup.update(updates, { transaction });
    const session = await NetworkingSession.findByPk(sessionId, { transaction });
    clearCaches({ companyId: session.companyId, sessionId });
    return serialiseSignup(signup);
  });
}

export async function listNetworkingBusinessCards(
  { ownerId, companyId } = {},
  { authorizedWorkspaceIds = [] } = {},
) {
  const where = {};
  const normalisedAuthorized = normaliseWorkspaceIds(authorizedWorkspaceIds);

  if (ownerId != null) {
    where.ownerId = ownerId;
  }
  if (companyId != null) {
    assertWorkspacePermission(companyId, normalisedAuthorized);
    where.companyId = Number(companyId);
  } else if (normalisedAuthorized.length) {
    where.companyId = { [Op.in]: normalisedAuthorized };
  }
  const cards = await NetworkingBusinessCard.findAll({ where, order: [['updatedAt', 'DESC']], limit: 100 });
  return cards.map((card) => serialiseBusinessCard(card));
}

export async function createNetworkingBusinessCard(
  payload = {},
  { ownerId, companyId, authorizedWorkspaceIds = [] } = {},
) {
  assertWorkspacePermission(companyId, authorizedWorkspaceIds);
  const {
    title,
    headline,
    bio,
    contactEmail,
    contactPhone,
    websiteUrl,
    linkedinUrl,
    calendlyUrl,
    portfolioUrl,
    attachments,
    spotlightVideoUrl,
    preferences,
    tags,
    status = 'draft',
  } = payload;

  if (!title || !title.trim()) {
    throw new ValidationError('Business card title is required.');
  }
  const email = `${contactEmail ?? ''}`.trim().toLowerCase();
  if (!email) {
    throw new ValidationError('Business card contact email is required.');
  }
  if (!NETWORKING_BUSINESS_CARD_STATUSES.includes(status)) {
    throw new ValidationError('Invalid business card status provided.');
  }

  const card = await NetworkingBusinessCard.create({
    ownerId: ownerId ?? null,
    companyId: companyId ?? null,
    title: title.trim(),
    headline: headline ?? null,
    bio: bio ?? null,
    contactEmail: email,
    contactPhone: contactPhone ?? null,
    websiteUrl: websiteUrl ?? null,
    linkedinUrl: linkedinUrl ?? null,
    calendlyUrl: calendlyUrl ?? null,
    portfolioUrl: portfolioUrl ?? null,
    attachments: Array.isArray(attachments) ? attachments : [],
    spotlightVideoUrl: spotlightVideoUrl ?? null,
    preferences: preferences ?? {},
    tags: Array.isArray(tags) ? tags : [],
    status,
  });
  return serialiseBusinessCard(card);
}

export async function updateNetworkingBusinessCard(cardId, payload = {}, { authorizedWorkspaceIds = [] } = {}) {
  const card = await NetworkingBusinessCard.findByPk(cardId);
  ensureBusinessCard(card);
  assertWorkspacePermission(card.companyId, authorizedWorkspaceIds);
  const updates = {};
  if (payload.title != null) {
    updates.title = payload.title.trim();
  }
  if (payload.headline !== undefined) {
    updates.headline = payload.headline ?? null;
  }
  if (payload.bio !== undefined) {
    updates.bio = payload.bio ?? null;
  }
  if (payload.contactEmail !== undefined) {
    const email = `${payload.contactEmail ?? ''}`.trim().toLowerCase();
    if (!email) {
      throw new ValidationError('Business card contact email is required.');
    }
    updates.contactEmail = email;
  }
  if (payload.contactPhone !== undefined) {
    updates.contactPhone = payload.contactPhone ?? null;
  }
  if (payload.websiteUrl !== undefined) {
    updates.websiteUrl = payload.websiteUrl ?? null;
  }
  if (payload.linkedinUrl !== undefined) {
    updates.linkedinUrl = payload.linkedinUrl ?? null;
  }
  if (payload.calendlyUrl !== undefined) {
    updates.calendlyUrl = payload.calendlyUrl ?? null;
  }
  if (payload.portfolioUrl !== undefined) {
    updates.portfolioUrl = payload.portfolioUrl ?? null;
  }
  if (payload.attachments !== undefined) {
    updates.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  }
  if (payload.spotlightVideoUrl !== undefined) {
    updates.spotlightVideoUrl = payload.spotlightVideoUrl ?? null;
  }
  if (payload.preferences !== undefined) {
    updates.preferences = payload.preferences ?? {};
  }
  if (payload.tags !== undefined) {
    updates.tags = Array.isArray(payload.tags) ? payload.tags : [];
  }
  if (payload.status && NETWORKING_BUSINESS_CARD_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }
  if (payload.lastSharedAt !== undefined) {
    updates.lastSharedAt = payload.lastSharedAt ? toDate(payload.lastSharedAt) : null;
  }
  if (payload.shareCount != null) {
    updates.shareCount = Math.max(0, Math.round(Number(payload.shareCount) || 0));
  }
  await card.update(updates);
  return serialiseBusinessCard(card);
}

export async function getNetworkingSessionRuntime(sessionId, { authorizedWorkspaceIds = [] } = {}) {
  const cacheKey = buildCacheKey(RUNTIME_CACHE_NAMESPACE, {
    sessionId,
    scope: normaliseWorkspaceIds(authorizedWorkspaceIds).join('-') || 'global',
  });
  return appCache.remember(cacheKey, 15, async () => {
    const session = await NetworkingSession.findByPk(sessionId, {
      include: [
        { model: NetworkingSessionRotation, as: 'rotations' },
        { model: NetworkingSessionSignup, as: 'signups' },
      ],
    });
    ensureSession(session);
    assertWorkspacePermission(session.companyId, authorizedWorkspaceIds);
    const now = Date.now();
    const rotations = session.rotations ?? [];
    const activeRotation = rotations.find((rotation) => {
      const start = rotation.startTime ? new Date(rotation.startTime).getTime() : null;
      const end = rotation.endTime ? new Date(rotation.endTime).getTime() : null;
      if (start == null || end == null) {
        return false;
      }
      return start <= now && end >= now;
    });
    const nextRotation = rotations.find((rotation) => {
      const start = rotation.startTime ? new Date(rotation.startTime).getTime() : null;
      return start != null && start > now;
    });
    const signups = session.signups ?? [];
    const checkedIn = signups.filter((signup) => signup.status === 'checked_in');
    const waitlist = signups.filter((signup) => signup.status === 'waitlisted');
    const completed = signups.filter((signup) => signup.status === 'completed');
    const noShows = signups.filter((signup) => signup.status === 'no_show');
    return {
      session: serialiseSession(session),
      runtime: {
        activeRotation: activeRotation ? activeRotation.toPublicObject() : null,
        nextRotation: nextRotation ? nextRotation.toPublicObject() : null,
        checkedIn: checkedIn.map((signup) => signup.toPublicObject()),
        waitlist: waitlist.map((signup) => signup.toPublicObject()),
        completed: completed.map((signup) => signup.toPublicObject()),
        noShows: noShows.map((signup) => signup.toPublicObject()),
      },
    };
  });
}

export default {
  createNetworkingSession,
  updateNetworkingSession,
  listNetworkingSessions,
  getNetworkingSession,
  regenerateNetworkingRotations,
  registerForNetworkingSession,
  updateNetworkingSignup,
  listNetworkingBusinessCards,
  createNetworkingBusinessCard,
  updateNetworkingBusinessCard,
  getNetworkingSessionRuntime,
};
