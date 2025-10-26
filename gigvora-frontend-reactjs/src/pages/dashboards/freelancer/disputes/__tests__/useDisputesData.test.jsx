import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useDisputesData from '../useDisputesData.js';

vi.mock('../../../../../services/freelancerDisputes.js', () => ({
  fetchDisputeDashboard: vi.fn(),
  fetchDisputeDetail: vi.fn(),
  createDispute: vi.fn(),
  appendDisputeEvent: vi.fn(),
}));

import {
  fetchDisputeDashboard,
  fetchDisputeDetail,
  createDispute,
  appendDisputeEvent,
} from '../../../../../services/freelancerDisputes.js';

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useDisputesData', () => {
  const dashboardResponse = {
    summary: { totalCases: 2 },
    disputes: [
      {
        id: 'case-1',
        status: 'open',
        latestEvent: { id: 'evt-1', eventAt: '2024-04-30T12:00:00.000Z' },
      },
    ],
    filters: {
      stages: ['open'],
      statuses: ['open', 'closed'],
      reasonCodes: [{ value: 'quality', label: 'Quality' }],
      priorities: ['low', 'medium'],
    },
    upcomingDeadlines: [],
    eligibleTransactions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchDisputeDashboard.mockResolvedValue(dashboardResponse);
    fetchDisputeDetail.mockResolvedValue({ dispute: { id: 'case-1' } });
    createDispute.mockResolvedValue({ dispute: { id: 'case-2' } });
    appendDisputeEvent.mockResolvedValue({ dispute: { id: 'case-1' } });
  });

  it('loads dashboard data when a freelancer id is provided', async () => {
    const { result } = renderHook((props) => useDisputesData(props), {
      initialProps: 'freelancer-1',
    });

    expect(result.current.loading).toBe(true);

    await flushAsync();

    expect(fetchDisputeDashboard).toHaveBeenCalledWith('freelancer-1', {});
    expect(result.current.dashboard).toEqual(dashboardResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates disputes and refreshes data', async () => {
    const { result } = renderHook((props) => useDisputesData(props), {
      initialProps: 'freelancer-9',
    });

    await flushAsync();

    await act(async () => {
      await result.current.openDispute({ reasonCode: 'quality' });
    });
    await flushAsync();

    expect(createDispute).toHaveBeenCalledWith('freelancer-9', { reasonCode: 'quality' });
    expect(result.current.selectedId).toBe('case-2');
    expect(result.current.toast?.message).toBe('Dispute created');
    expect(fetchDisputeDashboard).toHaveBeenCalledTimes(2);
  });

  it('selects disputes and caches detail', async () => {
    const { result } = renderHook((props) => useDisputesData(props), {
      initialProps: 'freelancer-11',
    });

    await flushAsync();

    await act(async () => {
      await result.current.selectDispute('case-1');
    });
    await flushAsync();

    expect(fetchDisputeDetail).toHaveBeenCalledWith('freelancer-11', 'case-1');
    expect(result.current.selectedDetail).toEqual({ dispute: { id: 'case-1' } });

    await act(async () => {
      await result.current.selectDispute('case-1');
    });

    expect(fetchDisputeDetail).toHaveBeenCalledTimes(1);
  });

  it('appends events and refreshes the dashboard', async () => {
    const { result } = renderHook((props) => useDisputesData(props), {
      initialProps: 'freelancer-15',
    });

    await flushAsync();

    await act(async () => {
      await result.current.logEvent('case-1', { notes: 'Updated' });
    });
    await flushAsync();

    expect(appendDisputeEvent).toHaveBeenCalledWith('freelancer-15', 'case-1', { notes: 'Updated' });
    expect(result.current.toast?.message).toBe('Update saved');
    expect(fetchDisputeDashboard).toHaveBeenCalledTimes(2);
  });
});
