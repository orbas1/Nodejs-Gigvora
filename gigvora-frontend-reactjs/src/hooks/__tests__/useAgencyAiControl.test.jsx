import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyAiControl from '../useAgencyAiControl.js';

const fetchAgencyAiControl = vi.fn();
const updateAgencyAiSettings = vi.fn();
const createAgencyBidTemplate = vi.fn();
const updateAgencyBidTemplate = vi.fn();
const deleteAgencyBidTemplate = vi.fn();

vi.mock('../../services/agencyAi.js', () => ({
  fetchAgencyAiControl: (...args) => fetchAgencyAiControl(...args),
  updateAgencyAiSettings: (...args) => updateAgencyAiSettings(...args),
  createAgencyBidTemplate: (...args) => createAgencyBidTemplate(...args),
  updateAgencyBidTemplate: (...args) => updateAgencyBidTemplate(...args),
  deleteAgencyBidTemplate: (...args) => deleteAgencyBidTemplate(...args),
}));

describe('useAgencyAiControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAgencyAiControl.mockResolvedValue({
      workspace: { id: 'ws-1', slug: 'creative' },
      templates: [],
    });
    updateAgencyAiSettings.mockResolvedValue({ success: true });
    createAgencyBidTemplate.mockResolvedValue({ id: 'tmpl-1' });
    updateAgencyBidTemplate.mockResolvedValue({ id: 'tmpl-1', name: 'Updated' });
  });

  it('loads automation settings and supports updates', async () => {
    const { result } = renderHook(() => useAgencyAiControl({ workspaceId: 'ws-1' }));

    await waitFor(() => expect(fetchAgencyAiControl).toHaveBeenCalled());
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.saveSettings({ autopilot: true });
    });
    expect(updateAgencyAiSettings).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws-1', autopilot: true }),
    );

    await act(async () => {
      await result.current.addTemplate({ name: 'Pitch' });
    });
    expect(createAgencyBidTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws-1', name: 'Pitch' }),
    );
    expect(fetchAgencyAiControl).toHaveBeenCalledTimes(2);
  });
});
