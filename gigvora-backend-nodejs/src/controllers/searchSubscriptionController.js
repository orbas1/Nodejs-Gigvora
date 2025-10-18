import { resolveRequestUserId } from '../utils/requestContext.js';
import { ValidationError } from '../utils/errors.js';
import {
  listSubscriptions as listSubscriptionService,
  createSubscription as createSubscriptionService,
  updateSubscription as updateSubscriptionService,
  deleteSubscription as deleteSubscriptionService,
  runSubscription as runSubscriptionService,
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

  const subscription = await updateSubscriptionService(req.params.id, userId, req.body ?? {});
  res.json(subscription);
}

export async function deleteSubscription(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to delete a saved search.');
  }

  const result = await deleteSubscriptionService(req.params.id, userId);
  res.json(result);
}

export async function runSubscription(req, res) {
  const userId = resolveRequestUserId(req);
  if (!userId) {
    throw new ValidationError('An authenticated userId is required to trigger a saved search.');
  }

  const subscription = await runSubscriptionService(req.params.id, userId);
  res.json(subscription);
}

export default {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  runSubscription,
};
