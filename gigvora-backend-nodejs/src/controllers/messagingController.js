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
  getMessageAttachmentDownload,
  updateThreadSettings as updateThreadSettingsService,
  addParticipantsToThread,
  removeParticipantFromThread,
} from '../services/messagingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions } from '../utils/requestContext.js';

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
  if (!Array.isArray(attachments)) {
    throw new ValidationError('attachments must be an array.');
  }
  return attachments.slice(0, 25).map((attachment) => {
    if (attachment == null || typeof attachment !== 'object') {
      throw new ValidationError('Each attachment must be an object.');
    }
    const normalised = { ...attachment };
    if (normalised.url != null) {
      normalised.url = String(normalised.url).trim();
    }
    if (normalised.name != null) {
      normalised.name = String(normalised.name).trim().slice(0, 200);
    }
    return normalised;
  });
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

export async function downloadMessageAttachment(req, res) {
  const actorId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const messageId = parsePositiveInteger(req.params?.messageId, 'messageId');
  const attachmentId = parsePositiveInteger(req.params?.attachmentId, 'attachmentId');

  const download = await getMessageAttachmentDownload(threadId, messageId, attachmentId, actorId);
  res.json(download);
}

export async function updateThreadSettings(req, res) {
  const actorId = resolveActorId(req);
  const threadId = parsePositiveInteger(req.params?.threadId, 'threadId');
  const { subject, channelType, metadataPatch, metadata } = req.body ?? {};

  const thread = await updateThreadSettingsService(threadId, actorId, {
    subject: subject != null ? String(subject).trim().slice(0, 250) : undefined,
    channelType,
    metadataPatch: metadataPatch != null ? sanitiseMetadata(metadataPatch) : sanitiseMetadata(metadata),
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
  updateThreadSettings,
  addParticipants,
  removeParticipant,
};
