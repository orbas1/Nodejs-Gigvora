import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import { AuthenticationError } from '../src/utils/errors.js';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const blogServiceUrl = new URL('../src/services/blogService.js', import.meta.url);
const calendarServiceUrl = new URL('../src/services/agencyCalendarService.js', import.meta.url);
const kanbanServiceUrl = new URL('../src/services/agencyClientKanbanService.js', import.meta.url);
const creationServiceUrl = new URL('../src/services/agencyCreationStudioService.js', import.meta.url);
const escrowServiceUrl = new URL('../src/services/agencyEscrowService.js', import.meta.url);
const workspaceUtilsUrl = new URL('../src/utils/agencyWorkspaceAccess.js', import.meta.url);
const modelsUrl = new URL('../src/models/index.js', import.meta.url);

jest.unstable_mockModule(modelsUrl.pathname, () => ({
  ProviderWorkspace: { findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
  ProviderWorkspaceMember: { findAll: jest.fn(), findOne: jest.fn() },
}));

const blogServiceMock = {
  listBlogPosts: jest.fn(),
  getBlogPost: jest.fn(),
  createBlogPost: jest.fn(),
  updateBlogPost: jest.fn(),
  deleteBlogPost: jest.fn(),
  listBlogCategories: jest.fn(),
  createBlogCategory: jest.fn(),
  updateBlogCategory: jest.fn(),
  deleteBlogCategory: jest.fn(),
  listBlogTags: jest.fn(),
  createBlogTag: jest.fn(),
  updateBlogTag: jest.fn(),
  deleteBlogTag: jest.fn(),
  createBlogMedia: jest.fn(),
};
jest.unstable_mockModule(blogServiceUrl.pathname, () => ({
  ...blogServiceMock,
  default: blogServiceMock,
}));

const calendarServiceMock = {
  listAgencyCalendarEvents: jest.fn(),
  getAgencyCalendarEvent: jest.fn(),
  createAgencyCalendarEvent: jest.fn(),
  updateAgencyCalendarEvent: jest.fn(),
  deleteAgencyCalendarEvent: jest.fn(),
};
jest.unstable_mockModule(calendarServiceUrl.pathname, () => ({
  ...calendarServiceMock,
  default: calendarServiceMock,
}));

const kanbanServiceMock = {
  getClientKanban: jest.fn(),
  createColumn: jest.fn(),
  updateColumn: jest.fn(),
  deleteColumn: jest.fn(),
  createCard: jest.fn(),
  updateCard: jest.fn(),
  moveCard: jest.fn(),
  deleteCard: jest.fn(),
  createChecklistItem: jest.fn(),
  updateChecklistItem: jest.fn(),
  deleteChecklistItem: jest.fn(),
  createClient: jest.fn(),
  updateClient: jest.fn(),
};
jest.unstable_mockModule(kanbanServiceUrl.pathname, () => ({
  ...kanbanServiceMock,
  default: kanbanServiceMock,
}));

const creationServiceMock = {
  getCreationStudioOverview: jest.fn(),
  getCreationStudioSnapshot: jest.fn(),
  createCreationItem: jest.fn(),
  updateCreationItem: jest.fn(),
  deleteCreationItem: jest.fn(),
};
jest.unstable_mockModule(creationServiceUrl.pathname, () => ({
  ...creationServiceMock,
  default: creationServiceMock,
}));

const escrowServiceMock = {
  getEscrowOverview: jest.fn(),
  listEscrowAccounts: jest.fn(),
  createEscrowAccountForWorkspace: jest.fn(),
  updateEscrowAccountForWorkspace: jest.fn(),
  listEscrowTransactions: jest.fn(),
  createEscrowTransactionForWorkspace: jest.fn(),
  updateEscrowTransactionDetails: jest.fn(),
  releaseEscrowForWorkspace: jest.fn(),
  refundEscrowForWorkspace: jest.fn(),
  updateEscrowSettingsForWorkspace: jest.fn(),
};
jest.unstable_mockModule(escrowServiceUrl.pathname, () => ({
  ...escrowServiceMock,
  default: escrowServiceMock,
}));

const workspaceUtilsMock = {
  resolveWorkspaceIdentifiersFromRequest: jest.fn(() => ({ workspaceId: 101 })),
  resolveWorkspaceForActor: jest.fn(async () => ({ workspace: { id: 101 } })),
  normaliseWorkspaceIdentifiers: jest.fn(),
};
jest.unstable_mockModule(workspaceUtilsUrl.pathname, () => ({
  ...workspaceUtilsMock,
  default: workspaceUtilsMock,
}));

let blogController;
let calendarController;
let kanbanController;
let creationController;
let escrowController;

function createResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

beforeAll(async () => {
  blogController = await import('../src/controllers/agencyBlogController.js');
  calendarController = await import('../src/controllers/agencyCalendarController.js');
  kanbanController = await import('../src/controllers/agencyClientKanbanController.js');
  creationController = await import('../src/controllers/agencyCreationController.js');
  escrowController = await import('../src/controllers/agencyEscrowController.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  workspaceUtilsMock.resolveWorkspaceIdentifiersFromRequest.mockReturnValue({ workspaceId: 101 });
  workspaceUtilsMock.resolveWorkspaceForActor.mockResolvedValue({ workspace: { id: 101 } });
});

describe('agencyBlogController', () => {
  it('rejects unauthenticated access', async () => {
    const req = { query: { workspaceId: '5' } };
    await expect(blogController.list(req, createResponse())).rejects.toThrow(AuthenticationError);
    expect(blogServiceMock.listBlogPosts).not.toHaveBeenCalled();
  });

  it('normalises workspace and payload when creating posts', async () => {
    workspaceUtilsMock.resolveWorkspaceIdentifiersFromRequest.mockReturnValue({ workspaceId: 42, workspaceSlug: 'creative' });
    workspaceUtilsMock.resolveWorkspaceForActor.mockResolvedValue({ workspace: { id: 42 } });
    blogServiceMock.createBlogPost.mockResolvedValue({ id: 'post-1' });

    const req = {
      user: { id: 9, type: 'agency' },
      body: {
        workspaceId: '12',
        workspaceSlug: 'creative',
        title: ' Launch Plan ',
      },
    };
    const res = createResponse();
    await blogController.create(req, res);
    expect(blogServiceMock.createBlogPost).toHaveBeenCalledWith(
      { workspaceId: 42, workspaceSlug: undefined, title: ' Launch Plan ' },
      { actorId: 9, workspaceId: 42 },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('agencyCalendarController', () => {
  it('passes sanitised identifiers to update handler', async () => {
    workspaceUtilsMock.resolveWorkspaceIdentifiersFromRequest.mockReturnValue({ workspaceId: 88 });
    calendarServiceMock.updateAgencyCalendarEvent.mockResolvedValue({ id: 'evt-1' });
    const req = {
      user: { id: 7, type: 'agency' },
      params: { eventId: ' 123 ' },
      body: { workspaceId: '88', title: 'Weekly Sync' },
    };
    const res = createResponse();
    await calendarController.update(req, res);
    expect(calendarServiceMock.updateAgencyCalendarEvent).toHaveBeenCalledWith('123', { workspaceId: 88, title: 'Weekly Sync' }, {
      actorId: 7,
      actorRole: 'agency',
      actorRoles: [],
      id: 7,
      isAdmin: false,
      role: 'agency',
    });
  });
});

describe('agencyClientKanbanController', () => {
  it('resolves workspace membership using slug when creating cards', async () => {
    workspaceUtilsMock.resolveWorkspaceIdentifiersFromRequest.mockReturnValue({ workspaceSlug: 'growth' });
    workspaceUtilsMock.resolveWorkspaceForActor.mockResolvedValue({ workspace: { id: 22 } });
    kanbanServiceMock.createCard.mockResolvedValue({ id: 55 });
    const req = {
      user: { id: 15, type: 'agency', roles: ['manager'] },
      body: { title: 'Kickoff' },
      query: { workspaceSlug: 'growth' },
    };
    const res = createResponse();
    await kanbanController.storeCard(req, res);
    expect(kanbanServiceMock.createCard).toHaveBeenCalledWith(15, 22, { title: 'Kickoff' });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('agencyCreationController', () => {
  it('normalises overview filters', async () => {
    creationServiceMock.getCreationStudioOverview.mockResolvedValue({ items: [] });
    const req = {
      user: { id: 4, type: 'agency' },
      query: { agencyProfileId: '19', page: '3', pageSize: '200', targetType: ' CAMPAIGN ', status: 'ACTIVE ', search: ' launch ' },
    };
    const res = createResponse();
    await creationController.overview(req, res);
    expect(creationServiceMock.getCreationStudioOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyProfileId: 19,
        page: 3,
        pageSize: 200,
        targetType: 'campaign',
        status: 'active',
        search: 'launch',
      }),
      expect.objectContaining({ actorId: 4 }),
    );
  });
});

describe('agencyEscrowController', () => {
  it('applies pagination caps when listing accounts', async () => {
    escrowServiceMock.listEscrowAccounts.mockResolvedValue({ results: [] });
    const req = {
      user: { id: 11, type: 'agency' },
      query: { workspaceId: '10', limit: '300', offset: '5', status: ' PENDING ', search: ' acme ' },
    };
    const res = createResponse();
    await escrowController.fetchAccounts(req, res);
    expect(escrowServiceMock.listEscrowAccounts).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 101,
        limit: 100,
        offset: 5,
        status: 'pending',
        search: 'acme',
      }),
      expect.objectContaining({ actorId: 11 }),
    );
  });

  it('forwards actor context when creating transactions', async () => {
    escrowServiceMock.createEscrowTransactionForWorkspace.mockResolvedValue({ id: 9 });
    const req = {
      user: { id: 33, type: 'agency', roles: ['agency_admin'] },
      body: { amount: 5000, currency: 'usd' },
      query: { workspaceId: '77' },
    };
    const res = createResponse();
    await escrowController.createTransaction(req, res);
    expect(escrowServiceMock.createEscrowTransactionForWorkspace).toHaveBeenCalledWith(
      { amount: 5000, currency: 'usd' },
      { workspaceId: 101 },
      expect.objectContaining({ actorId: 33 }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
