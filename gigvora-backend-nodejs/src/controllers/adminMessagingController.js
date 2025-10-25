import {
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
} from '../services/adminMessagingService.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function resolveActor(req) {
  const actor = extractAdminActor(req);
  let actorId = actor.actorId;
  const fallback = req.body?.actorId ?? req.body?.userId;
  if (actorId == null && fallback != null) {
    try {
      actorId = coercePositiveInteger(fallback, 'actorId');
    } catch (error) {
      // ignore invalid fallback, will be handled below
    }
  }
  if (actorId == null) {
    throw new ValidationError('An authenticated actorId is required for this action.');
  }
  return { ...actor, actorId };
}

export async function index(req, res) {
  const result = await listAdminThreads(req.query, req.query);
  res.json(result);
}

export async function show(req, res) {
  const { threadId } = req.params;
  const thread = await getAdminThread(threadId);
  res.json(thread);
}

export async function messages(req, res) {
  const { threadId } = req.params;
  const pagination = { page: req.query.page, pageSize: req.query.pageSize };
  const includeSystem = String(req.query.includeSystem ?? 'true').toLowerCase() === 'true';
  const result = await listAdminThreadMessages(threadId, pagination, { includeSystem });
  res.json(result);
}

export async function createThread(req, res) {
  const actor = resolveActor(req);
  const payload = { ...req.body, createdBy: actor.actorId };
  const thread = await createAdminThread(payload);
  logger.info({ actor: actor.reference, threadId: thread?.id }, 'Admin messaging thread created');
  res.status(201).json(thread);
}

export async function sendMessage(req, res) {
  const { threadId } = req.params;
  const actor = resolveActor(req);
  const message = await sendAdminMessage(threadId, actor.actorId, req.body);
  logger.info({ actor: actor.reference, threadId, messageId: message?.id }, 'Admin messaging thread reply sent');
  res.status(201).json(message);
}

export async function changeState(req, res) {
  const { threadId } = req.params;
  const { state } = req.body ?? {};
  if (!state) {
    throw new ValidationError('state is required');
  }
  const thread = await updateAdminThreadState(threadId, state);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, threadId, state }, 'Admin messaging thread state updated');
  res.json(thread);
}

export async function escalate(req, res) {
  const { threadId } = req.params;
  const actor = resolveActor(req);
  const supportCase = await escalateAdminThread(threadId, actor.actorId, req.body);
  logger.info({ actor: actor.reference, threadId, caseId: supportCase?.id }, 'Admin messaging thread escalated');
  res.status(202).json(supportCase);
}

export async function assign(req, res) {
  const { threadId } = req.params;
  const { agentId } = req.body ?? {};
  if (!agentId) {
    throw new ValidationError('agentId is required');
  }
  const actor = resolveActor(req);
  const result = await assignAdminSupportAgent(threadId, agentId, {
    ...req.body,
    assignedBy: actor.actorId,
  });
  logger.info({ actor: actor.reference, threadId, agentId }, 'Admin messaging thread assigned');
  res.json(result);
}

export async function updateSupportStatus(req, res) {
  const { threadId } = req.params;
  const { status } = req.body ?? {};
  if (!status) {
    throw new ValidationError('status is required');
  }
  const actor = resolveActor(req);
  const result = await updateAdminSupportStatus(threadId, status, {
    ...req.body,
    actorId: actor.actorId,
  });
  logger.info({ actor: actor.reference, threadId, status }, 'Admin messaging support status updated');
  res.json(result);
}

export async function labels(req, res) {
  const labels = await listMessageLabels();
  res.json({ data: labels });
}

export async function createLabel(req, res) {
  const actor = resolveActor(req);
  const label = await createMessageLabel({ ...req.body, createdBy: actor.actorId });
  logger.info({ actor: actor.reference, labelId: label?.id }, 'Admin messaging label created');
  res.status(201).json(label);
}

export async function updateLabel(req, res) {
  const { labelId } = req.params;
  const label = await updateMessageLabel(labelId, req.body ?? {});
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, labelId }, 'Admin messaging label updated');
  res.json(label);
}

export async function removeLabel(req, res) {
  const { labelId } = req.params;
  await deleteMessageLabel(labelId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, labelId }, 'Admin messaging label deleted');
  res.status(204).send();
}

export async function applyLabels(req, res) {
  const { threadId } = req.params;
  const actor = resolveActor(req);
  const labels = Array.isArray(req.body?.labelIds) ? req.body.labelIds : [];
  const thread = await setThreadLabels(threadId, labels, actor.actorId);
  logger.info({ actor: actor.reference, threadId, labels }, 'Admin messaging labels applied');
  res.json(thread);
}

export async function supportAgents(req, res) {
  const agents = await listSupportAgents();
  res.json({ data: agents });
}

