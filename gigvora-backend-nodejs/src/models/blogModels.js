import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const BLOG_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];

export const BlogCategory = sequelize.define(
  'BlogCategory',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    accentColor: { type: DataTypes.STRING(20), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'blog_categories',
    indexes: [
      { fields: ['workspaceId'] },
      { unique: true, fields: ['workspaceId', 'slug'], name: 'blog_categories_workspace_slug_unique' },
    ],
  },
);

BlogCategory.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId ?? null,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    accentColor: plain.accentColor,
    heroImageUrl: plain.heroImageUrl,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const BlogTag = sequelize.define(
  'BlogTag',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'blog_tags',
    indexes: [
      { fields: ['workspaceId'] },
      { unique: true, fields: ['workspaceId', 'slug'], name: 'blog_tags_workspace_slug_unique' },
    ],
  },
);

BlogTag.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId ?? null,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const BlogMedia = sequelize.define(
  'BlogMedia',
  {
    url: { type: DataTypes.STRING(500), allowNull: false },
    type: { type: DataTypes.STRING(80), allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    caption: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'blog_media', indexes: [{ fields: ['type'] }] },
);

BlogMedia.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    url: plain.url,
    type: plain.type,
    altText: plain.altText,
    caption: plain.caption,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const BlogPost = sequelize.define(
  'BlogPost',
  {
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false },
    excerpt: { type: DataTypes.STRING(480), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...BLOG_POST_STATUSES), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    readingTimeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    coverImageId: { type: DataTypes.INTEGER, allowNull: true },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    meta: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'blog_posts',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['publishedAt'] },
      { fields: ['categoryId'] },
      { fields: ['featured'] },
      { fields: ['workspaceId'] },
      { unique: true, fields: ['workspaceId', 'slug'], name: 'blog_posts_workspace_slug_unique' },
    ],
  },
);

BlogPost.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const author = this.get?.('author') ?? plain.author ?? null;
  const category = this.get?.('category') ?? plain.category ?? null;
  const coverImage = this.get?.('coverImage') ?? plain.coverImage ?? null;
  const tags = Array.isArray(this.get?.('tags')) ? this.get('tags') : plain.tags ?? [];
  const mediaItems = Array.isArray(this.get?.('media')) ? this.get('media') : plain.media ?? [];
  const metrics = this.get?.('metrics') ?? plain.metrics ?? null;
  const workspace = this.get?.('workspace') ?? plain.workspace ?? null;

  return {
    id: plain.id,
    title: plain.title,
    slug: plain.slug,
    excerpt: plain.excerpt,
    content: plain.content,
    status: plain.status,
    publishedAt: plain.publishedAt,
    readingTimeMinutes: plain.readingTimeMinutes ?? null,
    featured: Boolean(plain.featured),
    meta: plain.meta ?? null,
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        }
      : null,
    author: author
      ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          email: author.email,
        }
      : null,
    category: typeof category?.toPublicObject === 'function' ? category.toPublicObject() : category,
    tags: tags.map((tag) => (typeof tag?.toPublicObject === 'function' ? tag.toPublicObject() : tag)),
    coverImage:
      coverImage && typeof coverImage.toPublicObject === 'function' ? coverImage.toPublicObject() : coverImage,
    media: mediaItems.map((item) =>
      typeof item?.toPublicObject === 'function' ? item.toPublicObject() : item,
    ),
    metrics:
      metrics && typeof metrics.toPublicObject === 'function'
        ? metrics.toPublicObject()
        : metrics,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const BlogPostTag = sequelize.define(
  'BlogPostTag',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false, references: { model: BlogPost, key: 'id' } },
    tagId: { type: DataTypes.INTEGER, allowNull: false, references: { model: BlogTag, key: 'id' } },
  },
  {
    tableName: 'blog_post_tags',
    indexes: [{ unique: true, fields: ['postId', 'tagId'] }],
  },
);

export const BlogPostMedia = sequelize.define(
  'BlogPostMedia',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false, references: { model: BlogPost, key: 'id' } },
    mediaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: BlogMedia, key: 'id' } },
    position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    role: { type: DataTypes.STRING(80), allowNull: true },
    caption: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: 'blog_post_media',
    indexes: [
      { unique: true, fields: ['postId', 'mediaId'] },
      { fields: ['postId', 'position'] },
    ],
  },
);

BlogPostMedia.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const media = this.get?.('media') ?? plain.media ?? null;
  return {
    id: plain.id,
    position: plain.position ?? 0,
    role: plain.role ?? null,
    caption: plain.caption ?? null,
    media: media && typeof media.toPublicObject === 'function' ? media.toPublicObject() : media,
  };
};

export const BLOG_COMMENT_STATUSES = ['pending', 'approved', 'rejected', 'spam', 'archived'];

export const BlogPostMetric = sequelize.define(
  'BlogPostMetric',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    totalViews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    uniqueVisitors: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    averageReadTimeSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    readCompletionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    clickThroughRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    bounceRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    shareCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    likeCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    subscriberConversions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    commentCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'blog_post_metrics' },
);

BlogPostMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    postId: plain.postId,
    totalViews: plain.totalViews ?? 0,
    uniqueVisitors: plain.uniqueVisitors ?? 0,
    averageReadTimeSeconds: plain.averageReadTimeSeconds ?? 0,
    readCompletionRate: plain.readCompletionRate != null ? Number(plain.readCompletionRate) : 0,
    clickThroughRate: plain.clickThroughRate != null ? Number(plain.clickThroughRate) : 0,
    bounceRate: plain.bounceRate != null ? Number(plain.bounceRate) : 0,
    shareCount: plain.shareCount ?? 0,
    likeCount: plain.likeCount ?? 0,
    subscriberConversions: plain.subscriberConversions ?? 0,
    commentCount: plain.commentCount ?? 0,
    lastSyncedAt: plain.lastSyncedAt ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const BlogComment = sequelize.define(
  'BlogComment',
  {
    postId: { type: DataTypes.INTEGER, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    authorName: { type: DataTypes.STRING(160), allowNull: true },
    authorEmail: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...BLOG_COMMENT_STATUSES), allowNull: false, defaultValue: 'pending' },
    isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    likeCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    flagCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    editedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'blog_post_comments',
    indexes: [
      { fields: ['postId', 'status'] },
      { fields: ['createdAt'] },
    ],
  },
);

BlogComment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const author = this.get?.('author') ?? plain.author ?? null;
  const parent = this.get?.('parent') ?? plain.parent ?? null;
  const post = this.get?.('post') ?? plain.post ?? null;
  const replies = Array.isArray(this.get?.('replies')) ? this.get('replies') : plain.replies ?? [];

  return {
    id: plain.id,
    postId: plain.postId,
    parentId: plain.parentId ?? null,
    body: plain.body,
    status: plain.status,
    isPinned: Boolean(plain.isPinned),
    likeCount: plain.likeCount ?? 0,
    flagCount: plain.flagCount ?? 0,
    publishedAt: plain.publishedAt ?? null,
    editedAt: plain.editedAt ?? null,
    metadata: plain.metadata ?? null,
    author: author
      ? {
          id: author.id ?? null,
          firstName: author.firstName ?? null,
          lastName: author.lastName ?? null,
          email: author.email ?? null,
          name:
            author.firstName || author.lastName
              ? `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim()
              : author.name ?? plain.authorName ?? null,
        }
      : plain.authorName || plain.authorEmail
        ? {
            id: null,
            name: plain.authorName ?? null,
            email: plain.authorEmail ?? null,
          }
        : null,
    post: post
      ? {
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          publishedAt: post.publishedAt ?? null,
        }
      : null,
    parent: parent && typeof parent.toPublicObject === 'function' ? parent.toPublicObject() : parent,
    replies: replies.map((reply) =>
      typeof reply?.toPublicObject === 'function' ? reply.toPublicObject() : reply,
    ),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export function registerBlogAssociations({ User, ProviderWorkspace }) {
  BlogPost.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
  BlogPost.belongsTo(BlogCategory, { as: 'category', foreignKey: 'categoryId' });
  BlogPost.belongsTo(BlogMedia, { as: 'coverImage', foreignKey: 'coverImageId' });
  if (ProviderWorkspace) {
    BlogPost.belongsTo(ProviderWorkspace, {
      as: 'workspace',
      foreignKey: 'workspaceId',
    });

    BlogCategory.belongsTo(ProviderWorkspace, {
      as: 'workspace',
      foreignKey: 'workspaceId',
    });

    BlogTag.belongsTo(ProviderWorkspace, {
      as: 'workspace',
      foreignKey: 'workspaceId',
    });
  }

  BlogPost.belongsToMany(BlogTag, { through: BlogPostTag, as: 'tags', foreignKey: 'postId' });
  BlogTag.belongsToMany(BlogPost, { through: BlogPostTag, as: 'posts', foreignKey: 'tagId' });

  BlogPost.belongsToMany(BlogMedia, { through: BlogPostMedia, as: 'media', foreignKey: 'postId' });
  BlogMedia.belongsToMany(BlogPost, { through: BlogPostMedia, as: 'posts', foreignKey: 'mediaId' });

  BlogPostMedia.belongsTo(BlogMedia, { as: 'media', foreignKey: 'mediaId' });

  BlogPost.hasOne(BlogPostMetric, { as: 'metrics', foreignKey: 'postId' });
  BlogPostMetric.belongsTo(BlogPost, { as: 'post', foreignKey: 'postId' });

  BlogPost.hasMany(BlogComment, { as: 'comments', foreignKey: 'postId' });
  BlogComment.belongsTo(BlogPost, { as: 'post', foreignKey: 'postId' });
  BlogComment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
  BlogComment.belongsTo(BlogComment, { as: 'parent', foreignKey: 'parentId' });
  BlogComment.hasMany(BlogComment, { as: 'replies', foreignKey: 'parentId' });
}

export default {
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPost,
  BlogPostTag,
  BlogPostMedia,
  BlogPostMetric,
  BlogComment,
};
