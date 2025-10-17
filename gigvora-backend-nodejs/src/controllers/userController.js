import { User } from '../models/index.js';
import profileService from '../services/profileService.js';
import userDashboardService from '../services/userDashboardService.js';
import freelancerAllianceService from '../services/freelancerAllianceService.js';
import supportDeskService from '../services/supportDeskService.js';
import catalogInsightsService from '../services/catalogInsightsService.js';
import gigBuilderService from '../services/gigBuilderService.js';
import gigManagerService from '../services/gigManagerService.js';
import { getUserOpenAiSettings, updateUserOpenAiSettings } from '../services/aiAutoReplyService.js';
import affiliateDashboardService from '../services/affiliateDashboardService.js';
import { normalizeLocationPayload } from '../utils/location.js';

export async function listUsers(req, res) {
  const limitParam = Number.parseInt(req.query.limit ?? '20', 10);
  const offsetParam = Number.parseInt(req.query.offset ?? '0', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  const bypassCache = req.query.fresh === 'true';

  const users = await User.findAll({
    attributes: ['id'],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const profiles = await Promise.all(
    users.map((user) => profileService.getProfileOverview(user.id, { bypassCache })),
  );

  res.json({
    items: profiles,
    pagination: {
      limit,
      offset,
      count: profiles.length,
    },
  });
}

export async function getUserProfile(req, res) {
  const profile = await profileService.getProfileOverview(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(profile);
}

export async function updateUser(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const updates = { ...req.body };
  const hasLocation = Object.prototype.hasOwnProperty.call(req.body, 'location');
  const hasGeoLocation = Object.prototype.hasOwnProperty.call(req.body, 'geoLocation');
  if (hasLocation || hasGeoLocation) {
    const normalized = normalizeLocationPayload({
      location: hasLocation ? req.body.location : user.location,
      geoLocation: hasGeoLocation ? req.body.geoLocation : undefined,
    });
    if (hasLocation) {
      updates.location = normalized.location;
      if (!hasGeoLocation && normalized.location == null) {
        updates.geoLocation = null;
      }
    } else if (hasGeoLocation) {
      updates.location = normalized.location;
    }
    if (hasGeoLocation) {
      updates.geoLocation = normalized.geoLocation;
    }
  }
  await user.update(updates);
  res.json(user);
}

export async function updateProfileSettings(req, res) {
  const profile = await profileService.updateProfileAvailability(req.params.id, req.body);
  res.json(profile);
}

export async function updateUserProfileDetails(req, res) {
  const profile = await profileHubService.updateProfileBasics(req.params.id, req.body ?? {});
  res.json(profile);
}

export async function updateUserProfileAvatar(req, res) {
  const file = req.file ?? null;
  const payload = {
    fileBuffer: file?.buffer ?? null,
    mimeType: file?.mimetype ?? null,
    fileName: file?.originalname ?? null,
    url: req.body?.avatarUrl ?? req.body?.url ?? null,
    metadata: req.body?.metadata ?? null,
  };
  const profile = await profileHubService.changeProfileAvatar(req.params.id, payload);
  res.json(profile);
}

export async function listUserFollowers(req, res) {
  const hub = await profileHubService.getProfileHub(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(hub.followers);
}

export async function saveUserFollower(req, res) {
  const follower = await profileHubService.saveFollower(req.params.id, req.body ?? {});
  res.status(201).json(follower);
}

export async function deleteUserFollower(req, res) {
  await profileHubService.deleteFollower(req.params.id, req.params.followerId);
  res.status(204).send();
}

export async function listUserConnections(req, res) {
  const connections = await profileHubService.listConnections(req.params.id);
  res.json(connections);
}

export async function updateUserConnection(req, res) {
  const connection = await profileHubService.updateConnection(req.params.id, req.params.connectionId, req.body ?? {});
  res.json(connection);
}

export async function getUserDashboard(req, res) {
  const dashboard = await userDashboardService.getUserDashboard(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(dashboard);
}

export async function getUserProfileHub(req, res) {
  const hub = await profileHubService.getProfileHub(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(hub);
}

export async function getUserAffiliateDashboard(req, res) {
  const dashboard = await affiliateDashboardService.getAffiliateDashboard(req.params.id);
  res.json(dashboard);
}

export async function getFreelancerAlliances(req, res) {
  const alliances = await freelancerAllianceService.getFreelancerAllianceDashboard(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(alliances);
}

export async function getSupportDesk(req, res) {
  const snapshot = await supportDeskService.getFreelancerSupportDesk(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(snapshot);
}

export async function getFreelancerCatalogInsights(req, res) {
  const insights = await catalogInsightsService.getFreelancerCatalogInsights(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(insights);
}

export async function getFreelancerGigBuilder(req, res) {
  const payload = await gigBuilderService.getFreelancerGigBuilder({
    freelancerId: req.params.id,
    gigId: req.query.gigId,
  });
  res.json(payload);
}

export async function getGigManagerSnapshot(req, res) {
  const snapshot = await gigManagerService.getGigManagerSnapshot(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(snapshot);
}

export async function getUserAiSettings(req, res) {
  const settings = await getUserOpenAiSettings(req.params.id);
  res.json(settings);
}

export async function updateUserAiSettings(req, res) {
  const settings = await updateUserOpenAiSettings(req.params.id, req.body ?? {});
  res.json(settings);
}
