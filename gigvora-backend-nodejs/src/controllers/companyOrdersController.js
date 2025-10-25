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
import { requireOwnerIdFromRequest } from '../utils/ownerResolver.js';
import { parsePositiveInteger } from '../utils/controllerAccess.js';
import { buildCompanyOrderRequestContext } from '../utils/companyOrderAccess.js';

function resolveOrderContext(req) {
  const ownerId = requireOwnerIdFromRequest(
    req,
    'An authenticated ownerId is required for company order operations.',
  );
  const context = buildCompanyOrderRequestContext(req, ownerId);
  return { ownerId, context };
}

export async function dashboard(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { status } = req.query ?? {};
  const data = await getCompanyOrdersDashboard({
    ownerId,
    status: status || undefined,
    context,
  });
  res.json(data);
}

export async function create(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const order = await createCompanyOrder({ ownerId, payload: req.body ?? {}, context });
  res.status(201).json(order);
}

export async function update(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const order = await updateCompanyOrder({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    context,
  });
  res.json(order);
}

export async function remove(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  await deleteCompanyOrder({ ownerId, orderId: parsePositiveInteger(orderId, 'orderId'), context });
  res.status(204).send();
}

export async function detail(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const order = await getCompanyOrderDetail({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    context,
  });
  res.json(order);
}

export async function addTimelineEvent(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const event = await createCompanyOrderTimeline({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    context,
  });
  res.status(201).json(event);
}

export async function updateTimelineEvent(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId, eventId } = req.params ?? {};
  const event = await updateCompanyOrderTimeline({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    eventId: parsePositiveInteger(eventId, 'eventId'),
    payload: req.body ?? {},
    context,
  });
  res.json(event);
}

export async function removeTimelineEvent(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId, eventId } = req.params ?? {};
  await deleteCompanyOrderTimeline({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    eventId: parsePositiveInteger(eventId, 'eventId'),
    context,
  });
  res.status(204).send();
}

export async function postMessage(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const parsedActorId =
    req.user?.id != null ? Number.parseInt(req.user.id, 10) : Number.NaN;
  const actor = {
    id: Number.isFinite(parsedActorId) ? parsedActorId : ownerId,
    name: req.user?.displayName ?? req.user?.name ?? req.user?.email ?? 'Company operator',
  };
  const message = await postCompanyOrderMessage({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    actor,
    context,
  });
  res.status(201).json(message);
}

export async function createEscrowCheckpoint(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const checkpoint = await createCompanyOrderEscrow({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    context,
  });
  res.status(201).json(checkpoint);
}

export async function updateEscrowCheckpoint(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { checkpointId } = req.params ?? {};
  const checkpoint = await updateCompanyOrderEscrow({
    ownerId,
    checkpointId: parsePositiveInteger(checkpointId, 'checkpointId'),
    payload: req.body ?? {},
    context,
  });
  res.json(checkpoint);
}

export async function submitReview(req, res) {
  const { ownerId, context } = resolveOrderContext(req);
  const { orderId } = req.params ?? {};
  const order = await submitCompanyOrderReview({
    ownerId,
    orderId: parsePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    context,
  });
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
