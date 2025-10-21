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

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
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

function buildManagementPath(projectId, ...segments) {
  const safeSegments = ['workspace', 'management', ...segments]
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const prefix = `${PROJECTS_BASE_PATH}/${encodeURIComponent(ensureIdentifier('projectId', projectId))}`;
  return `${prefix}/${safeSegments.join('/')}`;
}

export async function fetchWorkspaceProjects({ projectId } = {}, options = {}) {
  const { signal, params = {}, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const safeParams = ensureOptions(params);
  const requestOptions = {
    ...safeOptions,
    params: {
      ...(safeParams || {}),
      projectId: projectId ? ensureIdentifier('projectId', projectId) : undefined,
    },
  };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get('/projects/workspace/management', requestOptions);
}

export async function fetchWorkspaceManagement(projectId, options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(
    buildManagementPath(projectId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export async function createWorkspaceRecord(projectId, entity, payload, options = {}) {
  const safeEntity = ensureIdentifier('entity', entity);
  const safePayload = ensurePayload(payload);
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  const path = buildManagementPath(projectId, safeEntity);
  return apiClient.post(path, safePayload, requestOptions);
}

export async function updateWorkspaceRecord(projectId, entity, recordId, payload, options = {}) {
  const safeEntity = ensureIdentifier('entity', entity);
  const requiresRecordId = safeEntity !== 'summary';
  const safeRecordId = requiresRecordId ? ensureIdentifier('recordId', recordId) : null;
  const safePayload = ensurePayload(payload);
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  const pathSegments = requiresRecordId ? [safeEntity, safeRecordId] : [safeEntity];
  const path = buildManagementPath(projectId, ...pathSegments);
  return apiClient.put(path, safePayload, requestOptions);
}

export async function deleteWorkspaceRecord(projectId, entity, recordId, options = {}) {
  const safeEntity = ensureIdentifier('entity', entity);
  const safeRecordId = ensureIdentifier('recordId', recordId);
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  const path = buildManagementPath(projectId, safeEntity, safeRecordId);
  return apiClient.delete(path, requestOptions);
}

export default {
  fetchWorkspaceProjects,
  fetchWorkspaceManagement,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  deleteWorkspaceRecord,
};
