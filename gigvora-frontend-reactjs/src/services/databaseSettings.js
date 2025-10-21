import { apiClient } from './apiClient.js';
import { requireIdentifier, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

export function listDatabaseConnections(filters = {}, options = {}) {
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    '/admin/database-settings',
    combineRequestOptions({ params }, options),
  );
}

export function getDatabaseConnection(connectionId, filters = {}, options = {}) {
  const resolvedConnectionId = requireIdentifier(connectionId, 'connectionId');
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    `/admin/database-settings/${resolvedConnectionId}`,
    combineRequestOptions({ params }, options),
  );
}

export function createDatabaseConnection(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post('/admin/database-settings', body, combineRequestOptions({}, options));
}

export function updateDatabaseConnection(
  connectionId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedConnectionId = requireIdentifier(connectionId, 'connectionId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/admin/database-settings/${resolvedConnectionId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export function deleteDatabaseConnection(connectionId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedConnectionId = requireIdentifier(connectionId, 'connectionId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    `/admin/database-settings/${resolvedConnectionId}`,
    combineRequestOptions({ params }, options),
  );
}

export function testDatabaseConnection(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    '/admin/database-settings/test-connection',
    body,
    combineRequestOptions({}, options),
  );
}

export default {
  listDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
};
