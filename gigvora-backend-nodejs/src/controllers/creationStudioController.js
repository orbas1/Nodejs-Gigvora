import {
  getCreationStudioOverview,
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  getWorkspace as getWorkspaceSummary,
  createItem as createWorkspaceItem,
  updateItem as updateWorkspaceItem,
  recordStepProgress,
  shareItem as shareWorkspaceItem,
  archiveItem as archiveWorkspaceItem,
} from '../services/creationStudioService.js';

function parseInteger(value, { min = 1 } = {}) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min) {
    return undefined;
  }
  return parsed;
}

function collectRoles(user) {
  const roles = new Set();
  if (!user) {
    return roles;
  }
  if (user.userType) {
    roles.add(String(user.userType).toLowerCase());
  }
  if (Array.isArray(user.roles)) {
    user.roles.map((role) => String(role).toLowerCase()).forEach((role) => roles.add(role));
  }
  if (Array.isArray(user.memberships)) {
    user.memberships
      .map((membership) => membership?.role ?? membership)
      .filter(Boolean)
      .map((role) => String(role).toLowerCase())
      .forEach((role) => roles.add(role));
  }
  return roles;
}

function buildPermissions(req) {
  const roles = collectRoles(req.user);
  const allowedRoles = new Set(['admin', 'company', 'company_admin', 'workspace_admin']);
  const canManage = Array.from(roles).some((role) => allowedRoles.has(role));
  return {
    roles: Array.from(roles),
    allowedRoles: Array.from(allowedRoles),
    canManage,
  };
}

function resolveActorId(req, payload = {}) {
  const candidates = [req?.user?.id, req?.user?.userId, req?.user?.profileId, payload?.actorId];
  for (const candidate of candidates) {
    if (candidate == null || candidate === '') {
      continue;
    }
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
}

export async function overview(req, res) {
  const workspaceId = parseInteger(req.query?.workspaceId);
  const ownerId = parseInteger(req.query?.ownerId);
  const summary = await getCreationStudioOverview({ workspaceId, ownerId });
  res.json({ ...summary, permissions: buildPermissions(req) });
}

export async function index(req, res) {
  const { workspaceId, ownerId, type, status, visibility, search, page, pageSize } = req.query ?? {};
  const result = await listCreationStudioItems({
    workspaceId: workspaceId ?? undefined,
    ownerId: ownerId ?? undefined,
    type: type ?? undefined,
    status: status ?? undefined,
    visibility: visibility ?? undefined,
    search: search ?? undefined,
    page: parseInteger(page),
    pageSize: parseInteger(pageSize),
  });
  res.json(result);
}

export async function store(req, res) {
  const actorId = resolveActorId(req, req.body);
  const item = await createCreationStudioItem({ ...req.body }, { actorId });
  res.status(201).json(item);
}

export async function update(req, res) {
  const { itemId } = req.params ?? {};
  const actorId = resolveActorId(req, req.body);
  const item = await updateCreationStudioItem(itemId, { ...req.body }, { actorId });
  res.json(item);
}

export async function publish(req, res) {
  const { itemId } = req.params ?? {};
  const actorId = resolveActorId(req, req.body);
  const item = await publishCreationStudioItem(itemId, req.body ?? {}, { actorId });
  res.json(item);
}

export async function destroy(req, res) {
  const { itemId } = req.params ?? {};
  await deleteCreationStudioItem(itemId, { actorId: resolveActorId(req) });
  res.status(204).end();
}

export async function show(req, res) {
  const { itemId } = req.params ?? {};
  const item = await getCreationStudioItem(itemId);
  res.json(item);
}

export const create = store;

export async function getWorkspace(req, res) {
  const includeArchived = req.query?.includeArchived === 'true';
  const workspace = await getWorkspaceSummary(req.params.id, { includeArchived });
  res.json(workspace);
}

export async function createItem(req, res) {
  const actorId = resolveActorId(req, req.body);
  const item = await createWorkspaceItem(req.params.id, req.body ?? {}, { actorId });
  res.status(201).json(item);
}

export async function updateItem(req, res) {
  const actorId = resolveActorId(req, req.body);
  const item = await updateWorkspaceItem(req.params.id, req.params.itemId, req.body ?? {}, { actorId });
  res.json(item);
}

export async function recordStep(req, res) {
  const actorId = resolveActorId(req, req.body);
  const step = await recordStepProgress(
    req.params.id,
    req.params.itemId,
    req.params.stepKey,
    req.body ?? {},
    { actorId },
  );
  res.json(step);
}

export async function shareItem(req, res) {
  const actorId = resolveActorId(req, req.body);
  const item = await shareWorkspaceItem(req.params.id, req.params.itemId, req.body ?? {}, { actorId });
  res.json(item);
}

export async function archiveItem(req, res) {
  const actorId = resolveActorId(req);
  await archiveWorkspaceItem(req.params.id, req.params.itemId, { actorId });
  res.status(204).end();
}

export default {
  overview,
  index,
  store,
  update,
  publish,
  destroy,
  show,
  getWorkspace,
  createItem,
  updateItem,
  recordStep,
  shareItem,
  archiveItem,
};
