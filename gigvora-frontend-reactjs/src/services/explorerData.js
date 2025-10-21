import { apiClient } from './apiClient.js';
import { requireIdentifier, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

function resolveCategory(category) {
  return requireIdentifier(category, 'category');
}

export async function fetchExplorerRecords(category, filters = {}, options = {}) {
  const resolvedCategory = resolveCategory(category);
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    `/explorer/${resolvedCategory}`,
    combineRequestOptions({ params }, options),
  );
}

export async function fetchExplorerRecord(category, recordId, options = {}) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  return apiClient.get(
    `/explorer/${resolvedCategory}/${resolvedRecordId}`,
    combineRequestOptions({}, options),
  );
}

export async function createExplorerRecord(category, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedCategory = resolveCategory(category);
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(`/explorer/${resolvedCategory}`, body, combineRequestOptions({}, options));
}

export async function updateExplorerRecord(
  category,
  recordId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/explorer/${resolvedCategory}/${resolvedRecordId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteExplorerRecord(category, recordId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    `/explorer/${resolvedCategory}/${resolvedRecordId}`,
    combineRequestOptions({ params }, options),
  );
}

export async function fetchExplorerInteractions(category, recordId, options = {}) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  return apiClient.get(
    `/explorer/${resolvedCategory}/${resolvedRecordId}/interactions`,
    combineRequestOptions({}, options),
  );
}

export async function createExplorerInteraction(
  category,
  recordId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/explorer/${resolvedCategory}/${resolvedRecordId}/interactions`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateExplorerInteraction(
  category,
  recordId,
  interactionId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  const resolvedInteractionId = requireIdentifier(interactionId, 'interactionId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/explorer/${resolvedCategory}/${resolvedRecordId}/interactions/${resolvedInteractionId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteExplorerInteraction(
  category,
  recordId,
  interactionId,
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedCategory = resolveCategory(category);
  const resolvedRecordId = requireIdentifier(recordId, 'recordId');
  const resolvedInteractionId = requireIdentifier(interactionId, 'interactionId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    `/explorer/${resolvedCategory}/${resolvedRecordId}/interactions/${resolvedInteractionId}`,
    combineRequestOptions({ params }, options),
  );
}

export default {
  fetchExplorerRecords,
  fetchExplorerRecord,
  createExplorerRecord,
  updateExplorerRecord,
  deleteExplorerRecord,
  fetchExplorerInteractions,
  createExplorerInteraction,
  updateExplorerInteraction,
  deleteExplorerInteraction,
};
