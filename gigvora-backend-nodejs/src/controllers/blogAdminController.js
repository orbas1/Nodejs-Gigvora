import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  listBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  createBlogMedia,
  getBlogMetricsOverview,
  getBlogPostMetrics,
  updateBlogPostMetrics,
  listBlogComments,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
} from '../services/blogService.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}

function parseNumeric(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export async function list(req, res) {
  const { status, page, pageSize, category, tag, search } = req.query ?? {};
  const includeUnpublished = parseBoolean(req.query?.includeUnpublished ?? true);
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const payload = await listBlogPosts({
    status,
    page,
    pageSize,
    category,
    tag,
    search,
    includeUnpublished: includeUnpublished,
    workspaceId,
    includeGlobalWorkspace: workspaceId != null,
  });
  res.json(payload);
}

export async function retrieve(req, res) {
  const { postId } = req.params;
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const post = await getBlogPost(Number(postId) || postId, { includeUnpublished: true, workspaceId });
  res.json(post);
}

export async function create(req, res) {
  const { id: actorId } = req.user ?? {};
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const result = await createBlogPost(req.body ?? {}, { actorId, workspaceId });
  res.status(201).json(result);
}

export async function update(req, res) {
  const { id: actorId } = req.user ?? {};
  const { postId } = req.params;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const result = await updateBlogPost(Number(postId) || postId, req.body ?? {}, { actorId, workspaceId });
  res.json(result);
}

export async function destroy(req, res) {
  const { postId } = req.params;
  const workspaceId = parseNumeric(req.query?.workspaceId);
  await deleteBlogPost(Number(postId) || postId, { workspaceId });
  res.status(204).send();
}

export async function categories(req, res) {
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const items = await listBlogCategories({ workspaceId, includeGlobal: workspaceId != null });
  res.json({ results: items });
}

export async function createCategory(req, res) {
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const category = await createBlogCategory(req.body ?? {}, { workspaceId });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const { categoryId } = req.params;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const category = await updateBlogCategory(Number(categoryId) || categoryId, req.body ?? {}, { workspaceId });
  res.json(category);
}

export async function deleteCategory(req, res) {
  const { categoryId } = req.params;
  const workspaceId = parseNumeric(req.query?.workspaceId);
  await deleteBlogCategory(Number(categoryId) || categoryId, { workspaceId });
  res.status(204).send();
}

export async function tags(req, res) {
  const workspaceId = parseNumeric(req.query?.workspaceId);
  const items = await listBlogTags({ workspaceId, includeGlobal: workspaceId != null });
  res.json({ results: items });
}

export async function createTag(req, res) {
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const tag = await createBlogTag(req.body ?? {}, { workspaceId });
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const { tagId } = req.params;
  const workspaceId = parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId);
  const tag = await updateBlogTag(Number(tagId) || tagId, req.body ?? {}, { workspaceId });
  res.json(tag);
}

export async function deleteTag(req, res) {
  const { tagId } = req.params;
  const workspaceId = parseNumeric(req.query?.workspaceId);
  await deleteBlogTag(Number(tagId) || tagId, { workspaceId });
  res.status(204).send();
}

export async function createMedia(req, res) {
  const media = await createBlogMedia(req.body ?? {});
  res.status(201).json(media);
}

export async function metricsOverview(req, res) {
  const { start, end } = req.query ?? {};
  const metrics = await getBlogMetricsOverview({ startDate: start, endDate: end });
  res.json(metrics);
}

export async function metricsForPost(req, res) {
  const { postId } = req.params;
  const metrics = await getBlogPostMetrics(Number(postId) || postId);
  res.json(metrics);
}

export async function updatePostMetrics(req, res) {
  const { postId } = req.params;
  const payload = await updateBlogPostMetrics(Number(postId) || postId, req.body ?? {});
  res.json(payload);
}

export async function comments(req, res) {
  const { postId } = req.params;
  const { status, page, pageSize } = req.query ?? {};
  const payload = await listBlogComments({
    postId: postId ? Number(postId) || postId : undefined,
    status,
    page,
    pageSize,
  });
  res.json(payload);
}

export async function createComment(req, res) {
  const { postId } = req.params;
  const { id: actorId } = req.user ?? {};
  const comment = await createBlogComment(Number(postId) || postId, req.body ?? {}, { actorId });
  res.status(201).json(comment);
}

export async function updateComment(req, res) {
  const { commentId } = req.params;
  const comment = await updateBlogComment(Number(commentId) || commentId, req.body ?? {});
  res.json(comment);
}

export async function deleteComment(req, res) {
  const { commentId } = req.params;
  await deleteBlogComment(Number(commentId) || commentId);
  res.status(204).send();
}

