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
import { resolveWorkspaceForActor, resolveWorkspaceIdentifiersFromRequest } from '../utils/agencyWorkspaceAccess.js';
import {
  buildAgencyActorContext,
  ensurePlainObject,
  toPositiveInteger,
} from '../utils/controllerUtils.js';

async function resolveContext(req, body = {}) {
  const actor = buildAgencyActorContext(req);
  const identifiers = resolveWorkspaceIdentifiersFromRequest(req, body, { required: false });
  let workspaceId = identifiers.workspaceId ?? null;
  if (workspaceId != null || identifiers.workspaceSlug) {
    const { workspace } = await resolveWorkspaceForActor(identifiers, actor, { requireMembership: true });
    workspaceId = workspace.id;
  }
  return { actor, workspaceId };
}

export async function index(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.query ?? {});
  const snapshot = await getClientKanban({ ownerId: actor.actorId, workspaceId });
  res.json(snapshot);
}

export async function storeColumn(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const column = await createColumn(actor.actorId, workspaceId, payload);
  res.status(201).json(column);
}

export async function updateColumnController(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const columnId = toPositiveInteger(req.params?.columnId, { fieldName: 'columnId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const column = await updateColumn(actor.actorId, workspaceId, columnId, payload);
  res.json(column);
}

export async function destroyColumn(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.query ?? {});
  const columnId = toPositiveInteger(req.params?.columnId, { fieldName: 'columnId' });
  await deleteColumn(actor.actorId, workspaceId, columnId);
  res.status(204).send();
}

export async function storeCard(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const card = await createCard(actor.actorId, workspaceId, payload);
  res.status(201).json(card);
}

export async function updateCardController(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const card = await updateCard(actor.actorId, workspaceId, cardId, payload);
  res.json(card);
}

export async function moveCardController(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const card = await moveCard(actor.actorId, workspaceId, cardId, payload);
  res.json(card);
}

export async function destroyCard(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.query ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  await deleteCard(actor.actorId, workspaceId, cardId);
  res.status(204).send();
}

export async function storeChecklistItem(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const item = await createChecklistItem(actor.actorId, workspaceId, cardId, payload);
  res.status(201).json(item);
}

export async function updateChecklistItemController(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  const itemId = toPositiveInteger(req.params?.itemId, { fieldName: 'itemId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const item = await updateChecklistItem(actor.actorId, workspaceId, cardId, itemId, payload);
  res.json(item);
}

export async function destroyChecklistItem(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.query ?? {});
  const cardId = toPositiveInteger(req.params?.cardId, { fieldName: 'cardId' });
  const itemId = toPositiveInteger(req.params?.itemId, { fieldName: 'itemId' });
  await deleteChecklistItem(actor.actorId, workspaceId, cardId, itemId);
  res.status(204).send();
}

export async function storeClient(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const client = await createClient(actor.actorId, workspaceId, payload);
  res.status(201).json(client);
}

export async function updateClientController(req, res) {
  const { actor, workspaceId } = await resolveContext(req, req.body ?? {});
  const clientId = toPositiveInteger(req.params?.clientId, { fieldName: 'clientId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const client = await updateClient(actor.actorId, workspaceId, clientId, payload);
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
