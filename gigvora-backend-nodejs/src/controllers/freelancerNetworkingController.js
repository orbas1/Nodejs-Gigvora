import {
  getFreelancerNetworkingDashboard,
  bookNetworkingSessionForFreelancer,
  updateFreelancerNetworkingSignup,
  cancelFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
  deleteFreelancerNetworkingConnection,
  listFreelancerNetworkingOrders,
  createFreelancerNetworkingOrder,
  updateFreelancerNetworkingOrder,
  deleteFreelancerNetworkingOrder,
  getFreelancerNetworkingSettings,
  updateFreelancerNetworkingSettings,
  updateFreelancerNetworkingPreferences,
  listFreelancerNetworkingCampaigns,
  createFreelancerNetworkingCampaign,
  updateFreelancerNetworkingCampaign,
  deleteFreelancerNetworkingCampaign,
  getFreelancerNetworkingAds,
} from '../services/freelancerNetworkingService.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, label = 'id') {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return parsed;
}

function ensureFreelancerAccess(user, freelancerId) {
  if (!freelancerId) {
    throw new ValidationError('freelancerId is required.');
  }
  if (!user) {
    throw new AuthorizationError('Authentication required.');
  }
  if (Number(user.id) === Number(freelancerId)) {
    return;
  }
  const permissions = new Set(
    Array.isArray(user.permissions)
      ? user.permissions.map((permission) => String(permission).toLowerCase())
      : [],
  );
  if (
    permissions.has('freelancer.manage.any') ||
    permissions.has('networking.manage.any') ||
    permissions.has('admin')
  ) {
    return;
  }
  throw new AuthorizationError('You do not have permission to manage this networking workspace.');
}

export async function dashboard(req, res) {
  const freelancerId =
    parsePositiveInteger(req.params.freelancerId ?? req.query.freelancerId, 'freelancerId') ??
    parsePositiveInteger(req.user?.id, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);

  const lookbackDays = req.query?.lookbackDays ? Number(req.query.lookbackDays) : undefined;
  const limitConnections = req.query?.limitConnections
    ? Number(req.query.limitConnections)
    : undefined;

  const payload = await getFreelancerNetworkingDashboard(freelancerId, {
    lookbackDays,
    limitConnections,
  });
  res.json(payload);
}

export async function book(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const sessionId = parsePositiveInteger(req.params.sessionId, 'sessionId');
  const payload = await bookNetworkingSessionForFreelancer(freelancerId, sessionId, req.body ?? {});
  res.status(201).json(payload);
}

export async function updateSignup(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const signupId = parsePositiveInteger(req.params.signupId, 'signupId');
  const payload = await updateFreelancerNetworkingSignup(freelancerId, signupId, req.body ?? {});
  res.json(payload);
}

export async function cancelSignup(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const signupId = parsePositiveInteger(req.params.signupId, 'signupId');
  const reason = req.body?.reason ?? req.query?.reason;
  const booking = await cancelFreelancerNetworkingSignup(freelancerId, signupId, { reason });
  res.json({ success: true, booking });
}

export async function listConnections(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const limit = req.query?.limit ? Number(req.query.limit) : undefined;
  const payload = await listFreelancerNetworkingConnections(freelancerId, { limit });
  res.json(payload);
}

export async function createConnection(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const payload = await createFreelancerNetworkingConnection(freelancerId, req.body ?? {});
  res.status(201).json(payload);
}

export async function updateConnection(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const connectionId = parsePositiveInteger(req.params.connectionId, 'connectionId');
  const payload = await updateFreelancerNetworkingConnection(freelancerId, connectionId, req.body ?? {});
  res.json(payload);
}

export async function deleteConnection(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const connectionId = parsePositiveInteger(req.params.connectionId, 'connectionId');
  const payload = await deleteFreelancerNetworkingConnection(freelancerId, connectionId);
  res.json({ success: true, connection: payload });
}

export async function metrics(req, res) {
  const freelancerId =
    parsePositiveInteger(req.params.freelancerId ?? req.query.freelancerId, 'freelancerId') ??
    parsePositiveInteger(req.user?.id, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const lookback = req.query?.lookbackDays ? Number(req.query.lookbackDays) : undefined;
  const limitConnections = req.query?.limitConnections ? Number(req.query.limitConnections) : undefined;
  const dashboard = await getFreelancerNetworkingDashboard(freelancerId, {
    lookbackDays: lookback ?? 180,
    limitConnections: limitConnections ?? 100,
  });
  res.json({
    summary: dashboard.summary,
    metrics: dashboard.metrics,
    orders: dashboard.orders?.summary ?? null,
    ads: dashboard.ads?.insights ?? null,
  });
}

export async function listOrders(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const limit = req.query?.limit ? Number(req.query.limit) : undefined;
  const payload = await listFreelancerNetworkingOrders(freelancerId, { limit });
  res.json(payload);
}

export async function createOrder(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const order = await createFreelancerNetworkingOrder(freelancerId, req.body ?? {});
  const overview = await listFreelancerNetworkingOrders(freelancerId);
  res.status(201).json({ order, summary: overview.summary });
}

export async function updateOrder(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const orderId = parsePositiveInteger(req.params.orderId, 'orderId');
  const order = await updateFreelancerNetworkingOrder(freelancerId, orderId, req.body ?? {});
  res.json(order);
}

export async function deleteOrder(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const orderId = parsePositiveInteger(req.params.orderId, 'orderId');
  const order = await deleteFreelancerNetworkingOrder(freelancerId, orderId);
  const overview = await listFreelancerNetworkingOrders(freelancerId);
  res.json({ success: true, order, summary: overview.summary });
}

export async function getSettings(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const card = await getFreelancerNetworkingSettings(freelancerId);
  res.json(card);
}

export async function patchSettings(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const card = await updateFreelancerNetworkingSettings(freelancerId, req.body ?? {});
  res.json(card);
}

export async function patchPreferences(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const card = await updateFreelancerNetworkingPreferences(freelancerId, req.body ?? {});
  res.json({ preferences: card.preferences ?? {}, updatedAt: card.updatedAt });
}

export async function listAds(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const payload = await getFreelancerNetworkingAds(freelancerId);
  res.json(payload);
}

export async function createAd(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const campaign = await createFreelancerNetworkingCampaign(freelancerId, req.body ?? {});
  const ads = await getFreelancerNetworkingAds(freelancerId);
  res.status(201).json({ campaign, ads });
}

export async function updateAd(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const campaignId = parsePositiveInteger(req.params.campaignId, 'campaignId');
  const campaign = await updateFreelancerNetworkingCampaign(freelancerId, campaignId, req.body ?? {});
  const ads = await getFreelancerNetworkingAds(freelancerId);
  res.json({ campaign, ads });
}

export async function deleteAd(req, res) {
  const freelancerId = parsePositiveInteger(req.params.freelancerId, 'freelancerId');
  ensureFreelancerAccess(req.user, freelancerId);
  const campaignId = parsePositiveInteger(req.params.campaignId, 'campaignId');
  await deleteFreelancerNetworkingCampaign(freelancerId, campaignId);
  const ads = await getFreelancerNetworkingAds(freelancerId);
  res.json({ success: true, ads });
}

export default {
  dashboard,
  book,
  updateSignup,
  cancelSignup,
  listConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  metrics,
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getSettings,
  patchSettings,
  patchPreferences,
  listAds,
  createAd,
  updateAd,
  deleteAd,
};
