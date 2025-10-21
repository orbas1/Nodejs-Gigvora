import {
  getFreelancerTimelineWorkspace,
  saveTimelineSettings,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  publishTimelinePost,
  upsertTimelinePostMetrics,
} from '../services/freelancerTimelineService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parseId(value, fieldName) {
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function normalizePermissions(user) {
  if (!user) {
    return [];
  }
  const permissions = [];
  if (Array.isArray(user.permissions)) {
    permissions.push(...user.permissions);
  }
  if (Array.isArray(user.roles)) {
    permissions.push(...user.roles);
  }
  if (typeof user.role === 'string') {
    permissions.push(user.role);
  }
  return permissions.map((permission) => String(permission).toLowerCase());
}

function ensureTimelineAccess(req, freelancerId) {
  const { user } = req;
  if (!user) {
    throw new AuthorizationError('Authentication required.');
  }

  const actorId = Number.parseInt(user.id, 10);
  if (!Number.isInteger(actorId) || actorId <= 0) {
    throw new AuthorizationError('Authentication required.');
  }

  const permissions = new Set(normalizePermissions(user));
  const canManage =
    actorId === freelancerId ||
    permissions.has('admin') ||
    permissions.has('freelancer.manage.any') ||
    permissions.has('timeline.manage.any');

  if (!canManage) {
    throw new AuthorizationError('You do not have permission to manage this timeline.');
  }

  return { actorId, permissions };
}

function resolveActorId(req, freelancerId) {
  const context = ensureTimelineAccess(req, freelancerId);
  const headerIdRaw = req.headers?.['x-user-id'];

  if (headerIdRaw == null || headerIdRaw === '') {
    return context.actorId;
  }

  const headerId = Number.parseInt(headerIdRaw, 10);
  if (!Number.isInteger(headerId) || headerId <= 0) {
    throw new ValidationError('x-user-id header must be a positive integer when provided.');
  }

  if (headerId === context.actorId) {
    return context.actorId;
  }

  if (context.permissions.has('admin') || context.permissions.has('timeline.impersonate.any')) {
    return headerId;
  }

  throw new AuthorizationError('Actor impersonation not permitted.');
}

function sanitizeTimelinePayload(body, label, { allowEmpty = false } = {}) {
  if (body == null) {
    if (allowEmpty) {
      return {};
    }
    throw new ValidationError(`${label} cannot be empty.`);
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError(`${label} must be an object.`);
  }

  const payload = JSON.parse(JSON.stringify(body));
  if (!allowEmpty && Object.keys(payload).length === 0) {
    throw new ValidationError(`${label} cannot be empty.`);
  }

  return payload;
}

function sanitizeMetricsPayload(body) {
  const payload = sanitizeTimelinePayload(body, 'metrics payload', { allowEmpty: true });

  if (payload.events != null && !Array.isArray(payload.events)) {
    throw new ValidationError('metrics events must be an array.');
  }

  if (Array.isArray(payload.events)) {
    payload.events = payload.events.map((event) => {
      if (event == null || typeof event !== 'object') {
        throw new ValidationError('metrics events must be objects.');
      }
      return JSON.parse(JSON.stringify(event));
    });
  }

  return payload;
}

export async function getTimelineWorkspace(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  ensureTimelineAccess(req, freelancerId);
  const payload = await getFreelancerTimelineWorkspace({ freelancerId });
  res.json(payload);
}

export async function updateTimelineSettings(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  ensureTimelineAccess(req, freelancerId);
  const settings = await saveTimelineSettings(
    freelancerId,
    sanitizeTimelinePayload(req.body, 'timeline settings'),
  );
  res.json(settings);
}

export async function createTimelineEntryController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const actorId = resolveActorId(req, freelancerId);
  const entry = await createTimelineEntry(
    freelancerId,
    sanitizeTimelinePayload(req.body, 'timeline entry'),
    { actorId },
  );
  res.status(201).json(entry);
}

export async function updateTimelineEntryController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const entryId = parseId(req.params.entryId, 'entryId');
  const actorId = resolveActorId(req, freelancerId);
  const entry = await updateTimelineEntry(
    freelancerId,
    entryId,
    sanitizeTimelinePayload(req.body, 'timeline entry'),
    { actorId },
  );
  res.json(entry);
}

export async function deleteTimelineEntryController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const entryId = parseId(req.params.entryId, 'entryId');
  ensureTimelineAccess(req, freelancerId);
  const result = await deleteTimelineEntry(freelancerId, entryId);
  res.json(result);
}

export async function createTimelinePostController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const actorId = resolveActorId(req, freelancerId);
  const post = await createTimelinePost(
    freelancerId,
    sanitizeTimelinePayload(req.body, 'timeline post'),
    { actorId },
  );
  res.status(201).json(post);
}

export async function updateTimelinePostController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const postId = parseId(req.params.postId, 'postId');
  const actorId = resolveActorId(req, freelancerId);
  const post = await updateTimelinePost(
    freelancerId,
    postId,
    sanitizeTimelinePayload(req.body, 'timeline post'),
    { actorId },
  );
  res.json(post);
}

export async function deleteTimelinePostController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const postId = parseId(req.params.postId, 'postId');
  ensureTimelineAccess(req, freelancerId);
  const result = await deleteTimelinePost(freelancerId, postId);
  res.json(result);
}

export async function publishTimelinePostController(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const postId = parseId(req.params.postId, 'postId');
  const actorId = resolveActorId(req, freelancerId);
  const post = await publishTimelinePost(
    freelancerId,
    postId,
    sanitizeTimelinePayload(req.body, 'timeline publish payload', { allowEmpty: true }),
    { actorId },
  );
  res.json(post);
}

export async function recordTimelinePostMetrics(req, res) {
  const freelancerId = parseId(req.params.freelancerId, 'freelancerId');
  const postId = parseId(req.params.postId, 'postId');
  ensureTimelineAccess(req, freelancerId);
  const metric = await upsertTimelinePostMetrics(freelancerId, postId, sanitizeMetricsPayload(req.body));
  res.status(201).json(metric);
}

export default {
  getTimelineWorkspace,
  updateTimelineSettings,
  createTimelineEntry: createTimelineEntryController,
  updateTimelineEntry: updateTimelineEntryController,
  deleteTimelineEntry: deleteTimelineEntryController,
  createTimelinePost: createTimelinePostController,
  updateTimelinePost: updateTimelinePostController,
  deleteTimelinePost: deleteTimelinePostController,
  publishTimelinePost: publishTimelinePostController,
  recordTimelinePostMetrics,
};
