import { describe, it, expect } from '@jest/globals';
import { DataTypes } from 'sequelize';
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogMedia,
  BlogPostMedia,
  BlogPostMetric,
  BlogComment,
  registerBlogAssociations,
} from '../../src/models/blogModels.js';
import sequelize from '../../src/models/sequelizeClient.js';

const TestUser = sequelize.define(
  'BlogTestUser',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
  },
  { tableName: 'blog_test_users' },
);

const TestProviderWorkspace = sequelize.define(
  'BlogTestProviderWorkspace',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'agency' },
    timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' },
    defaultCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    intakeEmail: { type: DataTypes.STRING(255), allowNull: true },
    settings: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'blog_test_provider_workspaces' },
);

function uniqueSlug(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

describe('blog models', () => {
  it('registerBlogAssociations validates required dependencies', () => {
    expect(() => registerBlogAssociations()).toThrow('valid User');
    expect(() => registerBlogAssociations({ User: TestUser })).toThrow('ProviderWorkspace');
  });

  it('registerBlogAssociations is idempotent when invoked with the same models', () => {
    const firstResult = registerBlogAssociations({ User: TestUser, ProviderWorkspace: TestProviderWorkspace });
    const secondResult = registerBlogAssociations({ User: TestUser, ProviderWorkspace: TestProviderWorkspace });

    expect(secondResult).toBe(firstResult);
    expect(BlogPost.associations.author.target).toBe(TestUser);
    expect(BlogPost.associations.workspace.target).toBe(TestProviderWorkspace);
  });

  it('BlogPost.toPublicObject returns a sanitised, fully populated payload', async () => {
    registerBlogAssociations({ User: TestUser, ProviderWorkspace: TestProviderWorkspace });

    const author = await TestUser.create({
      firstName: 'Jordan',
      lastName: 'Wells',
      email: `${uniqueSlug('jordan')}@gigvora.test`,
      password: 'hashed-password',
    });

    const workspace = await TestProviderWorkspace.create({
      ownerId: author.id,
      name: 'Gigvora Agency',
      slug: uniqueSlug('workspace'),
      type: 'agency',
      timezone: 'UTC',
      defaultCurrency: 'USD',
      intakeEmail: 'intake@gigvora.test',
      settings: { theme: 'gigvora' },
    });

    const category = await BlogCategory.create({
      workspaceId: workspace.id,
      name: 'Product Announcements',
      slug: uniqueSlug('product-announcements'),
      description: 'Latest product updates',
    });

    const tag = await BlogTag.create({
      workspaceId: workspace.id,
      name: 'AI',
      slug: uniqueSlug('ai'),
      description: 'Artificial Intelligence',
    });

    const coverImage = await BlogMedia.create({
      url: 'https://cdn.gigvora.test/images/cover.png',
      type: 'image/png',
      altText: 'Cover image',
      caption: 'The cover asset',
    });

    const galleryImage = await BlogMedia.create({
      url: 'https://cdn.gigvora.test/images/gallery.png',
      type: 'image/png',
      altText: 'Gallery image',
      caption: 'Gallery asset',
    });

    const post = await BlogPost.create({
      title: 'Release 2024.06',
      slug: uniqueSlug('release-2024-06'),
      excerpt: 'A comprehensive look at the Gigvora June release.',
      content: '<p>All the release details.</p>',
      status: 'published',
      publishedAt: new Date(),
      readingTimeMinutes: 8,
      featured: true,
      authorId: author.id,
      categoryId: category.id,
      coverImageId: coverImage.id,
      workspaceId: workspace.id,
      meta: { seo: { title: 'Gigvora June Release' } },
    });

    await post.addTag(tag);
    await post.addMedia(galleryImage, { through: { position: 1, role: 'gallery', caption: 'Gallery asset' } });

    await BlogPostMetric.create({
      postId: post.id,
      totalViews: 450,
      uniqueVisitors: 320,
      readCompletionRate: 76.5,
      likeCount: 28,
    });

    await post.reload({
      include: [
        { association: BlogPost.associations.author },
        { association: BlogPost.associations.category },
        { association: BlogPost.associations.coverImage },
        { association: BlogPost.associations.tags },
        { association: BlogPost.associations.media },
        { association: BlogPost.associations.metrics },
        { association: BlogPost.associations.workspace },
      ],
    });

    const publicPost = post.toPublicObject();

    expect(publicPost.id).toBe(post.id);
    expect(publicPost.author).toMatchObject({
      id: author.id,
      firstName: 'Jordan',
      lastName: 'Wells',
      email: author.email,
    });
    expect(publicPost.author).not.toHaveProperty('password');
    expect(publicPost.category).toMatchObject({ id: category.id, slug: category.slug });
    expect(publicPost.tags[0]).toMatchObject({ id: tag.id, name: tag.name });
    expect(publicPost.coverImage).toMatchObject({ id: coverImage.id, url: coverImage.url });
    expect(publicPost.media[0]).toMatchObject({ id: galleryImage.id, url: galleryImage.url });
    expect(publicPost.metrics).toMatchObject({ totalViews: 450, readCompletionRate: 76.5 });
    expect(publicPost.workspace).toMatchObject({ id: workspace.id, slug: workspace.slug });
    expect(publicPost).not.toHaveProperty('authorId');
    expect(publicPost).not.toHaveProperty('workspaceId');
    expect(publicPost.status).toBe('published');
    expect(publicPost.featured).toBe(true);
    expect(publicPost.meta).toMatchObject({ seo: { title: 'Gigvora June Release' } });
  });

  it('BlogPostMedia.toPublicObject nests media metadata correctly', async () => {
    registerBlogAssociations({ User: TestUser, ProviderWorkspace: TestProviderWorkspace });

    const author = await TestUser.create({
      firstName: 'Alex',
      lastName: 'Rivera',
      email: `${uniqueSlug('alex')}@gigvora.test`,
      password: 'hashed-password',
    });

    const workspace = await TestProviderWorkspace.create({
      ownerId: author.id,
      name: 'Gigvora Studio',
      slug: uniqueSlug('workspace'),
      type: 'agency',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });

    const post = await BlogPost.create({
      title: 'Behind the scenes',
      slug: uniqueSlug('behind-the-scenes'),
      content: '<p>Story</p>',
      status: 'draft',
      authorId: author.id,
      workspaceId: workspace.id,
    });

    const media = await BlogMedia.create({
      url: 'https://cdn.gigvora.test/images/behind.png',
      type: 'image/png',
    });

    const postMedia = await BlogPostMedia.create({
      postId: post.id,
      mediaId: media.id,
      position: 5,
      role: 'inline',
      caption: 'Inline media',
    });

    await postMedia.reload({ include: [{ association: BlogPostMedia.associations.media }] });

    const publicMedia = postMedia.toPublicObject();

    expect(publicMedia).toMatchObject({
      id: postMedia.id,
      position: 5,
      role: 'inline',
      caption: 'Inline media',
    });
    expect(publicMedia.media).toMatchObject({ id: media.id, url: media.url, type: media.type });
  });

  it('BlogComment.toPublicObject resolves anonymous and registered authors securely', async () => {
    registerBlogAssociations({ User: TestUser, ProviderWorkspace: TestProviderWorkspace });

    const author = await TestUser.create({
      firstName: 'Taylor',
      lastName: 'James',
      email: `${uniqueSlug('taylor')}@gigvora.test`,
      password: 'hashed-password',
    });

    const workspace = await TestProviderWorkspace.create({
      ownerId: author.id,
      name: 'Gigvora Writers',
      slug: uniqueSlug('workspace'),
      type: 'agency',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });

    const post = await BlogPost.create({
      title: 'Community feedback',
      slug: uniqueSlug('community-feedback'),
      content: '<p>Feedback</p>',
      status: 'published',
      authorId: author.id,
      workspaceId: workspace.id,
      publishedAt: new Date(),
    });

    const registeredComment = await BlogComment.create({
      postId: post.id,
      authorId: author.id,
      body: 'Excited about this release!',
      status: 'approved',
      likeCount: 4,
      flagCount: 0,
    });

    const anonymousComment = await BlogComment.create({
      postId: post.id,
      authorName: 'Jamie',
      authorEmail: 'jamie@example.com',
      body: 'Thanks for the transparency.',
      status: 'approved',
      likeCount: 2,
      flagCount: 0,
    });

    const reply = await BlogComment.create({
      postId: post.id,
      parentId: registeredComment.id,
      authorId: author.id,
      body: 'Appreciate the support!',
      status: 'approved',
    });

    await registeredComment.reload({
      include: [
        { association: BlogComment.associations.author },
        { association: BlogComment.associations.post },
        { association: BlogComment.associations.replies },
      ],
    });

    await anonymousComment.reload({
      include: [
        { association: BlogComment.associations.post },
      ],
    });

    await reply.reload({
      include: [
        { association: BlogComment.associations.parent },
        { association: BlogComment.associations.author },
      ],
    });

    const registeredPublic = registeredComment.toPublicObject();
    const anonymousPublic = anonymousComment.toPublicObject();
    const replyPublic = reply.toPublicObject();

    expect(registeredPublic.author).toMatchObject({
      id: author.id,
      email: author.email,
      firstName: author.firstName,
      lastName: author.lastName,
    });
    expect(registeredPublic.author).not.toHaveProperty('password');
    expect(anonymousPublic.author).toMatchObject({
      id: null,
      name: 'Jamie',
      email: 'jamie@example.com',
    });
    expect(replyPublic.parent.id).toBe(registeredComment.id);
    expect(replyPublic.replies).toHaveLength(0);
    expect(replyPublic.author).toMatchObject({ id: author.id });
  });
});
