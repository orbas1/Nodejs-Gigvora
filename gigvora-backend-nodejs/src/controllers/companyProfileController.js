import companyProfileService from '../services/companyProfileService.js';

function resolveUserId(req) {
  if (req.user?.id != null) {
    return Number(req.user.id);
  }
  if (req.query?.userId != null) {
    return Number(req.query.userId);
  }
  throw new Error('Authenticated user required.');
}

export async function getWorkspace(req, res) {
  const userId = resolveUserId(req);
  const workspace = await companyProfileService.getCompanyProfileWorkspace({
    userId,
    viewerId: req.user?.id,
  });
  res.json(workspace);
}

export async function updateProfile(req, res) {
  const userId = resolveUserId(req);
  const profile = await companyProfileService.updateCompanyProfileDetails(userId, req.body ?? {});
  res.json({ profile });
}

export async function updateAvatar(req, res) {
  const userId = resolveUserId(req);
  const profile = await companyProfileService.updateCompanyAvatar(userId, req.body ?? {});
  res.json({ profile });
}

export async function listFollowers(req, res) {
  const userId = resolveUserId(req);
  const workspace = await companyProfileService.getCompanyProfileWorkspace({
    userId,
    viewerId: req.user?.id,
  });
  res.json({ followers: workspace.followers, metrics: workspace.metrics });
}

export async function addFollower(req, res) {
  const userId = resolveUserId(req);
  const follower = await companyProfileService.addFollower({
    userId,
    followerId: req.body?.followerId,
    email: req.body?.email,
    status: req.body?.status,
    notificationsEnabled: req.body?.notificationsEnabled,
  });
  res.status(201).json(follower);
}

export async function updateFollower(req, res) {
  const userId = resolveUserId(req);
  const followerId = req.params?.followerId ?? req.body?.followerId;
  const follower = await companyProfileService.updateFollower({
    userId,
    followerId,
    status: req.body?.status,
    notificationsEnabled: req.body?.notificationsEnabled,
  });
  res.json(follower);
}

export async function removeFollower(req, res) {
  const userId = resolveUserId(req);
  const followerId = req.params?.followerId ?? req.body?.followerId;
  await companyProfileService.removeFollower({ userId, followerId });
  res.status(204).send();
}

export async function listConnections(req, res) {
  const userId = resolveUserId(req);
  const workspace = await companyProfileService.getCompanyProfileWorkspace({
    userId,
    viewerId: req.user?.id,
  });
  res.json({ connections: workspace.connections, metrics: workspace.metrics });
}

export async function createConnection(req, res) {
  const userId = resolveUserId(req);
  const connection = await companyProfileService.createConnection({
    userId,
    targetUserId: req.body?.targetUserId,
    targetEmail: req.body?.targetEmail,
    relationshipType: req.body?.relationshipType,
    status: req.body?.status,
    contactEmail: req.body?.contactEmail,
    contactPhone: req.body?.contactPhone,
    notes: req.body?.notes,
    lastInteractedAt: req.body?.lastInteractedAt,
  });
  res.status(201).json(connection);
}

export async function updateConnection(req, res) {
  const userId = resolveUserId(req);
  const connectionId = req.params?.connectionId ?? req.body?.connectionId;
  const connection = await companyProfileService.updateConnection({
    userId,
    connectionId,
    relationshipType: req.body?.relationshipType,
    status: req.body?.status,
    contactEmail: req.body?.contactEmail,
    contactPhone: req.body?.contactPhone,
    notes: req.body?.notes,
    lastInteractedAt: req.body?.lastInteractedAt,
  });
  res.json(connection);
}

export async function removeConnection(req, res) {
  const userId = resolveUserId(req);
  const connectionId = req.params?.connectionId ?? req.body?.connectionId;
  await companyProfileService.removeConnection({ userId, connectionId });
  res.status(204).send();
}

export default {
  getWorkspace,
  updateProfile,
  updateAvatar,
  listFollowers,
  addFollower,
  updateFollower,
  removeFollower,
  listConnections,
  createConnection,
  updateConnection,
  removeConnection,
};
