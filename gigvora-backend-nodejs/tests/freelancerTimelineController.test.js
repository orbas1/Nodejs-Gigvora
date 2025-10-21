import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerTimelineWorkspace = jest.fn();
const saveTimelineSettings = jest.fn();
const createTimelineEntry = jest.fn();
const updateTimelineEntry = jest.fn();
const deleteTimelineEntry = jest.fn();
const createTimelinePost = jest.fn();
const updateTimelinePost = jest.fn();
const deleteTimelinePost = jest.fn();
const publishTimelinePost = jest.fn();
const upsertTimelinePostMetrics = jest.fn();

const serviceModule = new URL('../src/services/freelancerTimelineService.js', import.meta.url);

const serviceExports = {
  getFreelancerTimelineWorkspace,
  saveTimelineSettings,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  publishTimelinePost,
  upsertTimelinePostMetrics,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let ValidationError;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/freelancerTimelineController.js');
  ({ ValidationError, AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getFreelancerTimelineWorkspace.mockReset();
  saveTimelineSettings.mockReset();
  createTimelineEntry.mockReset();
  updateTimelineEntry.mockReset();
  deleteTimelineEntry.mockReset();
  createTimelinePost.mockReset();
  updateTimelinePost.mockReset();
  deleteTimelinePost.mockReset();
  publishTimelinePost.mockReset();
  upsertTimelinePostMetrics.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('freelancerTimelineController.getTimelineWorkspace', () => {
  it('requires authenticated access', async () => {
    const req = { params: { freelancerId: '8' }, user: null };
    await expect(controller.getTimelineWorkspace(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(getFreelancerTimelineWorkspace).not.toHaveBeenCalled();
  });

  it('returns workspace data for the owner', async () => {
    getFreelancerTimelineWorkspace.mockResolvedValue({ entries: [] });
    const req = { params: { freelancerId: '8' }, user: { id: '8' } };
    const res = createResponse();

    await controller.getTimelineWorkspace(req, res);

    expect(getFreelancerTimelineWorkspace).toHaveBeenCalledWith({ freelancerId: 8 });
    expect(res.json).toHaveBeenCalledWith({ entries: [] });
  });
});

describe('freelancerTimelineController.createTimelineEntry', () => {
  it('validates actor impersonation and payloads', async () => {
    createTimelineEntry.mockResolvedValue({ id: 3 });
    const req = {
      params: { freelancerId: '8' },
      headers: {},
      body: { title: 'New entry' },
      user: { id: '8' },
    };
    const res = createResponse();

    await controller.createTimelineEntryController(req, res);

    expect(createTimelineEntry).toHaveBeenCalledWith(8, { title: 'New entry' }, { actorId: 8 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 3 });
  });

  it('rejects spoofed actor headers without permission', async () => {
    const req = {
      params: { freelancerId: '8' },
      headers: { 'x-user-id': '9' },
      body: { title: 'Invalid' },
      user: { id: '8' },
    };

    await expect(controller.createTimelineEntryController(req, createResponse())).rejects.toThrow(
      AuthorizationError,
    );
    expect(createTimelineEntry).not.toHaveBeenCalled();
  });
});

describe('freelancerTimelineController.recordTimelinePostMetrics', () => {
  it('validates metrics payloads', async () => {
    upsertTimelinePostMetrics.mockResolvedValue({});
    const req = {
      params: { freelancerId: '8', postId: '4' },
      body: { summary: { views: 10 }, events: [{ type: 'view' }] },
      user: { id: '8' },
    };
    const res = createResponse();

    await controller.recordTimelinePostMetrics(req, res);

    expect(upsertTimelinePostMetrics).toHaveBeenCalledWith(8, 4, {
      summary: { views: 10 },
      events: [{ type: 'view' }],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('rejects invalid event payloads', async () => {
    const req = {
      params: { freelancerId: '8', postId: '4' },
      body: { events: 'view' },
      user: { id: '8' },
    };

    await expect(controller.recordTimelinePostMetrics(req, createResponse())).rejects.toThrow(ValidationError);
    expect(upsertTimelinePostMetrics).not.toHaveBeenCalled();
  });
});

describe('freelancerTimelineController.updateTimelinePost', () => {
  it('allows privileged managers to impersonate when permitted', async () => {
    updateTimelinePost.mockResolvedValue({ id: 4 });
    const req = {
      params: { freelancerId: '8', postId: '4' },
      headers: { 'x-user-id': '8' },
      body: { title: 'Updated' },
      user: { id: '99', permissions: ['timeline.manage.any', 'timeline.impersonate.any'] },
    };
    const res = createResponse();

    await controller.updateTimelinePostController(req, res);

    expect(updateTimelinePost).toHaveBeenCalledWith(8, 4, { title: 'Updated' }, { actorId: 8 });
    expect(res.json).toHaveBeenCalledWith({ id: 4 });
  });
});
