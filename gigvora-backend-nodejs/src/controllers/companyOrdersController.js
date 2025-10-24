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
import { requireOwnerId, ensureViewAccess, ensureManageAccess } from '../utils/projectAccess.js';
import { resolveRequestPermissions } from '../utils/requestContext.js';

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

function buildAccessContext(req, ownerId, { requireManage = false } = {}) {
  const access = requireManage ? ensureManageAccess(req, ownerId) : ensureViewAccess(req, ownerId);
  const permissions = resolveRequestPermissions(req);
  return { ...access, permissions };
}

export async function dashboard(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: false });
  const { status } = req.query ?? {};
  const data = await getCompanyOrdersDashboard({ ownerId, status: status || undefined, accessContext });
  res.json(data);
}

export async function create(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const order = await createCompanyOrder({ ownerId, payload: req.body ?? {}, accessContext });
  res.status(201).json(order);
}

export async function update(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId } = req.params ?? {};
  const order = await updateCompanyOrder({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    accessContext,
  });
  res.json(order);
}

export async function remove(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId } = req.params ?? {};
  await deleteCompanyOrder({ ownerId, orderId: ensurePositiveInteger(orderId, 'orderId'), accessContext });
  res.status(204).send();
}

export async function detail(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: false });
  const { orderId } = req.params ?? {};
  const order = await getCompanyOrderDetail({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    accessContext,
  });
  res.json(order);
}

export async function addTimelineEvent(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId } = req.params ?? {};
  const event = await createCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    accessContext,
  });
  res.status(201).json(event);
}

export async function updateTimelineEvent(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId, eventId } = req.params ?? {};
  const event = await updateCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    eventId: ensurePositiveInteger(eventId, 'eventId'),
    payload: req.body ?? {},
    accessContext,
  });
  res.json(event);
}

export async function removeTimelineEvent(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId, eventId } = req.params ?? {};
  await deleteCompanyOrderTimeline({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    eventId: ensurePositiveInteger(eventId, 'eventId'),
    accessContext,
  });
  res.status(204).send();
}

export async function postMessage(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: false });
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
    accessContext,
  });
  res.status(201).json(message);
}

export async function createEscrowCheckpoint(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId } = req.params ?? {};
  const checkpoint = await createCompanyOrderEscrow({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    accessContext,
  });
  res.status(201).json(checkpoint);
}

export async function updateEscrowCheckpoint(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { checkpointId } = req.params ?? {};
  const checkpoint = await updateCompanyOrderEscrow({
    ownerId,
    checkpointId: ensurePositiveInteger(checkpointId, 'checkpointId'),
    payload: req.body ?? {},
    accessContext,
  });
  res.json(checkpoint);
}

export async function submitReview(req, res) {
  const ownerId = requireOwnerId(req, { fieldName: 'ownerId' });
  const accessContext = buildAccessContext(req, ownerId, { requireManage: true });
  const { orderId } = req.params ?? {};
  const order = await submitCompanyOrderReview({
    ownerId,
    orderId: ensurePositiveInteger(orderId, 'orderId'),
    payload: req.body ?? {},
    accessContext,
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
