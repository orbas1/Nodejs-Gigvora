import eventManagementService from '../services/eventManagementService.js';

export async function listEventManagement(req, res) {
  const { userId } = req.params;
  const includeArchived = req.query.includeArchived === 'true';
  const limitParam = req.query.limit != null ? Number(req.query.limit) : undefined;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;
  const payload = await eventManagementService.getUserEventManagement(userId, {
    includeArchived,
    limit,
  });
  res.json(payload);
}

export async function createEvent(req, res) {
  const { userId } = req.params;
  const event = await eventManagementService.createEvent(userId, req.body ?? {});
  res.status(201).json(event);
}

export async function getEvent(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.getEvent(userId, eventId);
  res.json(event);
}

export async function updateEvent(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.updateEvent(userId, eventId, req.body ?? {});
  res.json(event);
}

export async function deleteEvent(req, res) {
  const { userId, eventId } = req.params;
  await eventManagementService.deleteEvent(userId, eventId);
  res.status(204).end();
}

export async function createTask(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createTask(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateTask(req, res) {
  const { userId, eventId, taskId } = req.params;
  const event = await eventManagementService.updateTask(userId, eventId, taskId, req.body ?? {});
  res.json(event);
}

export async function deleteTask(req, res) {
  const { userId, eventId, taskId } = req.params;
  const event = await eventManagementService.deleteTask(userId, eventId, taskId);
  res.json(event);
}

export async function createGuest(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createGuest(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateGuest(req, res) {
  const { userId, eventId, guestId } = req.params;
  const event = await eventManagementService.updateGuest(userId, eventId, guestId, req.body ?? {});
  res.json(event);
}

export async function deleteGuest(req, res) {
  const { userId, eventId, guestId } = req.params;
  const event = await eventManagementService.deleteGuest(userId, eventId, guestId);
  res.json(event);
}

export async function createBudgetItem(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createBudgetItem(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateBudgetItem(req, res) {
  const { userId, eventId, budgetItemId } = req.params;
  const event = await eventManagementService.updateBudgetItem(userId, eventId, budgetItemId, req.body ?? {});
  res.json(event);
}

export async function deleteBudgetItem(req, res) {
  const { userId, eventId, budgetItemId } = req.params;
  const event = await eventManagementService.deleteBudgetItem(userId, eventId, budgetItemId);
  res.json(event);
}

export async function createAgendaItem(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createAgendaItem(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateAgendaItem(req, res) {
  const { userId, eventId, agendaItemId } = req.params;
  const event = await eventManagementService.updateAgendaItem(userId, eventId, agendaItemId, req.body ?? {});
  res.json(event);
}

export async function deleteAgendaItem(req, res) {
  const { userId, eventId, agendaItemId } = req.params;
  const event = await eventManagementService.deleteAgendaItem(userId, eventId, agendaItemId);
  res.json(event);
}

export async function createAsset(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createAsset(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateAsset(req, res) {
  const { userId, eventId, assetId } = req.params;
  const event = await eventManagementService.updateAsset(userId, eventId, assetId, req.body ?? {});
  res.json(event);
}

export async function deleteAsset(req, res) {
  const { userId, eventId, assetId } = req.params;
  const event = await eventManagementService.deleteAsset(userId, eventId, assetId);
  res.json(event);
}

export async function createChecklistItem(req, res) {
  const { userId, eventId } = req.params;
  const event = await eventManagementService.createChecklistItem(userId, eventId, req.body ?? {});
  res.status(201).json(event);
}

export async function updateChecklistItem(req, res) {
  const { userId, eventId, checklistItemId } = req.params;
  const event = await eventManagementService.updateChecklistItem(userId, eventId, checklistItemId, req.body ?? {});
  res.json(event);
}

export async function deleteChecklistItem(req, res) {
  const { userId, eventId, checklistItemId } = req.params;
  const event = await eventManagementService.deleteChecklistItem(userId, eventId, checklistItemId);
  res.json(event);
}

export default {
  listEventManagement,
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
