import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  AgencyMentoringSession,
  AgencyMentoringPurchase,
  AgencyMentorPreference,
  User,
} from '../models/index.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

function parseInteger(value) {
  if (value == null || value === '') return null;
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function normaliseDecimal(value) {
  if (value == null) return null;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toPlainUser(user) {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : user;
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id ?? null,
    name: fullName || null,
    email: plain.email ?? null,
    title: plain.title ?? null,
    location: plain.location ?? null,
  };
}

function sanitizeSession(sessionInstance) {
  if (!sessionInstance) return null;
  const plain = sessionInstance.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    purchaseId: plain.purchaseId,
    mentorId: plain.mentorId,
    mentorName: plain.mentorName ?? plain.mentor?.name ?? null,
    mentorEmail: plain.mentorEmail ?? plain.mentor?.email ?? null,
    clientName: plain.clientName,
    clientEmail: plain.clientEmail,
    clientCompany: plain.clientCompany,
    focusArea: plain.focusArea,
    agenda: plain.agenda,
    scheduledAt: plain.scheduledAt,
    durationMinutes: plain.durationMinutes,
    status: plain.status,
    meetingUrl: plain.meetingUrl,
    recordingUrl: plain.recordingUrl,
    followUpActions: plain.followUpActions,
    sessionNotes: plain.sessionNotes,
    sessionTags: plain.sessionTags ?? [],
    costAmount: normaliseDecimal(plain.costAmount),
    currency: plain.currency,
    createdBy: plain.createdBy,
    mentor: toPlainUser(plain.mentor ?? null),
    createdByUser: toPlainUser(plain.createdByUser ?? null),
    purchase: plain.purchase
      ? {
          id: plain.purchase.id,
          packageName: plain.purchase.packageName,
          sessionsIncluded: plain.purchase.sessionsIncluded,
          sessionsUsed: plain.purchase.sessionsUsed,
          status: plain.purchase.status,
        }
      : null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizePurchase(purchaseInstance) {
  if (!purchaseInstance) return null;
  const plain = purchaseInstance.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    mentorId: plain.mentorId,
    mentorName: plain.mentorName ?? plain.mentor?.name ?? null,
    mentorEmail: plain.mentorEmail ?? plain.mentor?.email ?? null,
    packageName: plain.packageName,
    description: plain.description,
    sessionsIncluded: plain.sessionsIncluded,
    sessionsUsed: plain.sessionsUsed,
    amount: normaliseDecimal(plain.amount),
    currency: plain.currency,
    purchasedAt: plain.purchasedAt,
    validFrom: plain.validFrom,
    validUntil: plain.validUntil,
    status: plain.status,
    invoiceUrl: plain.invoiceUrl,
    referenceCode: plain.referenceCode,
    notes: plain.notes,
    mentor: toPlainUser(plain.mentor ?? null),
    createdBy: plain.createdBy,
    createdByUser: toPlainUser(plain.createdByUser ?? null),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizePreference(preferenceInstance) {
  if (!preferenceInstance) return null;
  const plain = preferenceInstance.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    mentorId: plain.mentorId,
    mentorName: plain.mentorName ?? plain.mentor?.name ?? null,
    mentorEmail: plain.mentorEmail ?? plain.mentor?.email ?? null,
    preferenceLevel: plain.preferenceLevel,
    favourite: Boolean(plain.favourite),
    introductionNotes: plain.introductionNotes,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    lastEngagedAt: plain.lastEngagedAt,
    createdBy: plain.createdBy,
    mentor: toPlainUser(plain.mentor ?? null),
    createdByUser: toPlainUser(plain.createdByUser ?? null),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

async function ensureWorkspaceAccess(workspace, actorId, actorRoles = []) {
  if (!workspace) {
    return null;
  }

  const normalizedRoles = new Set((actorRoles ?? []).map((role) => `${role}`.toLowerCase()));
  const isAdmin = normalizedRoles.has('admin');

  if (isAdmin || workspace.ownerId === actorId) {
    return workspace;
  }

  const membershipCount = await ProviderWorkspaceMember.count({
    where: { workspaceId: workspace.id, userId: actorId },
  });

  if (membershipCount === 0) {
    throw new AuthorizationError('You do not have permission to access this agency workspace.');
  }

  return workspace;
}

async function resolveAgencyWorkspace({ workspaceId, workspaceSlug } = {}, { actorId, actorRoles = [], actorRole = null } = {}) {
  if (!actorId) {
    throw new AuthenticationError('Authentication required.');
  }

  const normalizedRoles = new Set([actorRole, ...(actorRoles ?? [])].filter(Boolean).map((role) => `${role}`.toLowerCase()));
  const isAdmin = normalizedRoles.has('admin');

  let workspace = null;
  const explicitId = parseInteger(workspaceId);
  const explicitSlug = workspaceSlug ? `${workspaceSlug}`.trim() : null;

  if (explicitId || explicitSlug) {
    const where = { type: 'agency' };
    if (explicitId) where.id = explicitId;
    if (explicitSlug) where.slug = explicitSlug;

    workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
    await ensureWorkspaceAccess(workspace, actorId, Array.from(normalizedRoles));
    return workspace;
  }

  if (isAdmin) {
    workspace = await ProviderWorkspace.findOne({ where: { type: 'agency' }, order: [['createdAt', 'ASC']] });
    if (!workspace) {
      throw new NotFoundError('No agency workspaces are registered yet.');
    }
    return workspace;
  }

  workspace = await ProviderWorkspace.findOne({
    where: { type: 'agency', ownerId: actorId },
    order: [['createdAt', 'ASC']],
  });

  if (workspace) {
    return workspace;
  }

  const membership = await ProviderWorkspaceMember.findOne({
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

  if (!membership?.workspace) {
    throw new AuthorizationError('No agency workspace is linked to your account yet.');
  }

  return membership.workspace;
}

const SESSION_INCLUDE = [
  { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'location'] },
  { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
  {
    model: AgencyMentoringPurchase,
    as: 'purchase',
    attributes: ['id', 'packageName', 'sessionsIncluded', 'sessionsUsed', 'status'],
  },
];

const PURCHASE_INCLUDE = [
  { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'title'] },
  { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
];

const PREFERENCE_INCLUDE = [
  { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'title'] },
  { model: User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
];

function isUpcomingSession(session) {
  if (!session?.scheduledAt) return false;
  const scheduledAt = new Date(session.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  const now = new Date();
  return scheduledAt >= new Date(now.getTime() - 12 * 60 * 60 * 1000);
}

async function buildSuggestedMentors(workspaceId, sessions, purchases, preferences) {
  const favouriteMentorIds = new Set(
    (preferences ?? [])
      .map((pref) => pref.mentorId)
      .filter((mentorId) => mentorId != null),
  );

  const engagementIndex = new Map();

  sessions.forEach((session) => {
    const key = session.mentorId || session.mentorEmail || session.mentorName;
    if (!key) return;
    const existing = engagementIndex.get(key) ?? { count: 0, mentorId: session.mentorId ?? null, mentorName: session.mentorName ?? null, mentorEmail: session.mentorEmail ?? null };
    existing.count += 1;
    if (!existing.mentorName && session.mentorName) existing.mentorName = session.mentorName;
    if (!existing.mentorEmail && session.mentorEmail) existing.mentorEmail = session.mentorEmail;
    engagementIndex.set(key, existing);
  });

  purchases.forEach((purchase) => {
    const key = purchase.mentorId || purchase.mentorEmail || purchase.mentorName;
    if (!key) return;
    const existing = engagementIndex.get(key) ?? { count: 0, mentorId: purchase.mentorId ?? null, mentorName: purchase.mentorName ?? null, mentorEmail: purchase.mentorEmail ?? null };
    existing.count += 1;
    if (!existing.mentorName && purchase.mentorName) existing.mentorName = purchase.mentorName;
    if (!existing.mentorEmail && purchase.mentorEmail) existing.mentorEmail = purchase.mentorEmail;
    engagementIndex.set(key, existing);
  });

  const sortedEngagements = Array.from(engagementIndex.values()).sort((a, b) => b.count - a.count);
  const prioritized = sortedEngagements.filter((entry) => !favouriteMentorIds.has(entry.mentorId ?? -1));

  const mentorIds = prioritized.map((entry) => entry.mentorId).filter((id) => id != null);
  const mentorProfiles = mentorIds.length
    ? await User.findAll({ where: { id: mentorIds }, attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'location'] })
    : [];
  const profileMap = new Map(mentorProfiles.map((profile) => [profile.id, toPlainUser(profile)]));

  const suggestions = prioritized.map((entry) => {
    const profile = entry.mentorId ? profileMap.get(entry.mentorId) : null;
    const displayName = profile?.name || entry.mentorName || 'Mentor partner';
    const highlight = entry.count >= 3 ? 'Frequent collaborator' : entry.count === 2 ? 'Emerging favourite' : 'Recent engagement';
    return {
      mentorId: entry.mentorId ?? null,
      mentorName: displayName,
      mentorEmail: profile?.email || entry.mentorEmail || null,
      location: profile?.location ?? null,
      title: profile?.title ?? null,
      highlight,
      engagementCount: entry.count,
    };
  });

  if (suggestions.length >= 8) {
    return suggestions.slice(0, 8);
  }

  const excludedIds = new Set([
    ...favouriteMentorIds,
    ...suggestions.map((suggestion) => suggestion.mentorId).filter((id) => id != null),
  ]);

  const additionalMentors = await User.findAll({
    where: {
      userType: 'mentor',
      ...(excludedIds.size
        ? {
            id: {
              [Op.notIn]: Array.from(excludedIds),
            },
          }
        : {}),
    },
    attributes: ['id', 'firstName', 'lastName', 'email', 'title', 'location', 'lastLoginAt'],
    order: [['lastLoginAt', 'DESC']],
    limit: 8,
  });

  additionalMentors.forEach((mentor) => {
    const profile = toPlainUser(mentor);
    suggestions.push({
      mentorId: profile.id,
      mentorName: profile.name ?? 'Mentor partner',
      mentorEmail: profile.email ?? null,
      location: profile.location ?? null,
      title: profile.title ?? null,
      highlight: 'Trusted Gigvora mentor',
      engagementCount: 0,
    });
  });

  return suggestions.slice(0, 12);
}

export async function getMentoringOverview(params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);

  const [sessionRows, purchaseRows, preferenceRows] = await Promise.all([
    AgencyMentoringSession.findAll({
      where: { workspaceId: workspace.id },
      include: SESSION_INCLUDE,
      order: [['scheduledAt', 'ASC']],
      limit: 120,
    }),
    AgencyMentoringPurchase.findAll({
      where: { workspaceId: workspace.id },
      include: PURCHASE_INCLUDE,
      order: [['purchasedAt', 'DESC']],
      limit: 60,
    }),
    AgencyMentorPreference.findAll({
      where: { workspaceId: workspace.id },
      include: PREFERENCE_INCLUDE,
      order: [['preferenceLevel', 'ASC']],
    }),
  ]);

  const sessions = sessionRows.map(sanitizeSession);
  const purchases = purchaseRows.map(sanitizePurchase);
  const preferences = preferenceRows.map(sanitizePreference);

  const metrics = {
    booked: sessions.filter((session) => ['scheduled', 'in_progress'].includes(session.status)).length,
    finished: sessions.filter((session) => session.status === 'completed').length,
    purchased: purchases.reduce((total, purchase) => total + (purchase.sessionsIncluded ?? 0), 0),
    spend: sessions.reduce((total, session) => total + (session.costAmount ?? 0), 0),
  };

  const upcomingSessions = sessions.filter(isUpcomingSession).slice(0, 10);
  const favouriteMentors = preferences.filter((pref) => pref.favourite);
  const suggestedMentors = await buildSuggestedMentors(workspace.id, sessions, purchases, preferences);

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      defaultCurrency: workspace.defaultCurrency,
    },
    metrics,
    upcomingSessions,
    favouriteMentors,
    suggestedMentors,
    recentPurchases: purchases.slice(0, 8),
    refreshedAt: new Date().toISOString(),
  };
}

export async function listMentoringSessions(params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const where = { workspaceId: workspace.id };

  const status = params.status ? `${params.status}`.toLowerCase() : null;
  if (status) {
    where.status = status;
  }

  const mentorId = parseInteger(params.mentorId);
  if (mentorId) {
    where[Op.or] = [{ mentorId }, { mentorEmail: params.mentorEmail ?? null }];
  }

  if (params.from || params.to) {
    const range = {};
    if (params.from) {
      range[Op.gte] = new Date(params.from);
    }
    if (params.to) {
      range[Op.lte] = new Date(params.to);
    }
    where.scheduledAt = range;
  }

  const rows = await AgencyMentoringSession.findAll({
    where,
    include: SESSION_INCLUDE,
    order: [['scheduledAt', 'DESC']],
  });

  return {
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    sessions: rows.map(sanitizeSession),
  };
}

export async function createMentoringSession(payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const { actorId } = actor;

  const mentorId = parseInteger(payload.mentorId);
  const mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  const mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;

  if (!mentorId && !mentorName && !mentorEmail) {
    throw new ValidationError('Provide a mentor name, email, or linked mentor account.');
  }
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
    throw new ValidationError('A valid session start time is required.');
  }

  const session = await AgencyMentoringSession.create({
    workspaceId: workspace.id,
    purchaseId: parseInteger(payload.purchaseId),
    mentorId: mentorId ?? null,
    mentorName,
    mentorEmail,
    clientName: payload.clientName ? `${payload.clientName}`.trim() : null,
    clientEmail: payload.clientEmail ? `${payload.clientEmail}`.trim() : null,
    clientCompany: payload.clientCompany ? `${payload.clientCompany}`.trim() : null,
    focusArea: payload.focusArea ? `${payload.focusArea}`.trim() : null,
    agenda: payload.agenda ?? null,
    scheduledAt,
    durationMinutes: payload.durationMinutes ? Number.parseInt(payload.durationMinutes, 10) || null : null,
    status: payload.status ? `${payload.status}`.toLowerCase() : 'scheduled',
    meetingUrl: payload.meetingUrl ?? null,
    recordingUrl: payload.recordingUrl ?? null,
    followUpActions: payload.followUpActions ?? null,
    sessionNotes: payload.sessionNotes ?? null,
    sessionTags: Array.isArray(payload.sessionTags) ? payload.sessionTags : null,
    costAmount: payload.costAmount ?? null,
    currency: payload.currency ? `${payload.currency}`.toUpperCase() : workspace.defaultCurrency ?? 'USD',
    createdBy: actorId,
    metadata: payload.metadata ?? null,
  });

  const reloaded = await session.reload({ include: SESSION_INCLUDE });
  return sanitizeSession(reloaded);
}

export async function updateMentoringSession(sessionId, payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const numericId = parseInteger(sessionId);
  if (!numericId) {
    throw new ValidationError('A valid session identifier is required.');
  }

  const session = await AgencyMentoringSession.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }

  const updates = {};
  if (payload.purchaseId !== undefined) updates.purchaseId = parseInteger(payload.purchaseId);
  if (payload.mentorId !== undefined) updates.mentorId = parseInteger(payload.mentorId);
  if (payload.mentorName !== undefined) updates.mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  if (payload.mentorEmail !== undefined)
    updates.mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  if (payload.clientName !== undefined) updates.clientName = payload.clientName ? `${payload.clientName}`.trim() : null;
  if (payload.clientEmail !== undefined) updates.clientEmail = payload.clientEmail ? `${payload.clientEmail}`.trim() : null;
  if (payload.clientCompany !== undefined)
    updates.clientCompany = payload.clientCompany ? `${payload.clientCompany}`.trim() : null;
  if (payload.focusArea !== undefined) updates.focusArea = payload.focusArea ? `${payload.focusArea}`.trim() : null;
  if (payload.agenda !== undefined) updates.agenda = payload.agenda ?? null;
  if (payload.scheduledAt !== undefined) {
    const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      throw new ValidationError('A valid session start time is required.');
    }
    updates.scheduledAt = scheduledAt;
  }
  if (payload.durationMinutes !== undefined) {
    updates.durationMinutes = payload.durationMinutes ? Number.parseInt(payload.durationMinutes, 10) || null : null;
  }
  if (payload.status !== undefined) updates.status = `${payload.status}`.toLowerCase();
  if (payload.meetingUrl !== undefined) updates.meetingUrl = payload.meetingUrl ?? null;
  if (payload.recordingUrl !== undefined) updates.recordingUrl = payload.recordingUrl ?? null;
  if (payload.followUpActions !== undefined) updates.followUpActions = payload.followUpActions ?? null;
  if (payload.sessionNotes !== undefined) updates.sessionNotes = payload.sessionNotes ?? null;
  if (payload.sessionTags !== undefined) updates.sessionTags = Array.isArray(payload.sessionTags) ? payload.sessionTags : null;
  if (payload.costAmount !== undefined) updates.costAmount = payload.costAmount ?? null;
  if (payload.currency !== undefined) updates.currency = payload.currency ? `${payload.currency}`.toUpperCase() : null;
  if (payload.metadata !== undefined) updates.metadata = payload.metadata ?? null;

  await session.update(updates);
  const reloaded = await session.reload({ include: SESSION_INCLUDE });
  return sanitizeSession(reloaded);
}

export async function deleteMentoringSession(sessionId, params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const numericId = parseInteger(sessionId);
  if (!numericId) {
    throw new ValidationError('A valid session identifier is required.');
  }

  const session = await AgencyMentoringSession.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }

  await session.destroy();
  return { success: true };
}

export async function listMentoringPurchases(params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const rows = await AgencyMentoringPurchase.findAll({
    where: { workspaceId: workspace.id },
    include: PURCHASE_INCLUDE,
    order: [['purchasedAt', 'DESC']],
  });

  return {
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    purchases: rows.map(sanitizePurchase),
  };
}

export async function createMentoringPurchase(payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const { actorId } = actor;

  const mentorId = parseInteger(payload.mentorId);
  const mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  const mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  const packageName = payload.packageName ? `${payload.packageName}`.trim() : null;

  if (!packageName) {
    throw new ValidationError('Package name is required.');
  }

  const purchase = await AgencyMentoringPurchase.create({
    workspaceId: workspace.id,
    mentorId: mentorId ?? null,
    mentorName,
    mentorEmail,
    packageName,
    description: payload.description ?? null,
    sessionsIncluded: payload.sessionsIncluded ? Number.parseInt(payload.sessionsIncluded, 10) || null : null,
    sessionsUsed: payload.sessionsUsed ? Number.parseInt(payload.sessionsUsed, 10) || 0 : 0,
    amount: payload.amount ?? null,
    currency: payload.currency ? `${payload.currency}`.toUpperCase() : workspace.defaultCurrency ?? 'USD',
    purchasedAt: payload.purchasedAt ? new Date(payload.purchasedAt) : new Date(),
    validFrom: payload.validFrom ? new Date(payload.validFrom) : null,
    validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
    status: payload.status ? `${payload.status}`.toLowerCase() : 'active',
    invoiceUrl: payload.invoiceUrl ?? null,
    referenceCode: payload.referenceCode ?? null,
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? null,
    createdBy: actorId,
  });

  const reloaded = await purchase.reload({ include: PURCHASE_INCLUDE });
  return sanitizePurchase(reloaded);
}

export async function updateMentoringPurchase(purchaseId, payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const numericId = parseInteger(purchaseId);
  if (!numericId) {
    throw new ValidationError('A valid purchase identifier is required.');
  }

  const purchase = await AgencyMentoringPurchase.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!purchase) {
    throw new NotFoundError('Mentoring purchase not found.');
  }

  const updates = {};
  if (payload.mentorId !== undefined) updates.mentorId = parseInteger(payload.mentorId);
  if (payload.mentorName !== undefined) updates.mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  if (payload.mentorEmail !== undefined)
    updates.mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  if (payload.packageName !== undefined) {
    const packageName = payload.packageName ? `${payload.packageName}`.trim() : null;
    if (!packageName) {
      throw new ValidationError('Package name is required.');
    }
    updates.packageName = packageName;
  }
  if (payload.description !== undefined) updates.description = payload.description ?? null;
  if (payload.sessionsIncluded !== undefined)
    updates.sessionsIncluded = payload.sessionsIncluded ? Number.parseInt(payload.sessionsIncluded, 10) || null : null;
  if (payload.sessionsUsed !== undefined)
    updates.sessionsUsed = payload.sessionsUsed ? Number.parseInt(payload.sessionsUsed, 10) || 0 : 0;
  if (payload.amount !== undefined) updates.amount = payload.amount ?? null;
  if (payload.currency !== undefined) updates.currency = payload.currency ? `${payload.currency}`.toUpperCase() : null;
  if (payload.purchasedAt !== undefined)
    updates.purchasedAt = payload.purchasedAt ? new Date(payload.purchasedAt) : new Date();
  if (payload.validFrom !== undefined) updates.validFrom = payload.validFrom ? new Date(payload.validFrom) : null;
  if (payload.validUntil !== undefined) updates.validUntil = payload.validUntil ? new Date(payload.validUntil) : null;
  if (payload.status !== undefined) updates.status = `${payload.status}`.toLowerCase();
  if (payload.invoiceUrl !== undefined) updates.invoiceUrl = payload.invoiceUrl ?? null;
  if (payload.referenceCode !== undefined) updates.referenceCode = payload.referenceCode ?? null;
  if (payload.notes !== undefined) updates.notes = payload.notes ?? null;
  if (payload.metadata !== undefined) updates.metadata = payload.metadata ?? null;

  if (
    updates.sessionsIncluded != null &&
    updates.sessionsUsed != null &&
    updates.sessionsUsed > updates.sessionsIncluded
  ) {
    throw new ValidationError('Sessions used cannot exceed sessions included.');
  }

  await purchase.update(updates);
  const reloaded = await purchase.reload({ include: PURCHASE_INCLUDE });
  return sanitizePurchase(reloaded);
}

export async function listMentorPreferences(params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const rows = await AgencyMentorPreference.findAll({
    where: { workspaceId: workspace.id },
    include: PREFERENCE_INCLUDE,
    order: [['preferenceLevel', 'ASC'], ['mentorName', 'ASC']],
  });

  return {
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    favourites: rows.map(sanitizePreference),
  };
}

export async function createMentorPreference(payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const { actorId } = actor;

  const mentorId = parseInteger(payload.mentorId);
  const mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  const mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  const preferenceLevel = payload.preferenceLevel ? `${payload.preferenceLevel}`.toLowerCase() : 'preferred';

  if (!mentorName && !mentorEmail && !mentorId) {
    throw new ValidationError('Provide at least a mentor name or contact email.');
  }

  const preference = await AgencyMentorPreference.create({
    workspaceId: workspace.id,
    mentorId: mentorId ?? null,
    mentorName: mentorName || 'Mentor partner',
    mentorEmail: mentorEmail ?? null,
    preferenceLevel,
    favourite: payload.favourite !== undefined ? Boolean(payload.favourite) : true,
    introductionNotes: payload.introductionNotes ?? null,
    tags: Array.isArray(payload.tags) ? payload.tags : null,
    lastEngagedAt: payload.lastEngagedAt ? new Date(payload.lastEngagedAt) : null,
    metadata: payload.metadata ?? null,
    createdBy: actorId,
  });

  const reloaded = await preference.reload({ include: PREFERENCE_INCLUDE });
  return sanitizePreference(reloaded);
}

export async function updateMentorPreference(preferenceId, payload = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(payload, actor);
  const numericId = parseInteger(preferenceId);
  if (!numericId) {
    throw new ValidationError('A valid favourite identifier is required.');
  }

  const preference = await AgencyMentorPreference.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!preference) {
    throw new NotFoundError('Favourite mentor record not found.');
  }

  const updates = {};
  if (payload.mentorId !== undefined) updates.mentorId = parseInteger(payload.mentorId);
  if (payload.mentorName !== undefined) updates.mentorName = payload.mentorName ? `${payload.mentorName}`.trim() : null;
  if (payload.mentorEmail !== undefined)
    updates.mentorEmail = payload.mentorEmail ? `${payload.mentorEmail}`.trim().toLowerCase() : null;
  if (payload.preferenceLevel !== undefined)
    updates.preferenceLevel = payload.preferenceLevel ? `${payload.preferenceLevel}`.toLowerCase() : null;
  if (payload.favourite !== undefined) updates.favourite = Boolean(payload.favourite);
  if (payload.introductionNotes !== undefined) updates.introductionNotes = payload.introductionNotes ?? null;
  if (payload.tags !== undefined) updates.tags = Array.isArray(payload.tags) ? payload.tags : null;
  if (payload.lastEngagedAt !== undefined)
    updates.lastEngagedAt = payload.lastEngagedAt ? new Date(payload.lastEngagedAt) : null;
  if (payload.metadata !== undefined) updates.metadata = payload.metadata ?? null;

  await preference.update(updates);
  const reloaded = await preference.reload({ include: PREFERENCE_INCLUDE });
  return sanitizePreference(reloaded);
}

export async function deleteMentorPreference(preferenceId, params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const numericId = parseInteger(preferenceId);
  if (!numericId) {
    throw new ValidationError('A valid favourite identifier is required.');
  }

  const preference = await AgencyMentorPreference.findOne({
    where: { id: numericId, workspaceId: workspace.id },
  });

  if (!preference) {
    throw new NotFoundError('Favourite mentor record not found.');
  }

  await preference.destroy();
  return { success: true };
}

export async function listSuggestedMentors(params = {}, actor = {}) {
  const workspace = await resolveAgencyWorkspace(params, actor);
  const [sessionRows, purchaseRows, preferenceRows] = await Promise.all([
    AgencyMentoringSession.findAll({ where: { workspaceId: workspace.id }, limit: 120 }),
    AgencyMentoringPurchase.findAll({ where: { workspaceId: workspace.id }, limit: 60 }),
    AgencyMentorPreference.findAll({ where: { workspaceId: workspace.id } }),
  ]);

  const suggestions = await buildSuggestedMentors(
    workspace.id,
    sessionRows.map((row) => row.get({ plain: true })),
    purchaseRows.map((row) => row.get({ plain: true })),
    preferenceRows.map((row) => row.get({ plain: true })),
  );

  return {
    workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    suggestedMentors: suggestions,
  };
}

export default {
  getMentoringOverview,
  listMentoringSessions,
  createMentoringSession,
  updateMentoringSession,
  deleteMentoringSession,
  listMentoringPurchases,
  createMentoringPurchase,
  updateMentoringPurchase,
  listMentorPreferences,
  createMentorPreference,
  updateMentorPreference,
  deleteMentorPreference,
  listSuggestedMentors,
};
