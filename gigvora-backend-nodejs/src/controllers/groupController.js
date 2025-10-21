import {
  listGroups,
  discoverGroups,
  getGroupProfile,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  requestMembership,
} from '../services/groupService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestPermissions, resolveRequestUserId } from '../utils/requestContext.js';

function parsePositiveInteger(value, label, { optional = false } = {}) {
  if (value == null || value === '') {
    if (optional) {
      return null;
    }
    throw new ValidationError(`${label} is required.`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalPositiveInteger(value, label) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer when provided.`);
  }
  return parsed;
}

function normaliseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalised)) {
    return false;
  }
  throw new ValidationError('Boolean query parameters must be true/false.');
}

function normaliseSearch(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
}

function resolveActorId(req, { required = false } = {}) {
  const actorId = resolveRequestUserId(req);
  if (!actorId && required) {
    throw new AuthorizationError('Authentication required.');
  }
  return actorId ?? null;
}

function resolveActor(req, { required = false } = {}) {
  if (!req.user && required) {
    throw new AuthorizationError('Authentication required.');
  }
  return req.user ?? null;
}

function resolvePermissions(req) {
  return resolveRequestPermissions(req).map((permission) => permission.toLowerCase());
}

function ensureGroupManagementAccess(req) {
  const actor = resolveActor(req, { required: true });
  const permissions = new Set(resolvePermissions(req));
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  roles.map((role) => String(role).toLowerCase()).forEach((role) => permissions.add(role));

  if (
    permissions.has('admin') ||
    permissions.has('group.manage.any') ||
    permissions.has('community.manage.any') ||
    permissions.has('group.admin')
  ) {
    return actor;
  }

  if (permissions.has('group.manage.own') || permissions.has('community.manage.own')) {
    return actor;
  }

  throw new AuthorizationError('You do not have permission to manage groups.');
}

function normalisePagination(query = {}) {
  const page = query.page != null ? Number.parseInt(query.page, 10) : 1;
  const pageSize = query.pageSize != null ? Number.parseInt(query.pageSize, 10) : 25;

  if (!Number.isFinite(page) || page <= 0) {
    throw new ValidationError('page must be a positive integer.');
  }

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    throw new ValidationError('pageSize must be a positive integer.');
  }

  return {
    page,
    pageSize: Math.min(pageSize, 100),
  };
}

function sanitizeNotes(value) {
  if (value == null) {
    return undefined;
  }
  const text = String(value).trim();
  if (text.length > 2000) {
    throw new ValidationError('notes must be 2000 characters or fewer.');
  }
  return text || undefined;
}

function sanitiseMembershipPayload(body = {}) {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Membership payload must be an object.');
  }

  const payload = {};
  if (body.role != null) {
    const role = String(body.role).trim();
    if (!role) {
      throw new ValidationError('role cannot be empty.');
    }
    if (role.length > 64) {
      throw new ValidationError('role must be 64 characters or fewer.');
    }
    payload.role = role.toLowerCase();
  }

  if (body.status != null) {
    const status = String(body.status).trim();
    if (!status) {
      throw new ValidationError('status cannot be empty.');
    }
    if (status.length > 64) {
      throw new ValidationError('status must be 64 characters or fewer.');
    }
    payload.status = status.toLowerCase();
  }

  if (body.notes != null) {
    payload.notes = sanitizeNotes(body.notes);
  }

  const metadata = body.metadata;
  if (metadata != null) {
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new ValidationError('metadata must be an object.');
    }
    payload.metadata = JSON.parse(JSON.stringify(metadata));
  }

  return payload;
}

function sanitiseGroupPayload(body = {}) {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Group payload must be an object.');
  }

  const payload = {};
  if (body.name != null) {
    const name = String(body.name).trim();
    if (!name) {
      throw new ValidationError('name cannot be empty.');
    }
    payload.name = name.slice(0, 120);
  }

  if (body.description != null) {
    const description = String(body.description).trim();
    payload.description = description.slice(0, 5000);
  }

  if (body.visibility != null) {
    const visibility = String(body.visibility).trim().toLowerCase();
    if (!['public', 'private', 'hidden'].includes(visibility)) {
      throw new ValidationError('visibility must be public, private, or hidden.');
    }
    payload.visibility = visibility;
  }

  if (body.settings != null) {
    if (typeof body.settings !== 'object' || Array.isArray(body.settings)) {
      throw new ValidationError('settings must be an object.');
    }
    payload.settings = JSON.parse(JSON.stringify(body.settings));
  }

  if (body.tags != null) {
    const tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags)
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
    payload.tags = tags.slice(0, 25).map((tag) => tag.slice(0, 48).toLowerCase());
  }

  return payload;
}

export async function discover(req, res) {
  const { limit, search } = req.query ?? {};
  const actorId = resolveActorId(req);
  const parsedLimit = parseOptionalPositiveInteger(limit, 'limit');
  const result = await discoverGroups({
    limit: parsedLimit != null ? Math.min(parsedLimit, 50) : undefined,
    search: normaliseSearch(search),
    actorId,
  });
  res.json(result);
}

export async function index(req, res) {
  const { search, visibility, includeMembers } = req.query ?? {};
  const pagination = normalisePagination(req.query);
  const result = await listGroups({
    ...pagination,
    search: normaliseSearch(search),
    visibility: normaliseSearch(visibility),
    includeMembers: normaliseBoolean(includeMembers, false),
    actor: resolveActor(req),
  });
  res.json(result);
}

export async function show(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actorId = resolveActorId(req);
  const result = await getGroupProfile(groupId, { actorId });
  res.json(result);
}

export async function create(req, res) {
  const actor = ensureGroupManagementAccess(req);
  const payload = sanitiseGroupPayload(req.body ?? {});
  const result = await createGroup(payload, { actor });
  res.status(201).json(result);
}

export async function update(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actor = ensureGroupManagementAccess(req);
  const payload = sanitiseGroupPayload(req.body ?? {});
  const result = await updateGroup(groupId, payload, { actor });
  res.json(result);
}

export async function addMemberController(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actor = ensureGroupManagementAccess(req);
  const { userId } = req.body ?? {};
  const result = await addMember(
    {
      groupId,
      userId: parsePositiveInteger(userId, 'userId'),
      ...sanitiseMembershipPayload(req.body ?? {}),
    },
    { actor },
  );
  res.status(201).json(result);
}

export async function updateMemberController(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const membershipId = parsePositiveInteger(req.params?.membershipId, 'membershipId');
  const actor = ensureGroupManagementAccess(req);
  const payload = sanitiseMembershipPayload(req.body ?? {});
  const result = await updateMember(groupId, membershipId, payload, { actor });
  res.json(result);
}

export async function removeMemberController(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const membershipId = parsePositiveInteger(req.params?.membershipId, 'membershipId');
  const actor = ensureGroupManagementAccess(req);
  const result = await removeMember(groupId, membershipId, { actor });
  res.json(result);
}

export async function join(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actorId = resolveActorId(req, { required: true });
  const { role } = req.body ?? {};
  const payload = {};
  if (role != null) {
    const normalisedRole = String(role).trim().toLowerCase();
    if (!normalisedRole) {
      throw new ValidationError('role cannot be empty.');
    }
    payload.role = normalisedRole;
  }
  const result = await joinGroup(groupId, { actorId, ...payload });
  res.status(201).json(result);
}

export async function leave(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actorId = resolveActorId(req, { required: true });
  const result = await leaveGroup(groupId, { actorId });
  res.json(result);
}

export async function updateMembership(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const payload = req.body ?? {};
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ValidationError('Membership settings payload must be an object.');
  }
  const result = await updateMembershipSettings(groupId, {
    actorId: resolveActorId(req, { required: true }),
    ...JSON.parse(JSON.stringify(payload)),
  });
  res.json(result);
}

export async function requestMembershipController(req, res) {
  const groupId = parsePositiveInteger(req.params?.groupId, 'groupId');
  const actor = resolveActor(req, { required: true });
  const { message } = req.body ?? {};
  const payload = {};
  if (message != null) {
    const trimmed = String(message).trim();
    if (trimmed.length > 2000) {
      throw new ValidationError('message must be 2000 characters or fewer.');
    }
    payload.message = trimmed;
  }
  const result = await requestMembership(groupId, { actor, ...payload });
  res.status(202).json(result);
}

export default {
  discover,
  index,
  show,
  create,
  update,
  addMember: addMemberController,
  updateMember: updateMemberController,
  removeMember: removeMemberController,
  join,
  leave,
  updateMembership,
  requestMembership: requestMembershipController,
};
