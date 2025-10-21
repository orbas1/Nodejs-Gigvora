import apiClient from './apiClient.js';

const PROFILE_CACHE_TTL = 1000 * 60 * 5; // five minutes

function ensureIdentifier(name, value) {
  if (value === undefined || value === null) {
    throw new Error(`${name} is required`);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function ensurePayload(payload) {
  if (payload === undefined || payload === null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function buildUserPath(userId, ...segments) {
  const safeUserId = encodeURIComponent(ensureIdentifier('userId', userId));
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  const suffix = safeSegments.length ? `/${safeSegments.join('/')}` : '';
  return `/users/${safeUserId}${suffix}`;
}

function cacheKey(userId) {
  return `profiles:overview:${ensureIdentifier('userId', userId)}`;
}

export async function fetchProfile(userId, options = {}) {
  const { force = false, ...restOptions } = options ?? {};
  const safeOptions = ensureOptions(restOptions);
  const { signal, ...other } = safeOptions;
  const key = cacheKey(userId);

  if (!force) {
    const cached = apiClient.readCache(key);
    if (cached?.data) {
      return cached.data;
    }
  }

  const requestOptions = { ...other };
  if (signal) {
    requestOptions.signal = signal;
  }

  const profile = await apiClient.get(
    buildUserPath(userId),
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
  apiClient.writeCache(key, profile, PROFILE_CACHE_TTL);
  return profile;
}

export async function updateProfile(userId, payload, options) {
  const key = cacheKey(userId);
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const updatedProfile = await apiClient.patch(
    buildUserPath(userId, 'profile'),
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
  apiClient.writeCache(key, updatedProfile, PROFILE_CACHE_TTL);
  return updatedProfile;
}

export async function updateProfileAvailability(userId, payload, options) {
  return updateProfile(userId, payload, options);
}

export default {
  fetchProfile,
  updateProfile,
  updateProfileAvailability,
};
