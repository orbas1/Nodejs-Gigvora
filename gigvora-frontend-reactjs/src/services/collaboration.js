import { apiClient } from './apiClient.js';

export async function fetchCollaborationSpaces(params = {}) {
  const response = await apiClient.get('/collaboration/spaces', { params });
  return response.spaces ?? [];
}

export async function createCollaborationSpace(payload) {
  const response = await apiClient.post('/collaboration/spaces', payload);
  return response.space;
}

export async function createCollaborationVideoRoom(spaceId, payload) {
  const response = await apiClient.post(`/collaboration/spaces/${spaceId}/video-rooms`, payload);
  return response.room;
}

export async function createCollaborationAsset(spaceId, payload) {
  const response = await apiClient.post(`/collaboration/spaces/${spaceId}/assets`, payload);
  return response.asset;
}

export async function createCollaborationAnnotation(assetId, payload) {
  const response = await apiClient.post(`/collaboration/assets/${assetId}/annotations`, payload);
  return response.annotation;
}

export async function connectCollaborationRepository(spaceId, payload) {
  const response = await apiClient.post(`/collaboration/spaces/${spaceId}/repositories`, payload);
  return response.repository;
}

export async function createCollaborationAiSession(spaceId, payload) {
  const response = await apiClient.post(`/collaboration/spaces/${spaceId}/ai-sessions`, payload);
  return response.session;
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
