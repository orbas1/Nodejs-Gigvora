import apiClient from './apiClient.js';

const PROJECTS_BASE_PATH = '/projects';
const DEFAULT_EVENT_LIMIT = 20;
const MAX_EVENT_LIMIT = 100;

function ensureIdentifier(name, value) {
  if (value === null || value === undefined) {
    throw new Error(`${name} is required`);
  }
  const normalised = `${value}`.trim();
  if (!normalised) {
    throw new Error(`${name} is required`);
  }
  return normalised;
}

function ensureProjectId(projectId) {
  return ensureIdentifier('projectId', projectId);
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

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  const { params: _ignoredParams, ...rest } = options;
  return rest;
}

function buildProjectPath(projectId, ...segments) {
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));

  const hasProjectId = projectId !== undefined && projectId !== null;
  const prefix = hasProjectId ? `/${encodeURIComponent(ensureProjectId(projectId))}` : '';
  const suffix = safeSegments.length ? `/${safeSegments.join('/')}` : '';
  return `${PROJECTS_BASE_PATH}${prefix}${suffix}`;
}

function buildWorkspacePath(projectId, ...segments) {
  return buildProjectPath(projectId, 'workspace', ...segments);
}

function sendMutation(method, path, payload, options) {
  const client = apiClient[method];
  if (typeof client !== 'function') {
    throw new Error(`Unsupported method: ${method}`);
  }

  if (method === 'delete') {
    const requestOptions = ensureOptions(options);
    if (payload !== undefined) {
      requestOptions.body = ensurePayload(payload);
    }
    return client(path, Object.keys(requestOptions).length ? requestOptions : undefined);
  }

  const requestOptions = ensureOptions(options);
  const body = ensurePayload(payload);
  return client(path, body, Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function createProject(payload, options) {
  return sendMutation('post', buildProjectPath(), payload, options);
}

export async function updateProject(projectId, payload, options) {
  return sendMutation('patch', buildProjectPath(projectId), payload, options);
}

export async function updateProjectAutoAssign(projectId, payload, options) {
  return sendMutation('patch', buildProjectPath(projectId, 'auto-assign'), payload, options);
}

export async function fetchProject(projectId, options = {}) {
  const safeOptions = ensureOptions(options);
  const { signal, ...rest } = safeOptions;
  const requestOptions = { ...rest };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildProjectPath(projectId), Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function fetchProjectEvents(projectId, options = {}) {
  if (options !== undefined && options !== null && typeof options !== 'object') {
    throw new Error('Options must be an object when provided.');
  }
  const { limit, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const { signal, ...other } = safeOptions;
  const parsedLimit = Number.parseInt(limit, 10);
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_EVENT_LIMIT)
    : DEFAULT_EVENT_LIMIT;
  const requestOptions = {
    params: { limit: safeLimit },
    ...other,
  };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildProjectPath(projectId, 'events'), requestOptions);
}

export async function listProjectBlueprints(options) {
  const safeOptions = ensureOptions(options);
  return apiClient.get(
    `${PROJECTS_BASE_PATH}/blueprints`,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function fetchProjectBlueprint(projectId, options) {
  const safeOptions = ensureOptions(options);
  return apiClient.get(
    buildProjectPath(projectId, 'blueprint'),
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function upsertProjectBlueprint(projectId, payload, options) {
  return sendMutation('put', buildProjectPath(projectId, 'blueprint'), payload, options);
}

export async function fetchProjectWorkspace(projectId, options) {
  const safeOptions = ensureOptions(options);
  return apiClient.get(
    buildWorkspacePath(projectId),
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function updateProjectWorkspaceBrief(projectId, payload, options) {
  return sendMutation('put', buildWorkspacePath(projectId, 'brief'), payload, options);
}

export async function updateProjectWorkspaceApproval(projectId, approvalId, payload, options) {
  return sendMutation(
    'patch',
    buildWorkspacePath(projectId, 'approvals', ensureIdentifier('approvalId', approvalId)),
    payload,
    options,
  );
}

export async function acknowledgeProjectWorkspaceConversation(projectId, conversationId, payload, options) {
  return sendMutation(
    'patch',
    buildWorkspacePath(projectId, 'conversations', ensureIdentifier('conversationId', conversationId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceConversationMessage(projectId, conversationId, payload, options) {
  const path = buildWorkspacePath(
    projectId,
    'conversations',
    ensureIdentifier('conversationId', conversationId),
    'messages',
  );
  return sendMutation('post', path, payload, options);
}

export function createProjectWorkspaceBudget(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'budgets'), payload, options);
}

export function updateProjectWorkspaceBudget(projectId, budgetId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'budgets', ensureIdentifier('budgetId', budgetId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceBudget(projectId, budgetId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'budgets', ensureIdentifier('budgetId', budgetId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceObject(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'objects'), payload, options);
}

export function updateProjectWorkspaceObject(projectId, objectId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'objects', ensureIdentifier('objectId', objectId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceObject(projectId, objectId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'objects', ensureIdentifier('objectId', objectId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceTimelineEntry(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'timeline'), payload, options);
}

export function updateProjectWorkspaceTimelineEntry(projectId, entryId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'timeline', ensureIdentifier('entryId', entryId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceTimelineEntry(projectId, entryId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'timeline', ensureIdentifier('entryId', entryId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceMeeting(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'meetings'), payload, options);
}

export function updateProjectWorkspaceMeeting(projectId, meetingId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'meetings', ensureIdentifier('meetingId', meetingId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceMeeting(projectId, meetingId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'meetings', ensureIdentifier('meetingId', meetingId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceRole(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'roles'), payload, options);
}

export function updateProjectWorkspaceRole(projectId, roleId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'roles', ensureIdentifier('roleId', roleId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceRole(projectId, roleId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'roles', ensureIdentifier('roleId', roleId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceSubmission(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'submissions'), payload, options);
}

export function updateProjectWorkspaceSubmission(projectId, submissionId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'submissions', ensureIdentifier('submissionId', submissionId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceSubmission(projectId, submissionId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'submissions', ensureIdentifier('submissionId', submissionId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceInvite(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'invites'), payload, options);
}

export function updateProjectWorkspaceInvite(projectId, inviteId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'invites', ensureIdentifier('inviteId', inviteId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceInvite(projectId, inviteId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'invites', ensureIdentifier('inviteId', inviteId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceHrRecord(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'hr'), payload, options);
}

export function updateProjectWorkspaceHrRecord(projectId, recordId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'hr', ensureIdentifier('recordId', recordId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceHrRecord(projectId, recordId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'hr', ensureIdentifier('recordId', recordId)),
    payload,
    options,
  );
}

export function createProjectWorkspaceFile(projectId, payload, options) {
  return sendMutation('post', buildWorkspacePath(projectId, 'files'), payload, options);
}

export function updateProjectWorkspaceFile(projectId, fileId, payload, options) {
  return sendMutation(
    'put',
    buildWorkspacePath(projectId, 'files', ensureIdentifier('fileId', fileId)),
    payload,
    options,
  );
}

export function deleteProjectWorkspaceFile(projectId, fileId, payload, options) {
  return sendMutation(
    'delete',
    buildWorkspacePath(projectId, 'files', ensureIdentifier('fileId', fileId)),
    payload,
    options,
  );
}

export default {
  createProject,
  updateProject,
  updateProjectAutoAssign,
  fetchProject,
  fetchProjectEvents,
  listProjectBlueprints,
  fetchProjectBlueprint,
  upsertProjectBlueprint,
  fetchProjectWorkspace,
  updateProjectWorkspaceBrief,
  updateProjectWorkspaceApproval,
  acknowledgeProjectWorkspaceConversation,
  createProjectWorkspaceConversationMessage,
  createProjectWorkspaceBudget,
  updateProjectWorkspaceBudget,
  deleteProjectWorkspaceBudget,
  createProjectWorkspaceObject,
  updateProjectWorkspaceObject,
  deleteProjectWorkspaceObject,
  createProjectWorkspaceTimelineEntry,
  updateProjectWorkspaceTimelineEntry,
  deleteProjectWorkspaceTimelineEntry,
  createProjectWorkspaceMeeting,
  updateProjectWorkspaceMeeting,
  deleteProjectWorkspaceMeeting,
  createProjectWorkspaceRole,
  updateProjectWorkspaceRole,
  deleteProjectWorkspaceRole,
  createProjectWorkspaceSubmission,
  updateProjectWorkspaceSubmission,
  deleteProjectWorkspaceSubmission,
  createProjectWorkspaceInvite,
  updateProjectWorkspaceInvite,
  deleteProjectWorkspaceInvite,
  createProjectWorkspaceHrRecord,
  updateProjectWorkspaceHrRecord,
  deleteProjectWorkspaceHrRecord,
  createProjectWorkspaceFile,
  updateProjectWorkspaceFile,
  deleteProjectWorkspaceFile,
};
