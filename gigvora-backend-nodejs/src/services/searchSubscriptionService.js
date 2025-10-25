import { SearchSubscription, DIGEST_FREQUENCIES } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const ALLOWED_FILTER_KEYS = [
  'employmentTypes',
  'employmentCategories',
  'durationCategories',
  'budgetCurrencies',
  'taxonomySlugs',
  'statuses',
  'tracks',
  'organizations',
  'locations',
  'countries',
  'regions',
  'cities',
  'updatedWithin',
  'isRemote',
];

function sanitiseFilters(rawFilters) {
  if (!rawFilters) {
    return {};
  }

  let parsed = rawFilters;
  if (typeof rawFilters === 'string') {
    try {
      parsed = JSON.parse(rawFilters);
    } catch (error) {
      throw new ValidationError('filters must be valid JSON', { cause: error });
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError('filters must be an object map of supported keys.');
  }

  const normalised = {};

  for (const key of ALLOWED_FILTER_KEYS) {
    if (!(key in parsed)) {
      continue;
    }

    const value = parsed[key];
    if (Array.isArray(value)) {
      const cleaned = value.map((item) => `${item}`.trim()).filter(Boolean);
      normalised[key] = [...new Set(cleaned)];
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      normalised[key] = value;
    }
  }

  if (typeof normalised.isRemote === 'string') {
    if (normalised.isRemote === 'true') normalised.isRemote = true;
    else if (normalised.isRemote === 'false') normalised.isRemote = false;
  }

  return normalised;
}

function sanitiseViewport(rawViewport) {
  if (!rawViewport) {
    return null;
  }

  let parsed = rawViewport;
  if (typeof rawViewport === 'string') {
    try {
      parsed = JSON.parse(rawViewport);
    } catch (error) {
      throw new ValidationError('viewport must be valid JSON', { cause: error });
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ValidationError('viewport must be an object with boundingBox.');
  }

  const box = parsed.boundingBox ?? parsed;
  const { north, south, east, west } = box;

  const coordinates = [north, south, east, west];
  if (coordinates.some((value) => typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value))) {
    throw new ValidationError('viewport bounding box must include numeric north, south, east, and west values.');
  }

  return {
    boundingBox: {
      north,
      south,
      east,
      west,
    },
  };
}

function sanitiseSort(sort) {
  if (!sort) {
    return null;
  }
  if (Array.isArray(sort)) {
    return sort.map((item) => `${item}`.trim()).filter(Boolean);
  }
  return `${sort}`.trim();
}

function sanitiseFrequency(frequency) {
  const fallback = 'daily';
  if (!frequency) {
    return fallback;
  }
  const normalised = `${frequency}`.toLowerCase();
  if (!DIGEST_FREQUENCIES.includes(normalised)) {
    throw new ValidationError(`frequency must be one of ${DIGEST_FREQUENCIES.join(', ')}`);
  }
  return normalised;
}

function computeNextRunAt(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'immediate':
      return now;
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return now;
  }
}

export function getNextRunTimestamp(frequency) {
  return computeNextRunAt(frequency);
}

export async function listSubscriptions(userId) {
  const subscriptions = await SearchSubscription.findAll({
    where: { userId },
    order: [
      ['name', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  return subscriptions.map((subscription) => subscription.toPublicObject());
}

export async function createSubscription(userId, payload = {}) {
  const name = `${payload.name ?? ''}`.trim();
  if (!name) {
    throw new ValidationError('name is required.');
  }

  const category = `${payload.category ?? 'job'}`.toLowerCase();
  if (!['job', 'gig', 'project', 'launchpad', 'volunteering', 'people', 'mixed'].includes(category)) {
    throw new ValidationError('category is not supported.');
  }

  const frequency = sanitiseFrequency(payload.frequency);
  const filters = sanitiseFilters(payload.filters);
  const viewport = sanitiseViewport(payload.mapViewport);
  const sort = sanitiseSort(payload.sort);

  const subscription = await SearchSubscription.create({
    userId,
    name,
    category,
    query: payload.query ? `${payload.query}`.trim() : null,
    filters: Object.keys(filters).length ? filters : null,
    sort: Array.isArray(sort) ? sort.join(',') : sort,
    frequency,
    notifyByEmail: payload.notifyByEmail ?? true,
    notifyInApp: payload.notifyInApp ?? true,
    mapViewport: viewport,
    nextRunAt: computeNextRunAt(frequency),
  });

  return subscription.toPublicObject();
}

export async function updateSubscription(id, userId, payload = {}) {
  const subscription = await SearchSubscription.findOne({ where: { id, userId } });
  if (!subscription) {
    throw new NotFoundError('Search subscription not found.', { id });
  }

  const updates = {};

  if (payload.name !== undefined) {
    const name = `${payload.name}`.trim();
    if (!name) {
      throw new ValidationError('name cannot be empty.');
    }
    updates.name = name;
  }

  if (payload.query !== undefined) {
    updates.query = payload.query ? `${payload.query}`.trim() : null;
  }

  if (payload.category !== undefined) {
    const category = `${payload.category}`.toLowerCase();
    if (!['job', 'gig', 'project', 'launchpad', 'volunteering', 'people', 'mixed'].includes(category)) {
      throw new ValidationError('category is not supported.');
    }
    updates.category = category;
  }

  if (payload.filters !== undefined) {
    const filters = sanitiseFilters(payload.filters);
    updates.filters = Object.keys(filters).length ? filters : null;
  }

  if (payload.sort !== undefined) {
    const sort = sanitiseSort(payload.sort);
    updates.sort = Array.isArray(sort) ? sort.join(',') : sort;
  }

  if (payload.mapViewport !== undefined) {
    updates.mapViewport = sanitiseViewport(payload.mapViewport);
  }

  if (payload.frequency !== undefined) {
    const frequency = sanitiseFrequency(payload.frequency);
    updates.frequency = frequency;
    updates.nextRunAt = computeNextRunAt(frequency);
  }

  if (payload.notifyByEmail !== undefined) {
    updates.notifyByEmail = Boolean(payload.notifyByEmail);
  }

  if (payload.notifyInApp !== undefined) {
    updates.notifyInApp = Boolean(payload.notifyInApp);
  }

  await subscription.update(updates);
  return subscription.toPublicObject();
}

export async function deleteSubscription(id, userId) {
  const deleted = await SearchSubscription.destroy({ where: { id, userId } });
  if (!deleted) {
    throw new NotFoundError('Search subscription not found.', { id });
  }
  return { success: true };
}

export async function runSubscription(id, userId) {
  const subscription = await SearchSubscription.findOne({ where: { id, userId } });
  if (!subscription) {
    throw new NotFoundError('Search subscription not found.', { id });
  }

  const frequency = subscription.frequency ?? 'daily';
  const lastTriggeredAt = new Date();
  const nextRunAt = computeNextRunAt(frequency);

  await subscription.update({ lastTriggeredAt, nextRunAt });

  return subscription.toPublicObject();
}

export default {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  runSubscription,
};
