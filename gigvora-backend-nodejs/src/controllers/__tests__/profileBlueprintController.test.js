import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../services/profileBlueprintService.js', import.meta.url);

const serviceMock = {
  listProfileBlueprints: jest.fn(),
  getProfileBlueprint: jest.fn(),
  invalidateProfileBlueprintCache: jest.fn(),
};

jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
  __esModule: true,
  listProfileBlueprints: serviceMock.listProfileBlueprints,
  getProfileBlueprint: serviceMock.getProfileBlueprint,
  invalidateProfileBlueprintCache: serviceMock.invalidateProfileBlueprintCache,
}));

const controller = await import('../profileBlueprintController.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('profileBlueprintController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists profile blueprints', async () => {
    const payload = { blueprints: [{ id: 'user_profile' }], meta: { total: 6 } };
    serviceMock.listProfileBlueprints.mockResolvedValueOnce(payload);

    const req = {};
    const res = createResponse();

    await controller.index(req, res);

    expect(serviceMock.listProfileBlueprints).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('shows a single profile blueprint', async () => {
    const payload = { blueprint: { id: 'company_profile' }, meta: { total: 6 } };
    serviceMock.getProfileBlueprint.mockResolvedValueOnce(payload);

    const req = { params: { blueprintId: 'company-profile' } };
    const res = createResponse();

    await controller.show(req, res);

    expect(serviceMock.getProfileBlueprint).toHaveBeenCalledWith('company-profile');
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
