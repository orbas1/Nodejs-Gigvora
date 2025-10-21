import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const actualZodPath = fileURLToPath(new URL('../../node_modules/zod/index.js', import.meta.url));
jest.unstable_mockModule('zod', () => import(actualZodPath));

const constantsModulePath = fileURLToPath(new URL('../../src/models/constants/index.js', import.meta.url));
const modelsModulePath = fileURLToPath(new URL('../../src/models/index.js', import.meta.url));
const controllerModulePath = fileURLToPath(new URL('../../src/controllers/userPageController.js', import.meta.url));

jest.unstable_mockModule(constantsModulePath, () => ({
  __esModule: true,
  PAGE_VISIBILITIES: ['public', 'members', 'private'],
  PAGE_MEMBER_ROLES: ['owner', 'admin', 'editor', 'moderator', 'member'],
  PAGE_MEMBER_STATUSES: ['pending', 'active', 'suspended'],
  PAGE_POST_STATUSES: ['draft', 'scheduled', 'published', 'archived'],
  PAGE_POST_VISIBILITIES: ['public', 'members', 'private'],
  COMMUNITY_INVITE_STATUSES: ['pending', 'accepted', 'revoked'],
}));

jest.unstable_mockModule(modelsModulePath, () => ({ __esModule: true }));

const indexHandler = jest.fn((req, res) => res.json({ pages: [] }));
const managedHandler = jest.fn((req, res) => res.json({ managed: [] }));
const storeHandler = jest.fn((req, res) => res.status(201).json({ id: 1 }));
const updateHandler = jest.fn((req, res) => res.json({ id: Number(req.params.pageId) }));
const membershipsHandler = jest.fn((req, res) => res.json({ memberships: [] }));
const updateMembershipHandler = jest.fn((req, res) => res.json({ membership: true }));
const invitesHandler = jest.fn((req, res) => res.json({ invites: [] }));
const createInviteHandler = jest.fn((req, res) => res.status(201).json({ invite: true }));
const removeInviteHandler = jest.fn((req, res) => res.status(204).send());
const postsHandler = jest.fn((req, res) => res.json({ posts: [] }));
const createPostHandler = jest.fn((req, res) => res.status(201).json({ post: true }));
const updatePostHandler = jest.fn((req, res) => res.json({ post: true }));
const deletePostHandler = jest.fn((req, res) => res.status(204).send());

jest.unstable_mockModule(controllerModulePath, () => ({
  __esModule: true,
  index: indexHandler,
  managed: managedHandler,
  store: storeHandler,
  update: updateHandler,
  memberships: membershipsHandler,
  updateMembership: updateMembershipHandler,
  invites: invitesHandler,
  createInvite: createInviteHandler,
  removeInvite: removeInviteHandler,
  posts: postsHandler,
  createPost: createPostHandler,
  updatePost: updatePostHandler,
  deletePost: deletePostHandler,
}));

const { default: userPageRoutes } = await import('../../src/routes/userPageRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/users/:id/pages', userPageRoutes);
  app.use((err, req, res, next) => {
    if (err?.status) {
      res.status(err.status).json({ message: err.message, details: err.details ?? err.issues });
      return;
    }
    res.status(500).json({ message: err?.message ?? 'Internal error' });
  });
  return app;
};

describe('userPageRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses query parameters when listing pages', async () => {
    const app = buildApp();
    const response = await request(app).get('/users/42/pages?includeMemberships=true');
    expect(response.status).toBe(200);
    expect(indexHandler).toHaveBeenCalledTimes(1);
    const [req] = indexHandler.mock.calls[0];
    expect(req.params.id).toBe(42);
    expect(req.query.includeMemberships).toBe(true);
  });

  it('rejects invalid listing query parameters', async () => {
    const app = buildApp();
    const response = await request(app).get('/users/42/pages?includeMemberships=maybe');
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Request validation failed.');
    expect(indexHandler).not.toHaveBeenCalled();
  });

  it('validates page creation payloads', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/users/12/pages')
      .send({ name: 'My Community', visibility: 'public' });
    expect(response.status).toBe(201);
    expect(storeHandler).toHaveBeenCalledTimes(1);
    const [req] = storeHandler.mock.calls[0];
    expect(req.params.id).toBe(12);
    expect(req.body.name).toBe('My Community');
  });

  it('returns validation error for invalid page creation payloads', async () => {
    const app = buildApp();
    const response = await request(app).post('/users/12/pages').send({ visibility: 'public' });
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Request validation failed.');
    expect(storeHandler).not.toHaveBeenCalled();
  });

  it('validates post update payloads', async () => {
    const app = buildApp();
    const response = await request(app)
      .patch('/users/7/pages/3/posts/10')
      .send({ title: 'Updated Title', content: 'Updated content' });
    expect(response.status).toBe(200);
    expect(updatePostHandler).toHaveBeenCalledTimes(1);
    const [req] = updatePostHandler.mock.calls[0];
    expect(req.params.postId).toBe(10);
    expect(req.body.title).toBe('Updated Title');
  });

  it('rejects invalid post update payloads', async () => {
    const app = buildApp();
    const response = await request(app).patch('/users/7/pages/3/posts/10').send({ scheduledAt: 'not-a-date' });
    expect(response.status).toBe(422);
    expect(updatePostHandler).not.toHaveBeenCalled();
  });
});
