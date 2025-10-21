import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/companyPageService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  listCompanyPages: jest.fn(),
  getCompanyPage: jest.fn(),
  createCompanyPage: jest.fn(),
  updateCompanyPage: jest.fn(),
  replacePageSections: jest.fn(),
  replacePageCollaborators: jest.fn(),
  publishCompanyPage: jest.fn(),
  archiveCompanyPage: jest.fn(),
  deleteCompanyPage: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/companyPageController.js');
const {
  index,
  show,
  create,
  update,
  updateSections,
  updateCollaborators,
  publish,
  archive,
  destroy,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('companyPageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists company pages with parsed workspace id and pagination defaults', async () => {
    const req = { query: { workspaceId: '99', limit: '10', offset: '5' } };
    const res = createResponse();
    const payload = { pages: [], pagination: { total: 0 } };
    serviceMock.listCompanyPages.mockResolvedValueOnce(payload);

    await index(req, res);

    expect(serviceMock.listCompanyPages).toHaveBeenCalledWith({
      workspaceId: 99,
      status: undefined,
      visibility: undefined,
      search: undefined,
      limit: 10,
      offset: 5,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('throws when page id is invalid', async () => {
    const req = { query: { workspaceId: '1' }, params: { pageId: 'abc' } };
    const res = createResponse();

    await expect(show(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.getCompanyPage).not.toHaveBeenCalled();
  });

  it('creates a page with actor context and body payload', async () => {
    const req = { query: { workspaceId: '5' }, user: { id: 42 }, body: { name: 'New Page' } };
    const res = createResponse();
    const page = { id: 10, name: 'New Page' };
    serviceMock.createCompanyPage.mockResolvedValueOnce(page);

    await create(req, res);

    expect(serviceMock.createCompanyPage).toHaveBeenCalledWith({ workspaceId: 5, actorId: 42, name: 'New Page' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ page });
  });

  it('updates sections enforcing array payloads', async () => {
    const req = {
      query: { workspaceId: '6' },
      params: { pageId: '8' },
      body: { sections: { not: 'an array' } },
      user: { id: 100 },
    };
    const res = createResponse();
    const page = { id: 8, sections: [] };
    serviceMock.replacePageSections.mockResolvedValueOnce(page);

    await updateSections(req, res);

    expect(serviceMock.replacePageSections).toHaveBeenCalledWith({
      workspaceId: 6,
      pageId: 8,
      sections: [],
      actorId: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ page });
  });

  it('archives a page using parsed identifiers', async () => {
    const req = { query: { workspaceId: '6' }, params: { pageId: '11' }, user: { id: 5 } };
    const res = createResponse();

    await archive(req, res);

    expect(serviceMock.archiveCompanyPage).toHaveBeenCalledWith({ workspaceId: 6, pageId: 11, actorId: 5 });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});
