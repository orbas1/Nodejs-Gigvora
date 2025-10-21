import { apiClient } from './apiClient.js';
import {
  requireIdentifier,
  mergeWorkspace,
  buildWorkspaceContext,
  combineRequestOptions,
} from './serviceHelpers.js';

function parsePositiveInteger(value) {
  if (value == null) {
    return undefined;
  }
  const numeric = typeof value === 'string' ? Number.parseInt(value.trim(), 10) : value;
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return undefined;
}

function userEventsPath(userId) {
  const resolvedUserId = requireIdentifier(userId, 'userId');
  return `/users/${resolvedUserId}/events`;
}

function specificEventPath(userId, eventId) {
  const resolvedEventId = requireIdentifier(eventId, 'eventId');
  return `${userEventsPath(userId)}/${resolvedEventId}`;
}

function resourcePath(userId, eventId, resource, identifier, label) {
  let path = `${specificEventPath(userId, eventId)}/${resource}`;
  if (identifier != null) {
    path += `/${requireIdentifier(identifier, label)}`;
  }
  return path;
}

function withWorkspaceBody(payload = {}, workspace = {}) {
  if (payload instanceof FormData) {
    const context = buildWorkspaceContext(workspace);
    Object.entries(context).forEach(([key, value]) => {
      payload.set(key, value);
    });
    return payload;
  }
  return mergeWorkspace({ ...(payload || {}) }, workspace);
}

export async function fetchEventManagement(
  userId,
  { includeArchived, limit, workspaceId, workspaceSlug, ...options } = {},
) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  if (includeArchived !== undefined) {
    params.includeArchived = includeArchived ? 'true' : 'false';
  }
  const normalisedLimit = parsePositiveInteger(limit);
  if (normalisedLimit !== undefined) {
    params.limit = normalisedLimit;
  }

  return apiClient.get(
    userEventsPath(userId),
    combineRequestOptions({ params }, options),
  );
}

export async function fetchEventSettings(userId, options = {}) {
  return apiClient.get(
    `${userEventsPath(userId)}/settings`,
    combineRequestOptions({}, options),
  );
}

export async function updateEventSettings(
  userId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    `${userEventsPath(userId)}/settings`,
    body,
    combineRequestOptions({}, options),
  );
}

export async function createEvent(userId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    userEventsPath(userId),
    body,
    combineRequestOptions({}, options),
  );
}

export async function getEvent(userId, eventId, options = {}) {
  return apiClient.get(
    specificEventPath(userId, eventId),
    combineRequestOptions({}, options),
  );
}

export async function updateEvent(
  userId,
  eventId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    specificEventPath(userId, eventId),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteEvent(userId, eventId, { workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    specificEventPath(userId, eventId),
    combineRequestOptions({ params }, options),
  );
}

export async function createTask(userId, eventId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'tasks'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateTask(
  userId,
  eventId,
  taskId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'tasks', taskId, 'taskId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteTask(userId, eventId, taskId, { workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'tasks', taskId, 'taskId'),
    combineRequestOptions({ params }, options),
  );
}

export async function createGuest(userId, eventId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'guests'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateGuest(
  userId,
  eventId,
  guestId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'guests', guestId, 'guestId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteGuest(userId, eventId, guestId, { workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'guests', guestId, 'guestId'),
    combineRequestOptions({ params }, options),
  );
}

export async function createBudgetItem(userId, eventId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'budget-items'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateBudgetItem(
  userId,
  eventId,
  budgetItemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'budget-items', budgetItemId, 'budgetItemId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteBudgetItem(
  userId,
  eventId,
  budgetItemId,
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'budget-items', budgetItemId, 'budgetItemId'),
    combineRequestOptions({ params }, options),
  );
}

export async function createAgendaItem(userId, eventId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'agenda'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateAgendaItem(
  userId,
  eventId,
  agendaItemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'agenda', agendaItemId, 'agendaItemId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteAgendaItem(userId, eventId, agendaItemId, { workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'agenda', agendaItemId, 'agendaItemId'),
    combineRequestOptions({ params }, options),
  );
}

export async function createAsset(userId, eventId, payload = {}, { workspaceId, workspaceSlug, ...options } = {}) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'assets'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateAsset(
  userId,
  eventId,
  assetId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'assets', assetId, 'assetId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteAsset(userId, eventId, assetId, { workspaceId, workspaceSlug, ...options } = {}) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'assets', assetId, 'assetId'),
    combineRequestOptions({ params }, options),
  );
}

export async function createChecklistItem(
  userId,
  eventId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.post(
    resourcePath(userId, eventId, 'checklist'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function updateChecklistItem(
  userId,
  eventId,
  checklistItemId,
  payload = {},
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const body = withWorkspaceBody(payload ?? {}, { workspaceId, workspaceSlug });
  return apiClient.patch(
    resourcePath(userId, eventId, 'checklist', checklistItemId, 'checklistItemId'),
    body,
    combineRequestOptions({}, options),
  );
}

export async function deleteChecklistItem(
  userId,
  eventId,
  checklistItemId,
  { workspaceId, workspaceSlug, ...options } = {},
) {
  const params = mergeWorkspace({}, { workspaceId, workspaceSlug });
  return apiClient.delete(
    resourcePath(userId, eventId, 'checklist', checklistItemId, 'checklistItemId'),
    combineRequestOptions({ params }, options),
  );
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
  fetchEventSettings,
  updateEventSettings,
};
