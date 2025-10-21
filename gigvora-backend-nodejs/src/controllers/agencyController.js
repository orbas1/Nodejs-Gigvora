import { getAgencyDashboard } from '../services/agencyDashboardService.js';
import { getAgencyOverview, updateAgencyOverview } from '../services/agencyOverviewService.js';
import {
  getAgencyProfileOverview,
  updateAgencyProfile,
  updateAgencyAvatar,
  getAgencyProfileManagement,
  listAgencyFollowers,
  updateAgencyFollower,
  removeAgencyFollower,
  listAgencyConnections,
  requestAgencyConnection,
  respondToAgencyConnection,
  removeAgencyConnection,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
} from '../services/agencyProfileService.js';
import { AuthorizationError, AuthenticationError, ValidationError } from '../utils/errors.js';
import {
  agencyProfileQuerySchema,
  updateAgencyProfileSchema,
  updateAgencyAvatarSchema,
  listFollowersQuerySchema,
  followerParamsSchema,
  updateFollowerBodySchema,
  requestConnectionBodySchema,
  connectionParamsSchema,
  respondConnectionBodySchema,
  createAgencyProfileMediaSchema,
  updateAgencyProfileMediaSchema,
  createAgencyProfileSkillSchema,
  updateAgencyProfileSkillSchema,
  createAgencyProfileCredentialSchema,
  updateAgencyProfileCredentialSchema,
  createAgencyProfileExperienceSchema,
  updateAgencyProfileExperienceSchema,
  createAgencyProfileWorkforceSegmentSchema,
  updateAgencyProfileWorkforceSegmentSchema,
} from '../validation/schemas/agencySchemas.js';

function toOptionalPositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const integer = Math.trunc(value);
    return integer > 0 ? integer : null;
  }
  const parsed = Number.parseInt(`${value}`.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function requirePositiveInteger(value, label) {
  const parsed = toOptionalPositiveInteger(value);
  if (!parsed) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function sanitizeSlug(value) {
  if (value == null) {
    return undefined;
  }
  const text = `${value}`.trim();
  return text ? text : undefined;
}

function hasAdminPrivileges(user = {}) {
  const roleSet = new Set((user.roles ?? []).map((role) => `${role}`.toLowerCase()));
  const type = `${user.type ?? ''}`.toLowerCase();
  return roleSet.has('admin') || type === 'admin';
}

function resolveActorId(req) {
  return toOptionalPositiveInteger(req?.user?.id);
}

function requireActorId(req) {
  const actorId = resolveActorId(req);
  if (!actorId) {
    throw new AuthenticationError('Authentication required.');
  }
  return actorId;
}

function resolveActorContext(req) {
  return {
    actorId: resolveActorId(req),
    actorRole: req?.user?.type ?? null,
    actorRoles: Array.isArray(req?.user?.roles) ? req.user.roles : [],
  };
}

function formatZodIssues(issues = []) {
  return issues.map((issue) => ({
    path: issue.path.join('.') || issue.path.join(''),
    message: issue.message,
    code: issue.code,
  }));
}

function parseWithSchema(schema, payload, { source = 'request' } = {}) {
  const result = schema.safeParse(payload ?? {});
  if (!result.success) {
    throw new ValidationError(`${source} validation failed.`, { issues: formatZodIssues(result.error.issues) });
  }
  return result.data;
}

function resolveTargetUserId(req, queryOverride) {
  const actorId = resolveActorId(req);
  const query = queryOverride ?? req?.query ?? {};
  const requested = toOptionalPositiveInteger(query.userId);

  if (requested && requested !== actorId) {
    if (!hasAdminPrivileges(req?.user)) {
      throw new AuthorizationError('You can only manage your own agency profile.');
    }
    return requested;
  }

  if (actorId) {
    return actorId;
  }

  throw new AuthenticationError('Authentication required.');
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const payload = {
    workspaceId: toOptionalPositiveInteger(workspaceId) ?? undefined,
    workspaceSlug: sanitizeSlug(workspaceSlug),
    lookbackDays: toOptionalPositiveInteger(lookbackDays) ?? undefined,
  };
  const context = resolveActorContext(req);
  const result = await getAgencyDashboard(payload, {
    actorId: context.actorId,
    actorRole: context.actorRole,
    actorRoles: context.actorRoles,
  });
  res.json(result);
}

export async function overview(req, res) {
  const { workspaceId, workspaceSlug } = req.query ?? {};
  const payload = {
    workspaceId: toOptionalPositiveInteger(workspaceId) ?? undefined,
    workspaceSlug: sanitizeSlug(workspaceSlug),
  };
  const context = resolveActorContext(req);
  const result = await getAgencyOverview(payload, context);
  res.json(result);
}

export async function updateOverview(req, res) {
  const context = resolveActorContext(req);
  const result = await updateAgencyOverview(req.body ?? {}, context);
  res.json(result);
}

export async function getProfile(req, res) {
  const query = parseWithSchema(agencyProfileQuerySchema, req.query ?? {}, { source: 'query' });
  const targetUserId = resolveTargetUserId({ ...req, query }, query);
  const viewerId = resolveActorId(req);
  const result = await getAgencyProfileOverview(targetUserId, {
    includeFollowers: query.includeFollowers ?? true,
    includeConnections: query.includeConnections ?? true,
    followersLimit: query.followersLimit ?? 25,
    followersOffset: query.followersOffset ?? 0,
    bypassCache: query.fresh ?? false,
    viewerId,
  });
  res.json(result);
}

export async function updateProfile(req, res) {
  const payload = parseWithSchema(updateAgencyProfileSchema, req.body ?? {}, { source: 'body' });
  const targetUserId = resolveTargetUserId(req);
  const actorId = requireActorId(req);
  const result = await updateAgencyProfile(targetUserId, payload, { actorId });
  res.json(result);
}

export async function updateAvatar(req, res) {
  const payload = parseWithSchema(updateAgencyAvatarSchema, req.body ?? {}, { source: 'body' });
  const targetUserId = resolveTargetUserId(req);
  const actorId = requireActorId(req);
  const result = await updateAgencyAvatar(targetUserId, payload, { actorId });
  res.json(result);
}

export async function profile(req, res) {
  const context = resolveActorContext(req);
  const result = await getAgencyProfileManagement({}, context);
  res.json(result);
}

export async function listFollowers(req, res) {
  const query = parseWithSchema(listFollowersQuerySchema, req.query ?? {}, { source: 'query' });
  const targetUserId = resolveTargetUserId({ ...req, query }, query);
  const followers = await listAgencyFollowers(targetUserId, {
    limit: query.limit ?? 25,
    offset: query.offset ?? 0,
  });
  res.json(followers);
}

export async function updateFollower(req, res) {
  const params = parseWithSchema(followerParamsSchema, req.params ?? {}, { source: 'params' });
  const updates = parseWithSchema(updateFollowerBodySchema, req.body ?? {}, { source: 'body' });
  const targetUserId = resolveTargetUserId(req);
  const follower = await updateAgencyFollower(targetUserId, params.followerId, updates);
  res.json(follower);
}

export async function removeFollower(req, res) {
  const params = parseWithSchema(followerParamsSchema, req.params ?? {}, { source: 'params' });
  const targetUserId = resolveTargetUserId(req);
  await removeAgencyFollower(targetUserId, params.followerId);
  res.status(204).end();
}

export async function listConnections(req, res) {
  const queryUserId = toOptionalPositiveInteger(req.query?.userId);
  const targetUserId = resolveTargetUserId({ ...req, query: { userId: queryUserId } }, { userId: queryUserId });
  const connections = await listAgencyConnections(targetUserId, { viewerId: resolveActorId(req) });
  res.json(connections);
}

export async function requestConnection(req, res) {
  const payload = parseWithSchema(requestConnectionBodySchema, req.body ?? {}, { source: 'body' });
  const targetUserId = resolveTargetUserId(req);
  const connection = await requestAgencyConnection(targetUserId, payload.targetId);
  res.status(201).json(connection);
}

export async function respondToConnection(req, res) {
  const params = parseWithSchema(connectionParamsSchema, req.params ?? {}, { source: 'params' });
  const payload = parseWithSchema(respondConnectionBodySchema, req.body ?? {}, { source: 'body' });
  const targetUserId = resolveTargetUserId(req);
  const result = await respondToAgencyConnection(targetUserId, params.connectionId, payload.decision);
  res.json(result);
}

export async function removeConnection(req, res) {
  const params = parseWithSchema(connectionParamsSchema, req.params ?? {}, { source: 'params' });
  const targetUserId = resolveTargetUserId(req);
  await removeAgencyConnection(targetUserId, params.connectionId);
  res.status(204).end();
}

export async function createMedia(req, res) {
  const actorId = requireActorId(req);
  const payload = parseWithSchema(createAgencyProfileMediaSchema, req.body ?? {}, { source: 'body' });
  const media = await createAgencyProfileMedia(actorId, payload);
  res.status(201).json(media);
}

export async function updateMedia(req, res) {
  const actorId = requireActorId(req);
  const mediaId = requirePositiveInteger(req.params?.mediaId, 'mediaId');
  const payload = parseWithSchema(updateAgencyProfileMediaSchema, req.body ?? {}, { source: 'body' });
  const media = await updateAgencyProfileMedia(actorId, mediaId, payload);
  res.json(media);
}

export async function deleteMedia(req, res) {
  const actorId = requireActorId(req);
  const mediaId = requirePositiveInteger(req.params?.mediaId, 'mediaId');
  await deleteAgencyProfileMedia(actorId, mediaId);
  res.status(204).end();
}

export async function createSkill(req, res) {
  const actorId = requireActorId(req);
  const payload = parseWithSchema(createAgencyProfileSkillSchema, req.body ?? {}, { source: 'body' });
  const skill = await createAgencyProfileSkill(actorId, payload);
  res.status(201).json(skill);
}

export async function updateSkill(req, res) {
  const actorId = requireActorId(req);
  const skillId = requirePositiveInteger(req.params?.skillId, 'skillId');
  const payload = parseWithSchema(updateAgencyProfileSkillSchema, req.body ?? {}, { source: 'body' });
  const skill = await updateAgencyProfileSkill(actorId, skillId, payload);
  res.json(skill);
}

export async function deleteSkill(req, res) {
  const actorId = requireActorId(req);
  const skillId = requirePositiveInteger(req.params?.skillId, 'skillId');
  await deleteAgencyProfileSkill(actorId, skillId);
  res.status(204).end();
}

export async function createCredential(req, res) {
  const actorId = requireActorId(req);
  const payload = parseWithSchema(createAgencyProfileCredentialSchema, req.body ?? {}, { source: 'body' });
  const credential = await createAgencyProfileCredential(actorId, payload);
  res.status(201).json(credential);
}

export async function updateCredential(req, res) {
  const actorId = requireActorId(req);
  const credentialId = requirePositiveInteger(req.params?.credentialId, 'credentialId');
  const payload = parseWithSchema(updateAgencyProfileCredentialSchema, req.body ?? {}, { source: 'body' });
  const credential = await updateAgencyProfileCredential(actorId, credentialId, payload);
  res.json(credential);
}

export async function deleteCredential(req, res) {
  const actorId = requireActorId(req);
  const credentialId = requirePositiveInteger(req.params?.credentialId, 'credentialId');
  await deleteAgencyProfileCredential(actorId, credentialId);
  res.status(204).end();
}

export async function createExperience(req, res) {
  const actorId = requireActorId(req);
  const payload = parseWithSchema(createAgencyProfileExperienceSchema, req.body ?? {}, { source: 'body' });
  const experience = await createAgencyProfileExperience(actorId, payload);
  res.status(201).json(experience);
}

export async function updateExperience(req, res) {
  const actorId = requireActorId(req);
  const experienceId = requirePositiveInteger(req.params?.experienceId, 'experienceId');
  const payload = parseWithSchema(updateAgencyProfileExperienceSchema, req.body ?? {}, { source: 'body' });
  const experience = await updateAgencyProfileExperience(actorId, experienceId, payload);
  res.json(experience);
}

export async function deleteExperience(req, res) {
  const actorId = requireActorId(req);
  const experienceId = requirePositiveInteger(req.params?.experienceId, 'experienceId');
  await deleteAgencyProfileExperience(actorId, experienceId);
  res.status(204).end();
}

export async function createWorkforceSegment(req, res) {
  const actorId = requireActorId(req);
  const payload = parseWithSchema(createAgencyProfileWorkforceSegmentSchema, req.body ?? {}, { source: 'body' });
  const segment = await createAgencyProfileWorkforceSegment(actorId, payload);
  res.status(201).json(segment);
}

export async function updateWorkforceSegment(req, res) {
  const actorId = requireActorId(req);
  const segmentId = requirePositiveInteger(req.params?.segmentId, 'segmentId');
  const payload = parseWithSchema(updateAgencyProfileWorkforceSegmentSchema, req.body ?? {}, { source: 'body' });
  const segment = await updateAgencyProfileWorkforceSegment(actorId, segmentId, payload);
  res.json(segment);
}

export async function deleteWorkforceSegment(req, res) {
  const actorId = requireActorId(req);
  const segmentId = requirePositiveInteger(req.params?.segmentId, 'segmentId');
  await deleteAgencyProfileWorkforceSegment(actorId, segmentId);
  res.status(204).end();
}

export default {
  dashboard,
  overview,
  updateOverview,
  getProfile,
  updateProfile,
  updateAvatar,
  profile,
  listFollowers,
  updateFollower,
  removeFollower,
  listConnections,
  requestConnection,
  respondToConnection,
  removeConnection,
  createMedia,
  updateMedia,
  deleteMedia,
  createSkill,
  updateSkill,
  deleteSkill,
  createCredential,
  updateCredential,
  deleteCredential,
  createExperience,
  updateExperience,
  deleteExperience,
  createWorkforceSegment,
  updateWorkforceSegment,
  deleteWorkforceSegment,
};
