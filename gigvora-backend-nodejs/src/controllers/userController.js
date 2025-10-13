import { User } from '../models/index.js';
import profileService from '../services/profileService.js';
import userDashboardService from '../services/userDashboardService.js';
import catalogInsightsService from '../services/catalogInsightsService.js';

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
  await user.update(req.body);
  res.json(user);
}

export async function updateProfileSettings(req, res) {
  const profile = await profileService.updateProfileAvailability(req.params.id, req.body);
  res.json(profile);
}

export async function getUserDashboard(req, res) {
  const dashboard = await userDashboardService.getUserDashboard(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(dashboard);
}

export async function getFreelancerCatalogInsights(req, res) {
  const insights = await catalogInsightsService.getFreelancerCatalogInsights(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(insights);
}
