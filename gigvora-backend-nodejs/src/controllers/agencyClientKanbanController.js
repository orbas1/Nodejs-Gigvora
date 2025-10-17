import {
  getClientKanban,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClient,
  updateClient,
} from '../services/agencyClientKanbanService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

function parseWorkspaceId(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function resolveContext(req) {
  const ownerId = resolveRequestUserId(req) ?? req.user?.id ?? null;
  if (!ownerId) {
    throw new Error('Unable to resolve authenticated user.');
  }
  const workspaceId =
    parseWorkspaceId(req.query?.workspaceId) ?? parseWorkspaceId(req.body?.workspaceId) ?? null;
  return { ownerId, workspaceId };
}

export async function index(req, res) {
  const context = resolveContext(req);
  const snapshot = await getClientKanban(context);
  res.json(snapshot);
}

export async function storeColumn(req, res) {
  const context = resolveContext(req);
  const column = await createColumn(context.ownerId, context.workspaceId, req.body ?? {});
  res.status(201).json(column);
}

export async function updateColumnController(req, res) {
  const context = resolveContext(req);
  const columnId = Number.parseInt(req.params?.columnId, 10);
  const column = await updateColumn(context.ownerId, context.workspaceId, columnId, req.body ?? {});
  res.json(column);
}

export async function destroyColumn(req, res) {
  const context = resolveContext(req);
  const columnId = Number.parseInt(req.params?.columnId, 10);
  await deleteColumn(context.ownerId, context.workspaceId, columnId);
  res.status(204).send();
}

export async function storeCard(req, res) {
  const context = resolveContext(req);
  const card = await createCard(context.ownerId, context.workspaceId, req.body ?? {});
  res.status(201).json(card);
}

export async function updateCardController(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  const card = await updateCard(context.ownerId, context.workspaceId, cardId, req.body ?? {});
  res.json(card);
}

export async function moveCardController(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  const card = await moveCard(context.ownerId, context.workspaceId, cardId, req.body ?? {});
  res.json(card);
}

export async function destroyCard(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  await deleteCard(context.ownerId, context.workspaceId, cardId);
  res.status(204).send();
}

export async function storeChecklistItem(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  const item = await createChecklistItem(context.ownerId, context.workspaceId, cardId, req.body ?? {});
  res.status(201).json(item);
}

export async function updateChecklistItemController(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  const itemId = Number.parseInt(req.params?.itemId, 10);
  const item = await updateChecklistItem(
    context.ownerId,
    context.workspaceId,
    cardId,
    itemId,
    req.body ?? {},
  );
  res.json(item);
}

export async function destroyChecklistItem(req, res) {
  const context = resolveContext(req);
  const cardId = Number.parseInt(req.params?.cardId, 10);
  const itemId = Number.parseInt(req.params?.itemId, 10);
  await deleteChecklistItem(context.ownerId, context.workspaceId, cardId, itemId);
  res.status(204).send();
}

export async function storeClient(req, res) {
  const context = resolveContext(req);
  const client = await createClient(context.ownerId, context.workspaceId, req.body ?? {});
  res.status(201).json(client);
}

export async function updateClientController(req, res) {
  const context = resolveContext(req);
  const clientId = Number.parseInt(req.params?.clientId, 10);
  const client = await updateClient(context.ownerId, context.workspaceId, clientId, req.body ?? {});
  res.json(client);
}

export default {
  index,
  storeColumn,
  updateColumnController,
  destroyColumn,
  storeCard,
  updateCardController,
  moveCardController,
  destroyCard,
  storeChecklistItem,
  updateChecklistItemController,
  destroyChecklistItem,
  storeClient,
  updateClientController,
};

