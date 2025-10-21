import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyIntegrations from '../useAgencyIntegrations.js';

const fetchAgencyIntegrations = vi.fn();
const createAgencyIntegration = vi.fn();
const updateAgencyIntegration = vi.fn();
const rotateAgencyIntegrationSecret = vi.fn();
const createAgencyIntegrationWebhook = vi.fn();
const updateAgencyIntegrationWebhook = vi.fn();
const deleteAgencyIntegrationWebhook = vi.fn();
const testAgencyIntegrationConnection = vi.fn();

vi.mock('../../services/agencyIntegrations.js', () => ({
  fetchAgencyIntegrations: (...args) => fetchAgencyIntegrations(...args),
  createAgencyIntegration: (...args) => createAgencyIntegration(...args),
  updateAgencyIntegration: (...args) => updateAgencyIntegration(...args),
  rotateAgencyIntegrationSecret: (...args) => rotateAgencyIntegrationSecret(...args),
  createAgencyIntegrationWebhook: (...args) => createAgencyIntegrationWebhook(...args),
  updateAgencyIntegrationWebhook: (...args) => updateAgencyIntegrationWebhook(...args),
  deleteAgencyIntegrationWebhook: (...args) => deleteAgencyIntegrationWebhook(...args),
  testAgencyIntegrationConnection: (...args) => testAgencyIntegrationConnection(...args),
}));

describe('useAgencyIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAgencyIntegrations.mockResolvedValue({
      connectors: [{ id: 'integration-1', provider: 'slack' }],
      auditLog: [],
      meta: { selectedWorkspaceId: 42, availableWorkspaces: [{ id: 42, name: 'HQ' }] },
    });
    createAgencyIntegration.mockResolvedValue({ id: 'integration-2' });
  });

  it('loads integrations and can create a new connector', async () => {
    const { result } = renderHook(() => useAgencyIntegrations({ workspaceId: 42 }));

    await waitFor(() => expect(fetchAgencyIntegrations).toHaveBeenCalled());
    expect(result.current.loading).toBe(false);
    expect(result.current.connectors).toHaveLength(1);

    await act(async () => {
      await result.current.createIntegration({ provider: 'asana' });
    });

    expect(createAgencyIntegration).toHaveBeenCalledWith({ provider: 'asana', workspaceId: 42 });
  });
});
