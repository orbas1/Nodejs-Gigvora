import { apiClient } from './apiClient.js';
import { requireIdentifier, mergeWorkspace, combineRequestOptions } from './serviceHelpers.js';

export function fetchCoverLetterWorkspace(userId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.get(
    `/users/${resolvedUserId}/cover-letters/workspace`,
    combineRequestOptions({ params }, options),
  );
}

export function createCoverLetter(userId, payload, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/cover-letters`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export function uploadCoverLetterVersion(
  userId,
  documentId,
  payload,
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/cover-letters/${resolvedDocumentId}/upload`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export function createStoryBlock(userId, payload, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/story-blocks`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export function uploadStoryBlockVersion(
  userId,
  documentId,
  payload,
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/users/${resolvedUserId}/story-blocks/${resolvedDocumentId}/upload`,
    payload ?? {},
    combineRequestOptions({ params }, options),
  );
}

export default {
  fetchCoverLetterWorkspace,
  createCoverLetter,
  uploadCoverLetterVersion,
  createStoryBlock,
  uploadStoryBlockVersion,
};
