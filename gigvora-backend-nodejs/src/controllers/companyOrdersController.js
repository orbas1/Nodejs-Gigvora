import {
  getCompanyOrdersDashboard,
  createCompanyOrder,
  updateCompanyOrder,
  deleteCompanyOrder,
  getCompanyOrderDetail,
  createCompanyOrderTimeline,
  updateCompanyOrderTimeline,
  deleteCompanyOrderTimeline,
  postCompanyOrderMessage,
  createCompanyOrderEscrow,
  updateCompanyOrderEscrow,
  submitCompanyOrderReview,
} from '../services/companyOrdersService.js';

function parseInteger(value, fallback = undefined) {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveOwnerId(req) {
  const userId = req.user?.id ?? req.query?.userId ?? req.body?.userId;
  return parseInteger(userId, null);
}

export async function dashboard(req, res) {
  const ownerId = resolveOwnerId(req);
  const { status } = req.query ?? {};
  const data = await getCompanyOrdersDashboard({ ownerId, status: status || undefined });
  res.json(data);
}

export async function create(req, res) {
  const ownerId = resolveOwnerId(req);
  const order = await createCompanyOrder({ ownerId, payload: req.body ?? {} });
  res.status(201).json(order);
}

export async function update(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const order = await updateCompanyOrder({ ownerId, orderId: parseInteger(orderId), payload: req.body ?? {} });
  res.json(order);
}

export async function remove(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  await deleteCompanyOrder({ ownerId, orderId: parseInteger(orderId) });
  res.status(204).send();
}

export async function detail(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const order = await getCompanyOrderDetail({ ownerId, orderId: parseInteger(orderId) });
  res.json(order);
}

export async function addTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const event = await createCompanyOrderTimeline({ ownerId, orderId: parseInteger(orderId), payload: req.body ?? {} });
  res.status(201).json(event);
}

export async function updateTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId, eventId } = req.params ?? {};
  const event = await updateCompanyOrderTimeline({
    ownerId,
    orderId: parseInteger(orderId),
    eventId: parseInteger(eventId),
    payload: req.body ?? {},
  });
  res.json(event);
}

export async function removeTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId, eventId } = req.params ?? {};
  await deleteCompanyOrderTimeline({ ownerId, orderId: parseInteger(orderId), eventId: parseInteger(eventId) });
  res.status(204).send();
}

export async function postMessage(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const actor = {
    id: parseInteger(req.user?.id, ownerId),
    name: req.user?.displayName ?? req.user?.name ?? req.user?.email ?? 'Company operator',
  };
  const message = await postCompanyOrderMessage({
    ownerId,
    orderId: parseInteger(orderId),
    payload: req.body ?? {},
    actor,
  });
  res.status(201).json(message);
}

export async function createEscrowCheckpoint(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const checkpoint = await createCompanyOrderEscrow({ ownerId, orderId: parseInteger(orderId), payload: req.body ?? {} });
  res.status(201).json(checkpoint);
}

export async function updateEscrowCheckpoint(req, res) {
  const ownerId = resolveOwnerId(req);
  const { checkpointId } = req.params ?? {};
  const checkpoint = await updateCompanyOrderEscrow({ ownerId, checkpointId: parseInteger(checkpointId), payload: req.body ?? {} });
  res.json(checkpoint);
}

export async function submitReview(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const order = await submitCompanyOrderReview({ ownerId, orderId: parseInteger(orderId), payload: req.body ?? {} });
  res.json(order);
}

export default {
  dashboard,
  create,
  update,
  remove,
  detail,
  addTimelineEvent,
  updateTimelineEvent,
  removeTimelineEvent,
  postMessage,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
  submitReview,
};
