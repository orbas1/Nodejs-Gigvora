import {
  listCreationStudioItems,
  getCreationStudioOverview,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  getWorkspace,
  createItem,
  updateItem,
  recordStepProgress,
  shareItem,
  archiveItem,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
} from '../services/creationStudioService.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

function parsePositiveInt(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalPositiveInt(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveActorId(req, { required = true } = {}) {
  const candidates = [req.user?.id, req.body?.actorId, req.headers?.['x-actor-id']];
  for (const candidate of candidates) {
    const parsed = parseOptionalPositiveInt(candidate);
    if (parsed) {
      return parsed;
    }
  }
  if (required) {
    throw new AuthorizationError('Authenticated actor required.');
  }
  return null;
}

function normaliseLimit(value, { fallback, min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(parsed, max));
}

function normaliseOffset(value, { fallback } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalisePage(value, { fallback } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function overview(req, res) {
  const workspaceId = parseOptionalPositiveInt(req.query.workspaceId);
  const payload = await getCreationStudioOverview({ workspaceId });
  res.json(payload);
}

export async function index(req, res) {
  const { workspaceId, type, status, search, limit, offset, page, pageSize } = req.query ?? {};
  const selectedType = type && CREATION_STUDIO_ITEM_TYPES.includes(type) ? type : undefined;
  const selectedStatus = status && CREATION_STUDIO_ITEM_STATUSES.includes(status) ? status : undefined;
  const pagination = {};
  const limitValue = normaliseLimit(limit);
  const offsetValue = normaliseOffset(offset);
  const pageValue = normalisePage(page);
  const pageSizeValue = normaliseLimit(pageSize);

  if (limitValue != null) {
    pagination.limit = limitValue;
  }
  if (offsetValue != null) {
    pagination.offset = offsetValue;
  }
  if (pageValue != null) {
    pagination.page = pageValue;
  }
  if (pageSizeValue != null) {
    pagination.pageSize = pageSizeValue;
  }

  const items = await listCreationStudioItems({
    workspaceId: parseOptionalPositiveInt(workspaceId),
    type: selectedType,
    status: selectedStatus,
    search,
    ...pagination,
  });
  res.json({ items });
}

export async function store(req, res) {
  const actorId = resolveActorId(req);
  const workspaceId = parsePositiveInt(req.body?.workspaceId, 'workspaceId');
  const item = await createCreationStudioItem({ ...req.body, workspaceId }, { actorId });
  res.status(201).json(item);
}

export async function update(req, res) {
  const actorId = resolveActorId(req, { required: false });
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const item = await updateCreationStudioItem(itemId, req.body ?? {}, { actorId });
  res.json(item);
}

export async function publish(req, res) {
  const actorId = resolveActorId(req, { required: false });
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const item = await publishCreationStudioItem(itemId, req.body ?? {}, { actorId });
  res.json(item);
}

export async function destroy(req, res) {
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  await deleteCreationStudioItem(itemId);
  res.status(204).send();
}

export async function getWorkspaceHandler(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const includeArchived = req.query.includeArchived === 'true';
  const workspace = await getWorkspace(ownerId, { includeArchived });
  res.json(workspace);
}

export async function createItemHandler(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const actorId = resolveActorId(req, { required: false }) ?? ownerId;
  const item = await createItem(ownerId, req.body ?? {}, { actorId });
  res.status(201).json(item);
}

export async function updateItemHandler(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const actorId = resolveActorId(req, { required: false }) ?? ownerId;
  const item = await updateItem(ownerId, itemId, req.body ?? {}, { actorId });
  if (!item) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  return res.json(item);
}

export async function recordStep(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const { stepKey } = req.params;
  const actorId = resolveActorId(req, { required: false }) ?? ownerId;
  const step = await recordStepProgress(ownerId, itemId, stepKey, req.body ?? {}, { actorId });
  if (!step) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  return res.json(step);
}

export async function shareItemHandler(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const actorId = resolveActorId(req, { required: false }) ?? ownerId;
  const item = await shareItem(ownerId, itemId, req.body ?? {}, { actorId });
  if (!item) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  return res.json(item);
}

export async function archiveItemHandler(req, res) {
  const ownerId = parsePositiveInt(req.params.id, 'ownerId');
  const itemId = parsePositiveInt(req.params.itemId, 'itemId');
  const actorId = resolveActorId(req, { required: false }) ?? ownerId;
  const archived = await archiveItem(ownerId, itemId, { actorId });
  if (!archived) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  return res.status(204).end();
}

export default {
  overview,
  index,
  store,
  update,
  publish,
  destroy,
  getWorkspace: getWorkspaceHandler,
  createItem: createItemHandler,
  updateItem: updateItemHandler,
  recordStep,
  shareItem: shareItemHandler,
  archiveItem: archiveItemHandler,
};
