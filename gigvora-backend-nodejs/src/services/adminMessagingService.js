import { Op, fn, col, literal } from 'sequelize';
import {
  sequelize,
  MessageThread,
  MessageParticipant,
  MessageLabel,
  MessageThreadLabel,
  SupportCase,
  User,
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_CASE_PRIORITIES,
} from '../models/messagingModels.js';
import {
  sanitizeThread,
  sanitizeMessage,
} from './messagingService.js';
import {
  appendMessage,
  createThread,
  getThread,
  listMessages,
  updateThreadState as updateThreadStateInternal,
  assignSupportAgent as assignSupportAgentInternal,
  updateSupportCaseStatus as updateSupportCaseStatusInternal,
  escalateThreadToSupport as escalateThreadToSupportInternal,
} from './messagingService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function parseInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry != null && `${entry}`.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

function assertInSet(values, allowed, label) {
  values.forEach((value) => {
    if (!allowed.includes(value)) {
      throw new ValidationError(`Invalid ${label}: ${value}`);
    }
  });
}

function buildThreadWhere(filters = {}) {
  const where = {};

  if (filters.channelTypes?.length) {
    assertInSet(filters.channelTypes, MESSAGE_CHANNEL_TYPES, 'channel type');
    where.channelType = { [Op.in]: filters.channelTypes };
  }

  if (filters.states?.length) {
    assertInSet(filters.states, MESSAGE_THREAD_STATES, 'thread state');
    where.state = { [Op.in]: filters.states };
  }

  if (filters.creatorId) {
    const parsed = parseInteger(filters.creatorId);
    if (parsed) {
      where.createdBy = parsed;
    }
  }

  if (filters.dateFrom || filters.dateTo) {
    where.lastMessageAt = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        where.lastMessageAt[Op.gte] = from;
      }
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!Number.isNaN(to.getTime())) {
        where.lastMessageAt[Op.lte] = to;
      }
    }
    if (!Object.keys(where.lastMessageAt).length) {
      delete where.lastMessageAt;
    }
  }

  if (filters.searchTerm) {
    const like = Op.iLike ?? Op.like;
    where[Op.or] = [
      { subject: { [like]: `%${filters.searchTerm}%` } },
      { '$participants.user.firstName$': { [like]: `%${filters.searchTerm}%` } },
      { '$participants.user.lastName$': { [like]: `%${filters.searchTerm}%` } },
      { '$participants.user.email$': { [like]: `%${filters.searchTerm}%` } },
    ];
  }

  return where;
}

function buildSupportInclude(filters = {}, { forMetrics = false } = {}) {
  const include = {
    model: SupportCase,
    as: 'supportCase',
    required: false,
    attributes: forMetrics ? ['id', 'status', 'priority', 'assignedTo', 'escalatedAt'] : undefined,
    include: forMetrics
      ? []
      : [
          { model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'escalatedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'resolvedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
    where: {},
  };

  if (filters.supportStatuses?.length) {
    assertInSet(filters.supportStatuses, SUPPORT_CASE_STATUSES, 'support status');
    include.where.status = { [Op.in]: filters.supportStatuses };
    include.required = true;
  }

  if (filters.supportPriorities?.length) {
    assertInSet(filters.supportPriorities, SUPPORT_CASE_PRIORITIES, 'support priority');
    include.where.priority = {
      ...(include.where.priority ?? {}),
      [Op.in]: filters.supportPriorities,
    };
    include.required = true;
  }

  if (filters.assignedTo) {
    const parsed = parseInteger(filters.assignedTo);
    if (parsed) {
      include.where.assignedTo = parsed;
      include.required = true;
    }
  }

  if (filters.unassignedOnly) {
    include.where.assignedTo = { [Op.is]: null };
    include.required = true;
  }

  if (filters.escalatedOnly) {
    include.where.escalatedAt = { [Op.not]: null };
    include.required = true;
  }

  if (filters.hasSupportCase === true) {
    include.required = true;
  }

  if (!Object.keys(include.where).length) {
    delete include.where;
  }

  return include;
}

function buildLabelInclude(filters = {}, { forMetrics = false } = {}) {
  const include = {
    model: MessageLabel,
    as: 'labels',
    required: false,
    attributes: forMetrics ? ['id'] : ['id', 'name', 'slug', 'color', 'description'],
    through: { attributes: [] },
  };

  if (filters.labelIds?.length) {
    include.required = true;
    include.where = {
      id: {
        [Op.in]: filters.labelIds.map((id) => parseInteger(id)).filter(Boolean),
      },
    };
  }

  return include;
}

function buildParticipantInclude(filters = {}, { forMetrics = false } = {}) {
  return {
    model: MessageParticipant,
    as: 'participants',
    required: Boolean(filters.searchTerm),
    attributes: forMetrics ? [] : ['id', 'threadId', 'userId', 'role', 'lastReadAt', 'mutedUntil', 'notificationsEnabled'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: forMetrics ? [] : ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  };
}

function normalizeFilters(raw = {}) {
  const searchTerm = typeof raw.search === 'string' ? raw.search.trim() : '';
  const channelTypes = normalizeArray(raw.channelTypes);
  const states = normalizeArray(raw.states);
  const supportStatuses = normalizeArray(raw.supportStatuses ?? raw.supportStatus);
  const supportPriorities = normalizeArray(raw.supportPriorities ?? raw.supportPriority);
  const labelIds = normalizeArray(raw.labelIds);

  return {
    searchTerm: searchTerm ? searchTerm : null,
    channelTypes,
    states,
    supportStatuses,
    supportPriorities,
    labelIds,
    assignedTo: raw.assignedTo ?? null,
    unassignedOnly: String(raw.unassignedOnly ?? '').toLowerCase() === 'true',
    escalatedOnly: String(raw.escalatedOnly ?? '').toLowerCase() === 'true',
    hasSupportCase:
      raw.hasSupportCase == null ? null : String(raw.hasSupportCase).toLowerCase() === 'true',
    creatorId: raw.creatorId ?? null,
    dateFrom: raw.dateFrom ?? null,
    dateTo: raw.dateTo ?? null,
    includeSystemMessages: String(raw.includeSystemMessages ?? '').toLowerCase() === 'true',
  };
}

function buildThreadQuery(filters, pagination, { forMetrics = false } = {}) {
  const where = buildThreadWhere(filters);
  const include = [];

  include.push(buildParticipantInclude(filters, { forMetrics }));
  include.push(buildSupportInclude(filters, { forMetrics }));
  include.push(buildLabelInclude(filters, { forMetrics }));

  const options = {
    where,
    include,
    order: [
      ['lastMessageAt', 'DESC'],
      ['updatedAt', 'DESC'],
    ],
    distinct: true,
    subQuery: false,
  };

  if (!forMetrics) {
    options.limit = pagination.pageSize;
    options.offset = (pagination.page - 1) * pagination.pageSize;
  }

  if (filters.hasSupportCase === false) {
    options.where[Op.and] = [
      ...(options.where[Op.and] ?? []),
      { '$supportCase.id$': { [Op.is]: null } },
    ];
  }

  return options;
}

async function buildMetrics(filters) {
  const options = buildThreadQuery(filters, { page: 1, pageSize: 1 }, { forMetrics: true });
  delete options.limit;
  delete options.offset;

  const [channelRows, stateRows, supportRows, priorityRows, assignmentRows] = await Promise.all([
    MessageThread.findAll({
      ...options,
      attributes: ['channelType', [fn('COUNT', col('MessageThread.id')), 'count']],
      group: ['MessageThread.channelType'],
      raw: true,
    }),
    MessageThread.findAll({
      ...options,
      attributes: ['state', [fn('COUNT', col('MessageThread.id')), 'count']],
      group: ['MessageThread.state'],
      raw: true,
    }),
    MessageThread.findAll({
      ...options,
      attributes: [
        [literal('COALESCE("supportCase"."status", \'none\')'), 'status'],
        [fn('COUNT', col('MessageThread.id')), 'count'],
      ],
      group: ['supportCase.status'],
      raw: true,
    }),
    MessageThread.findAll({
      ...options,
      attributes: [
        [literal('COALESCE("supportCase"."priority", \'none\')'), 'priority'],
        [fn('COUNT', col('MessageThread.id')), 'count'],
      ],
      group: ['supportCase.priority'],
      raw: true,
    }),
    MessageThread.findAll({
      ...options,
      attributes: [
        [
          literal(
            "CASE WHEN \"supportCase\".\"assignedTo\" IS NULL THEN 'unassigned' ELSE 'assigned' END",
          ),
          'assignment',
        ],
        [fn('COUNT', col('MessageThread.id')), 'count'],
      ],
      group: [
        literal("CASE WHEN \"supportCase\".\"assignedTo\" IS NULL THEN 'unassigned' ELSE 'assigned' END"),
      ],
      raw: true,
    }),
  ]);

  const normalize = (rows, key) =>
    rows.reduce((acc, row) => {
      const label = row[key];
      if (label == null) {
        return acc;
      }
      acc[label] = Number(row.count ?? 0);
      return acc;
    }, {});

  return {
    channels: normalize(channelRows, 'channelType'),
    states: normalize(stateRows, 'state'),
    supportStatuses: normalize(supportRows, 'status'),
    supportPriorities: normalize(priorityRows, 'priority'),
    assignment: normalize(assignmentRows, 'assignment'),
  };
}

export async function listAdminThreads(rawFilters = {}, rawPagination = {}) {
  const filters = normalizeFilters(rawFilters);
  const page = Math.max(parseInteger(rawPagination.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInteger(rawPagination.pageSize) || 25, 1), 100);

  const options = buildThreadQuery(filters, { page, pageSize });
  const { rows, count } = await MessageThread.findAndCountAll(options);

  const data = rows.map((thread) => sanitizeThread(thread));
  const metrics = await buildMetrics(filters);

  return {
    data,
    metrics,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize) || 1,
    },
  };
}

export async function getAdminThread(threadId) {
  const thread = await getThread(Number(threadId), { withParticipants: true, includeSupportCase: true });
  if (!thread) {
    throw new NotFoundError('Thread not found');
  }
  const hydrated = await MessageThread.findByPk(thread.id, {
    include: [
      buildParticipantInclude({}, {}),
      buildSupportInclude({}, {}),
      buildLabelInclude({}, {}),
    ],
  });
  return sanitizeThread(hydrated ?? thread);
}

export async function listAdminThreadMessages(threadId, pagination = {}, { includeSystem = true } = {}) {
  const response = await listMessages(threadId, pagination, { includeSystem });
  return {
    ...response,
    data: response.data.map((message) => sanitizeMessage(message)),
  };
}

export async function sendAdminMessage(threadId, userId, payload) {
  if (!userId) {
    throw new ValidationError('userId is required to send a message.');
  }
  return appendMessage(Number(threadId), Number(userId), payload);
}

export async function createAdminThread(payload) {
  return createThread(payload);
}

export async function updateAdminThreadState(threadId, state) {
  return updateThreadStateInternal(Number(threadId), state);
}

export async function escalateAdminThread(threadId, actorId, payload = {}) {
  return escalateThreadToSupportInternal(Number(threadId), Number(actorId), payload);
}

export async function assignAdminSupportAgent(threadId, agentId, payload = {}) {
  return assignSupportAgentInternal(Number(threadId), Number(agentId), payload);
}

export async function updateAdminSupportStatus(threadId, status, payload = {}) {
  return updateSupportCaseStatusInternal(Number(threadId), status, payload);
}

export async function listMessageLabels() {
  const labels = await MessageLabel.findAll({ order: [['name', 'ASC']] });
  return labels.map((label) => label.toPublicObject());
}

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export async function createMessageLabel({ name, color, description, createdBy, metadata = {} }) {
  if (!name?.trim()) {
    throw new ValidationError('Label name is required.');
  }
  const slug = slugify(name);
  const record = await MessageLabel.create({
    name: name.trim(),
    slug,
    color: color?.trim() || '#2563eb',
    description: description?.trim() || null,
    createdBy: createdBy ? Number(createdBy) : null,
    metadata,
  });
  return record.toPublicObject();
}

export async function updateMessageLabel(labelId, { name, color, description, metadata }) {
  const record = await MessageLabel.findByPk(Number(labelId));
  if (!record) {
    throw new NotFoundError('Label not found.');
  }
  if (name?.trim()) {
    record.name = name.trim();
    record.slug = slugify(name);
  }
  if (color?.trim()) {
    record.color = color.trim();
  }
  if (description !== undefined) {
    record.description = description?.trim() || null;
  }
  if (metadata && typeof metadata === 'object') {
    record.metadata = metadata;
  }
  await record.save();
  return record.toPublicObject();
}

export async function deleteMessageLabel(labelId) {
  const record = await MessageLabel.findByPk(Number(labelId));
  if (!record) {
    throw new NotFoundError('Label not found.');
  }
  await sequelize.transaction(async (trx) => {
    await MessageThreadLabel.destroy({ where: { labelId: record.id }, transaction: trx });
    await record.destroy({ transaction: trx });
  });
  return { success: true };
}

export async function setThreadLabels(threadId, labelIds = [], actorId) {
  const uniqueIds = Array.from(new Set(labelIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))));
  const thread = await MessageThread.findByPk(Number(threadId));
  if (!thread) {
    throw new NotFoundError('Thread not found.');
  }

  await sequelize.transaction(async (trx) => {
    await MessageThreadLabel.destroy({ where: { threadId: thread.id }, transaction: trx });
    if (uniqueIds.length) {
      const now = new Date();
      await MessageThreadLabel.bulkCreate(
        uniqueIds.map((labelId) => ({
          threadId: thread.id,
          labelId,
          appliedBy: actorId ? Number(actorId) : null,
          appliedAt: now,
        })),
        { transaction: trx },
      );
    }
  });

  const hydrated = await MessageThread.findByPk(thread.id, {
    include: [buildLabelInclude({}, {})],
  });
  return sanitizeThread(hydrated ?? thread);
}

export async function listSupportAgents() {
  const agents = await User.findAll({
    where: { userType: 'admin' },
    order: [
      ['firstName', 'ASC'],
      ['lastName', 'ASC'],
    ],
    attributes: ['id', 'firstName', 'lastName', 'email'],
  });
  return agents.map((agent) => ({
    id: agent.id,
    firstName: agent.firstName,
    lastName: agent.lastName,
    email: agent.email,
  }));
}

export default {
  listAdminThreads,
  getAdminThread,
  listAdminThreadMessages,
  sendAdminMessage,
  createAdminThread,
  updateAdminThreadState,
  escalateAdminThread,
  assignAdminSupportAgent,
  updateAdminSupportStatus,
  listMessageLabels,
  createMessageLabel,
  updateMessageLabel,
  deleteMessageLabel,
  setThreadLabels,
  listSupportAgents,
};
