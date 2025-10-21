import { apiClient } from './apiClient.js';

const BASE_PATH = '/projects';

function ensureString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return `${value}`.trim();
}

function ensureProjectId(projectId) {
  return ensureIdentifier('projectId', projectId);
}

function ensureIdentifier(name, value) {
  const normalised = ensureString(value);
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return normalised;
}

function ensurePayload(payload) {
  if (payload == null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildPath(projectId, ...segments) {
  const safeProjectId = encodeURIComponent(ensureProjectId(projectId));
  const encodedSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureString(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const suffix = encodedSegments.length ? `/${encodedSegments.join('/')}` : '';
  return `${BASE_PATH}/${safeProjectId}/operations${suffix}`;
}

function call(method, projectId, segments, payload, options) {
  const path = buildPath(projectId, ...segments);
  const safeOptions = ensureOptions(options);

  if (method === 'get') {
    return apiClient.get(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  if (method === 'delete') {
    return apiClient.delete(path, Object.keys(safeOptions).length ? safeOptions : undefined);
  }

  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const body = ensurePayload(payload);
  return client(path, body, Object.keys(safeOptions).length ? safeOptions : undefined);
}

export function fetchProjectOperations(projectId, options = {}) {
  const { signal, ...rest } = ensureOptions(options);
  const requestOptions = { ...rest };
  if (signal) {
    requestOptions.signal = signal;
  }
  return call('get', projectId, [], undefined, requestOptions);
}

export function updateProjectOperations(projectId, payload, options = {}) {
  return call('put', projectId, [], payload, options);
}

export function addProjectTask(projectId, payload, options = {}) {
  return call('post', projectId, ['tasks'], payload, options);
}

export function updateProjectTask(projectId, taskId, payload, options = {}) {
  return call('patch', projectId, ['tasks', ensureIdentifier('taskId', taskId)], payload, options);
}

export function deleteProjectTask(projectId, taskId, options = {}) {
  return call('delete', projectId, ['tasks', ensureIdentifier('taskId', taskId)], undefined, options);
}

export function createProjectBudget(projectId, payload, options = {}) {
  return call('post', projectId, ['budgets'], payload, options);
}

export function updateProjectBudget(projectId, budgetId, payload, options = {}) {
  return call('patch', projectId, ['budgets', ensureIdentifier('budgetId', budgetId)], payload, options);
}

export function deleteProjectBudget(projectId, budgetId, options = {}) {
  return call('delete', projectId, ['budgets', ensureIdentifier('budgetId', budgetId)], undefined, options);
}

export function createProjectObject(projectId, payload, options = {}) {
  return call('post', projectId, ['objects'], payload, options);
}

export function updateProjectObject(projectId, objectId, payload, options = {}) {
  return call('patch', projectId, ['objects', ensureIdentifier('objectId', objectId)], payload, options);
}

export function deleteProjectObject(projectId, objectId, options = {}) {
  return call('delete', projectId, ['objects', ensureIdentifier('objectId', objectId)], undefined, options);
}

export function createProjectTimelineEvent(projectId, payload, options = {}) {
  return call('post', projectId, ['timeline', 'events'], payload, options);
}

export function updateProjectTimelineEvent(projectId, eventId, payload, options = {}) {
  return call('patch', projectId, ['timeline', 'events', ensureIdentifier('eventId', eventId)], payload, options);
}

export function deleteProjectTimelineEvent(projectId, eventId, options = {}) {
  return call('delete', projectId, ['timeline', 'events', ensureIdentifier('eventId', eventId)], undefined, options);
}

export function createProjectMeeting(projectId, payload, options = {}) {
  return call('post', projectId, ['meetings'], payload, options);
}

export function updateProjectMeeting(projectId, meetingId, payload, options = {}) {
  return call('patch', projectId, ['meetings', ensureIdentifier('meetingId', meetingId)], payload, options);
}

export function deleteProjectMeeting(projectId, meetingId, options = {}) {
  return call('delete', projectId, ['meetings', ensureIdentifier('meetingId', meetingId)], undefined, options);
}

export function createProjectCalendarEntry(projectId, payload, options = {}) {
  return call('post', projectId, ['calendar'], payload, options);
}

export function updateProjectCalendarEntry(projectId, entryId, payload, options = {}) {
  return call('patch', projectId, ['calendar', ensureIdentifier('entryId', entryId)], payload, options);
}

export function deleteProjectCalendarEntry(projectId, entryId, options = {}) {
  return call('delete', projectId, ['calendar', ensureIdentifier('entryId', entryId)], undefined, options);
}

export function createProjectRole(projectId, payload, options = {}) {
  return call('post', projectId, ['roles'], payload, options);
}

export function updateProjectRole(projectId, roleId, payload, options = {}) {
  return call('patch', projectId, ['roles', ensureIdentifier('roleId', roleId)], payload, options);
}

export function deleteProjectRole(projectId, roleId, options = {}) {
  return call('delete', projectId, ['roles', ensureIdentifier('roleId', roleId)], undefined, options);
}

export function createProjectSubmission(projectId, payload, options = {}) {
  return call('post', projectId, ['submissions'], payload, options);
}

export function updateProjectSubmission(projectId, submissionId, payload, options = {}) {
  return call('patch', projectId, ['submissions', ensureIdentifier('submissionId', submissionId)], payload, options);
}

export function deleteProjectSubmission(projectId, submissionId, options = {}) {
  return call('delete', projectId, ['submissions', ensureIdentifier('submissionId', submissionId)], undefined, options);
}

export function createProjectInvite(projectId, payload, options = {}) {
  return call('post', projectId, ['invites'], payload, options);
}

export function updateProjectInvite(projectId, inviteId, payload, options = {}) {
  return call('patch', projectId, ['invites', ensureIdentifier('inviteId', inviteId)], payload, options);
}

export function deleteProjectInvite(projectId, inviteId, options = {}) {
  return call('delete', projectId, ['invites', ensureIdentifier('inviteId', inviteId)], undefined, options);
}

export function createProjectHrRecord(projectId, payload, options = {}) {
  return call('post', projectId, ['hr'], payload, options);
}

export function updateProjectHrRecord(projectId, recordId, payload, options = {}) {
  return call('patch', projectId, ['hr', ensureIdentifier('recordId', recordId)], payload, options);
}

export function deleteProjectHrRecord(projectId, recordId, options = {}) {
  return call('delete', projectId, ['hr', ensureIdentifier('recordId', recordId)], undefined, options);
}

export function createProjectTimeLog(projectId, payload, options = {}) {
  return call('post', projectId, ['time-logs'], payload, options);
}

export function updateProjectTimeLog(projectId, logId, payload, options = {}) {
  return call('patch', projectId, ['time-logs', ensureIdentifier('logId', logId)], payload, options);
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
