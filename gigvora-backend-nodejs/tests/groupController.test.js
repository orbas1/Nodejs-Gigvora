import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const discoverGroups = jest.fn();
const listGroups = jest.fn();
const getGroupProfile = jest.fn();
const createGroup = jest.fn();
const updateGroup = jest.fn();
const addMember = jest.fn();
const updateMember = jest.fn();
const removeMember = jest.fn();
const joinGroup = jest.fn();
const leaveGroup = jest.fn();
const updateMembershipSettings = jest.fn();
const requestMembership = jest.fn();

const serviceModule = new URL('../src/services/groupService.js', import.meta.url);

const serviceExports = {
  discoverGroups,
  listGroups,
  getGroupProfile,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  requestMembership,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let ValidationError;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/groupController.js');
  ({ ValidationError, AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('groupController.create', () => {
  it('requires admin-style permissions and sanitises payloads', async () => {
    const res = createResponse();
    createGroup.mockResolvedValue({ id: 99 });

    await controller.create(
      {
        body: {
          name: '  Engineers  ',
          visibility: 'PUBLIC',
          tags: ['Alpha', 'Beta'],
          settings: { approvals: true },
        },
        user: { id: 42, roles: ['admin'] },
      },
      res,
    );

    expect(createGroup).toHaveBeenCalledWith(
      {
        name: 'Engineers',
        visibility: 'public',
        tags: ['alpha', 'beta'],
        settings: { approvals: true },
      },
      { actor: { id: 42, roles: ['admin'] } },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 99 });
  });

  it('rejects unauthorised users', async () => {
    const req = { body: { name: 'Ops' }, user: { id: 13, roles: ['member'] } };
    await expect(controller.create(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(createGroup).not.toHaveBeenCalled();
  });
});

describe('groupController.addMember', () => {
  it('validates identifiers', async () => {
    const req = {
      params: { groupId: '0' },
      body: { userId: 'abc' },
      user: { id: 1, roles: ['admin'] },
    };

    await expect(controller.addMemberController(req, createResponse())).rejects.toThrow(ValidationError);
    expect(addMember).not.toHaveBeenCalled();
  });
});

describe('groupController.discover', () => {
  it('clamps limit to 50', async () => {
    discoverGroups.mockResolvedValue({ groups: [] });
    const res = createResponse();

    await controller.discover({ query: { limit: '500' }, user: { id: 9 } }, res);

    expect(discoverGroups).toHaveBeenCalledWith({ limit: 50, search: undefined, actorId: 9 });
    expect(res.json).toHaveBeenCalledWith({ groups: [] });
  });
});
