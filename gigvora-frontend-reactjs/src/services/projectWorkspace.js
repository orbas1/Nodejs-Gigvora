import { apiClient } from './apiClient.js';

function basePath(userId) {
  if (!userId) {
    throw new Error('userId is required for workspace operations.');
  }
  return `/users/${userId}/project-workspace`;
}

export function fetchProjectWorkspace(userId, { signal } = {}) {
  return apiClient.get(basePath(userId), { signal });
}

export function createWorkspaceProject(userId, payload) {
  return apiClient.post(`${basePath(userId)}/projects`, payload);
}

export function updateWorkspaceProject(userId, projectId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}`, payload);
}

export function createBudgetLine(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/budget-lines`, payload);
}

export function updateBudgetLine(userId, projectId, budgetLineId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/budget-lines/${budgetLineId}`,
    payload,
  );
}

export function deleteBudgetLine(userId, projectId, budgetLineId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/budget-lines/${budgetLineId}`);
}

export function createDeliverable(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/deliverables`, payload);
}

export function updateDeliverable(userId, projectId, deliverableId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/deliverables/${deliverableId}`,
    payload,
  );
}

export function deleteDeliverable(userId, projectId, deliverableId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/deliverables/${deliverableId}`);
}

export function createTask(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/tasks`, payload);
}

export function updateTask(userId, projectId, taskId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}/tasks/${taskId}`, payload);
}

export function deleteTask(userId, projectId, taskId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/tasks/${taskId}`);
}

export function createTaskAssignment(userId, projectId, taskId, payload) {
  return apiClient.post(
    `${basePath(userId)}/projects/${projectId}/tasks/${taskId}/assignments`,
    payload,
  );
}

export function updateTaskAssignment(userId, projectId, taskId, assignmentId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/tasks/${taskId}/assignments/${assignmentId}`,
    payload,
  );
}

export function deleteTaskAssignment(userId, projectId, taskId, assignmentId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/tasks/${taskId}/assignments/${assignmentId}`,
  );
}

export function createTaskDependency(userId, projectId, taskId, payload) {
  return apiClient.post(
    `${basePath(userId)}/projects/${projectId}/tasks/${taskId}/dependencies`,
    payload,
  );
}

export function deleteTaskDependency(userId, projectId, taskId, dependencyId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`,
  );
}

export function createChatMessage(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/chat/messages`, payload);
}

export function updateChatMessage(userId, projectId, messageId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/chat/messages/${messageId}`,
    payload,
  );
}

export function deleteChatMessage(userId, projectId, messageId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/chat/messages/${messageId}`);
}

export function createTimelineEntry(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/timeline`, payload);
}

export function updateTimelineEntry(userId, projectId, entryId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}/timeline/${entryId}`, payload);
}

export function deleteTimelineEntry(userId, projectId, entryId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/timeline/${entryId}`);
}

export function createMeeting(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/meetings`, payload);
}

export function updateMeeting(userId, projectId, meetingId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}/meetings/${meetingId}`, payload);
}

export function deleteMeeting(userId, projectId, meetingId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/meetings/${meetingId}`);
}

export function createCalendarEvent(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/calendar-events`, payload);
}

export function updateCalendarEvent(userId, projectId, eventId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/calendar-events/${eventId}`,
    payload,
  );
}

export function deleteCalendarEvent(userId, projectId, eventId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/calendar-events/${eventId}`,
  );
}

export function createRoleDefinition(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/roles`, payload);
}

export function updateRoleDefinition(userId, projectId, roleId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}/roles/${roleId}`, payload);
}

export function deleteRoleDefinition(userId, projectId, roleId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/roles/${roleId}`);
}

export function createRoleAssignment(userId, projectId, roleId, payload) {
  return apiClient.post(
    `${basePath(userId)}/projects/${projectId}/roles/${roleId}/assignments`,
    payload,
  );
}

export function updateRoleAssignment(userId, projectId, roleId, assignmentId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/roles/${roleId}/assignments/${assignmentId}`,
    payload,
  );
}

export function deleteRoleAssignment(userId, projectId, roleId, assignmentId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/roles/${roleId}/assignments/${assignmentId}`,
  );
}

export function createSubmission(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/submissions`, payload);
}

export function updateSubmission(userId, projectId, submissionId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/submissions/${submissionId}`,
    payload,
  );
}

export function deleteSubmission(userId, projectId, submissionId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/submissions/${submissionId}`,
  );
}

export function createFile(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/files`, payload);
}

export function updateFile(userId, projectId, fileId, payload) {
  return apiClient.patch(`${basePath(userId)}/projects/${projectId}/files/${fileId}`, payload);
}

export function deleteFile(userId, projectId, fileId) {
  return apiClient.delete(`${basePath(userId)}/projects/${projectId}/files/${fileId}`);
}

export function createInvitation(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/invitations`, payload);
}

export function updateInvitation(userId, projectId, invitationId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/invitations/${invitationId}`,
    payload,
  );
}

export function deleteInvitation(userId, projectId, invitationId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/invitations/${invitationId}`,
  );
}

export function createHrRecord(userId, projectId, payload) {
  return apiClient.post(`${basePath(userId)}/projects/${projectId}/hr-records`, payload);
}

export function updateHrRecord(userId, projectId, hrRecordId, payload) {
  return apiClient.patch(
    `${basePath(userId)}/projects/${projectId}/hr-records/${hrRecordId}`,
    payload,
  );
}

export function deleteHrRecord(userId, projectId, hrRecordId) {
  return apiClient.delete(
    `${basePath(userId)}/projects/${projectId}/hr-records/${hrRecordId}`,
  );
}

export default {
  fetchProjectWorkspace,
  createWorkspaceProject,
  updateWorkspaceProject,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  createTask,
  updateTask,
  deleteTask,
  createTaskAssignment,
  updateTaskAssignment,
  deleteTaskAssignment,
  createTaskDependency,
  deleteTaskDependency,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createRoleDefinition,
  updateRoleDefinition,
  deleteRoleDefinition,
  createRoleAssignment,
  updateRoleAssignment,
  deleteRoleAssignment,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  createFile,
  updateFile,
  deleteFile,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  createHrRecord,
  updateHrRecord,
  deleteHrRecord,
};
