import { apiClient } from './apiClient.js';

function requireProjectId(projectId) {
  if (!projectId) {
    throw new Error('projectId is required');
  }
}

function requireIdentifier(name, value) {
  if (!value && value !== 0) {
    throw new Error(`${name} is required`);
  }
}

export function fetchProjectOperations(projectId, { signal } = {}) {
  requireProjectId(projectId);
  return apiClient.get(`/projects/${projectId}/operations`, { signal });
}

export function updateProjectOperations(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.put(`/projects/${projectId}/operations`, payload);
}

export function addProjectTask(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/tasks`, payload);
}

export function updateProjectTask(projectId, taskId, payload) {
  requireProjectId(projectId);
  requireIdentifier('taskId', taskId);
  return apiClient.patch(`/projects/${projectId}/operations/tasks/${taskId}`, payload);
}

export function deleteProjectTask(projectId, taskId) {
  requireProjectId(projectId);
  requireIdentifier('taskId', taskId);
  return apiClient.delete(`/projects/${projectId}/operations/tasks/${taskId}`);
}

export function createProjectBudget(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/budgets`, payload);
}

export function updateProjectBudget(projectId, budgetId, payload) {
  requireProjectId(projectId);
  requireIdentifier('budgetId', budgetId);
  return apiClient.patch(`/projects/${projectId}/operations/budgets/${budgetId}`, payload);
}

export function deleteProjectBudget(projectId, budgetId) {
  requireProjectId(projectId);
  requireIdentifier('budgetId', budgetId);
  return apiClient.delete(`/projects/${projectId}/operations/budgets/${budgetId}`);
}

export function createProjectObject(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/objects`, payload);
}

export function updateProjectObject(projectId, objectId, payload) {
  requireProjectId(projectId);
  requireIdentifier('objectId', objectId);
  return apiClient.patch(`/projects/${projectId}/operations/objects/${objectId}`, payload);
}

export function deleteProjectObject(projectId, objectId) {
  requireProjectId(projectId);
  requireIdentifier('objectId', objectId);
  return apiClient.delete(`/projects/${projectId}/operations/objects/${objectId}`);
}

export function createProjectTimelineEvent(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/timeline/events`, payload);
}

export function updateProjectTimelineEvent(projectId, eventId, payload) {
  requireProjectId(projectId);
  requireIdentifier('eventId', eventId);
  return apiClient.patch(`/projects/${projectId}/operations/timeline/events/${eventId}`, payload);
}

export function deleteProjectTimelineEvent(projectId, eventId) {
  requireProjectId(projectId);
  requireIdentifier('eventId', eventId);
  return apiClient.delete(`/projects/${projectId}/operations/timeline/events/${eventId}`);
}

export function createProjectMeeting(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/meetings`, payload);
}

export function updateProjectMeeting(projectId, meetingId, payload) {
  requireProjectId(projectId);
  requireIdentifier('meetingId', meetingId);
  return apiClient.patch(`/projects/${projectId}/operations/meetings/${meetingId}`, payload);
}

export function deleteProjectMeeting(projectId, meetingId) {
  requireProjectId(projectId);
  requireIdentifier('meetingId', meetingId);
  return apiClient.delete(`/projects/${projectId}/operations/meetings/${meetingId}`);
}

export function createProjectCalendarEntry(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/calendar`, payload);
}

export function updateProjectCalendarEntry(projectId, entryId, payload) {
  requireProjectId(projectId);
  requireIdentifier('entryId', entryId);
  return apiClient.patch(`/projects/${projectId}/operations/calendar/${entryId}`, payload);
}

export function deleteProjectCalendarEntry(projectId, entryId) {
  requireProjectId(projectId);
  requireIdentifier('entryId', entryId);
  return apiClient.delete(`/projects/${projectId}/operations/calendar/${entryId}`);
}

export function createProjectRole(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/roles`, payload);
}

export function updateProjectRole(projectId, roleId, payload) {
  requireProjectId(projectId);
  requireIdentifier('roleId', roleId);
  return apiClient.patch(`/projects/${projectId}/operations/roles/${roleId}`, payload);
}

export function deleteProjectRole(projectId, roleId) {
  requireProjectId(projectId);
  requireIdentifier('roleId', roleId);
  return apiClient.delete(`/projects/${projectId}/operations/roles/${roleId}`);
}

export function createProjectSubmission(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/submissions`, payload);
}

export function updateProjectSubmission(projectId, submissionId, payload) {
  requireProjectId(projectId);
  requireIdentifier('submissionId', submissionId);
  return apiClient.patch(`/projects/${projectId}/operations/submissions/${submissionId}`, payload);
}

export function deleteProjectSubmission(projectId, submissionId) {
  requireProjectId(projectId);
  requireIdentifier('submissionId', submissionId);
  return apiClient.delete(`/projects/${projectId}/operations/submissions/${submissionId}`);
}

export function createProjectInvite(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/invites`, payload);
}

export function updateProjectInvite(projectId, inviteId, payload) {
  requireProjectId(projectId);
  requireIdentifier('inviteId', inviteId);
  return apiClient.patch(`/projects/${projectId}/operations/invites/${inviteId}`, payload);
}

export function deleteProjectInvite(projectId, inviteId) {
  requireProjectId(projectId);
  requireIdentifier('inviteId', inviteId);
  return apiClient.delete(`/projects/${projectId}/operations/invites/${inviteId}`);
}

export function createProjectHrRecord(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/hr`, payload);
}

export function updateProjectHrRecord(projectId, recordId, payload) {
  requireProjectId(projectId);
  requireIdentifier('recordId', recordId);
  return apiClient.patch(`/projects/${projectId}/operations/hr/${recordId}`, payload);
}

export function deleteProjectHrRecord(projectId, recordId) {
  requireProjectId(projectId);
  requireIdentifier('recordId', recordId);
  return apiClient.delete(`/projects/${projectId}/operations/hr/${recordId}`);
}

export function createProjectTimeLog(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/time-logs`, payload);
}

export function updateProjectTimeLog(projectId, logId, payload) {
  requireProjectId(projectId);
  requireIdentifier('logId', logId);
  return apiClient.patch(`/projects/${projectId}/operations/time-logs/${logId}`, payload);
}

export function deleteProjectTimeLog(projectId, logId) {
  requireProjectId(projectId);
  requireIdentifier('logId', logId);
  return apiClient.delete(`/projects/${projectId}/operations/time-logs/${logId}`);
}

export function createProjectTarget(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/targets`, payload);
}

export function updateProjectTarget(projectId, targetId, payload) {
  requireProjectId(projectId);
  requireIdentifier('targetId', targetId);
  return apiClient.patch(`/projects/${projectId}/operations/targets/${targetId}`, payload);
}

export function deleteProjectTarget(projectId, targetId) {
  requireProjectId(projectId);
  requireIdentifier('targetId', targetId);
  return apiClient.delete(`/projects/${projectId}/operations/targets/${targetId}`);
}

export function createProjectObjective(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/objectives`, payload);
}

export function updateProjectObjective(projectId, objectiveId, payload) {
  requireProjectId(projectId);
  requireIdentifier('objectiveId', objectiveId);
  return apiClient.patch(`/projects/${projectId}/operations/objectives/${objectiveId}`, payload);
}

export function deleteProjectObjective(projectId, objectiveId) {
  requireProjectId(projectId);
  requireIdentifier('objectiveId', objectiveId);
  return apiClient.delete(`/projects/${projectId}/operations/objectives/${objectiveId}`);
}

export function postConversationMessage(projectId, conversationId, payload) {
  requireProjectId(projectId);
  requireIdentifier('conversationId', conversationId);
  return apiClient.post(
    `/projects/${projectId}/operations/conversations/${conversationId}/messages`,
    payload,
  );
}

export function createProjectFile(projectId, payload) {
  requireProjectId(projectId);
  return apiClient.post(`/projects/${projectId}/operations/files`, payload);
}

export function updateProjectFile(projectId, fileId, payload) {
  requireProjectId(projectId);
  requireIdentifier('fileId', fileId);
  return apiClient.patch(`/projects/${projectId}/operations/files/${fileId}`, payload);
}

export function deleteProjectFile(projectId, fileId) {
  requireProjectId(projectId);
  requireIdentifier('fileId', fileId);
  return apiClient.delete(`/projects/${projectId}/operations/files/${fileId}`);
}

export default {
  fetchProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
  createProjectBudget,
  updateProjectBudget,
  deleteProjectBudget,
  createProjectObject,
  updateProjectObject,
  deleteProjectObject,
  createProjectTimelineEvent,
  updateProjectTimelineEvent,
  deleteProjectTimelineEvent,
  createProjectMeeting,
  updateProjectMeeting,
  deleteProjectMeeting,
  createProjectCalendarEntry,
  updateProjectCalendarEntry,
  deleteProjectCalendarEntry,
  createProjectRole,
  updateProjectRole,
  deleteProjectRole,
  createProjectSubmission,
  updateProjectSubmission,
  deleteProjectSubmission,
  createProjectInvite,
  updateProjectInvite,
  deleteProjectInvite,
  createProjectHrRecord,
  updateProjectHrRecord,
  deleteProjectHrRecord,
  createProjectTimeLog,
  updateProjectTimeLog,
  deleteProjectTimeLog,
  createProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
  createProjectObjective,
  updateProjectObjective,
  deleteProjectObjective,
  postConversationMessage,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
};
