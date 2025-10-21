import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getJobApplicationWorkspace = jest.fn();
const createJobApplication = jest.fn();
const updateJobApplication = jest.fn();
const archiveJobApplication = jest.fn();
const createJobApplicationInterview = jest.fn();
const updateJobApplicationInterview = jest.fn();
const deleteJobApplicationInterview = jest.fn();
const createJobApplicationFavourite = jest.fn();
const updateJobApplicationFavourite = jest.fn();
const deleteJobApplicationFavourite = jest.fn();
const createJobApplicationResponse = jest.fn();
const updateJobApplicationResponse = jest.fn();
const deleteJobApplicationResponse = jest.fn();

const serviceModule = new URL('../src/services/jobApplicationService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  getJobApplicationWorkspace,
  createJobApplication,
  updateJobApplication,
  archiveJobApplication,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationFavourite,
  updateJobApplicationFavourite,
  deleteJobApplicationFavourite,
  createJobApplicationResponse,
  updateJobApplicationResponse,
  deleteJobApplicationResponse,
}));

let workspace;
let updateApplication;
let storeInterview;
let destroyFavourite;
let destroyResponse;
let ValidationError;

beforeAll(async () => {
  ({ workspace, updateApplication, storeInterview, destroyFavourite, destroyResponse } = await import(
    '../src/controllers/jobApplicationController.js'
  ));
  ({ ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getJobApplicationWorkspace.mockReset();
  createJobApplication.mockReset();
  updateJobApplication.mockReset();
  archiveJobApplication.mockReset();
  createJobApplicationInterview.mockReset();
  updateJobApplicationInterview.mockReset();
  deleteJobApplicationInterview.mockReset();
  createJobApplicationFavourite.mockReset();
  updateJobApplicationFavourite.mockReset();
  deleteJobApplicationFavourite.mockReset();
  createJobApplicationResponse.mockReset();
  updateJobApplicationResponse.mockReset();
  deleteJobApplicationResponse.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('jobApplicationController.workspace', () => {
  it('parses limit filters and resolves the owner id', async () => {
    getJobApplicationWorkspace.mockResolvedValue({ items: [] });
    const req = {
      params: { ownerId: '18' },
      query: { limit: '15' },
      user: { id: '18' },
    };
    const res = createResponse();

    await workspace(req, res);

    expect(getJobApplicationWorkspace).toHaveBeenCalledWith(18, { actorId: 18, limit: 15 });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects missing owner ids', async () => {
    const req = { query: {}, body: {}, params: {}, user: {} };
    const res = createResponse();
    await expect(workspace(req, res)).rejects.toThrow(ValidationError);
    expect(getJobApplicationWorkspace).not.toHaveBeenCalled();
  });
});

describe('jobApplicationController.updateApplication', () => {
  it('ensures numeric identifiers before updating applications', async () => {
    updateJobApplication.mockResolvedValue({ id: 4 });
    const req = {
      params: { ownerId: '18', applicationId: '4' },
      body: { status: 'interview' },
      user: { id: '18' },
    };
    const res = createResponse();

    await updateApplication(req, res);

    expect(updateJobApplication).toHaveBeenCalledWith(18, 4, { status: 'interview' }, { actorId: 18 });
    expect(res.json).toHaveBeenCalledWith({ id: 4 });
  });

  it('rejects invalid application identifiers', async () => {
    const req = {
      params: { ownerId: '18', applicationId: 'zero' },
      user: { id: '18' },
    };
    const res = createResponse();

    await expect(updateApplication(req, res)).rejects.toThrow(ValidationError);
    expect(updateJobApplication).not.toHaveBeenCalled();
  });
});

describe('jobApplicationController.storeInterview', () => {
  it('passes validated identifiers to the service layer', async () => {
    createJobApplicationInterview.mockResolvedValue({ id: 6 });
    const req = {
      params: { ownerId: '3', applicationId: '7' },
      body: { scheduledAt: '2024-07-01T10:00:00Z' },
      user: { id: '3' },
    };
    const res = createResponse();

    await storeInterview(req, res);

    expect(createJobApplicationInterview).toHaveBeenCalledWith(3, 7, req.body, { actorId: 3 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 6 });
  });
});

describe('jobApplicationController.destroyFavourite', () => {
  it('enforces numeric favourite identifiers', async () => {
    deleteJobApplicationFavourite.mockResolvedValue({ success: true });
    const req = {
      params: { ownerId: '2', favouriteId: '5' },
      user: { id: '2' },
    };
    const res = createResponse();

    await destroyFavourite(req, res);

    expect(deleteJobApplicationFavourite).toHaveBeenCalledWith(2, 5, { actorId: 2 });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('jobApplicationController.destroyResponse', () => {
  it('validates identifiers before delegating to the service', async () => {
    deleteJobApplicationResponse.mockResolvedValue({ id: 9 });
    const req = {
      params: { ownerId: '12', applicationId: '9', responseId: '3' },
      user: { id: '12' },
    };
    const res = createResponse();

    await destroyResponse(req, res);

    expect(deleteJobApplicationResponse).toHaveBeenCalledWith(12, 9, 3, { actorId: 12 });
    expect(res.json).toHaveBeenCalledWith({ id: 9 });
  });
});
