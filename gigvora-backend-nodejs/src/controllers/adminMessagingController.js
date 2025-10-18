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
import { ValidationError } from '../utils/errors.js';

function resolveActorId(req, fallback = null) {
  const candidates = [req.user?.id, req.body?.actorId, req.body?.userId];
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (fallback != null) {
    return fallback;
  }
  throw new ValidationError('An authenticated actorId is required for this action.');
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
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const payload = { ...req.body, createdBy: actorId };
  const thread = await createAdminThread(payload);
  res.status(201).json(thread);
}

export async function sendMessage(req, res) {
  const { threadId } = req.params;
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const message = await sendAdminMessage(threadId, actorId, req.body);
  res.status(201).json(message);
}

export async function changeState(req, res) {
  const { threadId } = req.params;
  const { state } = req.body ?? {};
  if (!state) {
    throw new ValidationError('state is required');
  }
  const thread = await updateAdminThreadState(threadId, state);
  res.json(thread);
}

export async function escalate(req, res) {
  const { threadId } = req.params;
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const supportCase = await escalateAdminThread(threadId, actorId, req.body);
  res.status(202).json(supportCase);
}

export async function assign(req, res) {
  const { threadId } = req.params;
  const { agentId } = req.body ?? {};
  if (!agentId) {
    throw new ValidationError('agentId is required');
  }
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const result = await assignAdminSupportAgent(threadId, agentId, { ...req.body, assignedBy: actorId });
  res.json(result);
}

export async function updateSupportStatus(req, res) {
  const { threadId } = req.params;
  const { status } = req.body ?? {};
  if (!status) {
    throw new ValidationError('status is required');
  }
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const result = await updateAdminSupportStatus(threadId, status, { ...req.body, actorId });
  res.json(result);
}

export async function labels(req, res) {
  const labels = await listMessageLabels();
  res.json({ data: labels });
}

export async function createLabel(req, res) {
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const label = await createMessageLabel({ ...req.body, createdBy: actorId });
  res.status(201).json(label);
}

export async function updateLabel(req, res) {
  const { labelId } = req.params;
  const label = await updateMessageLabel(labelId, req.body ?? {});
  res.json(label);
}

export async function removeLabel(req, res) {
  const { labelId } = req.params;
  await deleteMessageLabel(labelId);
  res.status(204).send();
}

export async function applyLabels(req, res) {
  const { threadId } = req.params;
  const actorId = resolveActorId(req, req.user?.id ?? null);
  const labels = Array.isArray(req.body?.labelIds) ? req.body.labelIds : [];
  const thread = await setThreadLabels(threadId, labels, actorId);
  res.json(thread);
}

export async function supportAgents(req, res) {
  const agents = await listSupportAgents();
  res.json({ data: agents });
}

export default {
  index,
  show,
  messages,
  createThread,
  sendMessage,
  changeState,
  escalate,
  assign,
  updateSupportStatus,
  labels,
  createLabel,
  updateLabel,
  removeLabel,
  applyLabels,
  supportAgents,
};
