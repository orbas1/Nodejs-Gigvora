import { apiClient } from './apiClient.js';

const USERS_BASE_PATH = '/users';
const WORKSPACE_SEGMENT = 'project-workspace';

function ensureIdentifier(name, value) {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function ensurePayload(payload) {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildWorkspacePath(userId, ...segments) {
  const safeSegments = [WORKSPACE_SEGMENT, ...segments]
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const prefix = `${USERS_BASE_PATH}/${encodeURIComponent(ensureIdentifier('userId', userId))}`;
  return `${prefix}/${safeSegments.join('/')}`;
}

function callWorkspaceApi(method, userId, segments, payload, options) {
  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const safeOptions = ensureOptions(options);
  const path = buildWorkspacePath(userId, ...segments);

  if (method === 'delete') {
    if (Object.keys(safeOptions).length > 0) {
      return client(path, safeOptions);
    }
    return client(path);
  }

  const safePayload = ensurePayload(payload);
  if (Object.keys(safeOptions).length > 0) {
    return client(path, safePayload, safeOptions);
  }
  return client(path, safePayload);
}

function callProjectWorkspaceApi(method, userId, projectId, segments, payload, options) {
  const safeProjectId = ensureIdentifier('projectId', projectId);
  return callWorkspaceApi(method, userId, ['projects', safeProjectId, ...segments], payload, options);
}

export function fetchProjectWorkspace(userId, options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(
    buildWorkspacePath(userId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export function createWorkspaceProject(userId, payload, options) {
  return callWorkspaceApi('post', userId, ['projects'], payload, options);
}

export function updateWorkspaceProject(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('patch', userId, projectId, [], payload, options);
}

export function createBudgetLine(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['budget-lines'], payload, options);
}

export function updateBudgetLine(userId, projectId, budgetLineId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['budget-lines', ensureIdentifier('budgetLineId', budgetLineId)],
    payload,
    options,
  );
}

export function deleteBudgetLine(userId, projectId, budgetLineId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['budget-lines', ensureIdentifier('budgetLineId', budgetLineId)],
    undefined,
    options,
  );
}

export function createDeliverable(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['deliverables'], payload, options);
}

export function updateDeliverable(userId, projectId, deliverableId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['deliverables', ensureIdentifier('deliverableId', deliverableId)],
    payload,
    options,
  );
}

export function deleteDeliverable(userId, projectId, deliverableId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['deliverables', ensureIdentifier('deliverableId', deliverableId)],
    undefined,
    options,
  );
}

export function createTask(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['tasks'], payload, options);
}

export function updateTask(userId, projectId, taskId, payload, options) {
  return callProjectWorkspaceApi('patch', userId, projectId, ['tasks', ensureIdentifier('taskId', taskId)], payload, options);
}

export function deleteTask(userId, projectId, taskId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['tasks', ensureIdentifier('taskId', taskId)],
    undefined,
    options,
  );
}

export function createTaskAssignment(userId, projectId, taskId, payload, options) {
  return callProjectWorkspaceApi(
    'post',
    userId,
    projectId,
    ['tasks', ensureIdentifier('taskId', taskId), 'assignments'],
    payload,
    options,
  );
}

export function updateTaskAssignment(userId, projectId, taskId, assignmentId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    [
      'tasks',
      ensureIdentifier('taskId', taskId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    payload,
    options,
  );
}

export function deleteTaskAssignment(userId, projectId, taskId, assignmentId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    [
      'tasks',
      ensureIdentifier('taskId', taskId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    undefined,
    options,
  );
}

export function createTaskDependency(userId, projectId, taskId, payload, options) {
  return callProjectWorkspaceApi(
    'post',
    userId,
    projectId,
    ['tasks', ensureIdentifier('taskId', taskId), 'dependencies'],
    payload,
    options,
  );
}

export function deleteTaskDependency(userId, projectId, taskId, dependencyId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    [
      'tasks',
      ensureIdentifier('taskId', taskId),
      'dependencies',
      ensureIdentifier('dependencyId', dependencyId),
    ],
    undefined,
    options,
  );
}

export function createChatMessage(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['chat', 'messages'], payload, options);
}

export function updateChatMessage(userId, projectId, messageId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['chat', 'messages', ensureIdentifier('messageId', messageId)],
    payload,
    options,
  );
}

export function deleteChatMessage(userId, projectId, messageId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['chat', 'messages', ensureIdentifier('messageId', messageId)],
    undefined,
    options,
  );
}

export function createTimelineEntry(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['timeline'], payload, options);
}

export function updateTimelineEntry(userId, projectId, entryId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['timeline', ensureIdentifier('entryId', entryId)],
    payload,
    options,
  );
}

export function deleteTimelineEntry(userId, projectId, entryId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['timeline', ensureIdentifier('entryId', entryId)],
    undefined,
    options,
  );
}

export function createMeeting(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['meetings'], payload, options);
}

export function updateMeeting(userId, projectId, meetingId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['meetings', ensureIdentifier('meetingId', meetingId)],
    payload,
    options,
  );
}

export function deleteMeeting(userId, projectId, meetingId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['meetings', ensureIdentifier('meetingId', meetingId)],
    undefined,
    options,
  );
}

export function createCalendarEvent(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['calendar-events'], payload, options);
}

export function updateCalendarEvent(userId, projectId, eventId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['calendar-events', ensureIdentifier('eventId', eventId)],
    payload,
    options,
  );
}

export function deleteCalendarEvent(userId, projectId, eventId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['calendar-events', ensureIdentifier('eventId', eventId)],
    undefined,
    options,
  );
}

export function createRoleDefinition(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['roles'], payload, options);
}

export function updateRoleDefinition(userId, projectId, roleId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['roles', ensureIdentifier('roleId', roleId)],
    payload,
    options,
  );
}

export function deleteRoleDefinition(userId, projectId, roleId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['roles', ensureIdentifier('roleId', roleId)],
    undefined,
    options,
  );
}

export function createRoleAssignment(userId, projectId, roleId, payload, options) {
  return callProjectWorkspaceApi(
    'post',
    userId,
    projectId,
    ['roles', ensureIdentifier('roleId', roleId), 'assignments'],
    payload,
    options,
  );
}

export function updateRoleAssignment(userId, projectId, roleId, assignmentId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    [
      'roles',
      ensureIdentifier('roleId', roleId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    payload,
    options,
  );
}

export function deleteRoleAssignment(userId, projectId, roleId, assignmentId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    [
      'roles',
      ensureIdentifier('roleId', roleId),
      'assignments',
      ensureIdentifier('assignmentId', assignmentId),
    ],
    undefined,
    options,
  );
}

export function createSubmission(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['submissions'], payload, options);
}

export function updateSubmission(userId, projectId, submissionId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['submissions', ensureIdentifier('submissionId', submissionId)],
    payload,
    options,
  );
}

export function deleteSubmission(userId, projectId, submissionId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['submissions', ensureIdentifier('submissionId', submissionId)],
    undefined,
    options,
  );
}

export function createFile(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['files'], payload, options);
}

export function updateFile(userId, projectId, fileId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['files', ensureIdentifier('fileId', fileId)],
    payload,
    options,
  );
}

export function deleteFile(userId, projectId, fileId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['files', ensureIdentifier('fileId', fileId)],
    undefined,
    options,
  );
}

export function createInvitation(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['invitations'], payload, options);
}

export function updateInvitation(userId, projectId, invitationId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['invitations', ensureIdentifier('invitationId', invitationId)],
    payload,
    options,
  );
}

export function deleteInvitation(userId, projectId, invitationId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['invitations', ensureIdentifier('invitationId', invitationId)],
    undefined,
    options,
  );
}

export function createHrRecord(userId, projectId, payload, options) {
  return callProjectWorkspaceApi('post', userId, projectId, ['hr'], payload, options);
}

export function updateHrRecord(userId, projectId, hrRecordId, payload, options) {
  return callProjectWorkspaceApi(
    'patch',
    userId,
    projectId,
    ['hr', ensureIdentifier('hrRecordId', hrRecordId)],
    payload,
    options,
  );
}

export function deleteHrRecord(userId, projectId, hrRecordId, options) {
  return callProjectWorkspaceApi(
    'delete',
    userId,
    projectId,
    ['hr', ensureIdentifier('hrRecordId', hrRecordId)],
    undefined,
    options,
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
