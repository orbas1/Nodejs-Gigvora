import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAgencyDashboard from '../useAgencyDashboard.js';

const fetchAgencyDashboard = vi.fn();
const mockResource = { data: { metrics: {} }, refresh: vi.fn() };
const useCachedResourceSpy = vi.fn(() => mockResource);

vi.mock('../useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => useCachedResourceSpy(...args),
}));

vi.mock('../../services/agency.js', () => ({
  fetchAgencyDashboard: (...args) => fetchAgencyDashboard(...args),
}));

describe('useAgencyDashboard', () => {
  it('configures the cached resource with the workspace context', () => {
    fetchAgencyDashboard.mockResolvedValue({ summary: {} });

    const { result } = renderHook(() => useAgencyDashboard({ workspaceId: 'ws-1', lookbackDays: 30 }));

    expect(useCachedResourceSpy).toHaveBeenCalled();
    const [cacheKey, fetcher, options] = useCachedResourceSpy.mock.calls[0];
    expect(cacheKey).toBe('agency:dashboard:ws-1:30');
    expect(options).toMatchObject({ enabled: true });

    fetcher({});
    expect(fetchAgencyDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws-1', lookbackDays: 30 }),
    );

    expect(result.current).toBe(mockResource);
  });
});
