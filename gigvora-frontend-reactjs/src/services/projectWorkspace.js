import { apiClient } from './apiClient.js';

function ensureString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return `${value}`.trim();
}

function ensureIdentifier(name, value) {
  const normalised = ensureString(value);
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return normalised;
}

function ensureUserId(userId) {
  return ensureIdentifier('userId', userId);
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

function buildBase(userId) {
  return `/users/${encodeURIComponent(ensureUserId(userId))}/project-workspace`;
}

function buildPath(userId, ...segments) {
  const base = buildBase(userId);
  const encodedSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureString(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  return encodedSegments.length ? `${base}/${encodedSegments.join('/')}` : base;
}

function send(method, userId, segments, payload, options) {
  const path = buildPath(userId, ...segments);
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

export function fetchProjectWorkspace(userId, options = {}) {
  const { signal, ...rest } = ensureOptions(options);
  const requestOptions = { ...rest };
  if (signal) {
    requestOptions.signal = signal;
  }
  return send('get', userId, [], undefined, requestOptions);
}

export function createWorkspaceProject(userId, payload, options = {}) {
  return send('post', userId, ['projects'], payload, options);
}

export function updateWorkspaceProject(userId, projectId, payload, options = {}) {
  return send('patch', userId, ['projects', ensureIdentifier('projectId', projectId)], payload, options);
}

export function createBudgetLine(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'budget-lines'], payload, options);
}

export function updateBudgetLine(userId, projectId, budgetLineId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'budget-lines', ensureIdentifier('budgetLineId', budgetLineId)],
    payload,
    options,
  );
}

export function deleteBudgetLine(userId, projectId, budgetLineId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'budget-lines', ensureIdentifier('budgetLineId', budgetLineId)],
    undefined,
    options,
  );
}

export function createDeliverable(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'deliverables'], payload, options);
}

export function updateDeliverable(userId, projectId, deliverableId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'deliverables', ensureIdentifier('deliverableId', deliverableId)],
    payload,
    options,
  );
}

export function deleteDeliverable(userId, projectId, deliverableId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'deliverables', ensureIdentifier('deliverableId', deliverableId)],
    undefined,
    options,
  );
}

export function createTask(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'tasks'], payload, options);
}

export function updateTask(userId, projectId, taskId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'tasks', ensureIdentifier('taskId', taskId)],
    payload,
    options,
  );
}

export function deleteTask(userId, projectId, taskId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'tasks', ensureIdentifier('taskId', taskId)],
    undefined,
    options,
  );
}

export function createTaskAssignment(userId, projectId, taskId, payload, options = {}) {
  return send(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'tasks', ensureIdentifier('taskId', taskId), 'assignments'],
    payload,
    options,
  );
}

export function updateTaskAssignment(userId, projectId, taskId, assignmentId, payload, options = {}) {
  return send(
    'patch',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'tasks',
      ensureIdentifier('taskId', taskId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    payload,
    options,
  );
}

export function deleteTaskAssignment(userId, projectId, taskId, assignmentId, options = {}) {
  return send(
    'delete',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'tasks',
      ensureIdentifier('taskId', taskId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    undefined,
    options,
  );
}

export function createTaskDependency(userId, projectId, taskId, payload, options = {}) {
  return send(
    'post',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'tasks', ensureIdentifier('taskId', taskId), 'dependencies'],
    payload,
    options,
  );
}

export function deleteTaskDependency(userId, projectId, taskId, dependencyId, options = {}) {
  return send(
    'delete',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'tasks',
      ensureIdentifier('taskId', taskId),
      'dependencies',
      ensureIdentifier('dependencyId', dependencyId),
    ],
    undefined,
    options,
  );
}

export function createChatMessage(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'chat', 'messages'], payload, options);
}

export function updateChatMessage(userId, projectId, messageId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'chat', 'messages', ensureIdentifier('messageId', messageId)],
    payload,
    options,
  );
}

export function deleteChatMessage(userId, projectId, messageId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'chat', 'messages', ensureIdentifier('messageId', messageId)],
    undefined,
    options,
  );
}

export function createTimelineEntry(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'timeline'], payload, options);
}

export function updateTimelineEntry(userId, projectId, entryId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'timeline', ensureIdentifier('entryId', entryId)],
    payload,
    options,
  );
}

export function deleteTimelineEntry(userId, projectId, entryId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'timeline', ensureIdentifier('entryId', entryId)],
    undefined,
    options,
  );
}

export function createMeeting(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'meetings'], payload, options);
}

export function updateMeeting(userId, projectId, meetingId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'meetings', ensureIdentifier('meetingId', meetingId)],
    payload,
    options,
  );
}

export function deleteMeeting(userId, projectId, meetingId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'meetings', ensureIdentifier('meetingId', meetingId)],
    undefined,
    options,
  );
}

export function createCalendarEvent(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'calendar-events'], payload, options);
}

export function updateCalendarEvent(userId, projectId, eventId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'calendar-events', ensureIdentifier('eventId', eventId)],
    payload,
    options,
  );
}

export function deleteCalendarEvent(userId, projectId, eventId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'calendar-events', ensureIdentifier('eventId', eventId)],
    undefined,
    options,
  );
}

export function createRoleDefinition(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'roles'], payload, options);
}

export function updateRoleDefinition(userId, projectId, roleId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'roles', ensureIdentifier('roleId', roleId)],
    payload,
    options,
  );
}

export function deleteRoleDefinition(userId, projectId, roleId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'roles', ensureIdentifier('roleId', roleId)],
    undefined,
    options,
  );
}

export function createRoleAssignment(userId, projectId, roleId, payload, options = {}) {
  return send(
    'post',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'roles',
      ensureIdentifier('roleId', roleId),
      'assignments',
    ],
    payload,
    options,
  );
}

export function updateRoleAssignment(userId, projectId, roleId, assignmentId, payload, options = {}) {
  return send(
    'patch',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'roles',
      ensureIdentifier('roleId', roleId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    payload,
    options,
  );
}

export function deleteRoleAssignment(userId, projectId, roleId, assignmentId, options = {}) {
  return send(
    'delete',
    userId,
    [
      'projects',
      ensureIdentifier('projectId', projectId),
      'roles',
      ensureIdentifier('roleId', roleId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    undefined,
    options,
  );
}

export function createSubmission(userId, projectId, payload, options = {}) {
  return send('post', userId, ['projects', ensureIdentifier('projectId', projectId), 'submissions'], payload, options);
}

export function updateSubmission(userId, projectId, submissionId, payload, options = {}) {
  return send(
    'patch',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'submissions', ensureIdentifier('submissionId', submissionId)],
    payload,
    options,
  );
}

export function deleteSubmission(userId, projectId, submissionId, options = {}) {
  return send(
    'delete',
    userId,
    ['projects', ensureIdentifier('projectId', projectId), 'submissions', ensureIdentifier('submissionId', submissionId)],
    undefined,
    options,
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
