import { resolveRequestUserId } from '../utils/requestContext.js';
import { ValidationError } from '../utils/errors.js';
import {
  listSubscriptions as listSubscriptionService,
  createSubscription as createSubscriptionService,
  updateSubscription as updateSubscriptionService,
  deleteSubscription as deleteSubscriptionService,
} from '../services/searchSubscriptionService.js';

export async function listSubscriptions(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to list saved searches.');
  }

  const items = await listSubscriptionService(userId);
  res.json({ items });
}

export async function createSubscription(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to create a saved search.');
  }

  const subscription = await createSubscriptionService(userId, req.body ?? {});
  res.status(201).json(subscription);
}

export async function updateSubscription(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to update a saved search.');
  }

  const subscriptionId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(subscriptionId)) {
    throw new ValidationError('Subscription id must be a number.');
  }

  const subscription = await updateSubscriptionService(subscriptionId, userId, req.body ?? {});
  res.json(subscription);
}

export async function deleteSubscription(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to delete a saved search.');
  }

  const subscriptionId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(subscriptionId)) {
    throw new ValidationError('Subscription id must be a number.');
  }

  const result = await deleteSubscriptionService(subscriptionId, userId);
  res.json(result);
}

export default {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
};
