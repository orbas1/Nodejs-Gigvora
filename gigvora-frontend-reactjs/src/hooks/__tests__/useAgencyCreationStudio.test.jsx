import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyCreationStudio from '../useAgencyCreationStudio.js';

const fetchCreationStudioOverview = vi.fn();
const fetchCreationStudioItems = vi.fn();
const fetchCreationStudioItem = vi.fn();
const createCreationStudioItem = vi.fn();
const updateCreationStudioItem = vi.fn();
const publishCreationStudioItem = vi.fn();
const shareCreationStudioItem = vi.fn();
const deleteCreationStudioItem = vi.fn();

vi.mock('../../services/agencyCreationStudio.js', () => ({
  fetchCreationStudioOverview: (...args) => fetchCreationStudioOverview(...args),
  fetchCreationStudioItems: (...args) => fetchCreationStudioItems(...args),
  fetchCreationStudioItem: (...args) => fetchCreationStudioItem(...args),
  createCreationStudioItem: (...args) => createCreationStudioItem(...args),
  updateCreationStudioItem: (...args) => updateCreationStudioItem(...args),
  publishCreationStudioItem: (...args) => publishCreationStudioItem(...args),
  shareCreationStudioItem: (...args) => shareCreationStudioItem(...args),
  deleteCreationStudioItem: (...args) => deleteCreationStudioItem(...args),
}));

describe('useAgencyCreationStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCreationStudioOverview.mockResolvedValue({ summary: { published: 2 } });
    fetchCreationStudioItems.mockResolvedValue({ data: { items: [{ id: 'item-1', title: 'Case study' }] } });
    createCreationStudioItem.mockResolvedValue({ id: 'item-2' });
  });

  it('fetches overview and items and can create new content', async () => {
    const { result } = renderHook(() => useAgencyCreationStudio({ agencyProfileId: 'agency-1' }));

    await waitFor(() => expect(fetchCreationStudioOverview).toHaveBeenCalled());
    await waitFor(() => expect(fetchCreationStudioItems).toHaveBeenCalled());
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      await result.current.actions.create({ title: 'New deck' });
    });
    expect(createCreationStudioItem).toHaveBeenCalledWith({ title: 'New deck' });
  });
});
