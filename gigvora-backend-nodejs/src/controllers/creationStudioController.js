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
