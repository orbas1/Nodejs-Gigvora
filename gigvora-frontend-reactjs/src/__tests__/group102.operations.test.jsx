import { act, renderHook, waitFor } from '@testing-library/react';
import useProjectOperations from '../hooks/useProjectOperations.js';
import useProjectOperationsManager from '../hooks/useProjectOperationsManager.js';

const serviceMocks = vi.hoisted(() => {
  const factory = () => vi.fn();
  return {
    fetchProjectOperations: vi.fn(),
    updateProjectOperations: factory(),
    addProjectTask: factory(),
    updateProjectTask: factory(),
    deleteProjectTask: factory(),
    createProjectBudget: factory(),
    updateProjectBudget: factory(),
    deleteProjectBudget: factory(),
    createProjectObject: factory(),
    updateProjectObject: factory(),
    deleteProjectObject: factory(),
    createProjectTimelineEvent: factory(),
    updateProjectTimelineEvent: factory(),
    deleteProjectTimelineEvent: factory(),
    createProjectMeeting: factory(),
    updateProjectMeeting: factory(),
    deleteProjectMeeting: factory(),
    createProjectCalendarEntry: factory(),
    updateProjectCalendarEntry: factory(),
    deleteProjectCalendarEntry: factory(),
    createProjectRole: factory(),
    updateProjectRole: factory(),
    deleteProjectRole: factory(),
    createProjectSubmission: factory(),
    updateProjectSubmission: factory(),
    deleteProjectSubmission: factory(),
    createProjectInvite: factory(),
    updateProjectInvite: factory(),
    deleteProjectInvite: factory(),
    createProjectHrRecord: factory(),
    updateProjectHrRecord: factory(),
    deleteProjectHrRecord: factory(),
    createProjectTimeLog: factory(),
    updateProjectTimeLog: factory(),
    deleteProjectTimeLog: factory(),
    createProjectTarget: factory(),
    updateProjectTarget: factory(),
    deleteProjectTarget: factory(),
    createProjectObjective: factory(),
    updateProjectObjective: factory(),
    deleteProjectObjective: factory(),
    postConversationMessage: factory(),
    createProjectFile: factory(),
    updateProjectFile: factory(),
    deleteProjectFile: factory(),
  };
});

vi.mock('../services/projectOperations.js', () => ({
  __esModule: true,
  default: serviceMocks,
  ...serviceMocks,
}));

describe('useProjectOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns demo-ready operations data when no project is provided', () => {
    const { result } = renderHook(() => useProjectOperations());

    expect(serviceMocks.fetchProjectOperations).not.toHaveBeenCalled();
    expect(result.current.projectId).toBeNull();
    expect(result.current.data).toMatchObject({
      summary: expect.any(Object),
      budgets: expect.any(Array),
      tasks: expect.any(Array),
    });
    expect(result.current.canManage).toBe(true);
  });

  it('loads operations for the provided project id and executes mutations with refresh', async () => {
    serviceMocks.fetchProjectOperations
      .mockResolvedValueOnce({ access: { canManage: true }, tasks: [], summary: {} })
      .mockResolvedValueOnce({ access: { canManage: true }, tasks: [{ id: 'refresh-task' }], summary: {} });

    const { result } = renderHook(() => useProjectOperations({ projectId: '42' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(serviceMocks.fetchProjectOperations).toHaveBeenCalledWith(42, expect.any(Object));

    await act(async () => {
      await result.current.actions.updateOperations({ status: 'updated' });
    });

    expect(serviceMocks.updateProjectOperations).toHaveBeenCalledWith(42, { status: 'updated' });
    expect(serviceMocks.fetchProjectOperations).toHaveBeenCalledTimes(2);
    expect(result.current.mutating).toBe(false);
  });

  it('blocks management actions when permissions are missing', async () => {
    serviceMocks.fetchProjectOperations.mockResolvedValueOnce({
      access: { canManage: false, reason: 'Denied' },
      tasks: [],
    });

    const { result } = renderHook(() => useProjectOperations({ projectId: 99 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.actions.updateOperations({})).rejects.toThrow('Denied');
  });
});

describe('useProjectOperationsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes mapped actions and delegates to the underlying operations hook', async () => {
    serviceMocks.fetchProjectOperations
      .mockResolvedValueOnce({ access: { canManage: true }, tasks: [], summary: {} })
      .mockResolvedValueOnce({ access: { canManage: true }, tasks: [], summary: {} });

    const { result } = renderHook(() => useProjectOperationsManager({ projectId: 7 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.actions).toHaveProperty('updateOperations');

    await act(async () => {
      await result.current.actions.updateOperations({ playbook: 'refresh' });
    });

    expect(serviceMocks.updateProjectOperations).toHaveBeenCalledWith(7, { playbook: 'refresh' });
    expect(result.current.hasProject).toBe(true);
    expect(typeof result.current.run).toBe('function');
  });
});

