import { act, renderHook, waitFor } from '@testing-library/react';
import useProjectWorkspace from '../hooks/useProjectWorkspace.js';
import useWalletManagement from '../hooks/useWalletManagement.js';

const {
  fetchProjectWorkspaceForUser,
  fetchProjectWorkspaceForProject,
  createWorkspaceProject,
  workspaceActionMocks,
  fetchWalletManagement,
  createFundingSource,
} = vi.hoisted(() => {
  const fetchProjectWorkspaceForUserMock = vi.fn();
  const fetchProjectWorkspaceForProjectMock = vi.fn();
  const createWorkspaceProjectMock = vi.fn();

  const workspaceActionMocksCollection = {
    createWorkspaceProject: createWorkspaceProjectMock,
    updateWorkspaceProject: vi.fn(),
    createBudgetLine: vi.fn(),
    updateBudgetLine: vi.fn(),
    deleteBudgetLine: vi.fn(),
    createDeliverable: vi.fn(),
    updateDeliverable: vi.fn(),
    deleteDeliverable: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    createTaskAssignment: vi.fn(),
    updateTaskAssignment: vi.fn(),
    deleteTaskAssignment: vi.fn(),
    createTaskDependency: vi.fn(),
    deleteTaskDependency: vi.fn(),
    createChatMessage: vi.fn(),
    updateChatMessage: vi.fn(),
    deleteChatMessage: vi.fn(),
    createTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    deleteTimelineEntry: vi.fn(),
    createMeeting: vi.fn(),
    updateMeeting: vi.fn(),
    deleteMeeting: vi.fn(),
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    createRoleDefinition: vi.fn(),
    updateRoleDefinition: vi.fn(),
    deleteRoleDefinition: vi.fn(),
    createRoleAssignment: vi.fn(),
    updateRoleAssignment: vi.fn(),
    deleteRoleAssignment: vi.fn(),
    createSubmission: vi.fn(),
    updateSubmission: vi.fn(),
    deleteSubmission: vi.fn(),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    createInvitation: vi.fn(),
    updateInvitation: vi.fn(),
    deleteInvitation: vi.fn(),
    createHrRecord: vi.fn(),
    updateHrRecord: vi.fn(),
    deleteHrRecord: vi.fn(),
  };

  const fetchWalletManagementMock = vi.fn();
  const createFundingSourceMock = vi.fn();

  return {
    fetchProjectWorkspaceForUser: fetchProjectWorkspaceForUserMock,
    fetchProjectWorkspaceForProject: fetchProjectWorkspaceForProjectMock,
    createWorkspaceProject: createWorkspaceProjectMock,
    workspaceActionMocks: workspaceActionMocksCollection,
    fetchWalletManagement: fetchWalletManagementMock,
    createFundingSource: createFundingSourceMock,
  };
});

vi.mock('../services/projectWorkspace.js', () => ({
  __esModule: true,
  fetchProjectWorkspace: fetchProjectWorkspaceForUser,
  ...workspaceActionMocks,
}));

vi.mock('../services/projects.js', () => ({
  __esModule: true,
  fetchProjectWorkspace: fetchProjectWorkspaceForProject,
}));

vi.mock('../services/walletManagement.js', () => ({
  __esModule: true,
  fetchWalletManagement,
  createFundingSource,
  updateFundingSource: vi.fn(),
  createTransferRule: vi.fn(),
  updateTransferRule: vi.fn(),
  deleteTransferRule: vi.fn(),
  createTransferRequest: vi.fn(),
  updateTransferRequest: vi.fn(),
}));

describe('useProjectWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips loading when no context identifiers are provided', async () => {
    const { result } = renderHook(() => useProjectWorkspace());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchProjectWorkspaceForUser).not.toHaveBeenCalled();
    expect(fetchProjectWorkspaceForProject).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads workspace for the provided user and exposes management actions', async () => {
    fetchProjectWorkspaceForUser.mockResolvedValueOnce({ access: { canManage: true }, projects: [] });
    fetchProjectWorkspaceForUser.mockResolvedValueOnce({ access: { canManage: true }, projects: [{ id: 1 }] });

    const { result } = renderHook(() => useProjectWorkspace('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchProjectWorkspaceForUser).toHaveBeenCalledWith('user-1', expect.any(Object));

    await act(async () => {
      await result.current.actions.createProject({ name: 'Demo' });
    });

    expect(createWorkspaceProject).toHaveBeenCalledWith('user-1', { name: 'Demo' });
    expect(fetchProjectWorkspaceForUser).toHaveBeenCalledTimes(2);
  });

  it('throws when management actions are invoked without access', async () => {
    fetchProjectWorkspaceForUser.mockResolvedValueOnce({ access: { canManage: false, reason: 'Denied' } });

    const { result } = renderHook(() => useProjectWorkspace('user-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.actions.createProject({})).rejects.toThrow('Denied');
  });

  it('loads project workspace when projectId is provided', async () => {
    fetchProjectWorkspaceForProject.mockResolvedValueOnce({ project: { id: 55 } });

    const { result } = renderHook(() => useProjectWorkspace({ projectId: 55 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchProjectWorkspaceForProject).toHaveBeenCalledWith(55, expect.any(Object));
    expect(result.current.actions).toBeNull();
    expect(result.current.data).toEqual({ project: { id: 55 } });
  });
});

describe('useWalletManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets an error when the user id is missing', async () => {
    const { result } = renderHook(() => useWalletManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('loads wallet data for the provided user and refreshes after mutations', async () => {
    fetchWalletManagement
      .mockResolvedValueOnce({ wallet: { balance: 0 } })
      .mockResolvedValueOnce({ wallet: { balance: 25 } });

    const { result } = renderHook(() => useWalletManagement('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchWalletManagement).toHaveBeenCalledWith('user-1', { refresh: false });

    await act(async () => {
      await result.current.actions.createFundingSource({ label: 'Bank' });
    });

    expect(createFundingSource).toHaveBeenCalledWith('user-1', { label: 'Bank' });
    expect(fetchWalletManagement).toHaveBeenCalledTimes(2);
  });

  it('rejects refresh calls without a user context', async () => {
    const { result } = renderHook(() => useWalletManagement());

    await expect(result.current.actions.refresh()).rejects.toThrow('userId');
  });
});
