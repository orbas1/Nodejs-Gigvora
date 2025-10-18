import { useCallback, useMemo } from 'react';
import useProjectOperations from './useProjectOperations.js';
import projectOperationsService from '../services/projectOperations.js';

function noopPromise() {
  return Promise.resolve(null);
}

export default function useProjectOperationsManager({ projectId, enabled = true } = {}) {
  const state = useProjectOperations({ projectId, enabled });
  const { refresh } = state;

  const runAndRefresh = useCallback(
    async (operation = noopPromise, { skipRefresh = false } = {}) => {
      if (!projectId) {
        throw new Error('projectId is required');
      }
      const result = await operation();
      if (!skipRefresh) {
        await refresh({ force: true });
      }
      return result;
    },
    [projectId, refresh],
  );

  return useMemo(() => {
    return {
      ...state,
      projectId,
      hasProject: Boolean(projectId),
      refreshOperations: refresh,
      updateOperations: (payload) => runAndRefresh(() => projectOperationsService.updateProjectOperations(projectId, payload)),
      addTask: (payload) => runAndRefresh(() => projectOperationsService.addProjectTask(projectId, payload)),
      updateTask: (taskId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectTask(projectId, taskId, payload)),
      deleteTask: (taskId) => runAndRefresh(() => projectOperationsService.deleteProjectTask(projectId, taskId)),
      createBudget: (payload) => runAndRefresh(() => projectOperationsService.createProjectBudget(projectId, payload)),
      updateBudget: (budgetId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectBudget(projectId, budgetId, payload)),
      deleteBudget: (budgetId) => runAndRefresh(() => projectOperationsService.deleteProjectBudget(projectId, budgetId)),
      createObject: (payload) => runAndRefresh(() => projectOperationsService.createProjectObject(projectId, payload)),
      updateObject: (objectId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectObject(projectId, objectId, payload)),
      deleteObject: (objectId) => runAndRefresh(() => projectOperationsService.deleteProjectObject(projectId, objectId)),
      createTimelineEvent: (payload) =>
        runAndRefresh(() => projectOperationsService.createProjectTimelineEvent(projectId, payload)),
      updateTimelineEvent: (eventId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectTimelineEvent(projectId, eventId, payload)),
      deleteTimelineEvent: (eventId) =>
        runAndRefresh(() => projectOperationsService.deleteProjectTimelineEvent(projectId, eventId)),
      createMeeting: (payload) => runAndRefresh(() => projectOperationsService.createProjectMeeting(projectId, payload)),
      updateMeeting: (meetingId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectMeeting(projectId, meetingId, payload)),
      deleteMeeting: (meetingId) => runAndRefresh(() => projectOperationsService.deleteProjectMeeting(projectId, meetingId)),
      createCalendarEntry: (payload) =>
        runAndRefresh(() => projectOperationsService.createProjectCalendarEntry(projectId, payload)),
      updateCalendarEntry: (entryId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectCalendarEntry(projectId, entryId, payload)),
      deleteCalendarEntry: (entryId) =>
        runAndRefresh(() => projectOperationsService.deleteProjectCalendarEntry(projectId, entryId)),
      createRole: (payload) => runAndRefresh(() => projectOperationsService.createProjectRole(projectId, payload)),
      updateRole: (roleId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectRole(projectId, roleId, payload)),
      deleteRole: (roleId) => runAndRefresh(() => projectOperationsService.deleteProjectRole(projectId, roleId)),
      createSubmission: (payload) =>
        runAndRefresh(() => projectOperationsService.createProjectSubmission(projectId, payload)),
      updateSubmission: (submissionId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectSubmission(projectId, submissionId, payload)),
      deleteSubmission: (submissionId) =>
        runAndRefresh(() => projectOperationsService.deleteProjectSubmission(projectId, submissionId)),
      createInvite: (payload) => runAndRefresh(() => projectOperationsService.createProjectInvite(projectId, payload)),
      updateInvite: (inviteId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectInvite(projectId, inviteId, payload)),
      deleteInvite: (inviteId) => runAndRefresh(() => projectOperationsService.deleteProjectInvite(projectId, inviteId)),
      createHrRecord: (payload) => runAndRefresh(() => projectOperationsService.createProjectHrRecord(projectId, payload)),
      updateHrRecord: (recordId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectHrRecord(projectId, recordId, payload)),
      deleteHrRecord: (recordId) => runAndRefresh(() => projectOperationsService.deleteProjectHrRecord(projectId, recordId)),
      createTimeLog: (payload) => runAndRefresh(() => projectOperationsService.createProjectTimeLog(projectId, payload)),
      updateTimeLog: (logId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectTimeLog(projectId, logId, payload)),
      deleteTimeLog: (logId) => runAndRefresh(() => projectOperationsService.deleteProjectTimeLog(projectId, logId)),
      createTarget: (payload) => runAndRefresh(() => projectOperationsService.createProjectTarget(projectId, payload)),
      updateTarget: (targetId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectTarget(projectId, targetId, payload)),
      deleteTarget: (targetId) => runAndRefresh(() => projectOperationsService.deleteProjectTarget(projectId, targetId)),
      createObjective: (payload) => runAndRefresh(() => projectOperationsService.createProjectObjective(projectId, payload)),
      updateObjective: (objectiveId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectObjective(projectId, objectiveId, payload)),
      deleteObjective: (objectiveId) =>
        runAndRefresh(() => projectOperationsService.deleteProjectObjective(projectId, objectiveId)),
      postConversationMessage: (conversationId, payload) =>
        runAndRefresh(
          () => projectOperationsService.postConversationMessage(projectId, conversationId, payload),
          { skipRefresh: false },
        ),
      createFile: (payload) => runAndRefresh(() => projectOperationsService.createProjectFile(projectId, payload)),
      updateFile: (fileId, payload) =>
        runAndRefresh(() => projectOperationsService.updateProjectFile(projectId, fileId, payload)),
      deleteFile: (fileId) => runAndRefresh(() => projectOperationsService.deleteProjectFile(projectId, fileId)),
    };
  }, [projectId, runAndRefresh, state, refresh]);
}
