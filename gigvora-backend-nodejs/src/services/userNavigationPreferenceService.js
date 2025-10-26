import { User, UserDashboardNavigationPreference } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_PREFERENCES = Object.freeze({
  dashboardKey: 'global',
  collapsed: false,
  order: [],
  hidden: [],
  pinned: [],
});

function normalizeUserId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function normalizeDashboardKey(value) {
  if (value == null || value === '') {
    return DEFAULT_PREFERENCES.dashboardKey;
  }
  const stringified = `${value}`.trim().toLowerCase();
  if (!stringified) {
    return DEFAULT_PREFERENCES.dashboardKey;
  }
  const normalized = stringified.replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  if (!normalized) {
    throw new ValidationError('dashboardKey must contain at least one alphanumeric character.');
  }
  return normalized;
}

function normalizeIdList(value, { field, limit = 200 } = {}) {
  if (value == null) {
    return [];
  }
  const source = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const result = [];
  source.forEach((entry) => {
    if (entry == null) {
      return;
    }
    const stringified = `${entry}`.trim();
    if (!stringified) {
      return;
    }
    const normalized = stringified.slice(0, 120);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  });
  if (result.length > limit) {
    throw new ValidationError(`${field ?? 'list'} cannot contain more than ${limit} entries.`);
  }
  return result;
}

function normalizeBoolean(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return Boolean(value);
}

function mergeDefaults(preferences) {
  if (!preferences) {
    return { ...DEFAULT_PREFERENCES };
  }
  return {
    dashboardKey: preferences.dashboardKey ?? DEFAULT_PREFERENCES.dashboardKey,
    collapsed: preferences.collapsed ?? DEFAULT_PREFERENCES.collapsed,
    order: Array.isArray(preferences.order) ? [...preferences.order] : [],
    hidden: Array.isArray(preferences.hidden) ? [...preferences.hidden] : [],
    pinned: Array.isArray(preferences.pinned) ? [...preferences.pinned] : [],
  };
}

export async function getUserNavigationPreferences(userId, { dashboardKey } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const key = normalizeDashboardKey(dashboardKey);
  const record = await UserDashboardNavigationPreference.findOne({
    where: { userId: normalizedUserId, dashboardKey: key },
  });
  if (!record) {
    return mergeDefaults({ dashboardKey: key });
  }
  return mergeDefaults(record.toPublicObject());
}

export async function updateUserNavigationPreferences(userId, payload = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const user = await User.findByPk(normalizedUserId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const dashboardKey = normalizeDashboardKey(payload.dashboardKey ?? payload.dashboardKeySlug ?? payload.dashboard);
  const collapsed = payload.collapsed == null ? DEFAULT_PREFERENCES.collapsed : normalizeBoolean(payload.collapsed);
  const order = normalizeIdList(payload.order, { field: 'order' });
  const hidden = normalizeIdList(payload.hidden, { field: 'hidden' });
  const pinned = normalizeIdList(payload.pinned, { field: 'pinned' });

  const [record, created] = await UserDashboardNavigationPreference.findOrCreate({
    where: { userId: normalizedUserId, dashboardKey },
    defaults: {
      userId: normalizedUserId,
      dashboardKey,
      collapsed,
      order,
      hidden,
      pinned,
    },
  });

  if (!created) {
    record.set({ collapsed, order, hidden, pinned, dashboardKey });
    await record.save();
  }

  const reloaded = created ? record : await record.reload();
  return mergeDefaults(reloaded.toPublicObject());
}

export default {
  getUserNavigationPreferences,
  updateUserNavigationPreferences,
};
