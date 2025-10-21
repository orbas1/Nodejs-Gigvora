import {
  listProjectBlueprints,
  getProjectBlueprint,
  upsertProjectBlueprint,
} from '../services/projectBlueprintService.js';
import { hasProjectManagementAccess } from '../middleware/authorization.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function normalizeNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseProjectId(value) {
  const projectId = normalizeNumeric(value);
  if (!projectId) {
    throw new ValidationError('A valid projectId is required for project blueprint operations.');
  }
  return projectId;
}

function resolveActorContext(req) {
  return {
    actorId: normalizeNumeric(resolveRequestUserId(req)),
    hasManagementAccess: Boolean(hasProjectManagementAccess(req)),
  };
}

function ensureManagementAccess(req) {
  const context = resolveActorContext(req);
  if (!context.hasManagementAccess) {
    throw new AuthorizationError(
      'Project blueprint access requires an active project management or operations workspace role.',
    );
  }
  return context;
}

function parsePagination(query = {}) {
  const pagination = {};
  const limit = normalizeNumeric(query.limit);
  if (limit) {
    pagination.limit = Math.min(limit, 100);
  }
  const offsetRaw = query.offset;
  if (offsetRaw != null && offsetRaw !== '') {
    const offset = Number.parseInt(offsetRaw, 10);
    if (Number.isInteger(offset) && offset >= 0) {
      pagination.offset = offset;
    }
  }
  return pagination;
}

function buildAccessSnapshot(context, { performedBy } = {}) {
  const actorId = context.actorId ?? null;
  const performer = performedBy ?? actorId;
  return {
    actorId,
    performedBy: performer ?? null,
    hasManagementRole: context.hasManagementAccess,
    canView: Boolean(context.hasManagementAccess),
    canManage: Boolean(context.hasManagementAccess),
  };
}

function sanitizeBlueprintPayload(payload = {}) {
  const sanitized = { ...payload };
  delete sanitized.actorId;
  return sanitized;
}

export async function index(req, res) {
  const access = ensureManagementAccess(req);
  const pagination = parsePagination(req.query);
  const ownerFilter = normalizeNumeric(req.query?.ownerId);
  const queryOptions = { ...pagination };
  if (ownerFilter) {
    queryOptions.ownerId = ownerFilter;
  }

  const blueprints = await listProjectBlueprints(queryOptions);

  res.json({
    blueprints,
    filters: {
      ownerId: queryOptions.ownerId ?? null,
      limit: queryOptions.limit ?? null,
      offset: queryOptions.offset ?? null,
    },
    meta: {
      count: blueprints.length,
    },
    access: buildAccessSnapshot(access),
  });
}

export async function show(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const blueprint = await getProjectBlueprint(projectId);
  res.json({ ...blueprint, access: buildAccessSnapshot(access) });
}

export async function upsert(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const payload = req.body ?? {};
  const actorOverride = normalizeNumeric(payload.actorId);
  const sanitizedPayload = sanitizeBlueprintPayload(payload);

  const blueprint = await upsertProjectBlueprint(projectId, sanitizedPayload, {
    actorId: actorOverride ?? access.actorId ?? undefined,
  });

  res.json({ ...blueprint, access: buildAccessSnapshot(access, { performedBy: actorOverride ?? access.actorId }) });
}

export default {
  index,
  show,
  upsert,
};
