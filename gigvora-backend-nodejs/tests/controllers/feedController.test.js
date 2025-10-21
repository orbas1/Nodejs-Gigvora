import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const moderationModuleUrl = new URL('../../src/services/contentModerationService.js', import.meta.url);

const feedPostMock = {
  findAll: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn(),
};

const modelsMock = {
  FeedPost: feedPostMock,
  User: {},
  Profile: {},
};

const moderationMock = {
  enforceFeedPostPolicies: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, ...modelsMock }));
await jest.unstable_mockModule(moderationModuleUrl.pathname, () => ({ __esModule: true, ...moderationMock }));

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
  });

  it('lists feed posts ordered by recency', async () => {
    const posts = [
      createModel({ id: 1, title: 'Post', User: { firstName: 'Jane', Profile: { headline: 'Designer' } } }),
    ];
    const res = createResponse();
    feedPostMock.findAll.mockResolvedValueOnce(posts);

    await listFeed({}, res);

    expect(feedPostMock.findAll).toHaveBeenCalledWith({
      include: [{ model: modelsMock.User, include: [modelsMock.Profile] }],
      order: [['createdAt', 'DESC']],
    });
    expect(res.json).toHaveBeenCalledWith(expect.any(Array));
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
        attachments: [{ url: 'https://example.com/image.png', type: 'image' }],
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
        mediaAttachments: [{ url: 'https://example.com/image.png', type: 'image' }],
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
