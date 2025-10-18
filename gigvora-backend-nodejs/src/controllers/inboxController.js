import {
  getInboxWorkspace,
  updateInboxPreferences,
  createSavedReply,
  updateSavedReply,
  deleteSavedReply,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
} from '../services/inboxWorkspaceService.js';
import { ValidationError } from '../utils/errors.js';

function resolveActorId(req) {
  const candidates = [
    req.user?.id,
    req.body?.userId,
    req.body?.actorId,
    req.query?.userId,
    req.query?.actorId,
  ];
  for (const candidate of candidates) {
    if (candidate == null) {
      continue;
    }
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  throw new ValidationError('A valid userId is required to access the inbox workspace.');
}

export async function workspace(req, res) {
  const userId = resolveActorId(req);
  const workspace = await getInboxWorkspace(userId, {
    forceRefresh: String(req.query.forceRefresh ?? '').toLowerCase() === 'true',
  });
  res.json(workspace);
}

export async function savePreferences(req, res) {
  const userId = resolveActorId(req);
  const preferences = await updateInboxPreferences(userId, req.body ?? {});
  res.json(preferences);
}

export async function createReply(req, res) {
  const userId = resolveActorId(req);
  const reply = await createSavedReply(userId, req.body ?? {});
  res.status(201).json(reply);
}

export async function updateReply(req, res) {
  const userId = resolveActorId(req);
  const { replyId } = req.params;
  const reply = await updateSavedReply(userId, replyId, req.body ?? {});
  res.json(reply);
}

export async function removeReply(req, res) {
  const userId = resolveActorId(req);
  const { replyId } = req.params;
  await deleteSavedReply(userId, replyId);
  res.status(204).send();
}

export async function createRule(req, res) {
  const userId = resolveActorId(req);
  const rule = await createRoutingRule(userId, req.body ?? {});
  res.status(201).json(rule);
}

export async function updateRule(req, res) {
  const userId = resolveActorId(req);
  const { ruleId } = req.params;
  const rule = await updateRoutingRule(userId, ruleId, req.body ?? {});
  res.json(rule);
}

export async function removeRule(req, res) {
  const userId = resolveActorId(req);
  const { ruleId } = req.params;
  await deleteRoutingRule(userId, ruleId);
  res.status(204).send();
}

export default {
  workspace,
  savePreferences,
  createReply,
  updateReply,
  removeReply,
  createRule,
  updateRule,
  removeRule,
};
