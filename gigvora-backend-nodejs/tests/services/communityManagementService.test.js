import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ValidationError } from '../../src/utils/errors.js';

describe('communityManagementService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/index.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('requires a numeric userId', async () => {
    await jest.unstable_mockModule(modelsModulePath, () => ({
      Group: {},
      Page: {},
      GroupMembership: { findAll: jest.fn() },
      PageMembership: { findAll: jest.fn() },
      GroupInvite: { findAll: jest.fn() },
      GroupPost: { findAll: jest.fn() },
      PageInvite: { findAll: jest.fn() },
      PagePost: { findAll: jest.fn() },
      User: {},
    }));

    const { getCommunityManagementSnapshot } = await import('../../src/services/communityManagementService.js');

    await expect(getCommunityManagementSnapshot('')).rejects.toThrow(
      'A valid userId is required to load community management.',
    );
  });

  it('summarises group and page management metrics', async () => {
    const makeMembership = (plain) => ({
      ...plain,
      get: ({ plain: asPlain } = {}) => (asPlain ? { ...plain } : plain),
    });

    const groupMemberships = [
      makeMembership({
        id: 1,
        userId: 33,
        groupId: 71,
        role: 'owner',
        status: 'active',
        joinedAt: '2023-10-01T10:00:00Z',
        group: {
          id: 71,
          name: 'AI Builders',
          slug: 'ai-builders',
          description: 'Weekly build circle',
          visibility: 'private',
          memberPolicy: 'invite',
          avatarColor: '#123456',
          bannerImageUrl: null,
          settings: { timezone: 'UTC' },
          metadata: { cohort: '2024' },
        },
      }),
    ];

    const pageMemberships = [
      makeMembership({
        id: 2,
        userId: 33,
        pageId: 88,
        role: 'admin',
        status: 'active',
        joinedAt: '2023-09-05T12:00:00Z',
        page: {
          id: 88,
          name: 'Gigvora Studio',
          slug: 'gigvora-studio',
          description: 'Studio showcase',
          category: 'agency',
          websiteUrl: 'https://gigvora.com/studio',
          contactEmail: 'studio@gigvora.com',
          visibility: 'public',
          avatarColor: '#654321',
          bannerImageUrl: null,
          callToAction: 'Book intro call',
          settings: { timezone: 'Europe/Berlin' },
          metadata: { plan: 'pro' },
        },
      }),
    ];

    const makeInvite = (plain) => ({
      ...plain,
      get: ({ plain: asPlain } = {}) => (asPlain ? { ...plain } : plain),
    });

    const invites = [
      makeInvite({
        id: 301,
        groupId: 71,
        email: 'alex@example.com',
        role: 'member',
        status: 'pending',
        token: 'INV-123',
        invitedBy: { id: 33, firstName: 'Jamie', lastName: 'Lee', email: 'jamie@gigvora.com' },
        createdAt: '2023-12-10T08:00:00Z',
        updatedAt: '2023-12-10T08:00:00Z',
      }),
    ];

    const makePost = (plain) => ({
      ...plain,
      get: ({ plain: asPlain } = {}) => (asPlain ? { ...plain } : plain),
    });

    const posts = [
      makePost({
        id: 401,
        groupId: 71,
        pageId: null,
        title: 'Sprint kickoff',
        slug: 'sprint-kickoff',
        summary: 'Sprint agenda',
        status: 'published',
        visibility: 'members',
        scheduledAt: null,
        publishedAt: '2023-12-12T09:00:00Z',
        createdAt: '2023-12-11T09:00:00Z',
        updatedAt: '2023-12-12T09:05:00Z',
      }),
    ];

    const pageInvites = [
      makeInvite({
        id: 302,
        pageId: 88,
        email: 'casey@example.com',
        role: 'editor',
        status: 'pending',
        token: 'INV-222',
        invitedBy: { id: 33, firstName: 'Jamie', lastName: 'Lee', email: 'jamie@gigvora.com' },
        createdAt: '2023-12-08T10:00:00Z',
        updatedAt: '2023-12-08T10:00:00Z',
      }),
    ];

    const pagePosts = [
      makePost({
        id: 402,
        pageId: 88,
        title: 'Portfolio refresh',
        slug: 'portfolio-refresh',
        summary: 'New case studies',
        status: 'draft',
        visibility: 'public',
        scheduledAt: null,
        publishedAt: null,
        createdAt: '2023-12-09T11:00:00Z',
        updatedAt: '2023-12-09T11:30:00Z',
      }),
    ];

    await jest.unstable_mockModule(modelsModulePath, () => ({
      Group: {},
      Page: {},
      GroupMembership: { findAll: jest.fn().mockResolvedValue(groupMemberships) },
      PageMembership: { findAll: jest.fn().mockResolvedValue(pageMemberships) },
      GroupInvite: { findAll: jest.fn().mockResolvedValue(invites) },
      GroupPost: { findAll: jest.fn().mockResolvedValue(posts) },
      PageInvite: { findAll: jest.fn().mockResolvedValue(pageInvites) },
      PagePost: { findAll: jest.fn().mockResolvedValue(pagePosts) },
      User: {},
    }));

    const { getCommunityManagementSnapshot } = await import('../../src/services/communityManagementService.js');

    const snapshot = await getCommunityManagementSnapshot(33);

    expect(snapshot.groups.stats).toEqual({ total: 1, managed: 1, pendingInvites: 1 });
    expect(snapshot.pages.stats.pendingInvites).toBe(1);
    expect(snapshot.groups.items[0].metrics.postsPublished).toBe(1);
    expect(snapshot.pages.items[0].posts[0].status).toBe('draft');
  });
});
