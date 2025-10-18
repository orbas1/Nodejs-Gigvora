
import { Op, fn, col, literal, where } from 'sequelize';
import {
  MessageThread,
  MessageParticipant,
  MessageLabel,
  SupportCase,
  Message,
  User,
} from '../models/messagingModels.js';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  PROVIDER_WORKSPACE_MEMBER_STATUSES,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import {
  listWorkspaceLabels,
  createWorkspaceLabel,
  updateWorkspaceLabel,
  deleteWorkspaceLabel,
  setThreadLabels as assignThreadLabels,
  getThread,
  listMessages,
} from './messagingService.js';

const CACHE_NAMESPACE = 'company:inbox';
const OVERVIEW_CACHE_TTL = 45;
const THREADS_CACHE_TTL = 30;
const LOOKBACK_LIMITS = Object.freeze({ min: 7, max: 180, fallback: 30 });

function clampLookback(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return LOOKBACK_LIMITS.fallback;
  }
  if (numeric < LOOKBACK_LIMITS.min) {
    return LOOKBACK_LIMITS.min;
  }
  if (numeric > LOOKBACK_LIMITS.max) {
    return LOOKBACK_LIMITS.max;
  }
  return Math.floor(numeric);
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
  );
}

function serializeParticipant(participant) {
  if (!participant) return null;
  const plain = participant.get ? participant.get({ plain: true }) : participant;
  const user = participant.user ?? plain.user ?? null;
  return {
    id: plain.id,
    threadId: plain.threadId,
    userId: plain.userId,
    role: plain.role,
    notificationsEnabled: plain.notificationsEnabled,
    mutedUntil: plain.mutedUntil,
    lastReadAt: plain.lastReadAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      : null,
  };
}

function serializeLabel(label) {
  if (!label) return null;
  const plain = label.get ? label.get({ plain: true }) : label;
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    slug: plain.slug,
    color: plain.color,
    description: plain.description ?? null,
    createdBy: plain.createdBy ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serializeSupportCase(supportCase) {
  if (!supportCase) return null;
  const plain = supportCase.get ? supportCase.get({ plain: true }) : supportCase;
  return {
    id: plain.id,
    threadId: plain.threadId,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason ?? null,
    metadata: sanitizeMetadata(plain.metadata),
    escalatedBy: plain.escalatedBy ?? null,
    escalatedAt: plain.escalatedAt ?? null,
    assignedTo: plain.assignedTo ?? null,
    assignedBy: plain.assignedBy ?? null,
    assignedAt: plain.assignedAt ?? null,
    firstResponseAt: plain.firstResponseAt ?? null,
    resolvedAt: plain.resolvedAt ?? null,
    resolvedBy: plain.resolvedBy ?? null,
    resolutionSummary: plain.resolutionSummary ?? null,
  };
}

function serializeThread(thread, workspaceMemberIds = []) {
  if (!thread) return null;
  const plain = thread.get ? thread.get({ plain: true }) : thread;
  const metadata = sanitizeMetadata(plain.metadata);
  const participants = Array.isArray(thread.participants)
    ? thread.participants.map((participant) => serializeParticipant(participant))
    : [];
  const viewerParticipants = Array.isArray(thread.viewerParticipants)
    ? thread.viewerParticipants.map((participant) => serializeParticipant(participant))
    : [];
  const labels = Array.isArray(thread.labels) ? thread.labels.map((label) => serializeLabel(label)) : [];
  const supportCase = thread.supportCase ? serializeSupportCase(thread.supportCase) : null;

  const lastMessageAtMs = plain.lastMessageAt ? new Date(plain.lastMessageAt).getTime() : 0;
  const workspaceParticipantIds = new Set(workspaceMemberIds);
  const workspaceParticipants = participants.filter((participant) => workspaceParticipantIds.has(participant.userId));
  const externalParticipants = participants.filter((participant) => !workspaceParticipantIds.has(participant.userId));
  const requiresResponse = viewerParticipants.some((participant) => {
    if (!lastMessageAtMs) return false;
    if (!participant.lastReadAt) return true;
    const lastReadMs = new Date(participant.lastReadAt).getTime();
    return Number.isFinite(lastReadMs) && lastReadMs < lastMessageAtMs;
  });

  return {
    id: plain.id,
    subject: plain.subject,
    channelType: plain.channelType,
    state: plain.state,
    createdBy: plain.createdBy,
    lastMessageAt: plain.lastMessageAt,
    lastMessagePreview: plain.lastMessagePreview,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata,
    participants,
    workspaceParticipants,
    externalParticipants,
    viewerParticipants,
    labels,
    supportCase,
    unread: requiresResponse,
  };
}

async function resolveWorkspace({ workspaceId, workspaceSlug }) {
  const where = { type: 'company' };
  if (workspaceId) {
    where.id = workspaceId;
  }
  if (workspaceSlug) {
    where.slug = workspaceSlug;
  }
  const workspace = await ProviderWorkspace.findOne({ where });
  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }
  return workspace;
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

async function getWorkspaceMembers(workspaceId) {
  const members = await ProviderWorkspaceMember.findAll({
    where: {
      workspaceId,
      status: { [Op.in]: ['active', PROVIDER_WORKSPACE_MEMBER_STATUSES?.ACTIVE ?? 'active'] },
    },
    include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['createdAt', 'ASC']],
  });

  return members.map((member) => {
    const plain = member.get({ plain: true });
    return {
      id: plain.id,
      workspaceId: plain.workspaceId,
      userId: plain.userId,
      role: plain.role,
      status: plain.status,
      joinedAt: plain.createdAt,
      user: plain.member
        ? {
            id: plain.member.id,
            firstName: plain.member.firstName,
            lastName: plain.member.lastName,
            email: plain.member.email,
          }
        : null,
    };
  });
}

function buildOverviewCacheKey(workspaceId, lookback) {
  return buildCacheKey(`${CACHE_NAMESPACE}:overview`, { workspaceId, lookback });
}

function buildThreadsCacheKey(workspaceId, lookback, filters, page, pageSize) {
  return buildCacheKey(`${CACHE_NAMESPACE}:threads`, {
    workspaceId,
    lookback,
    filters,
    page,
    pageSize,
  });
}

function summariseThreads(threads = [], workspaceMemberIds = []) {
  const totalThreads = threads.length;
  let unreadThreads = 0;
  const channelCounts = new Map();
  const stateCounts = new Map();
  const labelCounts = new Map();
  const supportCounts = new Map();
  const contributorStats = new Map();
  const workspaceIdSet = new Set(workspaceMemberIds);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let supportResolvedLast7 = 0;

  threads.forEach((thread) => {
    if (thread.unread) {
      unreadThreads += 1;
    }
    channelCounts.set(thread.channelType, (channelCounts.get(thread.channelType) ?? 0) + 1);
    stateCounts.set(thread.state, (stateCounts.get(thread.state) ?? 0) + 1);

    thread.labels.forEach((label) => {
      labelCounts.set(label.id, {
        label,
        count: (labelCounts.get(label.id)?.count ?? 0) + 1,
      });
    });

    if (thread.supportCase) {
      supportCounts.set(thread.supportCase.status, (supportCounts.get(thread.supportCase.status) ?? 0) + 1);
      if (thread.supportCase.resolvedAt) {
        const resolvedAtMs = new Date(thread.supportCase.resolvedAt).getTime();
        if (Number.isFinite(resolvedAtMs) && resolvedAtMs >= sevenDaysAgo) {
          supportResolvedLast7 += 1;
        }
      }
    }

    thread.viewerParticipants.forEach((participant) => {
      if (!workspaceIdSet.has(participant.userId)) {
        return;
      }
      const key = participant.userId;
      const entry = contributorStats.get(key) ?? {
        userId: participant.userId,
        name: participant.user
          ? `${participant.user.firstName ?? ''} ${participant.user.lastName ?? ''}`.trim()
          : 'Workspace member',
        email: participant.user?.email ?? null,
        activeThreads: 0,
        unreadThreads: 0,
      };
      entry.activeThreads += 1;
      if (thread.unread) {
        entry.unreadThreads += 1;
      }
      contributorStats.set(key, entry);
    });
  });

  const channelBreakdown = Array.from(channelCounts.entries()).map(([channelType, count]) => ({
    channelType,
    count,
  }));

  const stateBreakdown = Array.from(stateCounts.entries()).map(([state, count]) => ({ state, count }));

  const labelBreakdown = Array.from(labelCounts.values()).map(({ label, count }) => ({
    label: serializeLabel(label),
    count,
  }));

  const supportBreakdown = Array.from(supportCounts.entries()).map(([status, count]) => ({ status, count }));

  const topContributors = Array.from(contributorStats.values())
    .sort((a, b) => b.activeThreads - a.activeThreads)
    .slice(0, 12);

  return {
    totalThreads,
    unreadThreads,
    channelBreakdown,
    stateBreakdown,
    labelBreakdown,
    supportBreakdown,
    topContributors,
    supportResolvedLast7,
  };
}

async function computeAverageFirstResponse(threadIds = [], memberIds = []) {
  if (!threadIds.length || !memberIds.length) {
    return null;
  }

  const memberIdList = memberIds.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0);
  if (!memberIdList.length) {
    return null;
  }

  const literalCondition = literal(
    `CASE WHEN "Message"."senderId" IN (${memberIdList.join(',')}) THEN "Message"."createdAt" END`,
  );

  const rows = await Message.findAll({
    attributes: [
      'threadId',
      [fn('MIN', col('createdAt')), 'firstMessageAt'],
      [fn('MIN', literalCondition), 'firstWorkspaceReplyAt'],
    ],
    where: { threadId: { [Op.in]: threadIds } },
    group: ['threadId'],
    raw: true,
  });

  const durations = rows
    .map((row) => {
      const first = row.firstMessageAt ? new Date(row.firstMessageAt).getTime() : null;
      const reply = row.firstWorkspaceReplyAt ? new Date(row.firstWorkspaceReplyAt).getTime() : null;
      if (!Number.isFinite(first) || !Number.isFinite(reply) || reply <= first) {
        return null;
      }
      return (reply - first) / (60 * 1000);
    })
    .filter((value) => typeof value === 'number' && Number.isFinite(value));

  if (!durations.length) {
    return null;
  }

  const total = durations.reduce((sum, value) => sum + value, 0);
  return Number((total / durations.length).toFixed(1));
}

export async function getCompanyInboxOverview({ workspaceId, workspaceSlug, lookbackDays = 30 } = {}) {
  if (!workspaceId && !workspaceSlug) {
    throw new ValidationError('workspaceId or workspaceSlug is required to load inbox data.');
  }

  const lookback = clampLookback(lookbackDays);
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const cacheKey = buildOverviewCacheKey(workspace.id, lookback);

  return appCache.remember(cacheKey, OVERVIEW_CACHE_TTL, async () => {
    const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
    const members = await getWorkspaceMembers(workspace.id);
    const memberIds = members.map((member) => member.userId).filter((id) => Number.isInteger(id));

    const include = [
      {
        model: MessageParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: MessageParticipant,
        as: 'viewerParticipants',
        attributes: ['id', 'threadId', 'userId', 'lastReadAt', 'mutedUntil', 'notificationsEnabled'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        required: memberIds.length > 0,
        where: { userId: { [Op.in]: memberIds } },
      },
      { model: MessageLabel, as: 'labels', through: { attributes: [] } },
      { model: SupportCase, as: 'supportCase' },
    ];

    const threads = memberIds.length
      ? await MessageThread.findAll({
          where: since ? { lastMessageAt: { [Op.gte]: since } } : {},
          include,
          order: [
            ['lastMessageAt', 'DESC'],
            ['id', 'DESC'],
          ],
          limit: 500,
        })
      : [];

    const serializedThreads = threads.map((thread) => serializeThread(thread, memberIds));
    const summary = summariseThreads(serializedThreads, memberIds);
    const threadIds = serializedThreads.map((thread) => thread.id);
    const averageFirstResponseMinutes = await computeAverageFirstResponse(threadIds, memberIds);

    const labels = await listWorkspaceLabels(workspace.id, {});
    const availableWorkspaces = await listAvailableWorkspaces();

    const supportOpen = summary.supportBreakdown
      .filter((entry) => !['resolved', 'closed'].includes(entry.status))
      .reduce((sum, entry) => sum + entry.count, 0);
    const supportWaiting = summary.supportBreakdown
      .filter((entry) => entry.status === 'waiting_on_customer')
      .reduce((sum, entry) => sum + entry.count, 0);

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      lookback: {
        days: lookback,
        since: since.toISOString(),
      },
      metrics: {
        totalThreads: summary.totalThreads,
        unreadThreads: summary.unreadThreads,
        awaitingResponse: summary.unreadThreads,
        supportOpen,
        supportWaiting,
        supportResolvedLast7Days: summary.supportResolvedLast7,
        averageFirstResponseMinutes,
      },
      channelBreakdown: summary.channelBreakdown,
      stateBreakdown: summary.stateBreakdown,
      labelBreakdown: summary.labelBreakdown,
      supportBreakdown: summary.supportBreakdown,
      teamMembers: summary.topContributors,
      members,
      labels,
      meta: {
        lookbackDays: lookback,
        selectedWorkspaceId: workspace.id,
        availableWorkspaces,
        generatedAt: new Date().toISOString(),
      },
    };
  });
}

export async function listCompanyInboxThreads({
  workspaceId,
  workspaceSlug,
  lookbackDays = 30,
  filters = {},
  pagination = {},
} = {}) {
  if (!workspaceId && !workspaceSlug) {
    throw new ValidationError('workspaceId or workspaceSlug is required to list inbox threads.');
  }

  const lookback = clampLookback(lookbackDays);
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const members = await getWorkspaceMembers(workspace.id);
  const memberIds = members.map((member) => member.userId).filter((id) => Number.isInteger(id));

  const { page = 1, pageSize = 25 } = pagination;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeSize = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
  const offset = (safePage - 1) * safeSize;

  const {
    channelTypes = [],
    states = [],
    labelIds = [],
    search,
    unreadOnly = false,
    supportStatuses = [],
  } = filters;

  const sanitizedSearch = search?.trim() ?? '';
  const likeOperator = Op.iLike ?? Op.like;
  const normalizedChannelTypes = channelTypes.filter(Boolean);
  const normalizedStates = states.filter(Boolean);
  const normalizedLabelIds = labelIds
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  const normalizedSupportStatuses = supportStatuses.filter(Boolean);

  const cacheKey = buildThreadsCacheKey(
    workspace.id,
    lookback,
    {
      channelTypes: normalizedChannelTypes,
      states: normalizedStates,
      labelIds: normalizedLabelIds,
      search: sanitizedSearch || null,
      unreadOnly,
      supportStatuses: normalizedSupportStatuses,
    },
    safePage,
    safeSize,
  );

  if (!memberIds.length) {
    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      data: [],
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: 0,
        totalPages: 1,
      },
      filtersApplied: {
        channelTypes: normalizedChannelTypes,
        states: normalizedStates,
        labelIds: normalizedLabelIds,
        search: sanitizedSearch || null,
        unreadOnly,
        supportStatuses: normalizedSupportStatuses,
      },
    };
  }

  return appCache.remember(cacheKey, THREADS_CACHE_TTL, async () => {
    const where = {};
    if (lookback) {
      where.lastMessageAt = { [Op.gte]: new Date(Date.now() - lookback * 24 * 60 * 60 * 1000) };
    }
    if (normalizedChannelTypes.length) {
      where.channelType = { [Op.in]: normalizedChannelTypes };
    }
    if (normalizedStates.length) {
      where.state = { [Op.in]: normalizedStates };
    }
    if (sanitizedSearch) {
      where[Op.or] = [
        { subject: { [likeOperator]: `%${sanitizedSearch}%` } },
        { lastMessagePreview: { [likeOperator]: `%${sanitizedSearch}%` } },
      ];
    }

    const include = [
      {
        model: MessageParticipant,
        as: 'viewerParticipants',
        required: memberIds.length > 0,
        where: {
          userId: { [Op.in]: memberIds },
        },
        attributes: ['id', 'threadId', 'userId', 'lastReadAt', 'mutedUntil', 'notificationsEnabled'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: MessageParticipant,
        as: 'participants',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: MessageLabel,
        as: 'labels',
        through: { attributes: [] },
        ...(normalizedLabelIds.length ? { where: { id: { [Op.in]: normalizedLabelIds } }, required: true } : {}),
      },
      {
        model: SupportCase,
        as: 'supportCase',
        include: [
          { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        ...(normalizedSupportStatuses.length
          ? { where: { status: { [Op.in]: normalizedSupportStatuses } }, required: true }
          : {}),
      },
    ];

    if (unreadOnly) {
      include[0].where = {
        ...include[0].where,
        [Op.or]: [
          { lastReadAt: null },
          where(col('viewerParticipants.lastReadAt'), '<', col('MessageThread.lastMessageAt')),
        ],
      };
    }

    const { rows, count } = memberIds.length
      ? await MessageThread.findAndCountAll({
          where,
          include,
          distinct: true,
          order: [
            ['lastMessageAt', 'DESC'],
            ['id', 'DESC'],
          ],
          limit: safeSize,
          offset,
        })
      : { rows: [], count: 0 };

    const data = rows.map((thread) => serializeThread(thread, memberIds));

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      data,
      pagination: {
        page: safePage,
        pageSize: safeSize,
        total: count,
        totalPages: Math.ceil(count / safeSize) || 1,
      },
      filtersApplied: {
        channelTypes: normalizedChannelTypes,
        states: normalizedStates,
        labelIds: normalizedLabelIds,
        search: sanitizedSearch || null,
        unreadOnly,
        supportStatuses: normalizedSupportStatuses,
      },
    };
  });
}

export async function getCompanyInboxThread({ workspaceId, workspaceSlug, threadId } = {}) {
  if (!threadId) {
    throw new ValidationError('threadId is required to load a company inbox thread.');
  }
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const members = await getWorkspaceMembers(workspace.id);
  const memberIds = members.map((member) => member.userId).filter((id) => Number.isInteger(id));

  if (!memberIds.length) {
    throw new AuthorizationError('Workspace has no active members with messaging access.');
  }

  const participantCount = await MessageParticipant.count({
    where: { threadId, userId: { [Op.in]: memberIds } },
  });

  if (participantCount === 0) {
    throw new NotFoundError('Thread not found for this workspace inbox.');
  }

  const thread = await getThread(threadId, {
    withParticipants: true,
    includeSupportCase: true,
    includeLabels: true,
  });
  const messages = await listMessages(threadId, { pageSize: 100 }, { includeSystem: false });

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    thread,
    messages: messages.data,
    messagePagination: messages.pagination,
  };
}

export async function setCompanyThreadLabels({ workspaceId, workspaceSlug, threadId, labelIds = [], actorId } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  await getCompanyInboxThread({ workspaceId: workspace.id, threadId });
  const result = await assignThreadLabels(threadId, labelIds, { workspaceId: workspace.id, actorId });
  appCache.flushByPrefix(CACHE_NAMESPACE);
  return result;
}

export async function listCompanyInboxLabels({ workspaceId, workspaceSlug, search } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  return listWorkspaceLabels(workspace.id, { search });
}

export async function createCompanyInboxLabel({ workspaceId, workspaceSlug, ...payload } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const label = await createWorkspaceLabel({ workspaceId: workspace.id, ...payload });
  appCache.flushByPrefix(CACHE_NAMESPACE);
  return label;
}

export async function updateCompanyInboxLabel(labelId, { workspaceId, workspaceSlug, ...payload } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const label = await updateWorkspaceLabel(labelId, { workspaceId: workspace.id, ...payload });
  appCache.flushByPrefix(CACHE_NAMESPACE);
  return label;
}

export async function deleteCompanyInboxLabel(labelId, { workspaceId, workspaceSlug } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const removed = await deleteWorkspaceLabel(labelId, { workspaceId: workspace.id });
  appCache.flushByPrefix(CACHE_NAMESPACE);
  return removed;
}

export async function listCompanyInboxMembers({ workspaceId, workspaceSlug } = {}) {
  const workspace = await resolveWorkspace({ workspaceId, workspaceSlug });
  const members = await getWorkspaceMembers(workspace.id);
  return members;
}

export default {
  getCompanyInboxOverview,
  listCompanyInboxThreads,
  getCompanyInboxThread,
  setCompanyThreadLabels,
  listCompanyInboxLabels,
  createCompanyInboxLabel,
  updateCompanyInboxLabel,
  deleteCompanyInboxLabel,
  listCompanyInboxMembers,
};
