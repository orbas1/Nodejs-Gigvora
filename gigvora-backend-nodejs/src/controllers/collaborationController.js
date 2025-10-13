import {
  listSpaces,
  getSpace,
  createSpace,
  createVideoRoom,
  addAsset,
  addAnnotation,
  connectRepository,
  createAiSession,
} from '../services/collaborationService.js';

function parseNumber(value, fallback = undefined) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }
  return Boolean(value);
}

export async function index(req, res) {
  const { ownerId, participantId, includeArchived } = req.query ?? {};
  const result = await listSpaces({
    ownerId,
    participantId,
    includeArchived: parseBoolean(includeArchived),
  });
  res.json(result);
}

export async function show(req, res) {
  const { spaceId } = req.params;
  const result = await getSpace(spaceId);
  res.json(result);
}

export async function store(req, res) {
  const payload = req.body ?? {};
  const result = await createSpace(payload, { actorId: parseNumber(payload.actorId) });
  res.status(201).json(result);
}

export async function storeRoom(req, res) {
  const { spaceId } = req.params;
  const payload = req.body ?? {};
  const result = await createVideoRoom(spaceId, payload);
  res.status(201).json(result);
}

export async function storeAsset(req, res) {
  const { spaceId } = req.params;
  const payload = req.body ?? {};
  const result = await addAsset(spaceId, payload);
  res.status(201).json(result);
}

export async function storeAnnotation(req, res) {
  const { assetId } = req.params;
  const payload = req.body ?? {};
  const result = await addAnnotation(assetId, payload);
  res.status(201).json(result);
}

export async function storeRepository(req, res) {
  const { spaceId } = req.params;
  const payload = req.body ?? {};
  const result = await connectRepository(spaceId, payload);
  res.status(201).json(result);
}

export async function storeAiSession(req, res) {
  const { spaceId } = req.params;
  const payload = req.body ?? {};
  const result = await createAiSession(spaceId, payload, { actorId: parseNumber(payload.actorId) });
  res.status(201).json(result);
}

export default {
  index,
  show,
  store,
  storeRoom,
  storeAsset,
  storeAnnotation,
  storeRepository,
  storeAiSession,
};
