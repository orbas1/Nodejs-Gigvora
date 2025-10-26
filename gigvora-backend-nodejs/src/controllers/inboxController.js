import {
  getInboxWorkspace,
  updateInboxPreferences,
  createSavedReply,
  updateSavedReply,
  deleteSavedReply,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  pinInboxThread,
  unpinInboxThread,
  reorderPinnedThreads,
} from '../services/inboxWorkspaceService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

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
      if (req.user?.id && Number.parseInt(req.user.id, 10) !== parsed) {
        throw new AuthorizationError('You can only manage your own inbox workspace.');
      }
      return parsed;
    }
  }
  throw new ValidationError('A valid userId is required to access the inbox workspace.');
}

function ensureObjectPayload(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  return JSON.parse(JSON.stringify(body));
}

function parsePositiveIdentifier(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function sanitizeReplyPayload(body = {}) {
  const payload = ensureObjectPayload(body, 'saved reply');
  if (payload.title != null) {
    payload.title = String(payload.title).trim().slice(0, 200);
  }
  if (payload.body != null) {
    payload.body = String(payload.body).trim();
  }
  if (payload.shortcut != null) {
    payload.shortcut = String(payload.shortcut).trim();
  }
  if (payload.shortcuts != null) {
    payload.shortcuts = Array.isArray(payload.shortcuts)
      ? payload.shortcuts.map((shortcut) => String(shortcut).trim()).filter(Boolean)
      : [];
  }
  return payload;
}

function sanitizeRulePayload(body = {}) {
  const payload = ensureObjectPayload(body, 'routing rule');
  if (payload.name != null) {
    payload.name = String(payload.name).trim().slice(0, 160);
  }
  if (payload.conditions != null && !Array.isArray(payload.conditions)) {
    throw new ValidationError('routing rule conditions must be an array.');
  }
  if (payload.actions != null && !Array.isArray(payload.actions)) {
    throw new ValidationError('routing rule actions must be an array.');
  }
  return payload;
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
  const preferences = await updateInboxPreferences(userId, ensureObjectPayload(req.body, 'preferences update'));
  res.json(preferences);
}

export async function createReply(req, res) {
  const userId = resolveActorId(req);
  const reply = await createSavedReply(userId, sanitizeReplyPayload(req.body));
  res.status(201).json(reply);
}

export async function updateReply(req, res) {
  const userId = resolveActorId(req);
  const { replyId } = req.params;
  const reply = await updateSavedReply(userId, parsePositiveIdentifier(replyId, 'replyId'), sanitizeReplyPayload(req.body));
  res.json(reply);
}

export async function removeReply(req, res) {
  const userId = resolveActorId(req);
  const { replyId } = req.params;
  await deleteSavedReply(userId, parsePositiveIdentifier(replyId, 'replyId'));
  res.status(204).send();
}

export async function createRule(req, res) {
  const userId = resolveActorId(req);
  const rule = await createRoutingRule(userId, sanitizeRulePayload(req.body));
  res.status(201).json(rule);
}

export async function updateRule(req, res) {
  const userId = resolveActorId(req);
  const { ruleId } = req.params;
  const rule = await updateRoutingRule(
    userId,
    parsePositiveIdentifier(ruleId, 'ruleId'),
    sanitizeRulePayload(req.body),
  );
  res.json(rule);
}

export async function removeRule(req, res) {
  const userId = resolveActorId(req);
  const { ruleId } = req.params;
  await deleteRoutingRule(userId, parsePositiveIdentifier(ruleId, 'ruleId'));
  res.status(204).send();
}

export async function pinThread(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const preferences = await pinInboxThread(userId, parsePositiveIdentifier(threadId, 'threadId'));
  res.json({ pinnedThreadIds: preferences.pinnedThreadIds });
}

export async function unpinThread(req, res) {
  const userId = resolveActorId(req);
  const { threadId } = req.params;
  const preferences = await unpinInboxThread(userId, parsePositiveIdentifier(threadId, 'threadId'));
  res.json({ pinnedThreadIds: preferences.pinnedThreadIds });
}

export async function reorderPins(req, res) {
  const userId = resolveActorId(req);
  const payload = ensureObjectPayload(req.body, 'pinned thread order');
  const order = Array.isArray(payload.threadIds) ? payload.threadIds : payload.order ?? [];
  const preferences = await reorderPinnedThreads(userId, order);
  res.json({ pinnedThreadIds: preferences.pinnedThreadIds });
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
  pinThread,
  unpinThread,
  reorderPins,
};
