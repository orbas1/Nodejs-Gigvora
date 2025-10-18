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
import { ValidationError } from '../utils/errors.js';

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
  const result = await listMemberGroups({
    actorId: userId,
    page,
    pageSize,
    statuses: normaliseStatuses(statuses),
    search,
    includeMembers: includeMembers === 'true' || includeMembers === true,
    sort,
  });
  res.json(result);
}

export async function store(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const group = await createUserGroup(req.body ?? {}, { actorId: userId });
  res.status(201).json(group);
}

export async function update(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const group = await updateUserGroup(groupId, req.body ?? {}, { actorId: userId });
  res.json(group);
}

export async function listInvites(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const invites = await listGroupInvites(groupId, { actorId: userId });
  res.json({ invites });
}

export async function createInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const invite = await createGroupInvite(groupId, req.body ?? {}, { actorId: userId });
  res.status(201).json(invite);
}

export async function removeInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const inviteId = parseIntOrNull(req.params.inviteId);
  if (!userId || !groupId || !inviteId) {
    throw new ValidationError('A valid user id, group id, and invite id are required.');
  }
  const result = await cancelGroupInvite(groupId, inviteId, { actorId: userId });
  res.json(result);
}

export async function listPosts(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const { status, limit } = req.query ?? {};
  const posts = await listGroupPosts(groupId, { actorId: userId, status, limit });
  res.json({ posts });
}

export async function createPost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  if (!userId || !groupId) {
    throw new ValidationError('A valid user id and group id are required.');
  }
  const post = await createGroupPost(groupId, req.body ?? {}, { actorId: userId });
  res.status(201).json(post);
}

export async function updatePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !groupId || !postId) {
    throw new ValidationError('A valid user id, group id, and post id are required.');
  }
  const post = await updateGroupPost(groupId, postId, req.body ?? {}, { actorId: userId });
  res.json(post);
}

export async function deletePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const groupId = parseIntOrNull(req.params.groupId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !groupId || !postId) {
    throw new ValidationError('A valid user id, group id, and post id are required.');
  }
  const result = await deleteGroupPost(groupId, postId, { actorId: userId });
  res.json(result);
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
