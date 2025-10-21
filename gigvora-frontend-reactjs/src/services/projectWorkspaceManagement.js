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

function buildManagementPath(projectId, entity, recordId) {
  const safeProjectId = encodeURIComponent(ensureIdentifier('projectId', projectId));
  if (!entity) {
    return `/projects/${safeProjectId}/workspace/management`;
  }
  const safeEntity = encodeURIComponent(ensureIdentifier('entity', entity));
  if (!recordId) {
    return `/projects/${safeProjectId}/workspace/management/${safeEntity}`;
  }
  const safeRecordId = encodeURIComponent(ensureIdentifier('recordId', recordId));
  return `/projects/${safeProjectId}/workspace/management/${safeEntity}/${safeRecordId}`;
}

export async function fetchWorkspaceProjects(filters = {}, options = {}) {
  const safeFilters = filters && typeof filters === 'object' ? filters : {};
  const { signal, ...restOptions } = ensureOptions(options);
  const params = {};
  if (safeFilters.projectId) {
    params.projectId = ensureIdentifier('projectId', safeFilters.projectId);
  }
  const requestOptions = { ...restOptions };
  if (Object.keys(params).length) {
    requestOptions.params = params;
  }
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get('/projects/workspace/management', Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function fetchWorkspaceManagement(projectId, options = {}) {
  const { signal, ...rest } = ensureOptions(options);
  const requestOptions = { ...rest };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildManagementPath(projectId), Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function createWorkspaceRecord(projectId, entity, payload = {}, options = {}) {
  const body = ensurePayload(payload);
  const requestOptions = ensureOptions(options);
  return apiClient.post(
    buildManagementPath(projectId, entity),
    body,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export async function updateWorkspaceRecord(projectId, entity, recordId, payload = {}, options = {}) {
  if (!recordId && ensureIdentifier('entity', entity) !== 'summary') {
    throw new Error('recordId is required');
  }
  const body = ensurePayload(payload);
  const requestOptions = ensureOptions(options);
  return apiClient.put(
    buildManagementPath(projectId, entity, recordId ?? undefined),
    body,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export async function deleteWorkspaceRecord(projectId, entity, recordId, options = {}) {
  const requestOptions = ensureOptions(options);
  return apiClient.delete(
    buildManagementPath(projectId, entity, recordId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export default {
  fetchWorkspaceProjects,
  fetchWorkspaceManagement,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  deleteWorkspaceRecord,
};
