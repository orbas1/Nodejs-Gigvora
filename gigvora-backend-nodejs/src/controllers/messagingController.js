import {
  listThreadsForUser,
  createThread,
  appendMessage,
  listMessages,
  getThread,
  markThreadRead,
  updateThreadState,
  muteThread,
  escalateThreadToSupport,
  assignSupportAgent,
  updateSupportCaseStatus,
  startOrJoinCall,
} from '../services/messagingService.js';
import { ValidationError } from '../utils/errors.js';

function parseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveActorId(req, { required = true } = {}) {
  const candidates = [
    req.user?.id,
    req.body?.userId,
    req.body?.actorId,
    req.query?.userId,
    req.query?.actorId,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (required) {
    throw new ValidationError('An authenticated userId is required for this action.');
  }

  return null;
}

function parseDateInput(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function listInbox(req, res) {
  const userId = resolveActorId(req);
  const {
    channelTypes,
    states,
    search,
    unreadOnly,
    includeParticipants,
    includeSupport,
    page,
    pageSize,
  } = req.query;

  const response = await listThreadsForUser(
    userId,
    {
      channelTypes: parseArray(channelTypes),
      states: parseArray(states),
      search,
      unreadOnly: String(unreadOnly ?? '').toLowerCase() === 'true',
      includeParticipants: String(includeParticipants ?? '').toLowerCase() !== 'false',
      includeSupport: String(includeSupport ?? '').toLowerCase() !== 'false',
    },
    { page, pageSize },
  );

  res.json(response);
}

export async function openThread(req, res) {
  const { threadId } = req.params;
  const thread = await getThread(Number(threadId), {
    withParticipants: String(req.query.includeParticipants ?? '').toLowerCase() !== 'false',
    includeSupportCase: String(req.query.includeSupport ?? '').toLowerCase() !== 'false',
  });
  res.json(thread);
}

export async function createConversation(req, res) {
  const createdBy = resolveActorId(req);
  const participantIds = parseArray(req.body.participantIds).map((id) => Number(id)).filter((id) => Number.isFinite(id));

  const thread = await createThread({
    subject: req.body.subject,
    channelType: req.body.channelType,
    createdBy,
    participantIds,
    metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
  });

  res.status(201).json(thread);
}

export async function postMessage(req, res) {
  const senderId = resolveActorId(req);
  const { threadId } = req.params;
  const message = await appendMessage(Number(threadId), senderId, {
    messageType: req.body.messageType,
    body: req.body.body,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
    metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
  });

  res.status(201).json(message);
}

export async function listThreadMessages(req, res) {
  const { threadId } = req.params;
  const { page, pageSize, includeSystem } = req.query;
  const response = await listMessages(
    Number(threadId),
    { page, pageSize },
    { includeSystem: String(includeSystem ?? '').toLowerCase() === 'true' },
  );
  res.json(response);
}

export async function acknowledgeThread(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const result = await markThreadRead(Number(threadId), userId);
  res.json(result);
}

export async function changeThreadState(req, res) {
  const { threadId } = req.params;
  const { state } = req.body;
  const thread = await updateThreadState(Number(threadId), state);
  res.json(thread);
}

export async function muteConversation(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const mutedUntil = parseDateInput(req.body.until);
  const result = await muteThread(Number(threadId), userId, mutedUntil);
  res.json(result);
}

export async function escalateThread(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const supportCase = await escalateThreadToSupport(Number(threadId), userId, {
    reason: req.body.reason,
    priority: req.body.priority,
    metadata: req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
  });
  res.status(202).json(supportCase);
}

export async function assignSupport(req, res) {
  const actorId = resolveActorId(req, { required: false });
  const { threadId } = req.params;
  const agentId = Number(req.body.agentId);
  if (!Number.isFinite(agentId) || agentId <= 0) {
    throw new ValidationError('agentId must be a positive integer.');
  }

  const supportCase = await assignSupportAgent(Number(threadId), agentId, {
    assignedBy: Number.isFinite(Number(req.body.assignedBy)) ? Number(req.body.assignedBy) : actorId ?? agentId,
    notifyAgent: String(req.body.notifyAgent ?? '').toLowerCase() !== 'false',
  });

  res.json(supportCase);
}

export async function updateSupportStatus(req, res) {
  const actorId = resolveActorId(req, { required: false });
  const { threadId } = req.params;
  const { status, resolutionSummary, metadata } = req.body;
  if (!status) {
    throw new ValidationError('status is required to update a support case.');
  }

  const supportCase = await updateSupportCaseStatus(Number(threadId), status, {
    actorId,
    resolutionSummary,
    metadataPatch: metadata && typeof metadata === 'object' ? metadata : {},
  });

  res.json(supportCase);
}

export async function createCallSession(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const { callType, callId, role } = req.body ?? {};

  const session = await startOrJoinCall(Number(threadId), userId, {
    callType,
    callId,
    role,
  });

  res.status(session.isNew ? 201 : 200).json(session);
}

export default {
  listInbox,
  openThread,
  createConversation,
  postMessage,
  listThreadMessages,
  acknowledgeThread,
  changeThreadState,
  muteConversation,
  escalateThread,
  assignSupport,
  updateSupportStatus,
};
