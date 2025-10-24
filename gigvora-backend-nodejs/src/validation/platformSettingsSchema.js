import { ESCROW_INTEGRATION_PROVIDERS } from '../models/constants/index.js';
import { ValidationError } from '../utils/errors.js';

export const SUBSCRIPTION_INTERVALS = Object.freeze(['weekly', 'monthly', 'quarterly', 'yearly', 'lifetime']);

const PAYMENT_PROVIDERS = new Set(ESCROW_INTEGRATION_PROVIDERS);
PAYMENT_PROVIDERS.add('stripe');

const WATCHER_CHANNELS = new Set(['in_app', 'email', 'sms', 'push']);

function coercePositiveInteger(value, { label, min = 0, max = 24 * 60 }) {
  if (value == null || value === '') {
    return min;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${label} must be a valid number.`);
  }
  const int = Math.max(Math.trunc(numeric), min);
  if (int > max) {
    throw new ValidationError(`${label} must be less than or equal to ${max}.`);
  }
  return int;
}

export function normaliseWatcherEntry(entry, { index }) {
  if (!entry || typeof entry !== 'object') {
    throw new ValidationError(`notifications.watchers[${index}] must be an object.`);
  }
  const { userId, channels, notifyDelayMinutes, label } = entry;
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError(`notifications.watchers[${index}].userId must be a positive integer.`);
  }

  const dedupedChannels = Array.isArray(channels)
    ? Array.from(
        new Set(
          channels
            .map((channel) => `${channel}`.trim().toLowerCase())
            .filter((channel) => WATCHER_CHANNELS.has(channel)),
        ),
      )
    : ['in_app'];

  if (dedupedChannels.length === 0) {
    dedupedChannels.push('in_app');
  }

  const safeLabel = label != null ? `${label}`.trim().slice(0, 120) : null;
  const safeDelay = coercePositiveInteger(notifyDelayMinutes, {
    label: `notifications.watchers[${index}].notifyDelayMinutes`,
  });

  return {
    userId: numericId,
    channels: dedupedChannels,
    notifyDelayMinutes: safeDelay,
    ...(safeLabel ? { label: safeLabel } : {}),
  };
}

export function normaliseEscalationPolicy(entry, { index }) {
  if (!entry || typeof entry !== 'object') {
    throw new ValidationError(`notifications.escalationPolicies[${index}] must be an object.`);
  }
  const name = entry.name != null ? `${entry.name}`.trim() : '';
  if (!name) {
    throw new ValidationError(`notifications.escalationPolicies[${index}].name is required.`);
  }
  const notifyAfterMinutes = coercePositiveInteger(entry.notifyAfterMinutes, {
    label: `notifications.escalationPolicies[${index}].notifyAfterMinutes`,
    min: 1,
    max: 7 * 24 * 60,
  });

  const watcherIds = Array.isArray(entry.watcherUserIds)
    ? Array.from(
        new Set(
          entry.watcherUserIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      )
    : [];
  if (!watcherIds.length) {
    throw new ValidationError(
      `notifications.escalationPolicies[${index}].watcherUserIds must include at least one valid user id.`,
    );
  }

  const channels = Array.isArray(entry.channels)
    ? Array.from(
        new Set(
          entry.channels
            .map((channel) => `${channel}`.trim().toLowerCase())
            .filter((channel) => WATCHER_CHANNELS.has(channel)),
        ),
      )
    : ['in_app'];

  if (!channels.length) {
    channels.push('in_app');
  }

  return {
    name: name.slice(0, 120),
    notifyAfterMinutes,
    watcherUserIds: watcherIds,
    channels,
    active: entry.active == null ? true : Boolean(entry.active),
  };
}

export function sanitiseNotificationsConfig(input = {}) {
  const watchersInput = Array.isArray(input.watchers) ? input.watchers : input.watchers ? [input.watchers] : [];
  const policiesInput = Array.isArray(input.escalationPolicies)
    ? input.escalationPolicies
    : input.escalationPolicies
    ? [input.escalationPolicies]
    : [];

  const watchers = watchersInput.map((entry, index) => normaliseWatcherEntry(entry, { index }));
  const seenWatchers = new Set();
  const dedupedWatchers = [];
  watchers.forEach((watcher) => {
    if (!seenWatchers.has(watcher.userId)) {
      seenWatchers.add(watcher.userId);
      dedupedWatchers.push(watcher);
    }
  });

  const policies = policiesInput.map((entry, index) => normaliseEscalationPolicy(entry, { index }));

  return {
    watchers: dedupedWatchers,
    escalationPolicies: policies,
  };
}

export function validatePlatformSettingsSnapshot(snapshot = {}) {
  const provider = snapshot?.payments?.provider ?? 'stripe';
  if (!PAYMENT_PROVIDERS.has(provider)) {
    throw new ValidationError(`Unsupported payment provider: ${provider}`);
  }

  if (provider === 'stripe') {
    const publishableKey = snapshot?.payments?.stripe?.publishableKey ?? '';
    const secretKey = snapshot?.payments?.stripe?.secretKey ?? '';
    if (!publishableKey || !publishableKey.trim()) {
      throw new ValidationError('Stripe publishable key is required when Stripe is the active payment provider.');
    }
    if (!secretKey || !secretKey.trim()) {
      throw new ValidationError('Stripe secret key is required when Stripe is the active payment provider.');
    }
  }

  if (provider === 'escrow_com') {
    const apiKey = snapshot?.payments?.escrow_com?.apiKey ?? '';
    const apiSecret = snapshot?.payments?.escrow_com?.apiSecret ?? '';
    if (!apiKey || !apiKey.trim()) {
      throw new ValidationError('Escrow.com API key is required when escrow_com is the active payment provider.');
    }
    if (!apiSecret || !apiSecret.trim()) {
      throw new ValidationError('Escrow.com API secret is required when escrow_com is the active payment provider.');
    }
    if (snapshot?.featureToggles?.escrow === false) {
      throw new ValidationError('Escrow compliance toggle cannot be disabled while escrow_com payments are active.');
    }
  }

  const notifications = snapshot?.notifications;
  if (notifications) {
    const watchers = notifications.watchers ?? [];
    if (!Array.isArray(watchers)) {
      throw new ValidationError('notifications.watchers must be an array.');
    }
    watchers.forEach((watcher, index) => {
      normaliseWatcherEntry(watcher, { index });
    });

    const policies = notifications.escalationPolicies ?? [];
    if (!Array.isArray(policies)) {
      throw new ValidationError('notifications.escalationPolicies must be an array.');
    }
    policies.forEach((policy, index) => {
      normaliseEscalationPolicy(policy, { index });
    });
  }

  const plans = snapshot?.subscriptions?.plans ?? [];
  if (plans && !Array.isArray(plans)) {
    throw new ValidationError('Subscription plans must be an array of plan definitions.');
  }
  if (Array.isArray(plans)) {
    plans.forEach((plan, index) => {
      const interval = (plan?.interval ?? '').trim().toLowerCase();
      if (interval && !SUBSCRIPTION_INTERVALS.includes(interval)) {
        throw new ValidationError(`subscriptions.plans[${index}].interval must be one of ${SUBSCRIPTION_INTERVALS.join(', ')}`);
      }
    });
  }
}

export const platformSettingsConstants = Object.freeze({
  PAYMENT_PROVIDERS,
  WATCHER_CHANNELS,
});

export default {
  SUBSCRIPTION_INTERVALS,
  normaliseWatcherEntry,
  normaliseEscalationPolicy,
  sanitiseNotificationsConfig,
  validatePlatformSettingsSnapshot,
  platformSettingsConstants,
};
