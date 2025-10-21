import { useCallback, useMemo, useRef, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import projectOperationsService, {
  fetchProjectOperations,
} from '../services/projectOperations.js';

const DEMO_OPERATIONS_SNAPSHOT = Object.freeze({
  summary: {
    status: 'demo',
    healthScore: 86,
    variance: {
      scope: 2,
      budget: 5,
      schedule: 8,
    },
    nextMilestone: {
      title: 'Integrate analytics pipeline',
      dueAt: '2024-05-02T12:00:00Z',
    },
  },
  access: {
    canManage: true,
    canViewFinancials: true,
    reason: null,
  },
  budgets: [
    {
      id: 'demo-budget',
      label: 'Delivery sprint',
      allocated: 45000,
      consumed: 31200,
      currency: 'GBP',
      updatedAt: '2024-04-14T10:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'demo-task',
      title: 'Ship onboarding flow',
      status: 'in_progress',
      assignees: ['Jordan Blake'],
      dueAt: '2024-04-21T17:00:00Z',
    },
  ],
});

function normaliseProjectId(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'object' && 'projectId' in value) {
    return normaliseProjectId(value.projectId);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number.parseInt(trimmed, 10);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }

  return null;
}

function buildManagementActions(projectId, runMutation) {
  if (!projectId) {
    return null;
  }

  const wrap = (fn) => (...args) => runMutation(() => fn(projectId, ...args));

  return {
    updateOperations: wrap(projectOperationsService.updateProjectOperations),
    addTask: wrap(projectOperationsService.addProjectTask),
    updateTask: wrap(projectOperationsService.updateProjectTask),
    deleteTask: wrap(projectOperationsService.deleteProjectTask),
    createBudget: wrap(projectOperationsService.createProjectBudget),
    updateBudget: wrap(projectOperationsService.updateProjectBudget),
    deleteBudget: wrap(projectOperationsService.deleteProjectBudget),
    createObject: wrap(projectOperationsService.createProjectObject),
    updateObject: wrap(projectOperationsService.updateProjectObject),
    deleteObject: wrap(projectOperationsService.deleteProjectObject),
    createTimelineEvent: wrap(projectOperationsService.createProjectTimelineEvent),
    updateTimelineEvent: wrap(projectOperationsService.updateProjectTimelineEvent),
    deleteTimelineEvent: wrap(projectOperationsService.deleteProjectTimelineEvent),
    createMeeting: wrap(projectOperationsService.createProjectMeeting),
    updateMeeting: wrap(projectOperationsService.updateProjectMeeting),
    deleteMeeting: wrap(projectOperationsService.deleteProjectMeeting),
    createCalendarEntry: wrap(projectOperationsService.createProjectCalendarEntry),
    updateCalendarEntry: wrap(projectOperationsService.updateProjectCalendarEntry),
    deleteCalendarEntry: wrap(projectOperationsService.deleteProjectCalendarEntry),
    createRole: wrap(projectOperationsService.createProjectRole),
    updateRole: wrap(projectOperationsService.updateProjectRole),
    deleteRole: wrap(projectOperationsService.deleteProjectRole),
    createSubmission: wrap(projectOperationsService.createProjectSubmission),
    updateSubmission: wrap(projectOperationsService.updateProjectSubmission),
    deleteSubmission: wrap(projectOperationsService.deleteProjectSubmission),
    createInvite: wrap(projectOperationsService.createProjectInvite),
    updateInvite: wrap(projectOperationsService.updateProjectInvite),
    deleteInvite: wrap(projectOperationsService.deleteProjectInvite),
    createHrRecord: wrap(projectOperationsService.createProjectHrRecord),
    updateHrRecord: wrap(projectOperationsService.updateProjectHrRecord),
    deleteHrRecord: wrap(projectOperationsService.deleteProjectHrRecord),
    createTimeLog: wrap(projectOperationsService.createProjectTimeLog),
    updateTimeLog: wrap(projectOperationsService.updateProjectTimeLog),
    deleteTimeLog: wrap(projectOperationsService.deleteProjectTimeLog),
    createTarget: wrap(projectOperationsService.createProjectTarget),
    updateTarget: wrap(projectOperationsService.updateProjectTarget),
    deleteTarget: wrap(projectOperationsService.deleteProjectTarget),
    createObjective: wrap(projectOperationsService.createProjectObjective),
    updateObjective: wrap(projectOperationsService.updateProjectObjective),
    deleteObjective: wrap(projectOperationsService.deleteProjectObjective),
    postConversationMessage: wrap(projectOperationsService.postConversationMessage),
    createFile: wrap(projectOperationsService.createProjectFile),
    updateFile: wrap(projectOperationsService.updateProjectFile),
    deleteFile: wrap(projectOperationsService.deleteProjectFile),
  };
}

export function useProjectOperations(params = {}) {
  const options = typeof params === 'object' && !Array.isArray(params) ? params : { projectId: params };
  const {
    projectId: rawProjectId,
    enabled = true,
    fallback = DEMO_OPERATIONS_SNAPSHOT,
    refreshOnMount = true,
  } = options;

  const projectId = useMemo(() => normaliseProjectId(rawProjectId), [rawProjectId]);
  const [mutating, setMutating] = useState(false);
  const lastMutationRef = useRef(null);

  const cacheKey = useMemo(() => {
    if (!projectId) return 'projects:operations:none';
    return `projects:operations:${projectId}`;
  }, [projectId]);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!projectId) {
        return fallback ?? null;
      }
      return fetchProjectOperations(projectId, { signal });
    },
    [fallback, projectId],
  );

  const shouldFetch = Boolean(enabled && projectId);

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: refreshOnMount ? shouldFetch : false,
    dependencies: [projectId, shouldFetch, refreshOnMount],
    ttl: 1000 * 45,
  });

  const resolvedData = resource.data ?? fallback ?? null;
  const access = resolvedData?.access ?? { canManage: false, reason: null };

  const guardMutation = useCallback(() => {
    if (!projectId) {
      throw new Error('A project context is required for this action.');
    }
    if (!access?.canManage) {
      throw new Error(access?.reason || 'You do not have permission to manage this project.');
    }
  }, [access?.canManage, access?.reason, projectId]);

  const runMutation = useCallback(
    async (executor, { skipRefresh = false } = {}) => {
      guardMutation();
      const mutationToken = Symbol('project-operations-mutation');
      lastMutationRef.current = mutationToken;
      setMutating(true);
      try {
        const result = await executor();
        if (!skipRefresh) {
          await resource.refresh({ force: true });
        }
        return result;
      } finally {
        if (lastMutationRef.current === mutationToken) {
          setMutating(false);
        }
      }
    },
    [guardMutation, resource],
  );

  const managementActions = useMemo(
    () => buildManagementActions(projectId, runMutation),
    [projectId, runMutation],
  );

  return {
    ...resource,
    projectId,
    data: resolvedData,
    access,
    canManage: Boolean(access?.canManage),
    mutating,
    actions: managementActions,
    runAction: runMutation,
  };
}

export default useProjectOperations;
