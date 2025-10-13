import { apiClient } from './apiClient.js';

export function fetchInterviewWorkflow(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.get('/interviews', { params: { workspaceId }, signal });
}

export function fetchInterviewRoom(roomId, { signal } = {}) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.get(`/interviews/rooms/${roomId}`, { signal });
}

export function updateInterviewRoom(roomId, payload) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.put(`/interviews/rooms/${roomId}`, payload);
}

export function addInterviewParticipant(roomId, payload) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.post(`/interviews/rooms/${roomId}/participants`, payload);
}

export function updateInterviewChecklistItem(roomId, itemId, payload) {
  if (!roomId || !itemId) {
    throw new Error('roomId and itemId are required');
  }
  return apiClient.patch(`/interviews/rooms/${roomId}/checklist/${itemId}`, payload);
}

export default {
  fetchInterviewWorkflow,
  fetchInterviewRoom,
  updateInterviewRoom,
  addInterviewParticipant,
  updateInterviewChecklistItem,
};
