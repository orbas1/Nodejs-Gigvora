import { describe, beforeAll, beforeEach, it, expect, jest } from '@jest/globals';
import './setupTestEnv.js';
import { ValidationError } from '../src/utils/errors.js';
import { createUser } from './helpers/factories.js';

let createBlogCategory;
let createBlogPost;
let createBlogTag;
let deleteBlogCategory;
let deleteBlogPost;
let deleteBlogTag;
let getBlogPost;
let listBlogPosts;
let updateBlogPost;

beforeAll(async () => {
  jest.unstable_mockModule('../src/models/index.js', async () => {
    const blogModels = await import('../src/models/blogModels.js');
    const messagingModels = await import('../src/models/messagingModels.js');
    const sequelizeClient = await import('../src/models/sequelizeClient.js');

    blogModels.registerBlogAssociations({ User: messagingModels.User });

    return {
      ...blogModels,
      User: messagingModels.User,
      sequelize: sequelizeClient.default,
    };
  });

  const blogService = await import('../src/services/blogService.js');
  ({
    createBlogCategory,
    createBlogPost,
    createBlogTag,
    deleteBlogCategory,
    deleteBlogPost,
    deleteBlogTag,
    getBlogPost,
    listBlogPosts,
    updateBlogPost,
  } = blogService);
});

async function createAuthor() {
  const user = await createUser({
    userType: 'admin',
    firstName: 'Avery',
    lastName: 'Content',
  });
  return user;
}

describe('blogService', () => {
  let author;

  beforeEach(async () => {
    author = await createAuthor();
  });

  it('creates published posts with full taxonomy and media relationships', async () => {
    const category = await createBlogCategory({
      name: 'Trust & Safety',
      description: 'Risk mitigation, compliance and trust frameworks.',
    });

    const result = await createBlogPost(
      {
        title: 'Trust centre observability blueprint',
        excerpt: 'Deploy observability guardrails across the entire trust centre perimeter.',
        content: '<p>Deep dive into trust instrumentation.</p>',
        status: 'published',
        categoryId: category.id,
        tags: ['trust', { name: 'compliance excellence' }],
        coverImage: {
          url: 'https://cdn.example.com/blog/trust-centre-cover.png',
          altText: 'Trust observability dashboards',
        },
        media: [
          {
            url: 'https://cdn.example.com/blog/trust-centre-metric.png',
            caption: 'Metric correlation heatmap',
          },
        ],
        readingTimeMinutes: 9,
      },
      { actorId: author.id },
    );

    expect(result.id).toBeGreaterThan(0);
    expect(result.slug).toContain('trust-centre-observability-blueprint');
    expect(result.status).toBe('published');
    expect(result.publishedAt).toBeTruthy();
    expect(result.author?.id).toBe(author.id);
    expect(result.category?.name).toBe('Trust & Safety');
    expect(result.tags.map((tag) => tag.name)).toEqual(
      expect.arrayContaining(['trust', 'compliance excellence']),
    );
    expect(result.coverImage?.url).toBe('https://cdn.example.com/blog/trust-centre-cover.png');
    expect(result.media).toHaveLength(1);

    const fetched = await getBlogPost(result.slug);
    expect(fetched.id).toBe(result.id);
    expect(fetched.category?.slug).toBe(category.slug);
    expect(fetched.tags).toHaveLength(2);
  });

  it('lists only published content by default and honours taxonomy filters', async () => {
    const operations = await createBlogCategory({ name: 'Operations' });
    const announcements = await createBlogCategory({ name: 'Announcements' });

    const published = await createBlogPost(
      {
        title: 'Operational excellence scorecards',
        content: '<p>Operational KPIs that align revenue and trust.</p>',
        status: 'published',
        categoryId: operations.id,
        tags: ['ops-intelligence'],
      },
      { actorId: author.id },
    );

    await createBlogPost(
      {
        title: 'Ops roadmap draft',
        content: '<p>Internal only draft.</p>',
        status: 'draft',
        categoryId: operations.id,
        tags: ['ops-intelligence'],
      },
      { actorId: author.id },
    );

    await createBlogPost(
      {
        title: 'Launch readiness update',
        content: '<p>Announcing new compliance workflows.</p>',
        status: 'published',
        categoryId: announcements.id,
        tags: ['launch'],
        featured: true,
      },
      { actorId: author.id },
    );

    const baseListing = await listBlogPosts();
    expect(baseListing.results).toHaveLength(2);
    expect(baseListing.results.map((item) => item.slug)).toEqual(
      expect.arrayContaining([published.slug, 'launch-readiness-update']),
    );

    const categoryFiltered = await listBlogPosts({ category: operations.slug });
    expect(categoryFiltered.results).toHaveLength(1);
    expect(categoryFiltered.results[0].slug).toBe(published.slug);

    const tagFiltered = await listBlogPosts({ tag: 'ops-intelligence' });
    expect(tagFiltered.results).toHaveLength(1);
    expect(tagFiltered.results[0].slug).toBe(published.slug);

    const includeDrafts = await listBlogPosts({ includeUnpublished: true, status: 'draft' });
    expect(includeDrafts.results).toHaveLength(1);
    expect(includeDrafts.results[0].status).toBe('draft');
  });

  it('ensures slugs remain unique across create and update flows', async () => {
    const first = await createBlogPost(
      {
        title: 'Enterprise analytics reveal',
        content: '<p>Original article.</p>',
      },
      { actorId: author.id },
    );

    const second = await createBlogPost(
      {
        title: 'Enterprise analytics reveal',
        content: '<p>Follow up article.</p>',
      },
      { actorId: author.id },
    );

    expect(first.slug).toBe('enterprise-analytics-reveal');
    expect(second.slug).not.toBe(first.slug);
    expect(second.slug).toMatch(/enterprise-analytics-reveal-\d+/);

    const updated = await updateBlogPost(
      second.id,
      {
        slug: first.slug,
        status: 'published',
        title: second.title,
        content: second.content,
      },
      { actorId: author.id },
    );

    expect(updated.slug).not.toBe(first.slug);
    expect(updated.slug).toMatch(/enterprise-analytics-reveal-\d+/);
  });

  it('prevents deleting taxonomy that is still referenced by content', async () => {
    const category = await createBlogCategory({ name: 'Security' });
    const tag = await createBlogTag({ name: 'zero-trust' });

    const post = await createBlogPost(
      {
        title: 'Zero trust fundamentals',
        content: '<p>Frameworks for perimeter-less enterprises.</p>',
        status: 'published',
        categoryId: category.id,
        tags: [{ id: tag.id }],
      },
      { actorId: author.id },
    );

    await expect(deleteBlogCategory(category.id)).rejects.toThrow(ValidationError);
    await expect(deleteBlogTag(tag.id)).rejects.toThrow(ValidationError);

    await deleteBlogPost(post.id);

    await expect(deleteBlogCategory(category.id)).resolves.toEqual({ success: true });
    await expect(deleteBlogTag(tag.id)).resolves.toEqual({ success: true });
  });
});
