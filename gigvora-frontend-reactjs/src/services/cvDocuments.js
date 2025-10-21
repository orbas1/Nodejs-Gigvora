import { apiClient } from './apiClient.js';
import { requireIdentifier, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

export function fetchCvWorkspace(userId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.get(
    `/users/${resolvedUserId}/cv-documents/workspace`,
    combineRequestOptions({ params }, options),
  );
}

export function createCvDocument(userId, payload, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/cv-documents`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export function uploadCvVersion(userId, documentId, payload, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/cv-documents/${resolvedDocumentId}/upload`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export default {
  fetchCvWorkspace,
  createCvDocument,
  uploadCvVersion,
};
