import {
  listUserPages,
  listManagedPages,
  createPage,
  updatePage,
  listPageMemberships,
  updatePageMembership,
  listPageInvites,
  createPageInvite,
  cancelPageInvite,
  listPagePosts,
  createPagePost,
  updatePagePost,
  deletePagePost,
} from '../services/pageService.js';
import { ValidationError } from '../utils/errors.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function parseIntOrNull(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function resolveActorId(req, fallback) {
  const resolved = resolveRequestUserId(req);
  if (resolved) {
    return resolved;
  }
  const candidate = parseIntOrNull(req.body?.actorId ?? req.query?.actorId);
  if (candidate) {
    return candidate;
  }
  return fallback ?? null;
}

export async function index(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const { includeMemberships } = req.query ?? {};
  const pages = await listUserPages(userId, {
    includeMemberships: includeMemberships === 'true' || includeMemberships === true,
  });
  res.json({ pages });
}

export async function managed(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const { limit } = req.query ?? {};
  const pages = await listManagedPages(userId, { limit });
  res.json({ pages });
}

export async function store(req, res) {
  const userId = parseIntOrNull(req.params.id);
  if (!userId) {
    throw new ValidationError('A valid user id is required.');
  }
  const actorId = resolveActorId(req, userId);
  const page = await createPage(req.body ?? {}, { actorId });
  res.status(201).json(page);
}

export async function update(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const actorId = resolveActorId(req, userId);
  const page = await updatePage(pageId, req.body ?? {}, { actorId });
  res.json(page);
}

export async function memberships(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const membershipList = await listPageMemberships(pageId, { actorId: resolveActorId(req, userId) });
  res.json({ memberships: membershipList });
}

export async function updateMembership(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  const membershipId = parseIntOrNull(req.params.membershipId);
  if (!userId || !pageId || !membershipId) {
    throw new ValidationError('A valid user id, page id, and membership id are required.');
  }
  const membership = await updatePageMembership(pageId, membershipId, req.body ?? {}, {
    actorId: resolveActorId(req, userId),
  });
  res.json(membership);
}

export async function invites(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const invitesList = await listPageInvites(pageId, { actorId: resolveActorId(req, userId) });
  res.json({ invites: invitesList });
}

export async function createInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const invite = await createPageInvite(pageId, req.body ?? {}, { actorId: resolveActorId(req, userId) });
  res.status(201).json(invite);
}

export async function removeInvite(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  const inviteId = parseIntOrNull(req.params.inviteId);
  if (!userId || !pageId || !inviteId) {
    throw new ValidationError('A valid user id, page id, and invite id are required.');
  }
  const result = await cancelPageInvite(pageId, inviteId, { actorId: resolveActorId(req, userId) });
  res.json(result);
}

export async function posts(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const { status, limit } = req.query ?? {};
  const postsList = await listPagePosts(pageId, {
    actorId: resolveActorId(req, userId),
    status,
    limit,
  });
  res.json({ posts: postsList });
}

export async function createPost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  if (!userId || !pageId) {
    throw new ValidationError('A valid user id and page id are required.');
  }
  const post = await createPagePost(pageId, req.body ?? {}, { actorId: resolveActorId(req, userId) });
  res.status(201).json(post);
}

export async function updatePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !pageId || !postId) {
    throw new ValidationError('A valid user id, page id, and post id are required.');
  }
  const post = await updatePagePost(pageId, postId, req.body ?? {}, { actorId: resolveActorId(req, userId) });
  res.json(post);
}

export async function deletePost(req, res) {
  const userId = parseIntOrNull(req.params.id);
  const pageId = parseIntOrNull(req.params.pageId);
  const postId = parseIntOrNull(req.params.postId);
  if (!userId || !pageId || !postId) {
    throw new ValidationError('A valid user id, page id, and post id are required.');
  }
  const result = await deletePagePost(pageId, postId, { actorId: resolveActorId(req, userId) });
  res.json(result);
}

export default {
  index,
  managed,
  store,
  update,
  memberships,
  updateMembership,
  invites,
  createInvite,
  removeInvite,
  posts,
  createPost,
  updatePost,
  deletePost,
};
