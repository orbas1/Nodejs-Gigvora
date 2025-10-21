import {
  createProject,
  updateProjectAutoAssign,
  getProjectOverview,
  listProjectEvents,
  updateProjectDetails,
} from '../services/projectService.js';
import { hasProjectManagementAccess } from '../middleware/authorization.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function normalizeNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

function ensureObject(input, label = 'payload') {
  if (input == null) {
    return {};
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError(`${label} must be provided as an object.`);
  }
  return input;
}

function stripActorId(payload = {}) {
  const sanitized = { ...payload };
  delete sanitized.actorId;
  return sanitized;
}

function parseProjectId(raw) {
  const projectId = normalizeNumeric(raw);
  if (!projectId) {
    throw new ValidationError('A valid projectId is required for project operations.');
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
      'Project management actions require an active operations, program, or workspace admin role.',
    );
  }
  return context;
}

function buildAccessSnapshot(context, { performedBy } = {}) {
  const actorId = context.actorId ?? null;
  const performer = performedBy ?? actorId;
  const canManage = Boolean(context.hasManagementAccess);
  return {
    actorId,
    performedBy: performer ?? null,
    hasManagementRole: canManage,
    canCreate: canManage,
    canView: canManage,
    canManage,
    canToggleAutoAssign: canManage,
  };
}

function parseEventLimit(limit) {
  const numeric = normalizeNumeric(limit);
  if (!numeric) {
    return null;
  }
  return Math.min(numeric, 100);
}

function resolveActorOverride(payloadActorId, context) {
  return normalizeNumeric(payloadActorId) ?? context.actorId ?? undefined;
}

export async function store(req, res) {
  const access = ensureManagementAccess(req);
  const body = ensureObject(req.body);
  const actorOverride = resolveActorOverride(body.actorId, access);
  const payload = stripActorId(body);

  const result = await createProject(payload, { actorId: actorOverride });

  res.status(201).json({
    ...result,
    access: buildAccessSnapshot(access, { performedBy: actorOverride ?? access.actorId }),
  });
}

export async function toggleAutoAssign(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const body = ensureObject(req.body);
  const actorOverride = resolveActorOverride(body.actorId, access);
  const payload = stripActorId(body);

  const result = await updateProjectAutoAssign(projectId, payload, { actorId: actorOverride });

  res.json({
    projectId,
    ...result,
    access: buildAccessSnapshot(access, { performedBy: actorOverride ?? access.actorId }),
  });
}

export async function update(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const body = ensureObject(req.body);
  const actorOverride = resolveActorOverride(body.actorId, access);
  const payload = stripActorId(body);

  const result = await updateProjectDetails(projectId, payload, { actorId: actorOverride });

  res.json({
    projectId,
    ...result,
    access: buildAccessSnapshot(access, { performedBy: actorOverride ?? access.actorId }),
  });
}

export async function show(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const overview = await getProjectOverview(projectId);

  res.json({
    projectId,
    ...overview,
    access: buildAccessSnapshot(access),
  });
}

export async function events(req, res) {
  const access = ensureManagementAccess(req);
  const projectId = parseProjectId(req.params?.projectId);
  const limit = parseEventLimit(req.query?.limit);

  const events = await listProjectEvents(projectId, { limit: limit ?? undefined });

  res.json({
    projectId,
    events,
    filters: { limit: limit ?? null },
    meta: { count: events.length },
    access: buildAccessSnapshot(access),
  });
}

export default {
  store,
  toggleAutoAssign,
  update,
  show,
  events,
};
