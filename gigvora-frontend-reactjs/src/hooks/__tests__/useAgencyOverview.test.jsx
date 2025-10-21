import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyOverview from '../useAgencyOverview.js';

const fetchAgencyOverview = vi.fn();
const updateAgencyOverview = vi.fn();

vi.mock('../../services/agency.js', () => ({
  fetchAgencyOverview: (...args) => fetchAgencyOverview(...args),
  updateAgencyOverview: (...args) => updateAgencyOverview(...args),
}));

describe('useAgencyOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAgencyOverview.mockResolvedValue({ overview: { headcount: 5 }, meta: { fromCache: false } });
    updateAgencyOverview.mockResolvedValue({ overview: { headcount: 6 } });
  });

  it('loads the overview and saves updates', async () => {
    const { result } = renderHook(() => useAgencyOverview({ workspaceId: 'ws-1' }));

    await waitFor(() => expect(fetchAgencyOverview).toHaveBeenCalled());
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.save({ headcount: 6 });
    });
    expect(updateAgencyOverview).toHaveBeenCalledWith({ headcount: 6 });
  });
});
