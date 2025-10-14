import {
  listMemberGroups,
  listGroups as listManagedGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  discoverGroups,
  getGroup,
  createGroup,
  updateGroup as updateGroupRecord,
  addMember as addGroupMember,
  updateMember as updateGroupMember,
  removeMember as removeGroupMember,
  requestMembership as requestGroupMembership,
} from '../services/groupService.js';

function toNumber(value, fallback = null) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.trim().toLowerCase();
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

export async function discover(req, res) {
  const { limit, search } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const result = await discoverGroups({ limit, search, actorId });
  res.json(result);
}

export async function index(req, res) {
  const actorId = resolveActorId(req);
  const { limit, offset, focus, q, query, includeEmpty } = req.query ?? {};
  const result = await listMemberGroups({
    actorId,
    limit,
    offset,
    focus,
    query: q ?? query,
    includeEmpty: parseBoolean(includeEmpty, false),
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

export async function requestMembership(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const { message } = req.body ?? {};
  const result = await requestGroupMembership(groupId, {
    actor: req.user,
    message,
  });
  res.status(202).json(result);
}

export async function listManaged(req, res) {
  const { page, pageSize, search, visibility, includeMembers } = req.query ?? {};
  const result = await listManagedGroups({
    page,
    pageSize,
    search,
    visibility,
    includeMembers: parseBoolean(includeMembers, false),
    actor: req.user,
  });
  res.json(result);
}

export async function create(req, res) {
  const payload = req.body ?? {};
  const result = await createGroup(payload, { actor: req.user });
  res.status(201).json(result);
}

export async function getManaged(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const includeMembers = parseBoolean(req.query?.includeMembers, true);
  const result = await getGroup(groupId, { includeMembers, actor: req.user });
  res.json(result);
}

export async function update(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const payload = req.body ?? {};
  const result = await updateGroupRecord(groupId, payload, { actor: req.user });
  res.json(result);
}

export async function addMember(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const payload = req.body ?? {};
  const result = await addGroupMember(
    {
      groupId,
      userId: toNumber(payload.userId),
      role: payload.role,
      status: payload.status,
      notes: payload.notes,
    },
    { actor: req.user },
  );
  res.status(201).json(result);
}

export async function updateMember(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const membershipId = toNumber(req.params?.membershipId);
  const payload = req.body ?? {};
  const result = await updateGroupMember(groupId, membershipId, payload, { actor: req.user });
  res.json(result);
}

export async function removeMember(req, res) {
  const groupId = toNumber(req.params?.groupId);
  const membershipId = toNumber(req.params?.membershipId);
  await removeGroupMember(groupId, membershipId, { actor: req.user });
  res.status(204).end();
}

export default {
  discover,
  index,
  show,
  join,
  leave,
  updateMembership,
  requestMembership,
  listManaged,
  create,
  getManaged,
  update,
  addMember,
  updateMember,
  removeMember,
};
