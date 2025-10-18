import { apiClient } from './apiClient.js';

export function listInterviewWorkspaces({ signal } = {}) {
  return apiClient.get('/interviews/workspaces', { signal });
}

export function fetchInterviewWorkspace(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.get(`/interviews/workspaces/${workspaceId}`, { signal });
}

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

export function listInterviewRooms(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.get(`/interviews/workspaces/${workspaceId}/rooms`, { signal });
}

export function createInterviewRoom(workspaceId, payload) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.post(`/interviews/workspaces/${workspaceId}/rooms`, payload);
}

export function updateInterviewRoom(roomId, payload) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.put(`/interviews/rooms/${roomId}`, payload);
}

export function deleteInterviewRoom(roomId) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.delete(`/interviews/rooms/${roomId}`);
}

export function addInterviewParticipant(roomId, payload) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.post(`/interviews/rooms/${roomId}/participants`, payload);
}

export function updateInterviewParticipant(roomId, participantId, payload) {
  if (!roomId || !participantId) {
    throw new Error('roomId and participantId are required');
  }
  return apiClient.patch(`/interviews/rooms/${roomId}/participants/${participantId}`, payload);
}

export function deleteInterviewParticipant(roomId, participantId) {
  if (!roomId || !participantId) {
    throw new Error('roomId and participantId are required');
  }
  return apiClient.delete(`/interviews/rooms/${roomId}/participants/${participantId}`);
}

export function createInterviewChecklistItem(roomId, payload) {
  if (!roomId) {
    throw new Error('roomId is required');
  }
  return apiClient.post(`/interviews/rooms/${roomId}/checklist`, payload);
}

export function updateInterviewChecklistItem(roomId, itemId, payload) {
  if (!roomId || !itemId) {
    throw new Error('roomId and itemId are required');
  }
  return apiClient.patch(`/interviews/rooms/${roomId}/checklist/${itemId}`, payload);
}

export function deleteInterviewChecklistItem(roomId, itemId) {
  if (!roomId || !itemId) {
    throw new Error('roomId and itemId are required');
  }
  return apiClient.delete(`/interviews/rooms/${roomId}/checklist/${itemId}`);
}

export function createInterviewLane(workspaceId, payload) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.post(`/interviews/workflows/${workspaceId}/lanes`, payload);
}

export function updateInterviewLane(workspaceId, laneId, payload) {
  if (!workspaceId || !laneId) {
    throw new Error('workspaceId and laneId are required');
  }
  return apiClient.patch(`/interviews/workflows/${workspaceId}/lanes/${laneId}`, payload);
}

export function deleteInterviewLane(workspaceId, laneId) {
  if (!workspaceId || !laneId) {
    throw new Error('workspaceId and laneId are required');
  }
  return apiClient.delete(`/interviews/workflows/${workspaceId}/lanes/${laneId}`);
}

export function createInterviewCard(workspaceId, laneId, payload) {
  if (!workspaceId || !laneId) {
    throw new Error('workspaceId and laneId are required');
  }
  return apiClient.post(`/interviews/workflows/${workspaceId}/lanes/${laneId}/cards`, payload);
}

export function updateInterviewCard(workspaceId, laneId, cardId, payload) {
  if (!workspaceId || !laneId || !cardId) {
    throw new Error('workspaceId, laneId and cardId are required');
  }
  return apiClient.patch(`/interviews/workflows/${workspaceId}/lanes/${laneId}/cards/${cardId}`, payload);
}

export function deleteInterviewCard(workspaceId, laneId, cardId) {
  if (!workspaceId || !laneId || !cardId) {
    throw new Error('workspaceId, laneId and cardId are required');
  }
  return apiClient.delete(`/interviews/workflows/${workspaceId}/lanes/${laneId}/cards/${cardId}`);
}

export function listPanelTemplates(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.get(`/interviews/workspaces/${workspaceId}/templates`, { signal });
}

export function createPanelTemplate(workspaceId, payload) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.post(`/interviews/workspaces/${workspaceId}/templates`, payload);
}

export function updatePanelTemplate(templateId, payload) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.patch(`/interviews/templates/${templateId}`, payload);
}

export function deletePanelTemplate(templateId) {
  if (!templateId) {
    throw new Error('templateId is required');
  }
  return apiClient.delete(`/interviews/templates/${templateId}`);
}

export function listCandidatePrepPortals(workspaceId, { signal } = {}) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.get(`/interviews/workspaces/${workspaceId}/prep`, { signal });
}

export function createCandidatePrepPortal(workspaceId, payload) {
  if (!workspaceId) {
    throw new Error('workspaceId is required');
  }
  return apiClient.post(`/interviews/workspaces/${workspaceId}/prep`, payload);
}

export function updateCandidatePrepPortal(portalId, payload) {
  if (!portalId) {
    throw new Error('portalId is required');
  }
  return apiClient.patch(`/interviews/prep/${portalId}`, payload);
}

export function deleteCandidatePrepPortal(portalId) {
  if (!portalId) {
    throw new Error('portalId is required');
  }
  return apiClient.delete(`/interviews/prep/${portalId}`);
}

export default {
  listInterviewWorkspaces,
  fetchInterviewWorkspace,
  fetchInterviewWorkflow,
  fetchInterviewRoom,
  listInterviewRooms,
  createInterviewRoom,
  updateInterviewRoom,
  deleteInterviewRoom,
  addInterviewParticipant,
  updateInterviewParticipant,
  deleteInterviewParticipant,
  createInterviewChecklistItem,
  updateInterviewChecklistItem,
  deleteInterviewChecklistItem,
  createInterviewLane,
  updateInterviewLane,
  deleteInterviewLane,
  createInterviewCard,
  updateInterviewCard,
  deleteInterviewCard,
  listPanelTemplates,
  createPanelTemplate,
  updatePanelTemplate,
  deletePanelTemplate,
  listCandidatePrepPortals,
  createCandidatePrepPortal,
  updateCandidatePrepPortal,
  deleteCandidatePrepPortal,
};
