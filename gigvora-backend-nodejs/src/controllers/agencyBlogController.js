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
} from '../services/blogService.js';
import { ProviderWorkspace, ProviderWorkspaceMember } from '../models/index.js';
import {
  buildAgencyActorContext,
  ensurePlainObject,
  mergeDefined,
  toOptionalPositiveInteger,
  toOptionalString,
  toPositiveInteger,
} from '../utils/controllerUtils.js';
import {
  resolveWorkspaceForActor,
  resolveWorkspaceIdentifiersFromRequest,
} from '../utils/agencyWorkspaceAccess.js';
import { ValidationError } from '../utils/errors.js';

function resolvePostIdentifier(rawId, { fieldName = 'postId' } = {}) {
  if (rawId == null) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number(rawId);
  if (Number.isInteger(numeric) && numeric > 0) {
    return numeric;
  }
  const text = `${rawId}`.trim();
  if (!text) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  return text;
}

function normalisePostFilters(query = {}) {
  const status = toOptionalString(query.status, { fieldName: 'status', maxLength: 40, lowercase: true });
  const category = toOptionalString(query.category, { fieldName: 'category', maxLength: 120 });
  const tag = toOptionalString(query.tag, { fieldName: 'tag', maxLength: 120 });
  const search = toOptionalString(query.search, { fieldName: 'search', maxLength: 200 });
  const page = toOptionalPositiveInteger(query.page, { fieldName: 'page', required: false });
  const pageSize = toOptionalPositiveInteger(query.pageSize, { fieldName: 'pageSize', required: false });
  return mergeDefined({}, { status, category, tag, search, page, pageSize });
}

async function resolveWorkspaceContext(req, body = {}, { requireMembership = true } = {}) {
  const actor = buildAgencyActorContext(req);
  const identifiers = resolveWorkspaceIdentifiersFromRequest(req, body, { required: true });
  const { workspace } = await resolveWorkspaceForActor(identifiers, actor, { requireMembership });
  return { actor, workspace };
}

export async function workspaces(req, res) {
  const actor = buildAgencyActorContext(req);

  if (actor.isAdmin) {
    const workspaces = await ProviderWorkspace.findAll({
      where: { type: 'agency' },
      order: [['name', 'ASC']],
    });
    res.json({
      results: workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
      })),
    });
    return;
  }

  const memberships = await ProviderWorkspaceMember.findAll({
    where: { userId: actor.actorId, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        attributes: ['id', 'name', 'slug', 'type'],
      },
    ],
    order: [[{ model: ProviderWorkspace, as: 'workspace' }, 'name', 'ASC']],
  });

  const results = memberships
    .map((membership) => {
      if (!membership.workspace) {
        return null;
      }
      return {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        type: membership.workspace.type,
        role: membership.role,
      };
    })
    .filter(Boolean);

  res.json({ results });
}

export async function list(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const filters = normalisePostFilters(req.query ?? {});
  const payload = await listBlogPosts({
    ...filters,
    includeUnpublished: true,
    workspaceId: workspace.id,
  });
  res.json(payload);
}

export async function retrieve(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const postId = resolvePostIdentifier(req.params?.postId, { fieldName: 'postId' });
  const post = await getBlogPost(postId, { includeUnpublished: true, workspaceId: workspace.id });
  res.json(post);
}

export async function create(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const payload = { ...body, workspaceId: workspace.id };
  delete payload.workspaceSlug;
  const result = await createBlogPost(payload, { actorId: actor.actorId, workspaceId: workspace.id });
  res.status(201).json(result);
}

export async function update(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const postId = resolvePostIdentifier(req.params?.postId, { fieldName: 'postId' });
  const payload = { ...body, workspaceId: workspace.id };
  delete payload.workspaceSlug;
  const result = await updateBlogPost(postId, payload, { actorId: actor.actorId, workspaceId: workspace.id });
  res.json(result);
}

export async function destroy(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const postId = resolvePostIdentifier(req.params?.postId, { fieldName: 'postId' });
  await deleteBlogPost(postId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function categories(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const items = await listBlogCategories({ workspaceId: workspace.id, includeGlobal: true });
  res.json({ results: items });
}

export async function createCategory(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const category = await createBlogCategory({ ...body, workspaceId: workspace.id }, { workspaceId: workspace.id });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const categoryId = toPositiveInteger(req.params?.categoryId, { fieldName: 'categoryId' });
  const category = await updateBlogCategory(categoryId, { ...body, workspaceId: workspace.id }, { workspaceId: workspace.id });
  res.json(category);
}

export async function deleteCategory(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const categoryId = toPositiveInteger(req.params?.categoryId, { fieldName: 'categoryId' });
  await deleteBlogCategory(categoryId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function tags(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const items = await listBlogTags({ workspaceId: workspace.id, includeGlobal: true });
  res.json({ results: items });
}

export async function createTag(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const tag = await createBlogTag({ ...body, workspaceId: workspace.id }, { workspaceId: workspace.id });
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const { actor, workspace } = await resolveWorkspaceContext(req, body);
  const tagId = toPositiveInteger(req.params?.tagId, { fieldName: 'tagId' });
  const tag = await updateBlogTag(tagId, { ...body, workspaceId: workspace.id }, { workspaceId: workspace.id });
  res.json(tag);
}

export async function deleteTag(req, res) {
  const { workspace } = await resolveWorkspaceContext(req, req.query ?? {});
  const tagId = toPositiveInteger(req.params?.tagId, { fieldName: 'tagId' });
  await deleteBlogTag(tagId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function createMedia(req, res) {
  const actor = buildAgencyActorContext(req);
  const body = ensurePlainObject(req.body ?? {}, 'body');
  const media = await createBlogMedia(body, actor);
  res.status(201).json(media);
}

export default {
  workspaces,
  list,
  retrieve,
  create,
  update,
  destroy,
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  tags,
  createTag,
  updateTag,
  deleteTag,
  createMedia,
};
