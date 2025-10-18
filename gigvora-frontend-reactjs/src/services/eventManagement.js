import { apiClient } from './apiClient.js';

export async function fetchEventManagement(userId, { includeArchived = false, signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load event management data.');
  }
  const params = new URLSearchParams();
  if (includeArchived) {
    params.set('includeArchived', 'true');
  }
  const query = params.toString();
  const url = query ? `/users/${userId}/events?${query}` : `/users/${userId}/events`;
  return apiClient.get(url, { signal });
}

export async function createEvent(userId, payload) {
  if (!userId) {
    throw new Error('userId is required to create an event.');
  }
  return apiClient.post(`/users/${userId}/events`, payload ?? {});
}

export async function getEvent(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error('userId and eventId are required.');
  }
  return apiClient.get(`/users/${userId}/events/${eventId}`);
}

export async function updateEvent(userId, eventId, payload) {
  if (!userId || !eventId) {
    throw new Error('userId and eventId are required.');
  }
  return apiClient.patch(`/users/${userId}/events/${eventId}`, payload ?? {});
}

export async function deleteEvent(userId, eventId) {
  if (!userId || !eventId) {
    throw new Error('userId and eventId are required.');
  }
  return apiClient.delete(`/users/${userId}/events/${eventId}`);
}

export async function createTask(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/tasks`, payload ?? {});
}

export async function updateTask(userId, eventId, taskId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/tasks/${taskId}`, payload ?? {});
}

export async function deleteTask(userId, eventId, taskId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/tasks/${taskId}`);
}

export async function createGuest(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/guests`, payload ?? {});
}

export async function updateGuest(userId, eventId, guestId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/guests/${guestId}`, payload ?? {});
}

export async function deleteGuest(userId, eventId, guestId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/guests/${guestId}`);
}

export async function createBudgetItem(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/budget-items`, payload ?? {});
}

export async function updateBudgetItem(userId, eventId, budgetItemId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/budget-items/${budgetItemId}`, payload ?? {});
}

export async function deleteBudgetItem(userId, eventId, budgetItemId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/budget-items/${budgetItemId}`);
}

export async function createAgendaItem(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/agenda`, payload ?? {});
}

export async function updateAgendaItem(userId, eventId, agendaItemId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/agenda/${agendaItemId}`, payload ?? {});
}

export async function deleteAgendaItem(userId, eventId, agendaItemId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/agenda/${agendaItemId}`);
}

export async function createAsset(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/assets`, payload ?? {});
}

export async function updateAsset(userId, eventId, assetId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/assets/${assetId}`, payload ?? {});
}

export async function deleteAsset(userId, eventId, assetId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/assets/${assetId}`);
}

export async function createChecklistItem(userId, eventId, payload) {
  return apiClient.post(`/users/${userId}/events/${eventId}/checklist`, payload ?? {});
}

export async function updateChecklistItem(userId, eventId, checklistItemId, payload) {
  return apiClient.patch(`/users/${userId}/events/${eventId}/checklist/${checklistItemId}`, payload ?? {});
}

export async function deleteChecklistItem(userId, eventId, checklistItemId) {
  return apiClient.delete(`/users/${userId}/events/${eventId}/checklist/${checklistItemId}`);
}

export default {
  fetchEventManagement,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  createTask,
  updateTask,
  deleteTask,
  createGuest,
  updateGuest,
  deleteGuest,
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  createAsset,
  updateAsset,
  deleteAsset,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
};
