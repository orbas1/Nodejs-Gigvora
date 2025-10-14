import {
  listGroups,
  discoverGroups,
  getGroupProfile,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  requestMembership,
} from '../services/groupService.js';

function parseIntOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normaliseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function resolveActor(req) {
  return req.user ?? null;
}

function resolveActorId(req) {
  return (
    parseIntOrNull(req.user?.id) ??
    parseIntOrNull(req.user?.userId) ??
    parseIntOrNull(req.query?.actorId) ??
    parseIntOrNull(req.body?.actorId)
  );
}

export async function discover(req, res) {
  const { limit, search } = req.query ?? {};
  const result = await discoverGroups({
    limit: limit != null ? Number(limit) : undefined,
    search: search ?? undefined,
    actorId: resolveActorId(req),
  });
  res.json(result);
}

export async function index(req, res) {
  const { page, pageSize, search, visibility, includeMembers } = req.query ?? {};
  const result = await listGroups({
    page,
    pageSize,
    search,
    visibility,
    includeMembers: normaliseBoolean(includeMembers),
    actor: resolveActor(req),
  });
  res.json(result);
}

export async function show(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const actorId = resolveActorId(req);
  const result = await getGroupProfile(groupId, { actorId });
  res.json(result);
}

export async function create(req, res) {
  const payload = req.body ?? {};
  const result = await createGroup(payload, { actor: resolveActor(req) });
  res.status(201).json(result);
}

export async function update(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const payload = req.body ?? {};
  const result = await updateGroup(groupId, payload, { actor: resolveActor(req) });
  res.json(result);
}

export async function addMemberController(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const { userId, role, status, notes } = req.body ?? {};
  const result = await addMember(
    {
      groupId,
      userId: parseIntOrNull(userId),
      role,
      status,
      notes,
    },
    { actor: resolveActor(req) },
  );
  res.status(201).json(result);
}

export async function updateMemberController(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const membershipId = parseIntOrNull(req.params?.membershipId);
  const payload = req.body ?? {};
  const result = await updateMember(groupId, membershipId, payload, { actor: resolveActor(req) });
  res.json(result);
}

export async function removeMemberController(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const membershipId = parseIntOrNull(req.params?.membershipId);
  const result = await removeMember(groupId, membershipId, { actor: resolveActor(req) });
  res.json(result);
}

export async function join(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const { role } = req.body ?? {};
  const result = await joinGroup(groupId, { actorId: resolveActorId(req), role });
  res.status(201).json(result);
}

export async function leave(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const result = await leaveGroup(groupId, { actorId: resolveActorId(req) });
  res.json(result);
}

export async function updateMembership(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const payload = req.body ?? {};
  const result = await updateMembershipSettings(groupId, {
    actorId: resolveActorId(req),
    ...payload,
  });
  res.json(result);
}

export async function requestMembershipController(req, res) {
  const groupId = parseIntOrNull(req.params?.groupId);
  const { message } = req.body ?? {};
  const result = await requestMembership(groupId, { actor: resolveActor(req), message });
  res.status(202).json(result);
}

export default {
  discover,
  index,
  show,
  create,
  update,
  addMember: addMemberController,
  updateMember: updateMemberController,
  removeMember: removeMemberController,
  join,
  leave,
  updateMembership,
  requestMembership: requestMembershipController,
};
