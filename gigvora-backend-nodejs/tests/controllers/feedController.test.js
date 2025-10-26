import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const moderationModuleUrl = new URL('../../src/services/contentModerationService.js', import.meta.url);
const suggestionModuleUrl = new URL('../../src/services/feedSuggestionService.js', import.meta.url);

const feedPostMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn(),
};

const feedCommentMock = {
  findAll: jest.fn(),
};

const feedReactionMock = {
  findAll: jest.fn(),
};

const userModelMock = {
  findByPk: jest.fn(),
};

const profileModelMock = {};

const modelsMock = {
  FeedPost: feedPostMock,
  FeedComment: feedCommentMock,
  FeedReaction: feedReactionMock,
  User: userModelMock,
  Profile: profileModelMock,
};

const moderationMock = {
  enforceFeedPostPolicies: jest.fn(),
  enforceFeedCommentPolicies: jest.fn(),
};

const suggestionMock = {
  getFeedSuggestions: jest.fn().mockResolvedValue({
    generatedAt: new Date().toISOString(),
    connections: [],
    groups: [],
    liveMoments: [],
  }),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, ...modelsMock }));
await jest.unstable_mockModule(moderationModuleUrl.pathname, () => ({ __esModule: true, ...moderationMock }));
await jest.unstable_mockModule(suggestionModuleUrl.pathname, () => ({ __esModule: true, ...suggestionMock }));

const controllerModule = await import('../../src/controllers/feedController.js');
const { listFeed, createPost } = controllerModule;
const { AuthorizationError, ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function createModel(data) {
  return {
    toJSON: () => ({ ...data }),
  };
}

describe('feedController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    moderationMock.enforceFeedPostPolicies.mockReset();
    moderationMock.enforceFeedCommentPolicies.mockReset();
    userModelMock.findByPk.mockReset();
    suggestionMock.getFeedSuggestions.mockClear().mockResolvedValue({
      generatedAt: new Date().toISOString(),
      connections: [],
      groups: [],
      liveMoments: [],
    });
    moderationMock.enforceFeedPostPolicies.mockImplementation((payload) => ({
      ...payload,
      attachments: payload.attachments ?? [],
      signals: [],
    }));
    moderationMock.enforceFeedCommentPolicies.mockImplementation(({ content }) => ({
      content,
      signals: [],
    }));
  });

  it('lists feed posts ordered by recency', async () => {
    const posts = [
      createModel({ id: 1, title: 'Post', User: { firstName: 'Jane', Profile: { headline: 'Designer' } } }),
    ];
    const res = createResponse();
    feedPostMock.findAll.mockResolvedValueOnce(posts);
    feedPostMock.count.mockResolvedValueOnce(1);
    feedReactionMock.findAll.mockResolvedValueOnce([]);
    feedCommentMock.findAll.mockResolvedValueOnce([]);

    await listFeed({ query: {} }, res);

    expect(feedPostMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [expect.objectContaining({ model: modelsMock.User })],
        order: expect.any(Array),
        limit: expect.any(Number),
      }),
    );
    expect(suggestionMock.getFeedSuggestions).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.any(Array),
        total: 1,
        suggestions: expect.objectContaining({
          connections: expect.any(Array),
          groups: expect.any(Array),
          liveMoments: expect.any(Array),
        }),
      }),
    );
  });

  it('creates a post with sanitised payloads and moderation context', async () => {
    const req = {
      user: { id: 7, role: 'freelancer' },
      headers: {},
      body: {
        content: '  Building something great  ',
        visibility: 'public',
        type: 'update',
        link: 'https://example.com/blog',
        mediaAttachments: ['https://example.com/image.png'],
        title: ' Launch update ',
        summary: ' Quick summary ',
        imageUrl: 'https://example.com/cover.png',
        source: ' marketing team ',
      },
    };
    const res = createResponse();
    moderationMock.enforceFeedPostPolicies.mockReturnValue({
      content: 'Building something great',
      summary: 'Quick summary',
      title: 'Launch update',
      link: 'https://example.com/blog',
      attachments: [{ url: 'https://example.com/image.png', type: 'image' }],
      signals: [{ type: 'repetitive_content' }],
    });
    moderationMock.enforceFeedCommentPolicies.mockReturnValue({ content: 'Closing the loop', signals: [] });
    userModelMock.findByPk.mockResolvedValue({
      id: 7,
      firstName: 'Jamie',
      lastName: 'Smith',
      email: 'jamie@example.com',
      Profile: { headline: 'Founder', avatarSeed: 'jamie-smith' },
    });
    feedPostMock.create.mockResolvedValueOnce({ id: 42 });
    feedPostMock.findByPk.mockResolvedValueOnce(
      createModel({
        id: 42,
        userId: 7,
        content: 'Building something great',
        visibility: 'public',
        type: 'update',
        link: 'https://example.com/blog',
        User: { firstName: 'Jamie', lastName: 'Smith', Profile: { headline: 'Founder' } },
      }),
    );

    await createPost(req, res);

    expect(moderationMock.enforceFeedPostPolicies).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Building something great',
        summary: 'Quick summary',
        attachments: expect.arrayContaining([
          expect.objectContaining({ url: 'https://example.com/image.png', type: 'image' }),
        ]),
      }),
      { role: 'freelancer' },
    );
    expect(feedPostMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        visibility: 'public',
        type: 'update',
        imageUrl: 'https://example.com/cover.png',
        source: 'marketing team',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        moderation: { signals: [{ type: 'repetitive_content' }] },
      }),
    );
  });

  it('prevents members from posting on behalf of another user', async () => {
    const req = { user: { id: 5, role: 'freelancer' }, headers: {}, body: { userId: 7, content: 'Hello' } };
    const res = createResponse();

    await expect(createPost(req, res)).rejects.toThrow(AuthorizationError);
    expect(feedPostMock.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported visibility values', async () => {
    const req = { user: { id: 5, role: 'freelancer' }, headers: {}, body: { content: 'Hello', visibility: 'private' } };
    const res = createResponse();

    await expect(createPost(req, res)).rejects.toThrow(ValidationError);
  });
});
