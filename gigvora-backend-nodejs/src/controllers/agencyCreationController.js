import {
  getCreationStudioOverview,
  getCreationStudioSnapshot,
  createCreationItem,
  updateCreationItem,
  deleteCreationItem,
} from '../services/agencyCreationStudioService.js';

function parseInteger(value, fallback = null) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function overview(req, res) {
  const { query, user } = req;
  const actorId = user?.id ?? null;
  const actorRole = user?.type ?? null;

  const result = await getCreationStudioOverview(
    {
      agencyProfileId: query?.agencyProfileId ? Number.parseInt(query.agencyProfileId, 10) : null,
      page: parseInteger(query?.page, 1),
      pageSize: parseInteger(query?.pageSize, undefined),
      targetType: query?.targetType ?? null,
      status: query?.status ?? null,
      search: query?.search ?? null,
    },
    { actorId, actorRole },
  );

  res.json(result);
}

export async function snapshot(req, res) {
  const { query, user } = req;
  const actorId = user?.id ?? null;
  const actorRole = user?.type ?? null;

  const result = await getCreationStudioSnapshot(
    {
      agencyProfileId: query?.agencyProfileId ? Number.parseInt(query.agencyProfileId, 10) : null,
      targetType: query?.targetType ?? null,
      status: query?.status ?? null,
    },
    { actorId, actorRole },
  );

  res.json(result);
}

export async function store(req, res) {
  const { body, user } = req;
  const actorId = user?.id ?? null;
  const actorRole = user?.type ?? null;

  const result = await createCreationItem(body ?? {}, { actorId, actorRole });
  res.status(201).json(result);
}

export async function update(req, res) {
  const { body, params, user } = req;
  const actorId = user?.id ?? null;
  const actorRole = user?.type ?? null;

  const itemId = Number.parseInt(params?.itemId, 10);
  if (!Number.isFinite(itemId)) {
    res.status(400).json({ message: 'A valid creation item id is required.' });
    return;
  }

  const result = await updateCreationItem(itemId, body ?? {}, { actorId, actorRole });
  res.json(result);
}

export async function destroy(req, res) {
  const { params, user } = req;
  const actorId = user?.id ?? null;
  const actorRole = user?.type ?? null;
  const itemId = Number.parseInt(params?.itemId, 10);
  if (!Number.isFinite(itemId)) {
    res.status(400).json({ message: 'A valid creation item id is required.' });
    return;
  }

  const result = await deleteCreationItem(itemId, { actorId, actorRole });
  res.status(200).json(result);
}

export default {
  overview,
  snapshot,
  store,
  update,
  destroy,
};
