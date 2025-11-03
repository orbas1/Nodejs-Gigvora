import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../apiClient.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const { apiClient } = await import('../apiClient.js');
const service = await import('../profileBlueprintService.js');

describe('profileBlueprintService', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it('fetches profile blueprints list with structured response', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprints: [{ id: 'user_profile' }], meta: { total: 6 } });

    const result = await service.fetchProfileBlueprints();

    expect(apiClient.get).toHaveBeenCalledWith('/profiles/blueprints', undefined);
    expect(result).toEqual({ blueprints: [{ id: 'user_profile' }], meta: { total: 6 } });
  });

  it('fetches a single profile blueprint with sanitized identifier', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprint: { id: 'company_profile' }, meta: { version: '1' } });

    const result = await service.fetchProfileBlueprint(' company-profile ');

    expect(apiClient.get).toHaveBeenCalledWith('/profiles/blueprints/company-profile', undefined);
    expect(result).toEqual({ blueprint: { id: 'company_profile' }, meta: { version: '1' } });
  });

  it('uses the default identifier when none is provided', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprint: { id: 'professional_profile' }, meta: {} });

    await service.fetchProfileBlueprint();

    expect(apiClient.get).toHaveBeenCalledWith('/profiles/blueprints/professional_profile', undefined);
  });
});
