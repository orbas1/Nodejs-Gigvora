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
  updateThreadSettings as updateThreadSettingsService,
  addParticipantsToThread,
  removeParticipantFromThread,
  updateTypingState as updateTypingStateService,
  listThreadTranscripts as listThreadTranscriptsService,
  generateThreadTranscript as generateThreadTranscriptService,
  enforceThreadRetention as enforceThreadRetentionService,
  searchThreads as searchThreadsService,
} from '../services/messagingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions } from '../utils/requestContext.js';
import { normaliseMessageAttachments } from '../services/fileValidationService.js';

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

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
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
      if (req.user?.id && Number.parseInt(req.user.id, 10) !== parsed) {
        throw new AuthorizationError('You cannot impersonate another user in messaging.');
      }
      return parsed;
    }
  }

  if (required) {
    throw new AuthorizationError('Authentication required.');
  }

  return null;
}

function ensureSupportPrivileges(req) {
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => permission.toLowerCase()));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => `${role}`.toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('support') ||
    permissions.has('support.manage.any') ||
    permissions.has('messaging.manage.any')
  ) {
    return;
  }

  throw new AuthorizationError('Support permissions required for this action.');
}

function normalisePagination(query = {}) {
  const page = query.page != null ? Number.parseInt(query.page, 10) : 1;
  const pageSize = query.pageSize != null ? Number.parseInt(query.pageSize, 10) : 25;

  if (!Number.isFinite(page) || page <= 0) {
    throw new ValidationError('page must be a positive integer.');
  }

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    throw new ValidationError('pageSize must be a positive integer.');
  }

  return {
    page,
    pageSize: Math.min(pageSize, 100),
  };
}

function sanitiseMetadata(metadata) {
  if (metadata == null) {
    return {};
  }
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new ValidationError('metadata must be an object.');
  }
  return JSON.parse(JSON.stringify(metadata));
}

function sanitiseAttachments(attachments) {
  if (attachments == null) {
    return [];
  }
  const array = Array.isArray(attachments) ? attachments : [attachments];
  return normaliseMessageAttachments(array, { maxAttachments: 25 });
}

function ensureParticipantList(value) {
  const normalised = Array.isArray(value)
    ? value
    : value == null
    ? []
    : parseArray(value);
  const values = normalised.map((id) => parsePositiveInteger(id, 'participantId'));
  if (values.length === 0) {
    throw new ValidationError('At least one participantId is required.');
  }
  return values;
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
    includeLabels,
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
      includeLabels: String(includeLabels ?? '').toLowerCase() === 'true',
    },
    normalisePagination({ page, pageSize }),
  );

  res.json(response);
}

export async function searchThreads(req, res) {
  const userId = resolveActorId(req);
  const { q, channelType, limit, includeMessages } = req.query ?? {};

  const result = await searchThreadsService(userId, {
    query: q,
    channelType: channelType ? String(channelType).trim() || undefined : undefined,
    limit: limit != null ? Number.parseInt(limit, 10) : undefined,
    includeMessages: includeMessages == null ? true : String(includeMessages).toLowerCase() !== 'false',
  });

  res.json(result);
}

export async function openThread(req, res) {
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const thread = await getThread(threadId, {
    withParticipants: String(req.query.includeParticipants ?? '').toLowerCase() !== 'false',
    includeSupportCase: String(req.query.includeSupport ?? '').toLowerCase() !== 'false',
    includeLabels: String(req.query.includeLabels ?? '').toLowerCase() === 'true',
  });
  res.json(thread);
}

export async function createConversation(req, res) {
  const createdBy = resolveActorId(req);
  const participantIds = ensureParticipantList(req.body.participantIds ?? req.body.participantId);

  const thread = await createThread({
    subject: String(req.body.subject ?? '').trim().slice(0, 250) || null,
    channelType: req.body.channelType,
    createdBy,
    participantIds,
    metadata: sanitiseMetadata(req.body.metadata),
  });

  res.status(201).json(thread);
}

export async function postMessage(req, res) {
  const senderId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const message = await appendMessage(threadId, senderId, {
    messageType: req.body.messageType,
    body: String(req.body.body ?? '').trim(),
    attachments: sanitiseAttachments(req.body.attachments),
    metadata: sanitiseMetadata(req.body.metadata),
  });

  res.status(201).json(message);
}

export async function listThreadMessages(req, res) {
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { page, pageSize, includeSystem } = req.query;
  const response = await listMessages(
    threadId,
    normalisePagination({ page, pageSize }),
    { includeSystem: String(includeSystem ?? '').toLowerCase() === 'true' },
  );
  res.json(response);
}

export async function listThreadTranscripts(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const transcripts = await listThreadTranscriptsService(threadId, userId);
  res.json({ threadId, transcripts });
}

export async function createThreadTranscript(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const transcript = await generateThreadTranscriptService(threadId, userId, {
    cutoff: req.body?.cutoff,
  });
  res.status(201).json(transcript);
}

export async function acknowledgeThread(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const result = await markThreadRead(threadId, userId);
  res.json(result);
}

export async function changeThreadState(req, res) {
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { state } = req.body ?? {};
  if (!state) {
    throw new ValidationError('state is required.');
  }
  const thread = await updateThreadState(threadId, String(state).trim().toLowerCase());
  res.json(thread);
}

export async function muteConversation(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const mutedUntil = parseDateInput(req.body.until);
  const result = await muteThread(threadId, userId, mutedUntil);
  res.json(result);
}

export async function escalateThread(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const supportCase = await escalateThreadToSupport(threadId, userId, {
    reason: String(req.body.reason ?? '').trim(),
    priority: req.body.priority,
    metadata: sanitiseMetadata(req.body.metadata),
  });
  res.status(202).json(supportCase);
}

export async function assignSupport(req, res) {
  ensureSupportPrivileges(req);
  const actorId = resolveActorId(req, { required: false });
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const agentId = parsePositiveInteger(req.body?.agentId, 'agentId');

  const supportCase = await assignSupportAgent(threadId, agentId, {
    assignedBy: parsePositiveInteger(req.body?.assignedBy, 'assignedBy', { optional: true }) ?? actorId ?? agentId,
    notifyAgent: String(req.body?.notifyAgent ?? '').toLowerCase() !== 'false',
  });

  res.json(supportCase);
}

export async function updateSupportStatus(req, res) {
  ensureSupportPrivileges(req);
  const actorId = resolveActorId(req, { required: false });
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { status, resolutionSummary, metadata } = req.body;
  if (!status) {
    throw new ValidationError('status is required to update a support case.');
  }

  const supportCase = await updateSupportCaseStatus(threadId, String(status).trim().toLowerCase(), {
    actorId,
    resolutionSummary,
    metadataPatch: sanitiseMetadata(metadata),
  });

  res.json(supportCase);
}

export async function enforceRetention(req, res) {
  ensureSupportPrivileges(req);
  const actorId = resolveActorId(req, { required: false });
  const { limit, dryRun } = req.body ?? {};
  const results = await enforceThreadRetentionService({
    limit: limit != null ? Number.parseInt(limit, 10) : undefined,
    actorId,
    dryRun: String(dryRun ?? '').toLowerCase() === 'true',
  });
  res.json({ results });
}

export async function createCallSession(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { callType, callId, role } = req.body ?? {};

  const session = await startOrJoinCall(threadId, userId, {
    callType,
    callId,
    role,
  });

  res.status(session.isNew ? 201 : 200).json(session);
}

export async function updateTypingState(req, res) {
  const userId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { typing, displayName } = req.body ?? {};

  const state = await updateTypingStateService(threadId, userId, {
    typing: typing != null ? Boolean(typing) : true,
    displayName,
  });

  res.json(state);
}

export async function updateThreadSettings(req, res) {
  const actorId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { subject, channelType, metadataPatch, metadata, retentionPolicy, retentionDays, retentionLocked } =
    req.body ?? {};

  const thread = await updateThreadSettingsService(threadId, actorId, {
    subject: subject != null ? String(subject).trim().slice(0, 250) : undefined,
    channelType,
    metadataPatch: metadataPatch != null ? sanitiseMetadata(metadataPatch) : sanitiseMetadata(metadata),
    retentionPolicy,
    retentionDays,
    retentionLocked,
  });

  res.json(thread);
}

export async function addParticipants(req, res) {
  const actorId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const participants = ensureParticipantList(req.body?.participantIds ?? req.body?.participantId);

  const thread = await addParticipantsToThread(threadId, actorId, participants);
  res.status(201).json(thread);
}

export async function removeParticipant(req, res) {
  const actorId = resolveActorId(req);
  const { threadId, participantId } = req.params;

  const thread = await removeParticipantFromThread(
    parsePositiveInteger(threadId, 'threadId'),
    parsePositiveInteger(participantId, 'participantId'),
    actorId,
  );
  res.json(thread);
}

export default {
  listInbox,
  searchThreads,
  openThread,
  createConversation,
  postMessage,
  listThreadMessages,
  listThreadTranscripts,
  createThreadTranscript,
  acknowledgeThread,
  changeThreadState,
  muteConversation,
  escalateThread,
  assignSupport,
  updateSupportStatus,
  enforceRetention,
  updateThreadSettings,
  addParticipants,
  removeParticipant,
  createCallSession,
  updateTypingState,
};
