import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../services/gigBlueprintService.js', import.meta.url);

const serviceMock = {
  listGigBlueprints: jest.fn(),
  getGigBlueprint: jest.fn(),
  invalidateGigBlueprintCache: jest.fn(),
};

jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
  __esModule: true,
  listGigBlueprints: serviceMock.listGigBlueprints,
  getGigBlueprint: serviceMock.getGigBlueprint,
  invalidateGigBlueprintCache: serviceMock.invalidateGigBlueprintCache,
}));

const controller = await import('../gigBlueprintController.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('gigBlueprintController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists gig blueprints', async () => {
    const payload = { blueprints: [{ id: '1' }], meta: { total: 1 } };
    serviceMock.listGigBlueprints.mockResolvedValueOnce(payload);

    const req = {};
    const res = createResponse();

    await controller.index(req, res);

    expect(serviceMock.listGigBlueprints).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('shows a single gig blueprint', async () => {
    const payload = { blueprint: { id: '1' }, meta: { total: 1 } };
    serviceMock.getGigBlueprint.mockResolvedValueOnce(payload);

    const req = { params: { blueprintId: 'gigs-default' } };
    const res = createResponse();

    await controller.show(req, res);

    expect(serviceMock.getGigBlueprint).toHaveBeenCalledWith('gigs-default');
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
