import * as agencyNetworkingService from '../services/agencyNetworkingService.js';

function actorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.type ?? null,
    actorRoles: req.user?.roles ?? [],
  };
}

function withWorkspacePayload(req, payload = {}) {
  const workspaceId =
    req.body?.workspaceId ?? req.query?.workspaceId ?? req.params?.workspaceId ?? payload.workspaceId ?? null;
  const workspaceSlug =
    req.body?.workspaceSlug ?? req.query?.workspaceSlug ?? req.params?.workspaceSlug ?? payload.workspaceSlug ?? null;
  return {
    ...payload,
    ...(workspaceId ? { workspaceId } : {}),
    ...(workspaceSlug ? { workspaceSlug } : {}),
  };
}

export async function overview(req, res) {
  const data = await agencyNetworkingService.getOverview(req.query ?? {}, actorContext(req));
  res.json(data);
}

export async function listBookings(req, res) {
  const data = await agencyNetworkingService.listBookings(req.query ?? {}, actorContext(req));
  res.json({ data });
}

export async function createBooking(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.createBooking(payload, actorContext(req));
  res.status(201).json(record);
}

export async function updateBooking(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.updateBooking(req.params.bookingId, payload, actorContext(req));
  res.json(record);
}

export async function listPurchases(req, res) {
  const data = await agencyNetworkingService.listPurchases(req.query ?? {}, actorContext(req));
  res.json({ data });
}

export async function createPurchase(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.createPurchase(payload, actorContext(req));
  res.status(201).json(record);
}

export async function updatePurchase(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.updatePurchase(req.params.orderId, payload, actorContext(req));
  res.json(record);
}

export async function listConnections(req, res) {
  const data = await agencyNetworkingService.listConnections(req.query ?? {}, actorContext(req));
  res.json({ data });
}

export async function createConnection(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.createConnection(payload, actorContext(req));
  res.status(201).json(record);
}

export async function updateConnection(req, res) {
  const payload = withWorkspacePayload(req, req.body ?? {});
  const record = await agencyNetworkingService.updateConnection(req.params.connectionId, payload, actorContext(req));
  res.json(record);
}

export default {
  overview,
  listBookings,
  createBooking,
  updateBooking,
  listPurchases,
  createPurchase,
  updatePurchase,
  listConnections,
  createConnection,
  updateConnection,
};
