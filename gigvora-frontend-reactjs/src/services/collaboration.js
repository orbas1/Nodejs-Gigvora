import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

export async function fetchCollaborationSpaces(params = {}, { signal } = {}) {
  const response = await apiClient.get('/collaboration/spaces', { params, signal });
  return response?.spaces ?? [];
}

export async function createCollaborationSpace(payload = {}, { signal } = {}) {
  const response = await apiClient.post('/collaboration/spaces', payload, { signal });
  return response?.space ?? null;
}

export async function createCollaborationVideoRoom(spaceId, payload = {}, { signal } = {}) {
  const resolvedSpaceId = ensureId(spaceId, 'spaceId is required to create a video room.');
  const response = await apiClient.post(`/collaboration/spaces/${resolvedSpaceId}/video-rooms`, payload, { signal });
  return response?.room ?? null;
}

export async function createCollaborationAsset(spaceId, payload = {}, { signal } = {}) {
  const resolvedSpaceId = ensureId(spaceId, 'spaceId is required to create an asset.');
  const response = await apiClient.post(`/collaboration/spaces/${resolvedSpaceId}/assets`, payload, { signal });
  return response?.asset ?? null;
}

export async function createCollaborationAnnotation(assetId, payload = {}, { signal } = {}) {
  const resolvedAssetId = ensureId(assetId, 'assetId is required to annotate an asset.');
  const response = await apiClient.post(`/collaboration/assets/${resolvedAssetId}/annotations`, payload, { signal });
  return response?.annotation ?? null;
}

export async function connectCollaborationRepository(spaceId, payload = {}, { signal } = {}) {
  const resolvedSpaceId = ensureId(spaceId, 'spaceId is required to connect a repository.');
  const response = await apiClient.post(`/collaboration/spaces/${resolvedSpaceId}/repositories`, payload, { signal });
  return response?.repository ?? null;
}

export async function createCollaborationAiSession(spaceId, payload = {}, { signal } = {}) {
  const resolvedSpaceId = ensureId(spaceId, 'spaceId is required to start an AI session.');
  const response = await apiClient.post(`/collaboration/spaces/${resolvedSpaceId}/ai-sessions`, payload, { signal });
  return response?.session ?? null;
}

export default {
  fetchCollaborationSpaces,
  createCollaborationSpace,
  createCollaborationVideoRoom,
  createCollaborationAsset,
  createCollaborationAnnotation,
  connectCollaborationRepository,
  createCollaborationAiSession,
};
