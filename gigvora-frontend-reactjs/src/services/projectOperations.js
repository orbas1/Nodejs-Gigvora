import { apiClient } from './apiClient.js';

const PROJECTS_BASE_PATH = '/projects';

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

function ensureProjectId(projectId) {
  return ensureIdentifier('projectId', projectId);
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

function buildOperationsPath(projectId, ...segments) {
  const safeSegments = ['operations', ...segments]
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const prefix = `${PROJECTS_BASE_PATH}/${encodeURIComponent(ensureProjectId(projectId))}`;
  return `${prefix}/${safeSegments.join('/')}`;
}

function callApi(method, projectId, segments, payload, options) {
  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const safeOptions = ensureOptions(options);
  const path = buildOperationsPath(projectId, ...segments);

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

export function fetchProjectOperations(projectId, options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(
    buildOperationsPath(projectId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export function updateProjectOperations(projectId, payload, options) {
  return callApi('put', projectId, [], payload, options);
}

export function addProjectTask(projectId, payload, options) {
  return callApi('post', projectId, ['tasks'], payload, options);
}

export function updateProjectTask(projectId, taskId, payload, options) {
  return callApi('patch', projectId, ['tasks', ensureIdentifier('taskId', taskId)], payload, options);
}

export function deleteProjectTask(projectId, taskId, options) {
  return callApi('delete', projectId, ['tasks', ensureIdentifier('taskId', taskId)], undefined, options);
}

export function createProjectBudget(projectId, payload, options) {
  return callApi('post', projectId, ['budgets'], payload, options);
}

export function updateProjectBudget(projectId, budgetId, payload, options) {
  return callApi('patch', projectId, ['budgets', ensureIdentifier('budgetId', budgetId)], payload, options);
}

export function deleteProjectBudget(projectId, budgetId, options) {
  return callApi('delete', projectId, ['budgets', ensureIdentifier('budgetId', budgetId)], undefined, options);
}

export function createProjectObject(projectId, payload, options) {
  return callApi('post', projectId, ['objects'], payload, options);
}

export function updateProjectObject(projectId, objectId, payload, options) {
  return callApi('patch', projectId, ['objects', ensureIdentifier('objectId', objectId)], payload, options);
}

export function deleteProjectObject(projectId, objectId, options) {
  return callApi('delete', projectId, ['objects', ensureIdentifier('objectId', objectId)], undefined, options);
}

export function createProjectTimelineEvent(projectId, payload, options) {
  return callApi('post', projectId, ['timeline', 'events'], payload, options);
}

export function updateProjectTimelineEvent(projectId, eventId, payload, options) {
  return callApi(
    'patch',
    projectId,
    ['timeline', 'events', ensureIdentifier('eventId', eventId)],
    payload,
    options,
  );
}

export function deleteProjectTimelineEvent(projectId, eventId, options) {
  return callApi(
    'delete',
    projectId,
    ['timeline', 'events', ensureIdentifier('eventId', eventId)],
    undefined,
    options,
  );
}

export function createProjectMeeting(projectId, payload, options) {
  return callApi('post', projectId, ['meetings'], payload, options);
}

export function updateProjectMeeting(projectId, meetingId, payload, options) {
  return callApi('patch', projectId, ['meetings', ensureIdentifier('meetingId', meetingId)], payload, options);
}

export function deleteProjectMeeting(projectId, meetingId, options) {
  return callApi('delete', projectId, ['meetings', ensureIdentifier('meetingId', meetingId)], undefined, options);
}

export function createProjectCalendarEntry(projectId, payload, options) {
  return callApi('post', projectId, ['calendar'], payload, options);
}

export function updateProjectCalendarEntry(projectId, entryId, payload, options) {
  return callApi('patch', projectId, ['calendar', ensureIdentifier('entryId', entryId)], payload, options);
}

export function deleteProjectCalendarEntry(projectId, entryId, options) {
  return callApi('delete', projectId, ['calendar', ensureIdentifier('entryId', entryId)], undefined, options);
}

export function createProjectRole(projectId, payload, options) {
  return callApi('post', projectId, ['roles'], payload, options);
}

export function updateProjectRole(projectId, roleId, payload, options) {
  return callApi('patch', projectId, ['roles', ensureIdentifier('roleId', roleId)], payload, options);
}

export function deleteProjectRole(projectId, roleId, options) {
  return callApi('delete', projectId, ['roles', ensureIdentifier('roleId', roleId)], undefined, options);
}

export function createProjectSubmission(projectId, payload, options) {
  return callApi('post', projectId, ['submissions'], payload, options);
}

export function updateProjectSubmission(projectId, submissionId, payload, options) {
  return callApi(
    'patch',
    projectId,
    ['submissions', ensureIdentifier('submissionId', submissionId)],
    payload,
    options,
  );
}

export function deleteProjectSubmission(projectId, submissionId, options) {
  return callApi(
    'delete',
    projectId,
    ['submissions', ensureIdentifier('submissionId', submissionId)],
    undefined,
    options,
  );
}

export function createProjectInvite(projectId, payload, options) {
  return callApi('post', projectId, ['invites'], payload, options);
}

export function updateProjectInvite(projectId, inviteId, payload, options) {
  return callApi('patch', projectId, ['invites', ensureIdentifier('inviteId', inviteId)], payload, options);
}

export function deleteProjectInvite(projectId, inviteId, options) {
  return callApi('delete', projectId, ['invites', ensureIdentifier('inviteId', inviteId)], undefined, options);
}

export function createProjectHrRecord(projectId, payload, options) {
  return callApi('post', projectId, ['hr'], payload, options);
}

export function updateProjectHrRecord(projectId, recordId, payload, options) {
  return callApi('patch', projectId, ['hr', ensureIdentifier('recordId', recordId)], payload, options);
}

export function deleteProjectHrRecord(projectId, recordId, options) {
  return callApi('delete', projectId, ['hr', ensureIdentifier('recordId', recordId)], undefined, options);
}

export function createProjectTimeLog(projectId, payload, options) {
  return callApi('post', projectId, ['time-logs'], payload, options);
}

export function updateProjectTimeLog(projectId, logId, payload, options) {
  return callApi('patch', projectId, ['time-logs', ensureIdentifier('logId', logId)], payload, options);
}

export function deleteProjectTimeLog(projectId, logId, options) {
  return callApi('delete', projectId, ['time-logs', ensureIdentifier('logId', logId)], undefined, options);
}

export function createProjectTarget(projectId, payload, options) {
  return callApi('post', projectId, ['targets'], payload, options);
}

export function updateProjectTarget(projectId, targetId, payload, options) {
  return callApi('patch', projectId, ['targets', ensureIdentifier('targetId', targetId)], payload, options);
}

export function deleteProjectTarget(projectId, targetId, options) {
  return callApi('delete', projectId, ['targets', ensureIdentifier('targetId', targetId)], undefined, options);
}

export function createProjectObjective(projectId, payload, options) {
  return callApi('post', projectId, ['objectives'], payload, options);
}

export function updateProjectObjective(projectId, objectiveId, payload, options) {
  return callApi(
    'patch',
    projectId,
    ['objectives', ensureIdentifier('objectiveId', objectiveId)],
    payload,
    options,
  );
}

export function deleteProjectObjective(projectId, objectiveId, options) {
  return callApi(
    'delete',
    projectId,
    ['objectives', ensureIdentifier('objectiveId', objectiveId)],
    undefined,
    options,
  );
}

export function postConversationMessage(projectId, conversationId, payload, options) {
  return callApi(
    'post',
    projectId,
    ['conversations', ensureIdentifier('conversationId', conversationId), 'messages'],
    payload,
    options,
  );
}

export function createProjectFile(projectId, payload, options) {
  return callApi('post', projectId, ['files'], payload, options);
}

export function updateProjectFile(projectId, fileId, payload, options) {
  return callApi('patch', projectId, ['files', ensureIdentifier('fileId', fileId)], payload, options);
}

export function deleteProjectFile(projectId, fileId, options) {
  return callApi('delete', projectId, ['files', ensureIdentifier('fileId', fileId)], undefined, options);
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
