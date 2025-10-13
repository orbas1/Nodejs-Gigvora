import {
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
} from '../services/groupService.js';

function toNumber(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function resolveActorId(req) {
  return (
    toNumber(req?.user?.id) ??
    toNumber(req?.user?.userId) ??
    toNumber(req?.query?.actorId) ??
    toNumber(req?.body?.actorId)
  );
}

export async function index(req, res) {
  const actorId = resolveActorId(req);
  const { limit, offset, focus, q, query, includeEmpty } = req.query ?? {};
  const result = await listGroups({
    actorId,
    limit: toNumber(limit, 12),
    offset: toNumber(offset, 0),
    focus: focus ?? undefined,
    query: q ?? query ?? undefined,
    includeEmpty: toBoolean(includeEmpty, false),
  });
  res.json(result);
}

export async function show(req, res) {
  const actorId = resolveActorId(req);
  const { groupId } = req.params ?? {};
  const result = await getGroupProfile(groupId, { actorId });
  res.json(result);
}

export async function join(req, res) {
  const actorId = resolveActorId(req);
  const { groupId } = req.params ?? {};
  const { role } = req.body ?? {};
  const result = await joinGroup(groupId, { actorId, role });
  res.status(201).json(result);
}

export async function leave(req, res) {
  const actorId = resolveActorId(req);
  const { groupId } = req.params ?? {};
  const result = await leaveGroup(groupId, { actorId });
  res.json(result);
}

export async function updateMembership(req, res) {
  const actorId = resolveActorId(req);
  const { groupId } = req.params ?? {};
  const payload = req.body ?? {};
  const result = await updateMembershipSettings(groupId, { actorId, ...payload });
  res.json(result);
}

export default {
  index,
  show,
  join,
  leave,
  updateMembership,
};
