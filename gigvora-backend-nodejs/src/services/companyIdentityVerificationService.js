import { Op } from 'sequelize';
import {
  sequelize,
  IdentityVerification,
  IdentityVerificationEvent,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  Profile,
  User,
  ID_VERIFICATION_STATUSES,
} from '../models/index.js';
import { upsertIdentityVerification } from './complianceService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const log = logger.child({ component: 'companyIdentityVerificationService' });

const ACTIVE_MEMBER_STATUSES = ['active', 'pending', 'suspended'];
const REVIEW_ROLES = new Set(['owner', 'admin', 'manager']);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const SORT_OPTIONS = Object.freeze([
  { value: 'recent', label: 'Most recent activity' },
  { value: 'oldest', label: 'Oldest submissions' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'status', label: 'Status' },
  { value: 'review_queue', label: 'Review queue priority' },
]);

function normalisePage(value, fallback = DEFAULT_PAGE) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function normalisePageSize(value, fallback = DEFAULT_PAGE_SIZE) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

function normaliseStatuses(input) {
  if (!input) {
    return [];
  }
  const source = Array.isArray(input) ? input : `${input}`.split(',');
  const normalised = new Set();
  source
    .map((value) => `${value}`.trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => {
      if (ID_VERIFICATION_STATUSES.includes(value)) {
        normalised.add(value);
      }
    });
  return Array.from(normalised);
}

function resolveSort(sort) {
  const requested = `${sort || ''}`.trim().toLowerCase();
  switch (requested) {
    case 'oldest':
      return [
        ['submittedAt', 'ASC'],
        ['id', 'ASC'],
      ];
    case 'name':
      return [[sequelize.col('IdentityVerification.fullName'), 'ASC']];
    case 'status': {
      const statusOrder = ID_VERIFICATION_STATUSES.map((status, index) => `WHEN '${status}' THEN ${index}`).join(' ');
      return [[sequelize.literal(`CASE "IdentityVerification"."status" ${statusOrder} ELSE ${ID_VERIFICATION_STATUSES.length} END`), 'ASC'], ['submittedAt', 'DESC']];
    }
    case 'review_queue': {
      const priority = {
        pending: 0,
        submitted: 1,
        in_review: 2,
        rejected: 3,
        expired: 4,
        verified: 5,
      };
      const clauses = ID_VERIFICATION_STATUSES.map((status) => `WHEN '${status}' THEN ${priority[status] ?? 6}`).join(' ');
      return [[sequelize.literal(`CASE "IdentityVerification"."status" ${clauses} ELSE 6 END`), 'ASC'], ['submittedAt', 'ASC']];
    }
    case 'recent':
    default:
      return [
        ['updatedAt', 'DESC'],
        ['id', 'DESC'],
      ];
  }
}

function mapUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
  };
}

function mapProfile(profile) {
  if (!profile) {
    return null;
  }
  const plain = profile.get ? profile.get({ plain: true }) : profile;
  return {
    id: plain.id,
    headline: plain.headline ?? null,
    location: plain.location ?? null,
    timezone: plain.timezone ?? null,
  };
}

function mapEvent(event) {
  if (!event) {
    return null;
  }
  const plain = event.toPublicObject ? event.toPublicObject() : event;
  return {
    ...plain,
    actor: event.actor ? mapUser(event.actor) : null,
  };
}

function mapVerification(record) {
  const base = record.toPublicObject ? record.toPublicObject() : record;
  return {
    ...base,
    user: record.user ? mapUser(record.user) : null,
    profile: record.profile ? mapProfile(record.profile) : null,
    reviewer: record.reviewer ? mapUser(record.reviewer) : null,
    events: Array.isArray(record.events) ? record.events.map(mapEvent) : [],
  };
}

async function listWorkspaceOptions() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 50,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

async function resolveWorkspace(workspaceId) {
  if (workspaceId) {
    const workspace = await ProviderWorkspace.findOne({ where: { id: workspaceId, type: 'company' } });
    if (!workspace) {
      throw new NotFoundError('Company workspace not found.');
    }
    return workspace;
  }

  const workspace = await ProviderWorkspace.findOne({
    where: { type: 'company' },
    order: [['createdAt', 'ASC']],
  });
  if (!workspace) {
    throw new NotFoundError('No company workspace configured.');
  }
  return workspace;
}

async function fetchWorkspaceMembers(workspaceId) {
  const members = await ProviderWorkspaceMember.findAll({
    where: {
      workspaceId,
      status: { [Op.in]: ACTIVE_MEMBER_STATUSES },
    },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['createdAt', 'ASC']],
  });

  const userIds = members.map((member) => member.userId);
  const profiles = await Profile.findAll({
    where: { userId: { [Op.in]: userIds } },
    attributes: ['id', 'userId', 'headline', 'location', 'timezone'],
  });
  const profilesByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));

  const enrichedMembers = members.map((member) => {
    const plain = member.get({ plain: true });
    return {
      id: plain.id,
      workspaceId: plain.workspaceId,
      userId: plain.userId,
      role: plain.role,
      status: plain.status,
      joinedAt: plain.joinedAt,
      member: mapUser(member.member),
      profile: mapProfile(profilesByUserId.get(plain.userId)),
    };
  });

  return { members: enrichedMembers, userIds };
}

async function fetchStatusCounts(baseWhere) {
  const rows = await IdentityVerification.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: baseWhere,
    group: ['status'],
    raw: true,
  });
  const counts = ID_VERIFICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {},
  );
  rows.forEach((row) => {
    const status = row.status;
    const count = Number(row.count ?? row[sequelize.fn('COUNT', sequelize.col('id'))]) || 0;
    if (status && counts[status] != null) {
      counts[status] = count;
    }
  });
  counts.total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return counts;
}

function differenceInHours(start, end) {
  if (!start || !end) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

async function calculateAverageReviewHours(baseWhere) {
  const records = await IdentityVerification.findAll({
    attributes: ['submittedAt', 'reviewedAt'],
    where: {
      ...baseWhere,
      submittedAt: { [Op.not]: null },
      reviewedAt: { [Op.not]: null },
    },
  });
  if (!records.length) {
    return null;
  }
  const total = records.reduce((sum, record) => {
    const diff = differenceInHours(record.submittedAt, record.reviewedAt);
    return diff != null ? sum + diff : sum;
  }, 0);
  const average = total / records.length;
  return Number.isFinite(average) ? Number(average.toFixed(2)) : null;
}

function buildMemberOption(member) {
  if (!member) {
    return null;
  }
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    status: member.status,
    name: member.member ? `${member.member.firstName} ${member.member.lastName}`.trim() : null,
    email: member.member?.email ?? null,
    profileId: member.profile?.id ?? null,
    profileHeadline: member.profile?.headline ?? null,
    profileLocation: member.profile?.location ?? null,
  };
}

export async function listIdentityVerifications({
  workspaceId,
  status,
  search,
  page,
  pageSize,
  sort,
  includeMembers = true,
} = {}) {
  const workspace = await resolveWorkspace(workspaceId);
  const resolvedPage = normalisePage(page);
  const resolvedPageSize = normalisePageSize(pageSize);
  const statusFilter = normaliseStatuses(status);
  const { members, userIds } = includeMembers ? await fetchWorkspaceMembers(workspace.id) : { members: [], userIds: [] };

  if (!userIds.length) {
    return {
      items: [],
      pagination: { page: resolvedPage, pageSize: resolvedPageSize, totalItems: 0, totalPages: 0 },
      stats: {
        countsByStatus: ID_VERIFICATION_STATUSES.reduce((acc, value) => ({ ...acc, [value]: 0 }), { total: 0 }),
        averageReviewHours: null,
        submittedThisWeek: 0,
        verifiedThisWeek: 0,
        oldestPending: null,
      },
      filters: {
        statuses: ID_VERIFICATION_STATUSES,
        sortOptions: SORT_OPTIONS,
      },
      metadata: {
        workspace: workspace.get({ plain: true }),
        workspaceOptions: await listWorkspaceOptions(),
        reviewerOptions: [],
        memberOptions: [],
        membersNeedingVerification: [],
      },
    };
  }

  const baseWhere = { userId: { [Op.in]: userIds } };
  const where = { ...baseWhere };
  if (statusFilter.length && statusFilter.length < ID_VERIFICATION_STATUSES.length) {
    where.status = { [Op.in]: statusFilter };
  }

  const likeOperator = sequelize.getDialect() === 'postgres' || sequelize.getDialect() === 'postgresql' ? Op.iLike : Op.like;
  if (search && `${search}`.trim().length) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { fullName: { [likeOperator]: term } },
      { idNumberLast4: { [Op.like]: term } },
      sequelize.where(sequelize.fn('LOWER', sequelize.col('user.firstName')), { [likeOperator]: term.toLowerCase() }),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('user.lastName')), { [likeOperator]: term.toLowerCase() }),
      sequelize.where(sequelize.fn('LOWER', sequelize.col('user.email')), { [likeOperator]: term.toLowerCase() }),
    ];
  }

  const include = [
    { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'timezone'] },
    { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
    { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
    {
      model: IdentityVerificationEvent,
      as: 'events',
      separate: true,
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    },
  ];

  const { rows, count } = await IdentityVerification.findAndCountAll({
    where,
    include,
    order: resolveSort(sort),
    limit: resolvedPageSize,
    offset: (resolvedPage - 1) * resolvedPageSize,
    distinct: true,
  });

  const items = rows.map((record) => mapVerification(record));
  const totalPages = Math.ceil(count / resolvedPageSize);

  const countsByStatus = await fetchStatusCounts(baseWhere);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [submittedThisWeek, verifiedThisWeek, oldestPendingRecord, averageReviewHours, workspaceOptions] = await Promise.all([
    IdentityVerification.count({ where: { ...baseWhere, submittedAt: { [Op.gte]: sevenDaysAgo } } }),
    IdentityVerification.count({ where: { ...baseWhere, status: 'verified', reviewedAt: { [Op.gte]: sevenDaysAgo } } }),
    IdentityVerification.findOne({
      where: { ...baseWhere, status: { [Op.in]: ['pending', 'submitted', 'in_review'] } },
      order: [
        ['submittedAt', 'ASC'],
        ['id', 'ASC'],
      ],
    }),
    calculateAverageReviewHours(baseWhere),
    listWorkspaceOptions(),
  ]);

  const oldestPending = oldestPendingRecord ? mapVerification(oldestPendingRecord) : null;

  const memberOptions = includeMembers ? members.map((member) => buildMemberOption(member)).filter(Boolean) : [];
  const reviewerOptions = includeMembers
    ? members
        .filter((member) => REVIEW_ROLES.has(member.role))
        .map((member) => ({
          userId: member.userId,
          name: member.member ? `${member.member.firstName} ${member.member.lastName}`.trim() : null,
          email: member.member?.email ?? null,
          memberId: member.id,
        }))
    : [];

  let membersNeedingVerification = [];
  if (includeMembers) {
    const existing = await IdentityVerification.findAll({
      attributes: ['userId', 'status'],
      where: baseWhere,
    });
    const byUser = new Map();
    existing.forEach((record) => {
      const plain = record.get({ plain: true });
      byUser.set(plain.userId, plain.status);
    });
    membersNeedingVerification = members
      .filter((member) => {
        if (!byUser.has(member.userId)) {
          return true;
        }
        const statusValue = byUser.get(member.userId);
        return statusValue === 'rejected' || statusValue === 'expired';
      })
      .map((member) => buildMemberOption(member));
  }

  return {
    items,
    pagination: {
      page: resolvedPage,
      pageSize: resolvedPageSize,
      totalItems: count,
      totalPages,
    },
    stats: {
      countsByStatus,
      averageReviewHours,
      submittedThisWeek,
      verifiedThisWeek,
      oldestPending,
    },
    filters: {
      statuses: ID_VERIFICATION_STATUSES,
      sortOptions: SORT_OPTIONS,
    },
    metadata: {
      workspace: workspace.get({ plain: true }),
      workspaceOptions,
      reviewerOptions,
      memberOptions,
      membersNeedingVerification,
    },
  };
}

async function ensureWorkspaceMember(workspaceId, userId) {
  if (!workspaceId || !userId) {
    throw new ValidationError('workspaceId and userId are required.');
  }
  const membership = await ProviderWorkspaceMember.findOne({
    where: {
      workspaceId,
      userId,
      status: { [Op.in]: ACTIVE_MEMBER_STATUSES },
    },
  });
  if (!membership) {
    throw new ValidationError('User is not part of the selected workspace.');
  }
  return membership;
}

async function resolveProfileId(userId, providedProfileId, transaction) {
  if (providedProfileId) {
    const profile = await Profile.findByPk(providedProfileId, { transaction });
    if (!profile) {
      throw new ValidationError('Profile not found for provided profileId.');
    }
    if (profile.userId !== userId) {
      throw new ValidationError('Profile does not belong to the selected user.');
    }
    return profile.id;
  }

  const existing = await Profile.findOne({ where: { userId }, transaction });
  if (existing) {
    return existing.id;
  }

  const created = await Profile.create({ userId }, { transaction });
  return created.id;
}

async function recordEvent(payload, transaction) {
  try {
    await IdentityVerificationEvent.create(payload, { transaction });
  } catch (error) {
    log.warn({ error, payload }, 'Failed to create identity verification event');
  }
}

export async function createIdentityVerification(payload = {}) {
  const workspace = await resolveWorkspace(payload.workspaceId);
  const actorId = payload.actorId ? Number(payload.actorId) : null;
  await ensureWorkspaceMember(workspace.id, payload.userId);

  return sequelize.transaction(async (transaction) => {
    const profileId = await resolveProfileId(payload.userId, payload.profileId, transaction);
    const status = payload.status && ID_VERIFICATION_STATUSES.includes(payload.status)
      ? payload.status
      : 'submitted';

    const record = await upsertIdentityVerification(
      payload.userId,
      {
        ...payload,
        profileId,
        status,
        verificationProvider: payload.verificationProvider ?? 'manual_review',
        submittedAt: payload.submittedAt ?? new Date().toISOString(),
      },
      { transaction },
    );

    await recordEvent(
      {
        identityVerificationId: record.id,
        eventType: 'submission_created',
        actorId,
        newStatus: status,
        metadata: {
          workspaceId: workspace.id,
          verificationProvider: payload.verificationProvider ?? 'manual_review',
        },
        notes: payload.notes ?? null,
      },
      transaction,
    );

    if (payload.reviewNotes) {
      await recordEvent(
        {
          identityVerificationId: record.id,
          eventType: 'note_recorded',
          actorId,
          notes: payload.reviewNotes,
        },
        transaction,
      );
    }

    return getIdentityVerification(record.id, { workspaceId: workspace.id }, { transaction });
  });
}

export async function getIdentityVerification(id, { workspaceId } = {}, { transaction } = {}) {
  const record = await IdentityVerification.findByPk(id, {
    include: [
      { model: Profile, as: 'profile', attributes: ['id', 'headline', 'location', 'timezone'] },
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      {
        model: IdentityVerificationEvent,
        as: 'events',
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
      },
    ],
    transaction,
  });

  if (!record) {
    throw new NotFoundError('Identity verification not found.');
  }

  if (workspaceId) {
    await ensureWorkspaceMember(workspaceId, record.userId);
  }

  return mapVerification(record);
}

export async function updateIdentityVerification(id, payload = {}) {
  const workspace = await resolveWorkspace(payload.workspaceId);
  const record = await IdentityVerification.findByPk(id);
  if (!record) {
    throw new NotFoundError('Identity verification not found.');
  }
  await ensureWorkspaceMember(workspace.id, record.userId);

  const actorId = payload.actorId ? Number(payload.actorId) : null;

  return sequelize.transaction(async (transaction) => {
    const updates = {};
    const events = [];

    if (payload.status) {
      const statusValue = `${payload.status}`.trim().toLowerCase();
      if (!ID_VERIFICATION_STATUSES.includes(statusValue)) {
        throw new ValidationError(`Unsupported status "${payload.status}".`);
      }
      if (statusValue !== record.status) {
        updates.status = statusValue;
        if (['verified', 'rejected', 'expired'].includes(statusValue) && !payload.reviewedAt && !record.reviewedAt) {
          updates.reviewedAt = new Date();
        }
        events.push({
          eventType: 'status_changed',
          previousStatus: record.status,
          newStatus: statusValue,
          notes: payload.statusNotes ?? null,
        });
      }
    }

    if (payload.reviewNotes !== undefined && payload.reviewNotes !== record.reviewNotes) {
      updates.reviewNotes = payload.reviewNotes ?? null;
      if (payload.reviewNotes) {
        events.push({
          eventType: 'note_recorded',
          notes: payload.reviewNotes,
        });
      }
    }

    if (payload.declinedReason !== undefined && payload.declinedReason !== record.declinedReason) {
      updates.declinedReason = payload.declinedReason ?? null;
    }

    if (payload.verificationProvider && payload.verificationProvider !== record.verificationProvider) {
      updates.verificationProvider = payload.verificationProvider;
      events.push({
        eventType: 'metadata_updated',
        metadata: { verificationProvider: payload.verificationProvider },
      });
    }

    const identityFieldChanges = {};
    const directFields = ['typeOfId', 'idNumberLast4', 'issuingCountry', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country'];
    directFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== record[field]) {
        updates[field] = payload[field] ?? null;
        identityFieldChanges[field] = payload[field] ?? null;
      }
    });

    if (payload.issuedAt !== undefined) {
      updates.issuedAt = payload.issuedAt ? new Date(payload.issuedAt) : null;
      identityFieldChanges.issuedAt = updates.issuedAt ? updates.issuedAt.toISOString() : null;
    }
    if (payload.expiresAt !== undefined) {
      updates.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
      identityFieldChanges.expiresAt = updates.expiresAt ? updates.expiresAt.toISOString() : null;
    }
    if (payload.dateOfBirth !== undefined) {
      updates.dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;
      identityFieldChanges.dateOfBirth = updates.dateOfBirth ? updates.dateOfBirth.toISOString() : null;
    }

    const documentKeys = ['documentFrontKey', 'documentBackKey', 'selfieKey'];
    documentKeys.forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== record[key]) {
        updates[key] = payload[key] ?? null;
      }
    });
    if (documentKeys.some((key) => updates[key] !== undefined)) {
      events.push({
        eventType: 'document_updated',
        metadata: {
          documentFrontKey: payload.documentFrontKey ?? null,
          documentBackKey: payload.documentBackKey ?? null,
          selfieKey: payload.selfieKey ?? null,
        },
      });
    }

    if (Object.keys(identityFieldChanges).length) {
      events.push({ eventType: 'metadata_updated', metadata: identityFieldChanges });
    }

    if (payload.reviewerId !== undefined) {
      if (payload.reviewerId === null) {
        if (record.reviewerId !== null) {
          updates.reviewerId = null;
          events.push({ eventType: 'assignment_updated', metadata: { reviewerId: null } });
        }
      } else {
        await ensureWorkspaceMember(workspace.id, payload.reviewerId);
        if (payload.reviewerId !== record.reviewerId) {
          updates.reviewerId = payload.reviewerId;
          events.push({ eventType: 'assignment_updated', metadata: { reviewerId: payload.reviewerId } });
        }
      }
    }

    if (payload.metadata) {
      const mergedMetadata = {
        ...(record.metadata ?? {}),
        ...(payload.metadata ?? {}),
      };
      updates.metadata = mergedMetadata;
      events.push({ eventType: 'metadata_updated', metadata: mergedMetadata });
    }

    if (payload.reviewedAt) {
      const reviewDate = new Date(payload.reviewedAt);
      if (!Number.isNaN(reviewDate.getTime())) {
        updates.reviewedAt = reviewDate;
      }
    }

    if (payload.submittedAt) {
      const submittedAt = new Date(payload.submittedAt);
      if (!Number.isNaN(submittedAt.getTime())) {
        updates.submittedAt = submittedAt;
      }
    }

    if (Object.keys(updates).length === 0) {
      return getIdentityVerification(id, { workspaceId: workspace.id });
    }

    await record.update(updates, { transaction });

    for (const eventPayload of events) {
      await recordEvent(
        {
          identityVerificationId: record.id,
          actorId,
          ...eventPayload,
        },
        transaction,
      );
    }

    return getIdentityVerification(id, { workspaceId: workspace.id }, { transaction });
  });
}

export default {
  listIdentityVerifications,
  getIdentityVerification,
  createIdentityVerification,
  updateIdentityVerification,
};
