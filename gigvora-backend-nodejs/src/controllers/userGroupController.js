import {
  listMemberGroups,
  createUserGroup,
  updateUserGroup,
  listGroupInvites,
  createGroupInvite,
  cancelGroupInvite,
  listGroupPosts,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
} from '../services/groupService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parseIntOrNull(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function normaliseStatuses(value) {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function index(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const { page, pageSize, statuses, search, includeMembers, sort } = req.query ?? {};
  const actor = assertGroupAccess(req, userId);
  const result = await listMemberGroups({
    actorId: userId,
    page,
    pageSize,
    statuses: normaliseStatuses(statuses),
    search,
    includeMembers: includeMembers === 'true' || includeMembers === true,
    sort,
  });
  res.json({ ...result, access: actor });
}

export async function store(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const actor = assertGroupAccess(req, userId);
  const group = await createUserGroup(ensurePayloadObject(req.body, 'group'), { actorId: userId });
  res.status(201).json({ ...group, access: actor });
}

export async function update(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const group = await updateUserGroup(groupId, ensurePayloadObject(req.body, 'group update'), {
    actorId: userId,
  });
  res.json({ ...group, access: actor });
}

export async function listInvites(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const invites = await listGroupInvites(groupId, { actorId: userId });
  res.json({ invites, access: actor });
}

export async function createInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const invite = await createGroupInvite(groupId, ensurePayloadObject(req.body, 'group invite'), {
    actorId: userId,
  });
  res.status(201).json({ ...invite, access: actor });
}

export async function removeInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const inviteId = parseIntOrNull(req.params.inviteId);
  if (!userId || !groupId || !inviteId) {
    throw new ValidationError('A valid user id, group id, and invite id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const result = await cancelGroupInvite(groupId, inviteId, { actorId: userId });
  res.json({ ...result, access: actor });
}

export async function listPosts(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const { status, limit } = req.query ?? {};
  const posts = await listGroupPosts(groupId, { actorId: userId, status, limit });
  res.json({ posts, access: actor });
}

export async function createPost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const post = await createGroupPost(groupId, ensurePayloadObject(req.body, 'group post'), { actorId: userId });
  res.status(201).json({ ...post, access: actor });
}

export async function updatePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !groupId || !postId) {
    throw new ValidationError('A valid user id, group id, and post id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const post = await updateGroupPost(groupId, postId, ensurePayloadObject(req.body, 'group post update'), {
    actorId: userId,
  });
  res.json({ ...post, access: actor });
}

export async function deletePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !groupId || !postId) {
    throw new ValidationError('A valid user id, group id, and post id are required.');
  }
  const actor = assertGroupAccess(req, userId);
  const result = await deleteGroupPost(groupId, postId, { actorId: userId });
  res.json({ ...result, access: actor });
}

export default {
  index,
  store,
  update,
  listInvites,
  createInvite,
  removeInvite,
  listPosts,
  createPost,
  updatePost,
  deletePost,
};

const ADMIN_PERMISSIONS = new Set(['groups:manage', 'community:manage']);
const ADMIN_ROLES = new Set(['admin', 'platform_admin', 'support', 'community', 'moderator']);

function ensurePayloadObject(body, label) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return { ...body };
}

function collectRoles(req) {
  const roles = new Set();
  const primary = req.user?.type ?? req.user?.role;
  if (primary) {
    roles.add(String(primary).toLowerCase());
  }
  if (Array.isArray(req.user?.roles)) {
    req.user.roles
      .map((role) => String(role).toLowerCase())
      .filter(Boolean)
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function assertGroupAccess(req, targetUserId) {
  const actorId = resolveRequestUserId(req);
  if (!actorId) {
    throw new AuthorizationError('Authentication is required to manage community groups.');
  }

  if (Number(actorId) === Number(targetUserId)) {
    return { actorId: Number(actorId), actingAs: 'self' };
  }

  const roles = collectRoles(req);
  const permissions = new Set(resolveRequestPermissions(req).map((permission) => String(permission).toLowerCase()));
  const hasRole = Array.from(roles).some((role) => ADMIN_ROLES.has(role));
  const hasPermission = Array.from(permissions).some((permission) => ADMIN_PERMISSIONS.has(permission));

  if (!hasRole && !hasPermission) {
    throw new AuthorizationError('You do not have permission to manage groups for this user.');
  }

  return { actorId: Number(actorId), actingAs: 'administrator' };
}
