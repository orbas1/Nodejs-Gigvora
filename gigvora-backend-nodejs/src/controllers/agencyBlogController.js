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
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

function parseNumeric(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

async function resolveWorkspaceContext({ workspaceId, workspaceSlug }, { actorId, actorRoles }) {
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }
  if (workspaceId == null && !workspaceSlug) {
    throw new ValidationError('A workspaceId or workspaceSlug must be provided.');
  }
  const normalizedRoles = Array.isArray(actorRoles)
    ? actorRoles.map((role) => `${role}`.toLowerCase())
    : [];
  const isAdmin = normalizedRoles.includes('admin');

  let workspace = null;
  if (workspaceId != null) {
    workspace = await ProviderWorkspace.findByPk(Number(workspaceId));
  } else if (workspaceSlug) {
    workspace = await ProviderWorkspace.findOne({ where: { slug: workspaceSlug } });
  }

  if (!workspace) {
    throw new NotFoundError('Workspace could not be found.');
  }

  if (!isAdmin) {
    const membership = await ProviderWorkspaceMember.findOne({
      where: {
        workspaceId: workspace.id,
        userId: actorId,
        status: 'active',
      },
    });
    if (!membership) {
      throw new AuthorizationError('You do not have access to this workspace.');
    }
  }

  return workspace;
}

export async function workspaces(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  if (Array.isArray(actorRoles) && actorRoles.map((role) => `${role}`.toLowerCase()).includes('admin')) {
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
    where: { userId: actorId, status: 'active' },
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
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { status, page, pageSize, category, tag, search } = req.query ?? {};
  const payload = await listBlogPosts({
    status,
    page,
    pageSize,
    category,
    tag,
    search,
    includeUnpublished: true,
    workspaceId: workspace.id,
  });
  res.json(payload);
}

export async function retrieve(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { postId } = req.params;
  const post = await getBlogPost(Number(postId) || postId, {
    includeUnpublished: true,
    workspaceId: workspace.id,
  });
  res.json(post);
}

export async function create(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const result = await createBlogPost(
    { ...req.body, workspaceId: workspace.id },
    { actorId, workspaceId: workspace.id },
  );
  res.status(201).json(result);
}

export async function update(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { postId } = req.params;
  const result = await updateBlogPost(Number(postId) || postId, req.body ?? {}, {
    actorId,
    workspaceId: workspace.id,
  });
  res.json(result);
}

export async function destroy(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { postId } = req.params;
  await deleteBlogPost(Number(postId) || postId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function categories(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const items = await listBlogCategories({ workspaceId: workspace.id, includeGlobal: true });
  res.json({ results: items });
}

export async function createCategory(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const category = await createBlogCategory(req.body ?? {}, { workspaceId: workspace.id });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { categoryId } = req.params;
  const category = await updateBlogCategory(Number(categoryId) || categoryId, req.body ?? {}, {
    workspaceId: workspace.id,
  });
  res.json(category);
}

export async function deleteCategory(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { categoryId } = req.params;
  await deleteBlogCategory(Number(categoryId) || categoryId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function tags(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const items = await listBlogTags({ workspaceId: workspace.id, includeGlobal: true });
  res.json({ results: items });
}

export async function createTag(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const tag = await createBlogTag(req.body ?? {}, { workspaceId: workspace.id });
  res.status(201).json(tag);
}

export async function updateTag(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.body?.workspaceId ?? req.query?.workspaceId),
      workspaceSlug: req.body?.workspaceSlug ?? req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { tagId } = req.params;
  const tag = await updateBlogTag(Number(tagId) || tagId, req.body ?? {}, { workspaceId: workspace.id });
  res.json(tag);
}

export async function deleteTag(req, res) {
  const actorId = req.user?.id;
  const actorRoles = req.user?.roles ?? [];
  const workspace = await resolveWorkspaceContext(
    {
      workspaceId: parseNumeric(req.query?.workspaceId),
      workspaceSlug: req.query?.workspaceSlug,
    },
    { actorId, actorRoles },
  );

  const { tagId } = req.params;
  await deleteBlogTag(Number(tagId) || tagId, { workspaceId: workspace.id });
  res.status(204).send();
}

export async function createMedia(req, res) {
  const media = await createBlogMedia(req.body ?? {});
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
