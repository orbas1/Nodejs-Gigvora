import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ModerationError } from '../../utils/errors.js';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';
const moderationModuleUrl = new URL('../../services/contentModerationService.js', import.meta.url);
const suggestionModuleUrl = new URL('../../services/feedSuggestionService.js', import.meta.url);

const FeedPostMock = {
  findAll: jest.fn(),
  count: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
};

const FeedCommentMock = {
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
};

const FeedReactionMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

const FeedShareMock = {
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
};

const UserMock = {
  findByPk: jest.fn(),
};

const ProfileMock = {
  findAll: jest.fn().mockResolvedValue([]),
};
const ConnectionMock = {
  findAll: jest.fn().mockResolvedValue([]),
};

const enforceFeedPostPoliciesMock = jest
  .fn()
  .mockImplementation((payload) => ({ ...payload, attachments: payload.attachments ?? [], signals: [] }));
const enforceFeedCommentPoliciesMock = jest
  .fn()
  .mockImplementation(({ content }) => ({ content, signals: [] }));

jest.unstable_mockModule(moderationModuleUrl.pathname, () => ({
  enforceFeedPostPolicies: enforceFeedPostPoliciesMock,
  enforceFeedCommentPolicies: enforceFeedCommentPoliciesMock,
}));

const getFeedSuggestionsMock = jest.fn().mockResolvedValue({
  generatedAt: new Date().toISOString(),
  connections: [],
  groups: [],
  liveMoments: [],
});
const invalidateFeedSuggestionsMock = jest.fn();

jest.unstable_mockModule(suggestionModuleUrl.pathname, () => ({
  getFeedSuggestions: getFeedSuggestionsMock,
  invalidateFeedSuggestions: invalidateFeedSuggestionsMock,
}));

let listFeed;
let createPost;
let createComment;
let toggleReaction;
let sharePost;

async function importController() {
  const { __setModelStubs } = await import(modelsModuleSpecifier);
  __setModelStubs({
    FeedPost: FeedPostMock,
    FeedComment: FeedCommentMock,
    FeedReaction: FeedReactionMock,
    FeedShare: FeedShareMock,
    User: UserMock,
    Profile: ProfileMock,
    Connection: ConnectionMock,
  });
  const { appCache } = await import('../../utils/cache.js');
  appCache.flushByPrefix?.('feed:suggestions:');
  return import('../feedController.js');
}

function resetMocks() {
  for (const mock of Object.values(FeedPostMock)) {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  }
  for (const mock of Object.values(FeedCommentMock)) {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  }
  for (const mock of Object.values(FeedReactionMock)) {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  }
  for (const mock of Object.values(FeedShareMock)) {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  }
  FeedShareMock.findAll.mockResolvedValue([]);
  FeedShareMock.count.mockResolvedValue(0);
  FeedShareMock.create.mockResolvedValue({});
  UserMock.findByPk.mockReset();
  ProfileMock.findAll.mockReset();
  ConnectionMock.findAll.mockReset();
  enforceFeedPostPoliciesMock.mockReset().mockImplementation((payload) => ({
    ...payload,
    attachments: payload.attachments ?? [],
    signals: [],
  }));
  enforceFeedCommentPoliciesMock.mockReset().mockImplementation(({ content }) => ({ content, signals: [] }));
  getFeedSuggestionsMock.mockReset().mockResolvedValue({
    generatedAt: new Date().toISOString(),
    connections: [],
    groups: [],
    liveMoments: [],
  });
  invalidateFeedSuggestionsMock.mockReset();
}

beforeEach(async () => {
  jest.resetModules();
  resetMocks();
  const controller = await importController();
  listFeed = controller.listFeed;
  createPost = controller.createPost;
  createComment = controller.createComment;
  toggleReaction = controller.toggleReaction;
  sharePost = controller.sharePost;
});

afterEach(() => {
  jest.clearAllMocks();
});

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('feedController', () => {
  it('lists feed posts with aggregated metrics', async () => {
    const now = new Date().toISOString();
    FeedPostMock.findAll.mockResolvedValue([
      {
        id: 10,
        toJSON: () => ({
          id: 10,
          userId: 1,
          content: 'Welcome to the timeline',
          summary: null,
          title: null,
          type: 'update',
          link: null,
          mediaAttachments: [],
          visibility: 'public',
          createdAt: now,
          updatedAt: now,
          publishedAt: now,
          User: {
            firstName: 'Ava',
            lastName: 'Founder',
            Profile: { headline: 'CEO', avatarSeed: 'ava' },
          },
        }),
      },
    ]);
    FeedPostMock.count.mockResolvedValue(1);
    FeedReactionMock.findAll.mockResolvedValue([{ postId: 10, reactionType: 'like', count: '3' }]);
    FeedCommentMock.findAll.mockResolvedValue([{ postId: 10, count: '2' }]);
    FeedShareMock.findAll.mockResolvedValue([{ postId: 10, count: '1' }]);

    const req = { query: {} };
    const res = createResponse();

    await listFeed(req, res);

    expect(res.json).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          id: 10,
          reactions: expect.objectContaining({ likes: 3 }),
          metrics: expect.objectContaining({ comments: 2, shares: 1 }),
        }),
      ],
      nextCursor: null,
      nextPage: null,
      hasMore: false,
      total: 1,
      suggestions: expect.objectContaining({
        connections: expect.any(Array),
        groups: expect.any(Array),
        liveMoments: expect.any(Array),
      }),
    });
  });

  it('creates mentorship updates with sanitised payloads', async () => {
    const now = new Date().toISOString();
    FeedPostMock.create.mockResolvedValue({ id: 501 });
    FeedPostMock.findByPk.mockResolvedValue({
      toJSON: () => ({
        id: 501,
        userId: 51,
        content: 'Launching mentorship office hours!',
        summary: 'Launching mentorship office hours!',
        type: 'mentorship',
        visibility: 'public',
        link: 'https://mentors.gigvora.test/sprint',
        mediaAttachments: [
          {
            id: 'attachment-1',
            url: 'https://cdn.gigvora.test/mentorship/sprint.png',
            type: 'image',
            alt: 'Sprint Outline',
          },
        ],
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
        User: {
          firstName: 'Jordan',
          lastName: 'Mentor',
          Profile: { headline: 'Mentorship Lead', avatarSeed: 'jordan' },
        },
      }),
    });
    UserMock.findByPk.mockResolvedValue({
      id: 51,
      firstName: 'Jordan',
      lastName: 'Mentor',
      email: 'jordan@gigvora.com',
      title: 'Mentorship Lead',
      Profile: { headline: 'Mentorship Lead', bio: 'Guides cohorts', avatarSeed: 'jordan' },
    });

    const req = {
      body: {
        userId: '51',
        type: 'mentorship',
        content: '  Launching mentorship office hours!  ',
        summary: 'Launching mentorship office hours!',
        link: ' https://mentors.gigvora.test/sprint ',
        mediaAttachments: [
          { url: 'https://cdn.gigvora.test/mentorship/sprint.png', type: 'IMAGE', alt: ' Sprint Outline ' },
        ],
      },
      user: { id: 51 },
      headers: { 'x-user-role': 'mentor' },
    };
    const res = createResponse();

    await createPost(req, res);

    expect(FeedPostMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 51,
        type: 'mentorship',
        mediaAttachments: [
          {
            id: 'attachment-1',
            url: 'https://cdn.gigvora.test/mentorship/sprint.png',
            type: 'image',
            alt: 'Sprint Outline',
          },
        ],
        link: 'https://mentors.gigvora.test/sprint',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 501,
        type: 'mentorship',
        mediaAttachments: [
          expect.objectContaining({ url: 'https://cdn.gigvora.test/mentorship/sprint.png', alt: 'Sprint Outline' }),
        ],
      }),
    );
  });

  it('creates a comment with author snapshot and sanitised message', async () => {
    FeedPostMock.findByPk.mockResolvedValue({ id: 42 });
    UserMock.findByPk.mockResolvedValue({
      id: 7,
      firstName: 'Jane',
      lastName: 'Ops',
      email: 'jane.ops@example.com',
      title: 'Operations Lead',
      Profile: { headline: 'Operations Lead', bio: 'Keeps the machine humming', avatarSeed: 'jane-ops' },
    });
    FeedCommentMock.create.mockImplementation(async (payload) => ({ id: 99, ...payload }));
    FeedCommentMock.findByPk.mockResolvedValue({
      toJSON: () => ({
        id: 99,
        postId: 42,
        body: 'Closing the loop',
        authorName: 'Jane Ops',
        authorHeadline: 'Operations Lead',
        authorAvatarSeed: 'jane-ops',
        createdAt: new Date().toISOString(),
        author: {
          firstName: 'Jane',
          lastName: 'Ops',
          Profile: { headline: 'Operations Lead', avatarSeed: 'jane-ops' },
        },
      }),
    });

    const req = {
      params: { postId: '42' },
      body: { message: '  Closing the loop  ' },
      user: { id: 7 },
      headers: { 'x-user-role': 'user' },
    };
    const res = createResponse();

    await createComment(req, res);

    expect(FeedCommentMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 42,
        userId: 7,
        body: 'Closing the loop',
        authorName: 'Jane Ops',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 99,
        message: 'Closing the loop',
        author: 'Jane Ops',
      }),
    );
  });

  it('records a share event with compliance metadata', async () => {
    const now = new Date();
    FeedPostMock.findByPk.mockResolvedValue({ id: 77 });
    UserMock.findByPk.mockResolvedValue({
      id: 15,
      firstName: 'Noah',
      lastName: 'Agency',
      email: 'noah@gigvora.com',
      Profile: { headline: 'Agency Partner', avatarSeed: 'noah' },
    });
    FeedShareMock.create.mockResolvedValue({
      id: 5,
      postId: 77,
      userId: 15,
      audience: 'internal',
      channel: 'email',
      message: 'Rallying the agency partners around this launch.',
      link: 'https://gigvora.test/feed/77',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      scheduledFor: null,
      notifyList: null,
      complianceAcknowledged: true,
    });
    FeedShareMock.count.mockResolvedValue(3);

    const req = {
      params: { postId: '77' },
      body: {
        audience: 'internal',
        channel: 'email',
        message: '  Rallying the agency partners around this launch.  ',
        link: 'https://gigvora.test/feed/77',
      },
      user: { id: 15 },
      headers: { 'x-user-role': 'agency' },
    };
    const res = createResponse();

    await sharePost(req, res);

    expect(FeedShareMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 77,
        userId: 15,
        audience: 'internal',
        channel: 'email',
        message: 'Rallying the agency partners around this launch.',
        link: 'https://gigvora.test/feed/77',
        complianceAcknowledged: true,
        scheduledFor: null,
        notifyList: null,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 77,
        metrics: { shares: 3 },
        share: expect.objectContaining({
          channel: 'email',
          audience: 'internal',
          scheduledFor: null,
          notifyList: null,
          complianceAcknowledged: true,
        }),
      }),
    );
  });

  it('requires compliance acknowledgement for external shares', async () => {
    FeedPostMock.findByPk.mockResolvedValue({ id: 33 });
    UserMock.findByPk.mockResolvedValue({
      id: 8,
      firstName: 'Taylor',
      lastName: 'Ops',
      email: 'taylor@gigvora.com',
      Profile: { headline: 'Ops', avatarSeed: 'taylor' },
    });

    const req = {
      params: { postId: '33' },
      body: {
        audience: 'external',
        channel: 'copy',
        message: 'Sharing this externally without ack.',
        link: 'https://gigvora.test/feed/33',
      },
      user: { id: 8 },
      headers: { 'x-user-role': 'member' },
    };
    const res = createResponse();

    await expect(sharePost(req, res)).rejects.toThrow('Compliance acknowledgement is required for external shares.');
  });

  it('persists scheduling metadata and notify list', async () => {
    const future = new Date(Date.now() + 3600_000);
    FeedPostMock.findByPk.mockResolvedValue({ id: 88 });
    UserMock.findByPk.mockResolvedValue({
      id: 21,
      firstName: 'Morgan',
      lastName: 'Strategy',
      email: 'morgan@gigvora.com',
      Profile: { headline: 'Strategy Lead', avatarSeed: 'morgan' },
    });
    FeedShareMock.create.mockResolvedValue({
      id: 9,
      postId: 88,
      userId: 21,
      audience: 'external',
      channel: 'secure',
      message: 'Briefing exec stakeholders.',
      link: 'https://gigvora.test/feed/88',
      scheduledFor: future,
      notifyList: ['ops@gigvora.com'],
      complianceAcknowledged: true,
      createdAt: future.toISOString(),
      updatedAt: future.toISOString(),
    });
    FeedShareMock.count.mockResolvedValue(5);

    const req = {
      params: { postId: '88' },
      body: {
        audience: 'external',
        channel: 'secure',
        message: 'Briefing exec stakeholders.',
        link: 'https://gigvora.test/feed/88',
        scheduledFor: future.toISOString(),
        notifyList: 'ops@gigvora.com, leadership@gigvora.com',
        complianceAcknowledged: true,
      },
      user: { id: 21 },
      headers: { 'x-user-role': 'mentor' },
    };
    const res = createResponse();

    await sharePost(req, res);

    expect(FeedShareMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: 88,
        channel: 'secure',
        scheduledFor: expect.any(Date),
        notifyList: ['ops@gigvora.com', 'leadership@gigvora.com'],
        complianceAcknowledged: true,
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        share: expect.objectContaining({
          audience: 'external',
          notifyList: ['ops@gigvora.com'],
          scheduledFor: future.toISOString(),
        }),
      }),
    );
  });

  it('toggles a reaction and returns an updated summary', async () => {
    FeedPostMock.findByPk.mockResolvedValue({ id: 55 });
    FeedReactionMock.findOne.mockResolvedValue(null);
    FeedReactionMock.create.mockResolvedValue({ id: 1 });
    FeedReactionMock.findAll.mockResolvedValue([{ reactionType: 'like', count: '1' }]);

    const req = {
      params: { postId: '55' },
      body: { reaction: 'like', active: true },
      user: { id: 9 },
      headers: { 'x-user-role': 'user' },
    };
    const res = createResponse();

    await toggleReaction(req, res);

    expect(FeedReactionMock.create).toHaveBeenCalledWith({
      postId: 55,
      userId: 9,
      reactionType: 'like',
      active: true,
    });
    expect(res.json).toHaveBeenCalledWith({
      postId: 55,
      reaction: 'like',
      active: true,
      summary: { likes: 1 },
    });
  });

  it('enriches the feed response with suggested connections and signal payload', async () => {
    FeedPostMock.findAll.mockResolvedValue([]);
    FeedPostMock.count.mockResolvedValue(0);
    FeedReactionMock.findAll.mockResolvedValue([]);
    FeedCommentMock.findAll.mockResolvedValue([]);
    getFeedSuggestionsMock.mockResolvedValue({
      generatedAt: '2024-05-01T12:00:00.000Z',
      connections: [
        {
          id: 'user-5',
          userId: 5,
          name: 'Alex River',
          headline: 'Product Lead',
          mutualConnections: 3,
          reason: '3 mutual connections',
        },
      ],
      groups: [
        {
          id: 77,
          name: 'Future of Work Collective',
          members: 2140,
          focus: ['future of work'],
        },
      ],
      liveMoments: [
        { id: 'signal-1', title: 'Live moment', tag: 'Update', icon: '⚡️', timestamp: '2024-05-01T11:59:00.000Z' },
      ],
    });

    const req = { query: {}, user: { id: 42 } };
    const res = createResponse();

    await listFeed(req, res);

    expect(getFeedSuggestionsMock).toHaveBeenCalledWith(
      { id: 42 },
      expect.objectContaining({
        connectionLimit: expect.any(Number),
        groupLimit: expect.any(Number),
        signalLimit: expect.any(Number),
        recentFeedPosts: expect.any(Array),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
        total: 0,
        suggestions: expect.objectContaining({
          connections: expect.arrayContaining([
            expect.objectContaining({ userId: 5, reason: '3 mutual connections' }),
          ]),
          groups: expect.arrayContaining([expect.objectContaining({ id: 77 })]),
          liveMoments: expect.arrayContaining([expect.objectContaining({ id: 'signal-1' })]),
        }),
      }),
    );
  });

  it('rejects comment creation when moderation blocks the message', async () => {
    FeedPostMock.findByPk.mockResolvedValue({ id: 99 });
    enforceFeedCommentPoliciesMock.mockImplementation(() => {
      throw new ModerationError('comment blocked');
    });

    const req = {
      params: { postId: '99' },
      body: { message: 'spam content' },
      user: { id: 21 },
      headers: { 'x-user-role': 'user' },
    };
    const res = createResponse();

    await expect(createComment(req, res)).rejects.toThrow('comment blocked');
    expect(FeedCommentMock.create).not.toHaveBeenCalled();
  });
});
