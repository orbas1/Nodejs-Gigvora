import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyInboxWorkspace from '../useAgencyInboxWorkspace.js';

const fetchAgencyInboxWorkspace = vi.fn();
const saveAgencyInboxPreferences = vi.fn();
const createAgencyInboxSavedReply = vi.fn();
const updateAgencyInboxSavedReply = vi.fn();
const deleteAgencyInboxSavedReply = vi.fn();
const createAgencyInboxRoutingRule = vi.fn();
const updateAgencyInboxRoutingRule = vi.fn();
const deleteAgencyInboxRoutingRule = vi.fn();
const saveAgencyInboxAutomations = vi.fn();

const refreshMock = vi.fn();

const workspacePayload = {
  workspaceId: 'ws-1',
  preferences: { inboxName: 'Agency inbox', notificationsEmail: true },
  automations: { routing: [] },
  savedReplies: [],
  routingRules: [],
};

const useCachedResourceMock = vi.fn(() => ({
  data: workspacePayload,
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: '2024-01-01T00:00:00Z',
  refresh: refreshMock,
}));

vi.mock('../useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => useCachedResourceMock(...args),
}));

vi.mock('../../services/agencyInbox.js', () => ({
  fetchAgencyInboxWorkspace: (...args) => fetchAgencyInboxWorkspace(...args),
  saveAgencyInboxPreferences: (...args) => saveAgencyInboxPreferences(...args),
  createAgencyInboxSavedReply: (...args) => createAgencyInboxSavedReply(...args),
  updateAgencyInboxSavedReply: (...args) => updateAgencyInboxSavedReply(...args),
  deleteAgencyInboxSavedReply: (...args) => deleteAgencyInboxSavedReply(...args),
  createAgencyInboxRoutingRule: (...args) => createAgencyInboxRoutingRule(...args),
  updateAgencyInboxRoutingRule: (...args) => updateAgencyInboxRoutingRule(...args),
  deleteAgencyInboxRoutingRule: (...args) => deleteAgencyInboxRoutingRule(...args),
  saveAgencyInboxAutomations: (...args) => saveAgencyInboxAutomations(...args),
}));

describe('useAgencyInboxWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAgencyInboxWorkspace.mockResolvedValue(workspacePayload);
    saveAgencyInboxPreferences.mockResolvedValue({ ...workspacePayload.preferences, inboxName: 'Updated' });
  });

  it('configures the cached resource and supports preference updates', async () => {
    const { result } = renderHook(() => useAgencyInboxWorkspace({ workspaceId: 'ws-1' }));

    const [cacheKey, fetcher, options] = useCachedResourceMock.mock.calls[0];
    expect(cacheKey).toBe('agency:inbox-workspace:ws-1');
    expect(options).toMatchObject({ enabled: true });

    await fetcher({});
    expect(fetchAgencyInboxWorkspace).toHaveBeenCalledWith({ workspaceId: 'ws-1' }, expect.any(Object));

    await act(async () => {
      await result.current.updatePreferences({ inboxName: 'Updated' });
    });
    expect(saveAgencyInboxPreferences).toHaveBeenCalledWith({ workspaceId: 'ws-1', inboxName: 'Updated' });
    expect(refreshMock).toHaveBeenCalledWith({ force: true });
  });
});
