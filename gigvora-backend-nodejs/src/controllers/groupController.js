import groupService from '../services/groupService.js';

function parseId(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

export async function discover(req, res) {
  const { limit, search } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const result = await groupService.discoverGroups({ limit, search, actorId });
  res.json(result);
}

export async function index(req, res) {
  const { page, pageSize, search, visibility, includeMembers } = req.query ?? {};
  const result = await groupService.listGroups({
    page,
    pageSize,
    search,
    visibility,
    includeMembers: parseBoolean(includeMembers),
    actor: req.user,
  });
  res.json(result);
}

export async function create(req, res) {
  const payload = req.body ?? {};
  const result = await groupService.createGroup(payload, { actor: req.user });
  res.status(201).json(result);
}

export async function show(req, res) {
  const groupId = parseId(req.params.groupId);
  const group = await groupService.getGroup(groupId, { includeMembers: true, actor: req.user });
  res.json(group);
}

export async function update(req, res) {
  const groupId = parseId(req.params.groupId);
  const payload = req.body ?? {};
  const result = await groupService.updateGroup(groupId, payload, { actor: req.user });
  res.json(result);
}

export async function addMember(req, res) {
  const groupId = parseId(req.params.groupId);
  const payload = req.body ?? {};
  const result = await groupService.addMember(
    {
      groupId,
      userId: parseId(payload.userId),
      role: payload.role,
      status: payload.status,
      notes: payload.notes,
    },
    { actor: req.user },
  );
  res.status(201).json(result);
}

export async function updateMember(req, res) {
  const groupId = parseId(req.params.groupId);
  const membershipId = parseId(req.params.membershipId);
  const payload = req.body ?? {};
  const result = await groupService.updateMember(groupId, membershipId, payload, { actor: req.user });
  res.json(result);
}

export async function removeMember(req, res) {
  const groupId = parseId(req.params.groupId);
  const membershipId = parseId(req.params.membershipId);
  await groupService.removeMember(groupId, membershipId, { actor: req.user });
  res.status(204).end();
}

export async function requestMembership(req, res) {
  const groupId = parseId(req.params.groupId);
  const payload = req.body ?? {};
  const result = await groupService.requestMembership(groupId, {
    actor: req.user,
    message: payload.message,
  });
  res.status(202).json(result);
}

export default {
  discover,
  index,
  create,
  show,
  update,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
};
