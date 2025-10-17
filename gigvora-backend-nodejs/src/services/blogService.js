import { Op, literal } from 'sequelize';
import {
  BlogCategory,
  BlogMedia,
  BlogPost,
  BlogPostMedia,
  BlogPostTag,
  BlogTag,
  ProviderWorkspace,
  User,
  sequelize,
} from '../models/index.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const STATUS_SET = new Set(['draft', 'scheduled', 'published', 'archived']);

function slugify(value, fallback = 'blog-post') {
  const base = `${value ?? ''}`.trim().toLowerCase();
  const sanitized = base
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (sanitized) {
    return sanitized;
  }
  return `${fallback}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureUniqueSlug(model, desiredSlug, { transaction, excludeId, scope } = {}) {
  let candidate = slugify(desiredSlug);
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    const hasWorkspaceScope = Boolean(model?.rawAttributes?.workspaceId);
    if (hasWorkspaceScope) {
      const workspaceId = scope?.workspaceId ?? null;
      if (workspaceId == null) {
        where.workspaceId = { [Op.is]: null };
      } else {
        where.workspaceId = workspaceId;
      }
    }
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await model.findOne({ where, transaction, paranoid: false });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugify(desiredSlug)}-${suffix}`;
  }
}

function normaliseArray(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

async function resolveCategory(input, { transaction, allowCreate = true, workspaceId } = {}) {
  if (!input) {
    return null;
  }
  if (typeof input === 'number' || /^\d+$/.test(`${input}`)) {
    const category = await BlogCategory.findByPk(Number(input), { transaction });
    if (!category) {
      throw new NotFoundError('Blog category not found.');
    }
    return category;
  }
  if (typeof input === 'string') {
    const slugValue = slugify(input);
    if (workspaceId != null) {
      const scopedCategory = await BlogCategory.findOne({
        where: { slug: slugValue, workspaceId },
        transaction,
      });
      if (scopedCategory) {
        return scopedCategory;
      }
    }
    const category = await BlogCategory.findOne({
      where: { slug: slugValue, workspaceId: null },
      transaction,
    });
    if (category) {
      return category;
    }
    if (!allowCreate) {
      throw new NotFoundError('Blog category not found.');
    }
    return BlogCategory.create(
      {
        name: input,
        slug: await ensureUniqueSlug(BlogCategory, input, {
          transaction,
          scope: { workspaceId: workspaceId ?? null },
        }),
        workspaceId: workspaceId ?? null,
      },
      { transaction },
    );
  }
  if (typeof input === 'object') {
    const { id, slug, name, description, accentColor, heroImageUrl } = input;
    if (id) {
      return resolveCategory(id, { transaction, allowCreate, workspaceId });
    }
    if (!name) {
      throw new ValidationError('Category name is required.');
    }
    const normalizedSlug = slug
      ? slugify(slug)
      : await ensureUniqueSlug(BlogCategory, name, {
          transaction,
          scope: { workspaceId: workspaceId ?? null },
        });
    const [category] = await BlogCategory.findOrCreate({
      where: {
        slug: normalizedSlug,
        workspaceId: workspaceId ?? null,
      },
      defaults: {
        name,
        slug: normalizedSlug,
        description: description ?? null,
        accentColor: accentColor ?? null,
        heroImageUrl: heroImageUrl ?? null,
        workspaceId: workspaceId ?? null,
      },
      transaction,
    });
    if (description || accentColor || heroImageUrl) {
      category.set({
        description: description ?? category.description,
        accentColor: accentColor ?? category.accentColor,
        heroImageUrl: heroImageUrl ?? category.heroImageUrl,
      });
      await category.save({ transaction });
    }
    return category;
  }
  return null;
}

async function resolveTags(tagsInput, { transaction, workspaceId } = {}) {
  const tags = normaliseArray(tagsInput)
    .map((tag) => (typeof tag === 'string' ? { name: tag } : tag))
    .filter((tag) => tag && (tag.id || tag.slug || tag.name));

  if (!tags.length) {
    return [];
  }

  const resolved = [];
  for (const tag of tags) {
    if (tag.id) {
      const existing = await BlogTag.findByPk(tag.id, { transaction });
      if (!existing) {
        throw new NotFoundError(`Blog tag ${tag.id} could not be found.`);
      }
      resolved.push(existing);
      // eslint-disable-next-line no-continue
      continue;
    }
    const baseSlug = tag.slug ? slugify(tag.slug) : slugify(tag.name);
    const slug = await ensureUniqueSlug(BlogTag, baseSlug, {
      transaction,
      scope: { workspaceId: workspaceId ?? null },
    });
    const [record] = await BlogTag.findOrCreate({
      where: {
        slug: baseSlug,
        workspaceId: workspaceId ?? null,
      },
      defaults: {
        name: tag.name ?? tag.slug ?? slug,
        slug,
        description: tag.description ?? null,
        metadata: tag.metadata ?? null,
        workspaceId: workspaceId ?? null,
      },
      transaction,
    });
    if (tag.description || tag.metadata) {
      record.set({
        description: tag.description ?? record.description,
        metadata: tag.metadata ?? record.metadata,
      });
      await record.save({ transaction });
    }
    resolved.push(record);
  }
  return resolved;
}

async function resolveMedia(mediaInput, { transaction } = {}) {
  const items = normaliseArray(mediaInput)
    .map((media) => (typeof media === 'string' ? { url: media } : media))
    .filter((media) => media && (media.id || media.url));

  if (!items.length) {
    return [];
  }

  const resolved = [];
  for (const item of items) {
    if (item.id) {
      const existing = await BlogMedia.findByPk(item.id, { transaction });
      if (!existing) {
        throw new NotFoundError(`Media asset ${item.id} not found.`);
      }
      resolved.push({ instance: existing, payload: item });
      // eslint-disable-next-line no-continue
      continue;
    }
    if (!item.url) {
      throw new ValidationError('Media url is required.');
    }
    const created = await BlogMedia.create(
      {
        url: item.url,
        type: item.type ?? null,
        altText: item.altText ?? null,
        caption: item.caption ?? null,
        metadata: item.metadata ?? null,
      },
      { transaction },
    );
    resolved.push({ instance: created, payload: item });
  }
  return resolved;
}

function buildInclude({ requireCategory, requireTag } = {}) {
  return [
    {
      model: BlogCategory,
      as: 'category',
      required: Boolean(requireCategory),
      ...(requireCategory ? { where: requireCategory } : {}),
    },
    {
      model: BlogTag,
      as: 'tags',
      through: { attributes: [] },
      required: Boolean(requireTag),
      ...(requireTag ? { where: requireTag } : {}),
    },
    { model: BlogMedia, as: 'coverImage' },
    {
      model: BlogMedia,
      as: 'media',
      through: { attributes: ['position', 'role', 'caption'] },
    },
    {
      model: ProviderWorkspace,
      as: 'workspace',
      attributes: ['id', 'name', 'slug'],
    },
    {
      model: User,
      as: 'author',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
  ];
}

function buildPagination({ count, page, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return {
    total: count,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function listBlogPosts(
  {
    status = 'published',
    page = 1,
    pageSize = 12,
    category,
    tag,
    search,
    includeUnpublished = false,
    workspaceId,
    includeGlobalWorkspace = false,
  } = {},
) {
  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedPageSize = Math.min(50, Math.max(1, Number.parseInt(pageSize, 10) || 12));

  const filters = [];
  if (!includeUnpublished) {
    filters.push({ status: 'published' });
  } else if (status && STATUS_SET.has(status)) {
    filters.push({ status });
  }

  if (workspaceId !== undefined) {
    if (workspaceId === null) {
      filters.push({ workspaceId: { [Op.is]: null } });
    } else if (includeGlobalWorkspace) {
      filters.push({
        [Op.or]: [{ workspaceId }, { workspaceId: { [Op.is]: null } }],
      });
    } else {
      filters.push({ workspaceId });
    }
  }

  if (search) {
    const value = `%${search.trim()}%`;
    filters.push({
      [Op.or]: [
        { title: { [Op.iLike ?? Op.like]: value } },
        { excerpt: { [Op.iLike ?? Op.like]: value } },
        { content: { [Op.iLike ?? Op.like]: value } },
      ],
    });
  }

  const where = filters.length ? { [Op.and]: filters } : {};

  const include = buildInclude({
    requireCategory: category ? { slug: slugify(category) } : null,
    requireTag: tag ? { slug: slugify(tag) } : null,
  });

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    include,
    limit: normalizedPageSize,
    offset: (normalizedPage - 1) * normalizedPageSize,
    order: [
      [literal('CASE WHEN "BlogPost"."featured" THEN 0 ELSE 1 END'), 'ASC'],
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    distinct: true,
  });

  return {
    results: rows.map((row) => row.toPublicObject()),
    pagination: buildPagination({ count, page: normalizedPage, pageSize: normalizedPageSize }),
  };
}

export async function getBlogPost(identifier, { includeUnpublished = false, workspaceId } = {}) {
  if (!identifier) {
    throw new ValidationError('A blog identifier is required.');
  }

  const filters = [];
  if (typeof identifier === 'number' || /^\d+$/.test(`${identifier}`)) {
    filters.push({ id: Number(identifier) });
  } else {
    filters.push({ slug: identifier });
  }

  if (!includeUnpublished) {
    filters.push({ status: 'published' });
  }

  if (workspaceId !== undefined) {
    if (workspaceId === null) {
      filters.push({ workspaceId: { [Op.is]: null } });
    } else {
      filters.push({ workspaceId });
    }
  }

  const where = filters.length ? { [Op.and]: filters } : {};

  const post = await BlogPost.findOne({
    where,
    include: buildInclude(),
  });

  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }

  return post.toPublicObject();
}

function normaliseStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = `${status}`.trim().toLowerCase();
  if (!STATUS_SET.has(normalized)) {
    throw new ValidationError('Unsupported blog status.');
  }
  return normalized;
}

function computePublishedAt(status, publishedAt) {
  if (publishedAt) {
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError('Invalid publication timestamp.');
    }
    return date;
  }
  if (status === 'published') {
    return new Date();
  }
  return null;
}

async function upsertBlogPost(payload, { actorId, post, workspaceId }) {
  const {
    title,
    slug,
    excerpt,
    content,
    status,
    publishedAt,
    readingTimeMinutes,
    featured,
    category,
    categoryId,
    tags,
    media,
    coverImage,
    coverImageId,
    meta,
  } = payload ?? {};

  if (!title || !content) {
    throw new ValidationError('Blog posts require a title and content.');
  }

  const resolvedStatus = normaliseStatus(status ?? post?.status);
  const publicationDate = computePublishedAt(resolvedStatus, publishedAt ?? post?.publishedAt);

  return sequelize.transaction(async (transaction) => {
    const resolvedWorkspaceId = workspaceId ?? post?.workspaceId ?? null;
    const categoryInstance = await resolveCategory(category ?? categoryId, {
      transaction,
      allowCreate: true,
      workspaceId: resolvedWorkspaceId,
    });
    const tagsCollection = await resolveTags(tags, { transaction, workspaceId: resolvedWorkspaceId });
    const mediaCollection = await resolveMedia(media, { transaction });

    let coverImageInstance = null;
    if (coverImageId || coverImage) {
      const [result] = await resolveMedia(coverImageId ? [{ id: coverImageId }] : [coverImage], { transaction });
      coverImageInstance = result?.instance ?? null;
    }

    const slugCandidate = await ensureUniqueSlug(BlogPost, slug ?? title, {
      transaction,
      excludeId: post?.id,
      scope: { workspaceId: resolvedWorkspaceId },
    });

    const payloadToPersist = {
      title,
      slug: slugCandidate,
      excerpt: excerpt ?? post?.excerpt ?? null,
      content,
      status: resolvedStatus,
      publishedAt: publicationDate,
      readingTimeMinutes: readingTimeMinutes ?? post?.readingTimeMinutes ?? 5,
      featured: Boolean(featured ?? post?.featured ?? false),
      authorId: actorId ?? post?.authorId ?? null,
      categoryId: categoryInstance?.id ?? null,
      coverImageId: coverImageInstance?.id ?? post?.coverImageId ?? null,
      workspaceId: resolvedWorkspaceId,
      meta: meta ?? post?.meta ?? null,
    };

    let target = post;
    if (!target) {
      target = await BlogPost.create(payloadToPersist, { transaction });
    } else {
      target.set(payloadToPersist);
      await target.save({ transaction });
    }

    if (tagsCollection.length) {
      await target.setTags(tagsCollection, { transaction });
    } else {
      await target.setTags([], { transaction });
    }

    if (mediaCollection.length) {
      await BlogPostMedia.destroy({ where: { postId: target.id }, transaction });
      await Promise.all(
        mediaCollection.map(({ instance, payload: mediaPayload }, index) =>
          BlogPostMedia.create(
            {
              postId: target.id,
              mediaId: instance.id,
              position: mediaPayload.position ?? index,
              role: mediaPayload.role ?? null,
              caption: mediaPayload.caption ?? instance.caption ?? null,
            },
            { transaction },
          ),
        ),
      );
    }

    await target.reload({
      transaction,
      include: buildInclude(),
    });

    return target.toPublicObject();
  });
}

export async function createBlogPost(payload, { actorId, workspaceId } = {}) {
  return upsertBlogPost(payload, { actorId, workspaceId: workspaceId ?? payload?.workspaceId ?? null });
}

export async function updateBlogPost(postId, payload, { actorId, workspaceId } = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId, { include: buildInclude() });
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  if (workspaceId != null && post.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to update this blog post.');
  }
  return upsertBlogPost(payload, { actorId, post, workspaceId: workspaceId ?? post.workspaceId ?? null });
}

export async function deleteBlogPost(postId, { workspaceId } = {}) {
  if (!postId) {
    throw new ValidationError('A valid blog post identifier is required.');
  }
  const post = await BlogPost.findByPk(postId);
  if (!post) {
    throw new NotFoundError('Blog post not found.');
  }
  if (workspaceId != null && post.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to delete this blog post.');
  }
  await sequelize.transaction(async (transaction) => {
    await BlogPostMedia.destroy({ where: { postId }, transaction });
    await BlogPostTag.destroy({ where: { postId }, transaction });
    await post.destroy({ transaction });
  });
  return { success: true };
}

export async function listBlogCategories({ workspaceId, includeGlobal = true } = {}) {
  const where = {};
  if (workspaceId !== undefined) {
    if (workspaceId === null) {
      where.workspaceId = null;
    } else if (includeGlobal) {
      where[Op.or] = [{ workspaceId }, { workspaceId: null }];
    } else {
      where.workspaceId = workspaceId;
    }
  }
  const categories = await BlogCategory.findAll({ where, order: [['name', 'ASC']] });
  return categories.map((category) => category.toPublicObject());
}

export async function createBlogCategory(payload, { workspaceId } = {}) {
  if (!payload?.name) {
    throw new ValidationError('Category name is required.');
  }
  const effectiveWorkspaceId = payload.workspaceId ?? workspaceId ?? null;
  const slug = await ensureUniqueSlug(BlogCategory, payload.slug ?? payload.name, {
    scope: { workspaceId: effectiveWorkspaceId },
  });
  const category = await BlogCategory.create({
    name: payload.name,
    slug,
    description: payload.description ?? null,
    accentColor: payload.accentColor ?? null,
    heroImageUrl: payload.heroImageUrl ?? null,
    metadata: payload.metadata ?? null,
    workspaceId: effectiveWorkspaceId,
  });
  return category.toPublicObject();
}

export async function updateBlogCategory(categoryId, payload, { workspaceId } = {}) {
  if (!categoryId) {
    throw new ValidationError('Category id is required.');
  }
  const category = await BlogCategory.findByPk(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found.');
  }
  if (workspaceId != null && category.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to update this category.');
  }
  if (payload.slug) {
    category.slug = await ensureUniqueSlug(BlogCategory, payload.slug, {
      excludeId: category.id,
      scope: { workspaceId: category.workspaceId ?? workspaceId ?? null },
    });
  }
  category.name = payload.name ?? category.name;
  category.description = payload.description ?? category.description;
  category.accentColor = payload.accentColor ?? category.accentColor;
  category.heroImageUrl = payload.heroImageUrl ?? category.heroImageUrl;
  category.metadata = payload.metadata ?? category.metadata;
  if (payload.workspaceId != null) {
    category.workspaceId = payload.workspaceId;
  }
  await category.save();
  return category.toPublicObject();
}

export async function deleteBlogCategory(categoryId, { workspaceId } = {}) {
  if (!categoryId) {
    throw new ValidationError('Category id is required.');
  }
  const category = await BlogCategory.findByPk(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found.');
  }
  if (workspaceId != null && category.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to delete this category.');
  }
  const postCount = await BlogPost.count({ where: { categoryId } });
  if (postCount > 0) {
    throw new ValidationError('Cannot delete a category that is assigned to published content.');
  }
  await category.destroy();
  return { success: true };
}

export async function listBlogTags({ workspaceId, includeGlobal = true } = {}) {
  const where = {};
  if (workspaceId !== undefined) {
    if (workspaceId === null) {
      where.workspaceId = null;
    } else if (includeGlobal) {
      where[Op.or] = [{ workspaceId }, { workspaceId: null }];
    } else {
      where.workspaceId = workspaceId;
    }
  }
  const tags = await BlogTag.findAll({ where, order: [['name', 'ASC']] });
  return tags.map((tag) => tag.toPublicObject());
}

export async function createBlogTag(payload, { workspaceId } = {}) {
  if (!payload?.name) {
    throw new ValidationError('Tag name is required.');
  }
  const effectiveWorkspaceId = payload.workspaceId ?? workspaceId ?? null;
  const slug = await ensureUniqueSlug(BlogTag, payload.slug ?? payload.name, {
    scope: { workspaceId: effectiveWorkspaceId },
  });
  const tag = await BlogTag.create({
    name: payload.name,
    slug,
    description: payload.description ?? null,
    metadata: payload.metadata ?? null,
    workspaceId: effectiveWorkspaceId,
  });
  return tag.toPublicObject();
}

export async function updateBlogTag(tagId, payload, { workspaceId } = {}) {
  if (!tagId) {
    throw new ValidationError('Tag id is required.');
  }
  const tag = await BlogTag.findByPk(tagId);
  if (!tag) {
    throw new NotFoundError('Tag not found.');
  }
  if (workspaceId != null && tag.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to update this tag.');
  }
  if (payload.slug) {
    tag.slug = await ensureUniqueSlug(BlogTag, payload.slug, {
      excludeId: tag.id,
      scope: { workspaceId: tag.workspaceId ?? workspaceId ?? null },
    });
  }
  tag.name = payload.name ?? tag.name;
  tag.description = payload.description ?? tag.description;
  tag.metadata = payload.metadata ?? tag.metadata;
  if (payload.workspaceId != null) {
    tag.workspaceId = payload.workspaceId;
  }
  await tag.save();
  return tag.toPublicObject();
}

export async function deleteBlogTag(tagId, { workspaceId } = {}) {
  if (!tagId) {
    throw new ValidationError('Tag id is required.');
  }
  const tag = await BlogTag.findByPk(tagId);
  if (!tag) {
    throw new NotFoundError('Tag not found.');
  }
  if (workspaceId != null && tag.workspaceId !== workspaceId) {
    throw new AuthorizationError('You do not have permission to delete this tag.');
  }
  const usage = await BlogPostTag.count({ where: { tagId } });
  if (usage > 0) {
    throw new ValidationError('Cannot delete a tag that is still in use.');
  }
  await tag.destroy();
  return { success: true };
}

export async function createBlogMedia(payload) {
  if (!payload?.url) {
    throw new ValidationError('Media url is required.');
  }
  const media = await BlogMedia.create({
    url: payload.url,
    type: payload.type ?? null,
    altText: payload.altText ?? null,
    caption: payload.caption ?? null,
    metadata: payload.metadata ?? null,
  });
  return media.toPublicObject();
}

export default {
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
};
