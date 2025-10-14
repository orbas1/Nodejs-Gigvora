import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const BLOG_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];

export const BlogCategory = sequelize.define(
  'BlogCategory',
  {
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    accentColor: { type: DataTypes.STRING(20), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'blog_categories', indexes: [{ unique: true, fields: ['slug'] }] },
);

BlogCategory.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
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
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'blog_tags', indexes: [{ unique: true, fields: ['slug'] }] },
);

BlogTag.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
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
    slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
    excerpt: { type: DataTypes.STRING(480), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...BLOG_POST_STATUSES), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    readingTimeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    coverImageId: { type: DataTypes.INTEGER, allowNull: true },
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

export function registerBlogAssociations({ User }) {
  BlogPost.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
  BlogPost.belongsTo(BlogCategory, { as: 'category', foreignKey: 'categoryId' });
  BlogPost.belongsTo(BlogMedia, { as: 'coverImage', foreignKey: 'coverImageId' });

  BlogPost.belongsToMany(BlogTag, { through: BlogPostTag, as: 'tags', foreignKey: 'postId' });
  BlogTag.belongsToMany(BlogPost, { through: BlogPostTag, as: 'posts', foreignKey: 'tagId' });

  BlogPost.belongsToMany(BlogMedia, { through: BlogPostMedia, as: 'media', foreignKey: 'postId' });
  BlogMedia.belongsToMany(BlogPost, { through: BlogPostMedia, as: 'posts', foreignKey: 'mediaId' });

  BlogPostMedia.belongsTo(BlogMedia, { as: 'media', foreignKey: 'mediaId' });
}

export default {
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPost,
  BlogPostTag,
  BlogPostMedia,
};
