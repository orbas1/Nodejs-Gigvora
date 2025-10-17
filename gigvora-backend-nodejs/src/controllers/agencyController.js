import { getAgencyDashboard } from '../services/agencyDashboardService.js';
import agencyProfileService from '../services/agencyProfileService.js';
import { AuthorizationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.type ?? null;

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getAgencyDashboard(payload, { actorId, actorRole });
  res.json(result);
}

function resolveTargetUserId(req) {
  const requestedUserId = parseNumber(req.query?.userId);
  if (requestedUserId && requestedUserId !== req.user?.id) {
    const isAdmin = req.user?.roles?.includes('admin');
    if (!isAdmin) {
      throw new AuthorizationError('You can only manage your own agency profile.');
    }
    return requestedUserId;
  }
  return req.user?.id;
}

export async function getProfile(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const payload = await agencyProfileService.getAgencyProfileOverview(targetUserId, {
    includeFollowers: req.query.includeFollowers !== 'false',
    includeConnections: req.query.includeConnections !== 'false',
    followersLimit: parseNumber(req.query.followersLimit) ?? 25,
    followersOffset: parseNumber(req.query.followersOffset) ?? 0,
    bypassCache: req.query.fresh === 'true',
    viewerId: req.user?.id ?? null,
  });
  res.json(payload);
}

export async function updateProfile(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const payload = await agencyProfileService.updateAgencyProfile(targetUserId, req.body ?? {}, {
    actorId: req.user?.id ?? null,
  });
  res.json(payload);
}

export async function updateAvatar(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const payload = await agencyProfileService.updateAgencyAvatar(targetUserId, req.body ?? {}, {
    actorId: req.user?.id ?? null,
  });
  res.json(payload);
}

export async function listFollowers(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const followers = await agencyProfileService.listAgencyFollowers(targetUserId, {
    limit: parseNumber(req.query.limit) ?? 25,
    offset: parseNumber(req.query.offset) ?? 0,
  });
  res.json(followers);
}

export async function updateFollower(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const followerId = req.params.followerId;
  const follower = await agencyProfileService.updateAgencyFollower(targetUserId, followerId, req.body ?? {});
  res.json(follower);
}

export async function removeFollower(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const followerId = req.params.followerId;
  await agencyProfileService.removeAgencyFollower(targetUserId, followerId);
  res.status(204).end();
}

export async function listConnections(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const connections = await agencyProfileService.listAgencyConnections(targetUserId, {
    viewerId: req.user?.id ?? null,
  });
  res.json(connections);
}

export async function requestConnection(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const connection = await agencyProfileService.requestAgencyConnection(targetUserId, req.body?.targetId);
  res.status(201).json(connection);
}

export async function respondToConnection(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const connectionId = req.params.connectionId;
  const result = await agencyProfileService.respondToAgencyConnection(targetUserId, connectionId, req.body?.decision);
  res.json(result);
}

export async function removeConnection(req, res) {
  const targetUserId = resolveTargetUserId(req);
  const connectionId = req.params.connectionId;
  await agencyProfileService.removeAgencyConnection(targetUserId, connectionId);
  res.status(204).end();
}

export default {
  dashboard,
  getProfile,
  updateProfile,
  updateAvatar,
  listFollowers,
  updateFollower,
  removeFollower,
  listConnections,
  requestConnection,
  respondToConnection,
  removeConnection,
};

