import { describe, expect, it, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const apiClient = {
    get: vi.fn(),
  };
  return { apiClient, default: apiClient };
});

describe('adminGovernance service', () => {
  it('fetches governance overview with params', async () => {
    const { apiClient } = await import('../apiClient.js');
    const { fetchAdminGovernanceOverview } = await import('../adminGovernance.js');

    apiClient.get.mockResolvedValue({ data: { lookbackDays: 30 } });

    const response = await fetchAdminGovernanceOverview({ lookbackDays: 14 });

    expect(apiClient.get).toHaveBeenCalledWith('/admin/governance/overview', {
      params: { lookbackDays: 14 },
    });
    expect(response).toEqual({ data: { lookbackDays: 30 } });
  });
});
