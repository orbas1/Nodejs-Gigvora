import { resolveRequestUserId } from '../utils/requestContext.js';
import { AuthorizationError, ValidationError } from '../utils/errors.js';
import {
  listSubscriptions as listSubscriptionService,
  createSubscription as createSubscriptionService,
  updateSubscription as updateSubscriptionService,
  deleteSubscription as deleteSubscriptionService,
  runSubscription as runSubscriptionService,
} from '../services/searchSubscriptionService.js';

function ensureAuthenticatedUser(req) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new AuthorizationError('Authentication is required to manage saved searches.');
  }
  return userId;
}

function parseSubscriptionId(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('Subscription id must be a positive integer.');
  }
  return numeric;
}

function ensurePayloadObject(body) {
  if (body == null) {
    return {};
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Payload must be provided as an object.');
  }
  return { ...body };
}

export async function listSubscriptions(req, res) {
  const userId = ensureAuthenticatedUser(req);
  const items = await listSubscriptionService(userId);
  res.json({ items });
}

export async function createSubscription(req, res) {
  const userId = ensureAuthenticatedUser(req);
  const subscription = await createSubscriptionService(userId, ensurePayloadObject(req.body));
  res.status(201).json(subscription);
}

export async function updateSubscription(req, res) {
  const userId = ensureAuthenticatedUser(req);
  const subscriptionId = parseSubscriptionId(req.params.id);
  const subscription = await updateSubscriptionService(subscriptionId, userId, ensurePayloadObject(req.body));
  res.json(subscription);
}

export async function deleteSubscription(req, res) {
  const userId = ensureAuthenticatedUser(req);
  const subscriptionId = parseSubscriptionId(req.params.id);
  const result = await deleteSubscriptionService(subscriptionId, userId);
  res.json(result);
}

export async function runSubscription(req, res) {
  const userId = ensureAuthenticatedUser(req);
  const subscriptionId = parseSubscriptionId(req.params.id);
  const subscription = await runSubscriptionService(subscriptionId, userId);
  res.json(subscription);
}

export default {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  runSubscription,
};
