import apiClient from './apiClient.js';

const PROFILE_CACHE_TTL = 1000 * 60 * 5; // five minutes
const CACHE_NAMESPACE = 'profiles:overview';

function ensureString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return `${value}`.trim();
}

function ensureUserId(userId) {
  const normalised = ensureString(userId);
  if (!normalised) {
    throw new Error('A valid userId is required for profile operations.');
  }
  return normalised;
}

function ensurePayload(payload, { allowNull = false } = {}) {
  if (payload == null) {
    if (allowNull) {
      return null;
    }
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Profile payloads must be objects.');
  }
  return payload;
}

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  return options;
}

function buildCacheKey(userId) {
  return `${CACHE_NAMESPACE}:${userId}`;
}

function buildProfilePath(userId, ...segments) {
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureString(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));

  const safeUserId = encodeURIComponent(ensureUserId(userId));
  const suffix = safeSegments.length ? `/${safeSegments.join('/')}` : '';
  return `/users/${safeUserId}${suffix}`;
}

export async function fetchProfile(userId, options = {}) {
  const safeUserId = ensureUserId(userId);
  const { force = false, signal, headers } = ensureOptions(options);
  const key = buildCacheKey(safeUserId);

  if (!force) {
    const cached = apiClient.readCache(key);
    if (cached?.data) {
      return cached.data;
    }
  }

  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (headers) {
    requestOptions.headers = headers;
  }

  const profile = await apiClient.get(buildProfilePath(safeUserId), Object.keys(requestOptions).length ? requestOptions : undefined);
  apiClient.writeCache(key, profile, PROFILE_CACHE_TTL);
  return profile;
}

export async function updateProfile(userId, payload, options = {}) {
  const safeUserId = ensureUserId(userId);
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const key = buildCacheKey(safeUserId);

  const updatedProfile = await apiClient.patch(
    buildProfilePath(safeUserId, 'profile'),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  apiClient.writeCache(key, updatedProfile, PROFILE_CACHE_TTL);
  return updatedProfile;
}

export async function updateProfileAvailability(userId, payload, options = {}) {
  const safeUserId = ensureUserId(userId);
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const updatedProfile = await apiClient.patch(
    buildProfilePath(safeUserId, 'profile', 'availability'),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  apiClient.writeCache(buildCacheKey(safeUserId), updatedProfile, PROFILE_CACHE_TTL);
  return updatedProfile;
}

export function clearProfileCache(userId) {
  const safeUserId = ensureUserId(userId);
  apiClient.removeCache?.(buildCacheKey(safeUserId));
}

export default {
  fetchProfile,
  updateProfile,
  updateProfileAvailability,
  clearProfileCache,
};
