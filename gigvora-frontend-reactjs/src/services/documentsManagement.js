import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  optionalString,
  mergeWorkspace,
  buildWorkspaceContext,
  combineRequestOptions,
} from './serviceHelpers.js';

function appendMetadata(formData, metadata = {}) {
  Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null)
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value
          .map(optionalString)
          .filter(Boolean)
          .forEach((entry) => formData.append(`${key}[]`, entry));
      } else {
        const normalised = optionalString(value);
        if (normalised) {
          formData.append(key, normalised);
        }
      }
    });
}

function appendWorkspace(formData, workspace = {}) {
  const context = buildWorkspaceContext(workspace);
  Object.entries(context).forEach(([key, value]) => {
    formData.set(key, value);
  });
}

export async function fetchDocumentRepository(filters = {}, options = {}) {
  const { workspaceId, workspaceSlug, ...restFilters } = filters;
  const params = {
    ...restFilters,
    ...mergeWorkspace({}, { workspaceId, workspaceSlug }),
  };
  return apiClient.get(
    '/admin/documents',
    combineRequestOptions({ params }, options),
  );
}

export async function uploadDocument({ file, workspaceId, workspaceSlug, ...metadata } = {}, options = {}) {
  if (!file) {
    throw new Error('A file is required to upload a document.');
  }

  const formData = new FormData();
  formData.append('file', file);
  appendMetadata(formData, metadata);
  appendWorkspace(formData, { workspaceId, workspaceSlug });

  return apiClient.post(
    '/admin/documents',
    formData,
    combineRequestOptions({}, options),
  );
}

export async function updateDocument(documentId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/admin/documents/${resolvedDocumentId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteDocument(documentId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    `/admin/documents/${resolvedDocumentId}`,
    combineRequestOptions({ params }, options),
  );
}

export async function publishDocument(documentId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/admin/documents/${resolvedDocumentId}/publish`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function requestDocumentReview(documentId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedDocumentId = requireIdentifier(documentId, 'documentId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post(
    `/admin/documents/${resolvedDocumentId}/review`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function createDocumentCollection(payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.post('/admin/documents/collections', body, combineRequestOptions({}, options));
}

export async function updateDocumentCollection(
  collectionId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const resolvedCollectionId = requireIdentifier(collectionId, 'collectionId');
  const body = mergeWorkspace({ ...(payload || {}) }, { workspaceId, workspaceSlug });
  return apiClient.put(
    `/admin/documents/collections/${resolvedCollectionId}`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteDocumentCollection(collectionId, { workspaceId, workspaceSlug, ...options } = {}) {
  const resolvedCollectionId = requireIdentifier(collectionId, 'collectionId');
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    `/admin/documents/collections/${resolvedCollectionId}`,
    combineRequestOptions({ params }, options),
  );
}

export default {
  fetchDocumentRepository,
  uploadDocument,
  updateDocument,
  deleteDocument,
  publishDocument,
  requestDocumentReview,
  createDocumentCollection,
  updateDocumentCollection,
  deleteDocumentCollection,
};
