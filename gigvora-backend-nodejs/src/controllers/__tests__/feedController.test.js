import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ModerationError } from '../../utils/errors.js';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';
const moderationModuleUrl = new URL('../../services/contentModerationService.js', import.meta.url);

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

let listFeed;
let createComment;
let toggleReaction;

async function importController() {
  const { __setModelStubs } = await import(modelsModuleSpecifier);
  __setModelStubs({
    FeedPost: FeedPostMock,
    FeedComment: FeedCommentMock,
    FeedReaction: FeedReactionMock,
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
  UserMock.findByPk.mockReset();
  ProfileMock.findAll.mockReset();
  ConnectionMock.findAll.mockReset();
  enforceFeedPostPoliciesMock.mockReset().mockImplementation((payload) => ({
    ...payload,
    attachments: payload.attachments ?? [],
    signals: [],
  }));
  enforceFeedCommentPoliciesMock.mockReset().mockImplementation(({ content }) => ({ content, signals: [] }));
}

beforeEach(async () => {
  jest.resetModules();
  resetMocks();
  const controller = await importController();
  listFeed = controller.listFeed;
  createComment = controller.createComment;
  toggleReaction = controller.toggleReaction;
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

    const req = { query: {} };
    const res = createResponse();

    await listFeed(req, res);

    expect(res.json).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          id: 10,
          reactions: expect.objectContaining({ likes: 3 }),
          metrics: expect.objectContaining({ comments: 2 }),
        }),
      ],
      nextCursor: null,
      nextPage: null,
      hasMore: false,
      total: 1,
      suggestions: [],
    });
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

  it('enriches the feed response with suggested connections and mutual reasons', async () => {
    FeedPostMock.findAll.mockResolvedValue([]);
    FeedPostMock.count.mockResolvedValue(0);
    FeedReactionMock.findAll.mockResolvedValue([]);
    FeedCommentMock.findAll.mockResolvedValue([]);
    ConnectionMock.findAll
      .mockResolvedValueOnce([
        { requesterId: 42, addresseeId: 7 },
        { requesterId: 7, addresseeId: 42 },
      ])
      .mockResolvedValueOnce([{ requesterId: 5, addresseeId: 7 }]);
    ProfileMock.findAll.mockResolvedValue([
      {
        userId: 5,
        headline: 'Product Lead',
        location: 'Berlin',
        avatarUrl: null,
        avatarSeed: 'alex',
        followersCount: 4,
        trustScore: 87,
        updatedAt: new Date().toISOString(),
        User: {
          id: 5,
          firstName: 'Alex',
          lastName: 'River',
          email: 'alex.river@example.com',
          userType: 'member',
          primaryDashboard: 'member',
        },
      },
    ]);

    const req = { query: {}, user: { id: 42 } };
    const res = createResponse();

    await listFeed(req, res);

    expect(ConnectionMock.findAll).toHaveBeenCalled();
    expect(ProfileMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: expect.any(Number),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
        total: 0,
        suggestions: [
          expect.objectContaining({
            userId: 5,
            reason: expect.stringMatching(/mutual|followers/),
          }),
        ],
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
