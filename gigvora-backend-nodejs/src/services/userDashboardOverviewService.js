import {
  User,
  UserDashboardOverview,
  Profile,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';
import weatherService from './weatherService.js';

const CACHE_NAMESPACE = 'user-dashboard-overview';
const CACHE_TTL_SECONDS = 60;
const WEATHER_STALE_AFTER_MS = 1000 * 60 * 30; // 30 minutes

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function buildCacheKeyFor(userId) {
  return buildCacheKey(CACHE_NAMESPACE, { userId });
}

async function ensureUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }
  return user;
}

async function ensureOverviewRecord(userId) {
  const existing = await UserDashboardOverview.findOne({ where: { userId } });
  if (existing) {
    return existing;
  }

  const [user, profile] = await Promise.all([
    ensureUser(userId),
    Profile.findOne({ where: { userId } }),
  ]);

  const statusFlags = Array.isArray(profile?.statusFlags)
    ? profile.statusFlags.filter((flag) => typeof flag === 'string' && flag.trim().length)
    : [];
  const trustLabel = statusFlags.length ? statusFlags[0] : null;

  const defaultGreeting = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Gigvora member';
  const headline = profile?.headline ?? profile?.missionStatement ?? null;
  const overview = profile?.missionStatement ?? null;
  const location = user.location ?? profile?.location ?? null;

  return UserDashboardOverview.create({
    userId,
    greetingName: defaultGreeting,
    headline,
    overview,
    followersCount: profile?.followersCount ?? 0,
    trustScore: profile?.trustScore ?? null,
    trustScoreLabel: trustLabel,
    weatherLocation: location,
    weatherUnits: 'metric',
  });
}

function sanitizeString(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
}

function sanitizeUrl(value) {
  const sanitized = sanitizeString(value);
  if (sanitized == null) {
    return sanitized;
  }
  try {
    const url = new URL(sanitized);
    return url.toString();
  } catch (error) {
    throw new ValidationError('A valid URL is required.');
  }
}

function sanitizeInteger(value, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('A numeric value is required.');
  }
  const rounded = Math.round(numeric);
  if (rounded < minimum || rounded > maximum) {
    throw new ValidationError(`Value must be between ${minimum} and ${maximum}.`);
  }
  return rounded;
}

function sanitizeDecimal(value, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('A numeric value is required.');
  }
  if (numeric < minimum || numeric > maximum) {
    throw new ValidationError(`Value must be between ${minimum} and ${maximum}.`);
  }
  return Number(numeric.toFixed(2));
}

async function hydrateWeather(overview, { forceRefresh = false } = {}) {
  const plain = overview.get({ plain: true });
  const location = plain.weatherLocation;
  const hasCoordinates = plain.weatherLatitude != null && plain.weatherLongitude != null;
  if (!location && !hasCoordinates) {
    return overview;
  }

  const lastUpdatedAt = plain.weatherUpdatedAt ? new Date(plain.weatherUpdatedAt).getTime() : null;
  const stale =
    forceRefresh ||
    !lastUpdatedAt ||
    Number.isNaN(lastUpdatedAt) ||
    Date.now() - lastUpdatedAt > WEATHER_STALE_AFTER_MS;

  if (!stale) {
    return overview;
  }

  try {
    const snapshot = await weatherService.getWeatherSnapshot({
      location,
      latitude: plain.weatherLatitude,
      longitude: plain.weatherLongitude,
      units: plain.weatherUnits ?? 'metric',
      forceRefresh,
    });

    if (!snapshot) {
      return overview;
    }

    await overview.update({
      weatherSnapshot: snapshot,
      weatherLatitude: snapshot.latitude ?? plain.weatherLatitude ?? null,
      weatherLongitude: snapshot.longitude ?? plain.weatherLongitude ?? null,
      weatherUpdatedAt: snapshot.updatedAt ? new Date(snapshot.updatedAt) : new Date(),
    });
  } catch (error) {
    logger.warn({ err: error, overviewId: overview.id }, 'Failed to refresh weather snapshot for dashboard overview');
  }

  return overview;
}

function buildDateDescriptor() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    formatted: now.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    time: now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

async function loadOverviewPayload(userId, { forceWeatherRefresh = false } = {}) {
  const overview = await ensureOverviewRecord(userId);
  await hydrateWeather(overview, { forceRefresh: forceWeatherRefresh });
  const plain = overview.toPublicObject();
  return {
    ...plain,
  };
}

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload ?? {}));
}

function attachPermissions(payload, userId, { actorId = null, actorRoles = [] } = {}) {
  const normalizedRoles = Array.isArray(actorRoles)
    ? actorRoles.map((role) => `${role}`.toLowerCase())
    : [];
  const canEdit = actorId != null ? actorId === userId || normalizedRoles.includes('admin') : true;
  return {
    ...payload,
    permissions: {
      canEdit,
      canRefreshWeather: canEdit,
    },
  };
}

export async function getOverview(
  userId,
  { bypassCache = false, actorId = null, actorRoles = [] } = {},
) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKeyFor(normalizedUserId);

  if (bypassCache) {
    appCache.delete(cacheKey);
  }

  const payload = await appCache.remember(cacheKey, CACHE_TTL_SECONDS, () =>
    loadOverviewPayload(normalizedUserId, { forceWeatherRefresh: bypassCache }),
  );

  const clone = clonePayload(payload);
  clone.date = buildDateDescriptor();
  return attachPermissions(clone, normalizedUserId, { actorId, actorRoles });
}

export async function updateOverview(
  userId,
  updates,
  { actorId = null, actorRoles = [] } = {},
) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedRoles = Array.isArray(actorRoles)
    ? actorRoles.map((role) => `${role}`.toLowerCase())
    : [];
  if (actorId != null && actorId !== normalizedUserId && !normalizedRoles.includes('admin')) {
    throw new AuthorizationError('You do not have permission to modify this overview.');
  }

  const overview = await ensureOverviewRecord(normalizedUserId);

  const payload = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'greetingName')) {
    payload.greetingName = sanitizeString(updates.greetingName);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'headline')) {
    payload.headline = sanitizeString(updates.headline);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'overview')) {
    payload.overview = sanitizeString(updates.overview);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'followersCount')) {
    payload.followersCount = sanitizeInteger(updates.followersCount, { minimum: 0, maximum: 100_000_000 });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'followersGoal')) {
    payload.followersGoal = sanitizeInteger(updates.followersGoal, {
      minimum: 0,
      maximum: 100_000_000,
    });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'trustScore')) {
    payload.trustScore = sanitizeDecimal(updates.trustScore, { minimum: 0, maximum: 100 });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'trustScoreLabel')) {
    payload.trustScoreLabel = sanitizeString(updates.trustScoreLabel);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'rating')) {
    payload.rating = sanitizeDecimal(updates.rating, { minimum: 0, maximum: 5 });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'ratingCount')) {
    payload.ratingCount = sanitizeInteger(updates.ratingCount, { minimum: 0, maximum: 10_000_000 });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'avatarUrl')) {
    payload.avatarUrl = sanitizeUrl(updates.avatarUrl);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'bannerImageUrl')) {
    payload.bannerImageUrl = sanitizeUrl(updates.bannerImageUrl);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'weatherUnits')) {
    const units = sanitizeString(updates.weatherUnits);
    if (units && !['metric', 'imperial'].includes(units)) {
      throw new ValidationError('weatherUnits must be either metric or imperial.');
    }
    if (units) {
      payload.weatherUnits = units;
    }
  }

  let weatherShouldRefresh = false;
  if (Object.prototype.hasOwnProperty.call(updates, 'weatherLocation')) {
    const location = sanitizeString(updates.weatherLocation);
    payload.weatherLocation = location;
    if (!location) {
      payload.weatherLatitude = null;
      payload.weatherLongitude = null;
      payload.weatherSnapshot = null;
      payload.weatherUpdatedAt = null;
    } else {
      weatherShouldRefresh = true;
    }
  }

  const hasUpdates = Object.keys(payload).length > 0;
  if (hasUpdates) {
    await overview.update(payload);
  }

  if (weatherShouldRefresh || payload.weatherUnits) {
    await hydrateWeather(overview, { forceRefresh: true });
  }

  await overview.reload();

  const cacheKey = buildCacheKeyFor(normalizedUserId);
  appCache.delete(cacheKey);
  appCache.delete(buildCacheKey('dashboard:user', { userId: normalizedUserId }));

  const refreshed = await loadOverviewPayload(normalizedUserId, { forceWeatherRefresh: false });
  const clone = clonePayload(refreshed);
  clone.date = buildDateDescriptor();
  const response = attachPermissions(clone, normalizedUserId, { actorId, actorRoles });

  appCache.set(cacheKey, refreshed, CACHE_TTL_SECONDS);

  return response;
}

export async function refreshWeather(
  userId,
  { actorId = null, actorRoles = [] } = {},
) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedRoles = Array.isArray(actorRoles)
    ? actorRoles.map((role) => `${role}`.toLowerCase())
    : [];
  if (actorId != null && actorId !== normalizedUserId && !normalizedRoles.includes('admin')) {
    throw new AuthorizationError('You do not have permission to refresh the weather for this overview.');
  }

  const overview = await ensureOverviewRecord(normalizedUserId);
  await hydrateWeather(overview, { forceRefresh: true });
  await overview.reload();

  const cacheKey = buildCacheKeyFor(normalizedUserId);
  appCache.delete(cacheKey);

  const refreshed = await loadOverviewPayload(normalizedUserId, { forceWeatherRefresh: false });
  const clone = clonePayload(refreshed);
  clone.date = buildDateDescriptor();

  return attachPermissions(clone, normalizedUserId, { actorId, actorRoles });
}

export default {
  getOverview,
  updateOverview,
  refreshWeather,
};
