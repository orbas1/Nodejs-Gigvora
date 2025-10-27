import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../apiClient.js', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const { apiClient } = await import('../apiClient.js');
const service = await import('../gigBlueprintService.js');

describe('gigBlueprintService', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
  });

  it('fetches gig blueprints list with structured response', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprints: [{ id: '1' }], meta: { total: 1 } });

    const result = await service.fetchGigBlueprints();

    expect(apiClient.get).toHaveBeenCalledWith('/marketplace/gig-blueprints', undefined);
    expect(result).toEqual({ blueprints: [{ id: '1' }], meta: { total: 1 } });
  });

  it('fetches a single gig blueprint with sanitized identifier', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprint: { id: 'custom' }, meta: { version: '1' } });

    const result = await service.fetchGigBlueprint(' custom ');

    expect(apiClient.get).toHaveBeenCalledWith('/marketplace/gig-blueprints/custom', undefined);
    expect(result).toEqual({ blueprint: { id: 'custom' }, meta: { version: '1' } });
  });

  it('uses the default identifier when none is provided', async () => {
    apiClient.get.mockResolvedValueOnce({ blueprint: { id: 'default' }, meta: {} });

    await service.fetchGigBlueprint();

    expect(apiClient.get).toHaveBeenCalledWith('/marketplace/gig-blueprints/gig-lifecycle-operational-blueprint', undefined);
  });
});
