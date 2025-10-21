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
import { ValidationError } from '../utils/errors.js';

function parseOptionalInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function ensurePositiveInteger(value, fieldName) {
  const parsed = parseOptionalInteger(value);
  if (!parsed || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function resolveOwnerId(req) {
  const candidate =
    req.user?.id ??
    req.auth?.userId ??
    req.query?.ownerId ??
    req.query?.userId ??
    req.body?.ownerId ??
    req.body?.userId ??
    req.params?.ownerId;

  const ownerId = parseOptionalInteger(candidate);
  if (!ownerId) {
    throw new ValidationError('An authenticated ownerId is required for company order operations.');
  }
  return ownerId;
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
  const order = await updateCompanyOrder({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
  });
  res.json(order);
}

export async function remove(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  await deleteCompanyOrder({ ownerId, orderId: ensurePositiveInteger(orderId, 'orderId') });
  res.status(204).send();
}

export async function detail(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const order = await getCompanyOrderDetail({ ownerId, orderId: ensurePositiveInteger(orderId, 'orderId') });
  res.json(order);
}

export async function addTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const event = await createCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
  });
  res.status(201).json(event);
}

export async function updateTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId, eventId } = req.params ?? {};
  const event = await updateCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    eventId: ensurePositiveInteger(eventId, 'eventId'),
    payload: req.body ?? {},
  });
  res.json(event);
}

export async function removeTimelineEvent(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId, eventId } = req.params ?? {};
  await deleteCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    eventId: ensurePositiveInteger(eventId, 'eventId'),
  });
  res.status(204).send();
}

export async function postMessage(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const actor = {
    id: parseOptionalInteger(req.user?.id) ?? ownerId,
    name: req.user?.displayName ?? req.user?.name ?? req.user?.email ?? 'Company operator',
  };
  const message = await postCompanyOrderMessage({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    actor,
  });
  res.status(201).json(message);
}

export async function createEscrowCheckpoint(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const checkpoint = await createCompanyOrderEscrow({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
  });
  res.status(201).json(checkpoint);
}

export async function updateEscrowCheckpoint(req, res) {
  const ownerId = resolveOwnerId(req);
  const { checkpointId } = req.params ?? {};
  const checkpoint = await updateCompanyOrderEscrow({
    ownerId,
    checkpointId: ensurePositiveInteger(checkpointId, 'checkpointId'),
    payload: req.body ?? {},
  });
  res.json(checkpoint);
}

export async function submitReview(req, res) {
  const ownerId = resolveOwnerId(req);
  const { orderId } = req.params ?? {};
  const order = await submitCompanyOrderReview({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
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
