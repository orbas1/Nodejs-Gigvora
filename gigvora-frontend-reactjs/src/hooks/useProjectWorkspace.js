import { useCallback, useEffect, useMemo, useState } from 'react';
import * as workspaceApi from '../services/projectWorkspace.js';

export default function useProjectWorkspace(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await workspaceApi.fetchProjectWorkspace(userId);
      setData(snapshot);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = data?.access?.canManage !== false;

  const ensureManageAccess = useCallback(() => {
    if (!canManage) {
      throw new Error(
        data?.access?.reason || 'You do not have permission to manage this project workspace.',
      );
    }
  }, [canManage, data?.access?.reason]);

  const actions = useMemo(
    () => ({
      async createProject(payload) {
        ensureManageAccess();
        await workspaceApi.createWorkspaceProject(userId, payload);
        await load();
      },
      async updateProject(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.updateWorkspaceProject(userId, projectId, payload);
        await load();
      },
      async createBudgetLine(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createBudgetLine(userId, projectId, payload);
        await load();
      },
      async updateBudgetLine(projectId, budgetLineId, payload) {
        ensureManageAccess();
        await workspaceApi.updateBudgetLine(userId, projectId, budgetLineId, payload);
        await load();
      },
      async deleteBudgetLine(projectId, budgetLineId) {
        ensureManageAccess();
        await workspaceApi.deleteBudgetLine(userId, projectId, budgetLineId);
        await load();
      },
      async createDeliverable(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createDeliverable(userId, projectId, payload);
        await load();
      },
      async updateDeliverable(projectId, deliverableId, payload) {
        ensureManageAccess();
        await workspaceApi.updateDeliverable(userId, projectId, deliverableId, payload);
        await load();
      },
      async deleteDeliverable(projectId, deliverableId) {
        ensureManageAccess();
        await workspaceApi.deleteDeliverable(userId, projectId, deliverableId);
        await load();
      },
      async createTask(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createTask(userId, projectId, payload);
        await load();
      },
      async updateTask(projectId, taskId, payload) {
        ensureManageAccess();
        await workspaceApi.updateTask(userId, projectId, taskId, payload);
        await load();
      },
      async deleteTask(projectId, taskId) {
        ensureManageAccess();
        await workspaceApi.deleteTask(userId, projectId, taskId);
        await load();
      },
      async createTaskAssignment(projectId, taskId, payload) {
        ensureManageAccess();
        await workspaceApi.createTaskAssignment(userId, projectId, taskId, payload);
        await load();
      },
      async updateTaskAssignment(projectId, taskId, assignmentId, payload) {
        ensureManageAccess();
        await workspaceApi.updateTaskAssignment(userId, projectId, taskId, assignmentId, payload);
        await load();
      },
      async deleteTaskAssignment(projectId, taskId, assignmentId) {
        ensureManageAccess();
        await workspaceApi.deleteTaskAssignment(userId, projectId, taskId, assignmentId);
        await load();
      },
      async createTaskDependency(projectId, taskId, payload) {
        ensureManageAccess();
        await workspaceApi.createTaskDependency(userId, projectId, taskId, payload);
        await load();
      },
      async deleteTaskDependency(projectId, taskId, dependencyId) {
        ensureManageAccess();
        await workspaceApi.deleteTaskDependency(userId, projectId, taskId, dependencyId);
        await load();
      },
      async createChatMessage(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createChatMessage(userId, projectId, payload);
        await load();
      },
      async updateChatMessage(projectId, messageId, payload) {
        ensureManageAccess();
        await workspaceApi.updateChatMessage(userId, projectId, messageId, payload);
        await load();
      },
      async deleteChatMessage(projectId, messageId) {
        ensureManageAccess();
        await workspaceApi.deleteChatMessage(userId, projectId, messageId);
        await load();
      },
      async createTimelineEntry(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createTimelineEntry(userId, projectId, payload);
        await load();
      },
      async updateTimelineEntry(projectId, entryId, payload) {
        ensureManageAccess();
        await workspaceApi.updateTimelineEntry(userId, projectId, entryId, payload);
        await load();
      },
      async deleteTimelineEntry(projectId, entryId) {
        ensureManageAccess();
        await workspaceApi.deleteTimelineEntry(userId, projectId, entryId);
        await load();
      },
      async createMeeting(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createMeeting(userId, projectId, payload);
        await load();
      },
      async updateMeeting(projectId, meetingId, payload) {
        ensureManageAccess();
        await workspaceApi.updateMeeting(userId, projectId, meetingId, payload);
        await load();
      },
      async deleteMeeting(projectId, meetingId) {
        ensureManageAccess();
        await workspaceApi.deleteMeeting(userId, projectId, meetingId);
        await load();
      },
      async createCalendarEvent(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createCalendarEvent(userId, projectId, payload);
        await load();
      },
      async updateCalendarEvent(projectId, eventId, payload) {
        ensureManageAccess();
        await workspaceApi.updateCalendarEvent(userId, projectId, eventId, payload);
        await load();
      },
      async deleteCalendarEvent(projectId, eventId) {
        ensureManageAccess();
        await workspaceApi.deleteCalendarEvent(userId, projectId, eventId);
        await load();
      },
      async createRoleDefinition(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createRoleDefinition(userId, projectId, payload);
        await load();
      },
      async updateRoleDefinition(projectId, roleId, payload) {
        ensureManageAccess();
        await workspaceApi.updateRoleDefinition(userId, projectId, roleId, payload);
        await load();
      },
      async deleteRoleDefinition(projectId, roleId) {
        ensureManageAccess();
        await workspaceApi.deleteRoleDefinition(userId, projectId, roleId);
        await load();
      },
      async createRoleAssignment(projectId, roleId, payload) {
        ensureManageAccess();
        await workspaceApi.createRoleAssignment(userId, projectId, roleId, payload);
        await load();
      },
      async updateRoleAssignment(projectId, roleId, assignmentId, payload) {
        ensureManageAccess();
        await workspaceApi.updateRoleAssignment(userId, projectId, roleId, assignmentId, payload);
        await load();
      },
      async deleteRoleAssignment(projectId, roleId, assignmentId) {
        ensureManageAccess();
        await workspaceApi.deleteRoleAssignment(userId, projectId, roleId, assignmentId);
        await load();
      },
      async createSubmission(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createSubmission(userId, projectId, payload);
        await load();
      },
      async updateSubmission(projectId, submissionId, payload) {
        ensureManageAccess();
        await workspaceApi.updateSubmission(userId, projectId, submissionId, payload);
        await load();
      },
      async deleteSubmission(projectId, submissionId) {
        ensureManageAccess();
        await workspaceApi.deleteSubmission(userId, projectId, submissionId);
        await load();
      },
      async createFile(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createFile(userId, projectId, payload);
        await load();
      },
      async updateFile(projectId, fileId, payload) {
        ensureManageAccess();
        await workspaceApi.updateFile(userId, projectId, fileId, payload);
        await load();
      },
      async deleteFile(projectId, fileId) {
        ensureManageAccess();
        await workspaceApi.deleteFile(userId, projectId, fileId);
        await load();
      },
      async createInvitation(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createInvitation(userId, projectId, payload);
        await load();
      },
      async updateInvitation(projectId, invitationId, payload) {
        ensureManageAccess();
        await workspaceApi.updateInvitation(userId, projectId, invitationId, payload);
        await load();
      },
      async deleteInvitation(projectId, invitationId) {
        ensureManageAccess();
        await workspaceApi.deleteInvitation(userId, projectId, invitationId);
        await load();
      },
      async createHrRecord(projectId, payload) {
        ensureManageAccess();
        await workspaceApi.createHrRecord(userId, projectId, payload);
        await load();
      },
      async updateHrRecord(projectId, hrRecordId, payload) {
        ensureManageAccess();
        await workspaceApi.updateHrRecord(userId, projectId, hrRecordId, payload);
        await load();
      },
      async deleteHrRecord(projectId, hrRecordId) {
        ensureManageAccess();
        await workspaceApi.deleteHrRecord(userId, projectId, hrRecordId);
        await load();
      },
    }),
    [ensureManageAccess, load, userId],
  );

  return {
    data,
    loading,
    error,
    actions,
    reload: load,
  };
}
