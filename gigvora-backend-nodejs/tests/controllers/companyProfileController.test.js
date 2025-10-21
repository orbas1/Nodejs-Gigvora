import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/companyProfileService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getCompanyProfileWorkspace: jest.fn(),
  updateCompanyProfileDetails: jest.fn(),
  updateCompanyAvatar: jest.fn(),
  addFollower: jest.fn(),
  updateFollower: jest.fn(),
  removeFollower: jest.fn(),
  createConnection: jest.fn(),
  updateConnection: jest.fn(),
  removeConnection: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/companyProfileController.js');
const {
  getWorkspace,
  updateProfile,
  updateAvatar,
  listFollowers,
  addFollower,
  updateFollower,
  removeFollower,
  listConnections,
  createConnection,
  updateConnection,
  removeConnection,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('companyProfileController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads workspace using authenticated user id', async () => {
    const req = { user: { id: 51 } };
    const res = createResponse();
    const workspace = { followers: [], metrics: {} };
    serviceMock.getCompanyProfileWorkspace.mockResolvedValueOnce(workspace);

    await getWorkspace(req, res);

    expect(serviceMock.getCompanyProfileWorkspace).toHaveBeenCalledWith({ userId: 51, viewerId: 51 });
    expect(res.json).toHaveBeenCalledWith(workspace);
  });

  it('throws when follower id is invalid', async () => {
    const req = { user: { id: 12 }, params: { followerId: 'abc' } };
    const res = createResponse();

    await expect(updateFollower(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.updateFollower).not.toHaveBeenCalled();
  });

  it('creates connection with numeric ids', async () => {
    const req = {
      user: { id: 7 },
      body: { targetUserId: 33, relationshipType: 'mentor' },
    };
    const res = createResponse();
    const connection = { id: 1 };
    serviceMock.createConnection.mockResolvedValueOnce(connection);

    await createConnection(req, res);

    expect(serviceMock.createConnection).toHaveBeenCalledWith({
      userId: 7,
      targetUserId: 33,
      targetEmail: undefined,
      relationshipType: 'mentor',
      status: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      notes: undefined,
      lastInteractedAt: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(connection);
  });

  it('removes connection returning no content', async () => {
    const req = { user: { id: 4 }, params: { connectionId: '90' } };
    const res = createResponse();

    await removeConnection(req, res);

    expect(serviceMock.removeConnection).toHaveBeenCalledWith({ userId: 4, connectionId: 90 });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});
