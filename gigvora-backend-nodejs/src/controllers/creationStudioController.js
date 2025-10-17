import creationStudioService from '../services/creationStudioService.js';

function resolveActorId(req) {
  if (req.user?.id) {
    return req.user.id;
  }
  if (req.user?.userId) {
    return req.user.userId;
  }
  if (req.user?.profileId) {
    return req.user.profileId;
  }
  return Number.parseInt(req.params.id, 10) || null;
}

export async function getWorkspace(req, res) {
  const includeArchived = req.query.includeArchived === 'true';
  const workspace = await creationStudioService.getWorkspace(req.params.id, { includeArchived });
  res.json(workspace);
}

export async function createItem(req, res) {
  const actorId = resolveActorId(req);
  const item = await creationStudioService.createItem(req.params.id, req.body ?? {}, { actorId });
  res.status(201).json(item);
}

export async function updateItem(req, res) {
  const actorId = resolveActorId(req);
  const item = await creationStudioService.updateItem(req.params.id, req.params.itemId, req.body ?? {}, { actorId });
  if (!item) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  res.json(item);
}

export async function recordStep(req, res) {
  const actorId = resolveActorId(req);
  const step = await creationStudioService.recordStepProgress(
    req.params.id,
    req.params.itemId,
    req.params.stepKey,
    req.body ?? {},
    { actorId },
  );
  if (!step) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  res.json(step);
}

export async function shareItem(req, res) {
  const actorId = resolveActorId(req);
  const item = await creationStudioService.shareItem(req.params.id, req.params.itemId, req.body ?? {}, { actorId });
  if (!item) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  res.json(item);
}

export async function archiveItem(req, res) {
  const actorId = resolveActorId(req);
  const archived = await creationStudioService.archiveItem(req.params.id, req.params.itemId, { actorId });
  if (!archived) {
    return res.status(404).json({ message: 'Creation not found' });
  }
  res.status(204).end();
}

export default {
  getWorkspace,
  createItem,
  updateItem,
  recordStep,
  shareItem,
  archiveItem,
import {
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
} from '../services/creationStudioService.js';

function resolveActorId(req, payload = {}) {
  const candidates = [
    req?.user?.id,
    req?.headers?.['x-user-id'],
    payload.actorId,
    payload.ownerId,
  ];
  for (const candidate of candidates) {
    if (candidate == null || candidate === '') {
      continue;
    }
    const numeric = Number.parseInt(candidate, 10);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return undefined;
}

export async function index(req, res) {
  const { ownerId, type, status, visibility, search, page, pageSize } = req.query ?? {};
  const result = await listCreationStudioItems({ ownerId, type, status, visibility, search, page, pageSize });
  res.json(result);
}

export async function show(req, res) {
  const { itemId } = req.params ?? {};
  const item = await getCreationStudioItem(itemId);
  res.json(item);
}

export async function create(req, res) {
  const payload = req.body ? { ...req.body } : {};
  const actorId = resolveActorId(req, payload);
  const item = await createCreationStudioItem(payload, { actorId });
  res.status(201).json(item);
}

export async function update(req, res) {
  const { itemId } = req.params ?? {};
  const payload = req.body ? { ...req.body } : {};
  const actorId = resolveActorId(req, payload);
  const item = await updateCreationStudioItem(itemId, payload, { actorId });
  res.json(item);
}

export async function publish(req, res) {
  const { itemId } = req.params ?? {};
  const payload = req.body ? { ...req.body } : {};
  const actorId = resolveActorId(req, payload);
  const item = await publishCreationStudioItem(itemId, payload, { actorId });
  res.json(item);
}

export default {
  index,
  show,
  create,
  update,
  publish,
};
