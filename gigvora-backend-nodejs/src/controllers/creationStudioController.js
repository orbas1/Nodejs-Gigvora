import {
  listCreationStudioItems,
  getCreationStudioOverview,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  deleteCreationStudioItem,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
} from '../services/creationStudioService.js';

function parseInteger(value) {
  if (value == null) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
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
    canManage,
    allowedRoles: Array.from(allowedRoles),
  };
}

export async function overview(req, res) {
  const { workspaceId } = req.query ?? {};
  const selectedWorkspaceId = parseInteger(workspaceId);
  const result = await getCreationStudioOverview({ workspaceId: selectedWorkspaceId });
  res.json({
    ...result,
    permissions: buildPermissions(req),
  });
}

export async function index(req, res) {
  const { workspaceId, type, status, search, limit, offset } = req.query ?? {};
  const payload = {
    workspaceId: parseInteger(workspaceId),
    type: type && CREATION_STUDIO_ITEM_TYPES.includes(type) ? type : undefined,
    status: status && CREATION_STUDIO_ITEM_STATUSES.includes(status) ? status : undefined,
    search: search ?? undefined,
    limit: parseInteger(limit) ?? 20,
    offset: parseInteger(offset) ?? 0,
  };
  const items = await listCreationStudioItems(payload);
  res.json({ items });
}

export async function store(req, res) {
  const payload = {
    ...req.body,
    workspaceId: req.body.workspaceId ?? parseInteger(req.body.workspaceId),
    createdById: req.user?.id ?? null,
  };
  const item = await createCreationStudioItem(payload);
  res.status(201).json(item);
}

export async function update(req, res) {
  const { itemId } = req.params ?? {};
  const id = parseInteger(itemId);
  const payload = {
    ...req.body,
    workspaceId: req.body.workspaceId ?? parseInteger(req.body.workspaceId),
  };
  const item = await updateCreationStudioItem(id, payload);
  res.json(item);
}

export async function publish(req, res) {
  const { itemId } = req.params ?? {};
  const id = parseInteger(itemId);
  const payload = {
    publishAt: req.body?.publishAt ?? null,
  };
  const item = await publishCreationStudioItem(id, payload);
  res.json(item);
}

export async function destroy(req, res) {
  const { itemId } = req.params ?? {};
  const id = parseInteger(itemId);
  await deleteCreationStudioItem(id);
  res.status(204).send();
}

export default {
  overview,
  index,
  store,
  update,
  publish,
  destroy,
};
