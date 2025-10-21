import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as workspaceApi from '../services/projectWorkspace.js';
import * as projectsService from '../services/projects.js';

const MANAGEMENT_ACTIONS = {
  createProject: workspaceApi.createWorkspaceProject,
  updateProject: workspaceApi.updateWorkspaceProject,
  createBudgetLine: workspaceApi.createBudgetLine,
  updateBudgetLine: workspaceApi.updateBudgetLine,
  deleteBudgetLine: workspaceApi.deleteBudgetLine,
  createDeliverable: workspaceApi.createDeliverable,
  updateDeliverable: workspaceApi.updateDeliverable,
  deleteDeliverable: workspaceApi.deleteDeliverable,
  createTask: workspaceApi.createTask,
  updateTask: workspaceApi.updateTask,
  deleteTask: workspaceApi.deleteTask,
  createTaskAssignment: workspaceApi.createTaskAssignment,
  updateTaskAssignment: workspaceApi.updateTaskAssignment,
  deleteTaskAssignment: workspaceApi.deleteTaskAssignment,
  createTaskDependency: workspaceApi.createTaskDependency,
  deleteTaskDependency: workspaceApi.deleteTaskDependency,
  createChatMessage: workspaceApi.createChatMessage,
  updateChatMessage: workspaceApi.updateChatMessage,
  deleteChatMessage: workspaceApi.deleteChatMessage,
  createTimelineEntry: workspaceApi.createTimelineEntry,
  updateTimelineEntry: workspaceApi.updateTimelineEntry,
  deleteTimelineEntry: workspaceApi.deleteTimelineEntry,
  createMeeting: workspaceApi.createMeeting,
  updateMeeting: workspaceApi.updateMeeting,
  deleteMeeting: workspaceApi.deleteMeeting,
  createCalendarEvent: workspaceApi.createCalendarEvent,
  updateCalendarEvent: workspaceApi.updateCalendarEvent,
  deleteCalendarEvent: workspaceApi.deleteCalendarEvent,
  createRoleDefinition: workspaceApi.createRoleDefinition,
  updateRoleDefinition: workspaceApi.updateRoleDefinition,
  deleteRoleDefinition: workspaceApi.deleteRoleDefinition,
  createRoleAssignment: workspaceApi.createRoleAssignment,
  updateRoleAssignment: workspaceApi.updateRoleAssignment,
  deleteRoleAssignment: workspaceApi.deleteRoleAssignment,
  createSubmission: workspaceApi.createSubmission,
  updateSubmission: workspaceApi.updateSubmission,
  deleteSubmission: workspaceApi.deleteSubmission,
  createFile: workspaceApi.createFile,
  updateFile: workspaceApi.updateFile,
  deleteFile: workspaceApi.deleteFile,
  createInvitation: workspaceApi.createInvitation,
  updateInvitation: workspaceApi.updateInvitation,
  deleteInvitation: workspaceApi.deleteInvitation,
  createHrRecord: workspaceApi.createHrRecord,
  updateHrRecord: workspaceApi.updateHrRecord,
  deleteHrRecord: workspaceApi.deleteHrRecord,
};

function resolveOptions(input) {
  if (
    input &&
    typeof input === 'object' &&
    !Array.isArray(input) &&
    (Object.prototype.hasOwnProperty.call(input, 'userId') ||
      Object.prototype.hasOwnProperty.call(input, 'projectId') ||
      Object.prototype.hasOwnProperty.call(input, 'enabled') ||
      Object.prototype.hasOwnProperty.call(input, 'autoLoad'))
  ) {
    return {
      userId: input.userId ?? null,
      projectId: input.projectId ?? null,
      enabled: input.enabled ?? true,
      autoLoad: input.autoLoad ?? true,
    };
  }

  return {
    userId: input ?? null,
    projectId: null,
    enabled: true,
    autoLoad: true,
  };
}

export default function useProjectWorkspace(input) {
  const { userId, projectId, enabled, autoLoad } = resolveOptions(input);
  const isProjectContext = Boolean(projectId);
  const isUserContext = !isProjectContext && Boolean(userId);
  const shouldLoad = Boolean(enabled && autoLoad && (userId || projectId));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(shouldLoad);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);

  const isMountedRef = useRef(true);
  const activeControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    };
  }, []);

  const load = useCallback(
    async ({ signal: externalSignal } = {}) => {
      if (!enabled || (!userId && !projectId)) {
        if (isMountedRef.current) {
          setLoading(false);
          setError(null);
        }
        return null;
      }

      const controller = externalSignal ? null : new AbortController();
      const signal = externalSignal ?? controller.signal;

      if (!externalSignal) {
        activeControllerRef.current?.abort();
        activeControllerRef.current = controller;
      }

      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const snapshot = isProjectContext
          ? await projectsService.fetchProjectWorkspace(projectId, { signal })
          : await workspaceApi.fetchProjectWorkspace(userId, { signal });

        if (!isMountedRef.current || signal.aborted) {
          return null;
        }

        setData(snapshot);
        setError(null);
        return snapshot;
      } catch (err) {
        if (signal.aborted) {
          return null;
        }
        const normalisedError = err instanceof Error ? err : new Error('Unable to load project workspace.');
        if (isMountedRef.current) {
          setError(normalisedError);
        }
        throw normalisedError;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        if (!externalSignal && activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
      }
    },
    [enabled, isProjectContext, projectId, userId],
  );

  useEffect(() => {
    if (!shouldLoad) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    load({ signal: controller.signal }).catch((err) => {
      if (err?.name === 'AbortError') {
        return;
      }
      // Error state handled by hook.
    });

    return () => {
      controller.abort();
    };
  }, [load, shouldLoad]);

  const canManage = useMemo(() => {
    if (!isUserContext) {
      return false;
    }
    return data?.access?.canManage !== false;
  }, [data?.access?.canManage, isUserContext]);

  const ensureManageAccess = useCallback(() => {
    if (!isUserContext) {
      throw new Error('Workspace management actions require a user context.');
    }
    if (!userId) {
      throw new Error('A userId is required to manage the project workspace.');
    }
    if (!canManage) {
      throw new Error(
        data?.access?.reason || 'You do not have permission to manage this project workspace.',
      );
    }
  }, [canManage, data?.access?.reason, isUserContext, userId]);

  const runAndReload = useCallback(
    async (executor) => {
      ensureManageAccess();
      setMutating(true);
      try {
        const result = await executor();
        await load();
        return result;
      } finally {
        if (isMountedRef.current) {
          setMutating(false);
        }
      }
    },
    [ensureManageAccess, load],
  );

  const actions = useMemo(() => {
    if (!isUserContext) {
      return null;
    }

    const wrapped = {};
    Object.entries(MANAGEMENT_ACTIONS).forEach(([name, handler]) => {
      wrapped[name] = async (...args) => runAndReload(() => handler(userId, ...args));
    });
    return wrapped;
  }, [isUserContext, runAndReload, userId]);

  return {
    data,
    loading,
    error,
    mutating,
    canManage,
    actions,
    reload: load,
  };
}
