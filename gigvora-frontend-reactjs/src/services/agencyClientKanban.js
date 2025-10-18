import apiClient from './apiClient.js';

const BASE_PATH = '/agency/client-kanban';

function buildParams({ workspaceId } = {}) {
  const params = {};
  if (workspaceId != null && `${workspaceId}`.length > 0) {
    params.workspaceId = workspaceId;
  }
  return params;
}

export async function fetchAgencyClientKanban({ workspaceId } = {}) {
  const response = await apiClient.get(BASE_PATH, { params: buildParams({ workspaceId }) });
  return response.data;
}

export async function createKanbanColumn(payload = {}, { workspaceId } = {}) {
  const response = await apiClient.post(`${BASE_PATH}/columns`, { ...payload, workspaceId });
  return response.data;
}

export async function updateKanbanColumn(columnId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.patch(`${BASE_PATH}/columns/${columnId}`, {
    ...payload,
    workspaceId,
  });
  return response.data;
}

export async function deleteKanbanColumn(columnId, { workspaceId } = {}) {
  await apiClient.delete(`${BASE_PATH}/columns/${columnId}`, { data: { workspaceId } });
}

export async function createKanbanCard(payload = {}, { workspaceId } = {}) {
  const response = await apiClient.post(`${BASE_PATH}/cards`, { ...payload, workspaceId });
  return response.data;
}

export async function updateKanbanCard(cardId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.patch(`${BASE_PATH}/cards/${cardId}`, { ...payload, workspaceId });
  return response.data;
}

export async function moveKanbanCard(cardId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.post(`${BASE_PATH}/cards/${cardId}/move`, { ...payload, workspaceId });
  return response.data;
}

export async function deleteKanbanCard(cardId, { workspaceId } = {}) {
  await apiClient.delete(`${BASE_PATH}/cards/${cardId}`, { data: { workspaceId } });
}

export async function createChecklistItem(cardId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.post(`${BASE_PATH}/cards/${cardId}/checklist`, { ...payload, workspaceId });
  return response.data;
}

export async function updateChecklistItem(cardId, itemId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.patch(
    `${BASE_PATH}/cards/${cardId}/checklist/${itemId}`,
    { ...payload, workspaceId },
  );
  return response.data;
}

export async function deleteChecklistItem(cardId, itemId, { workspaceId } = {}) {
  await apiClient.delete(`${BASE_PATH}/cards/${cardId}/checklist/${itemId}`, {
    data: { workspaceId },
  });
}

export async function createClientAccount(payload = {}, { workspaceId } = {}) {
  const response = await apiClient.post(`${BASE_PATH}/clients`, { ...payload, workspaceId });
  return response.data;
}

export async function updateClientAccount(clientId, payload = {}, { workspaceId } = {}) {
  const response = await apiClient.patch(`${BASE_PATH}/clients/${clientId}`, {
    ...payload,
    workspaceId,
  });
  return response.data;
}

export default {
  fetchAgencyClientKanban,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  createKanbanCard,
  updateKanbanCard,
  moveKanbanCard,
  deleteKanbanCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClientAccount,
  updateClientAccount,
};

