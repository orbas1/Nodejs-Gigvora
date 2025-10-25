import apiClient from './apiClient.js';

const USERS_BASE_PATH = '/users';

function ensureUserId(userId) {
  if (userId === null || userId === undefined) {
    throw new Error('A userId is required to perform user operations.');
  }
  const normalised = `${userId}`.trim();
  if (!normalised) {
    throw new Error('A userId is required to perform user operations.');
  }
  return normalised;
}

function ensurePayload(payload) {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Update payload must be an object.');
  }
  return payload;
}

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  const rest = { ...options };
  delete rest.params;
  return rest;
}

function buildUserPath(userId, ...segments) {
  const safeUserId = encodeURIComponent(ensureUserId(userId));
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => `${segment}`.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));
  if (!safeSegments.length) {
    return `${USERS_BASE_PATH}/${safeUserId}`;
  }
  return `${USERS_BASE_PATH}/${safeUserId}/${safeSegments.join('/')}`;
}

export async function fetchUser(userId, options = {}) {
  const safeOptions = ensureOptions(options);
  const { signal, ...rest } = safeOptions;
  const requestOptions = { ...rest };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildUserPath(userId), Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function updateUserAccount(userId, payload, options) {
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    buildUserPath(userId),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export default {
  fetchUser,
  updateUserAccount,
};
