import apiClient from './apiClient.js';

export async function fetchDocumentRepository(options = {}) {
  return apiClient.get('/admin/documents', options);
}

export async function uploadDocument({ file, ...metadata }) {
  if (!file) {
    throw new Error('A file is required to upload a document.');
  }

  const formData = new FormData();
  formData.append('file', file);

  Object.entries(metadata ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => formData.append(`${key}[]`, entry));
      } else {
        formData.append(key, value);
      }
    });

  return apiClient.post('/admin/documents', formData);
}

export async function updateDocument(documentId, payload) {
  if (!documentId) {
    throw new Error('documentId is required to update a document.');
  }
  return apiClient.put(`/admin/documents/${documentId}`, payload);
}

export async function deleteDocument(documentId) {
  if (!documentId) {
    throw new Error('documentId is required to delete a document.');
  }
  return apiClient.delete(`/admin/documents/${documentId}`);
}

export async function publishDocument(documentId, payload = {}) {
  if (!documentId) {
    throw new Error('documentId is required to publish a document.');
  }
  return apiClient.post(`/admin/documents/${documentId}/publish`, payload);
}

export async function requestDocumentReview(documentId, payload = {}) {
  if (!documentId) {
    throw new Error('documentId is required to request a review.');
  }
  return apiClient.post(`/admin/documents/${documentId}/review`, payload);
}

export async function createDocumentCollection(payload) {
  return apiClient.post('/admin/documents/collections', payload);
}

export async function updateDocumentCollection(collectionId, payload) {
  if (!collectionId) {
    throw new Error('collectionId is required to update a collection.');
  }
  return apiClient.put(`/admin/documents/collections/${collectionId}`, payload);
}

export async function deleteDocumentCollection(collectionId) {
  if (!collectionId) {
    throw new Error('collectionId is required to delete a collection.');
  }
  return apiClient.delete(`/admin/documents/collections/${collectionId}`);
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
