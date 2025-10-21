import { apiClient } from './apiClient.js';

function ensureValue(name, value) {
  const trimmed = value === undefined || value === null ? '' : `${value}`.trim();
  if (!trimmed) {
    throw new Error(`${name} is required.`);
  }
  return trimmed;
}

function ensureUserId(userId) {
  return ensureValue('userId', userId);
}

function ensurePayload(payload, { nullable = false } = {}) {
  if (payload == null) {
    if (nullable) {
      return null;
    }
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function ensureOptions(options = {}) {
  if (options === null || options === undefined) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function buildUserPath(userId, ...segments) {
  const safeUserId = encodeURIComponent(ensureUserId(userId));
  const safeSegments = segments
    .filter((segment) => segment !== undefined && segment !== null)
    .map((segment) => ensureValue('segment', segment))
    .map((segment) => encodeURIComponent(segment));
  const suffix = safeSegments.length ? `/${safeSegments.join('/')}` : '';
  return `/users/${safeUserId}${suffix}`;
}

export async function fetchProfileHub(userId, options = {}) {
  const { signal, fresh = false } = ensureOptions(options);
  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (fresh) {
    requestOptions.params = { fresh: 'true' };
  }
  return apiClient.get(buildUserPath(userId, 'profile-hub'), Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function updateProfileDetails(userId, payload, options = {}) {
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    buildUserPath(userId, 'profile'),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function uploadProfileAvatar(userId, { file, avatarUrl, metadata, signal } = {}) {
  if (!file && !avatarUrl) {
    throw new Error('Provide a file or avatarUrl to update the profile picture.');
  }
  const formData = new FormData();
  if (file) {
    formData.append('avatar', file);
  }
  if (avatarUrl) {
    formData.append('avatarUrl', ensureValue('avatarUrl', avatarUrl));
  }
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  const options = signal ? { signal } : undefined;
  return apiClient.post(buildUserPath(userId, 'profile', 'avatar'), formData, options);
}

export async function listFollowers(userId, options = {}) {
  const { signal, fresh = false } = ensureOptions(options);
  const requestOptions = {};
  if (signal) {
    requestOptions.signal = signal;
  }
  if (fresh) {
    requestOptions.params = { fresh: 'true' };
  }
  return apiClient.get(buildUserPath(userId, 'profile', 'followers'), Object.keys(requestOptions).length ? requestOptions : undefined);
}

export async function saveFollower(userId, payload, options = {}) {
  const body = ensurePayload(payload);
  const followerId = body?.followerId ? ensureValue('followerId', body.followerId) : null;
  const safeOptions = ensureOptions(options);

  if (followerId) {
    return apiClient.patch(
      buildUserPath(userId, 'profile', 'followers', followerId),
      body,
      Object.keys(safeOptions).length ? safeOptions : undefined,
    );
  }

  return apiClient.post(
    buildUserPath(userId, 'profile', 'followers'),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function deleteFollower(userId, followerId, options = {}) {
  const safeOptions = ensureOptions(options);
  return apiClient.delete(
    buildUserPath(userId, 'profile', 'followers', ensureValue('followerId', followerId)),
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function listConnections(userId, options = {}) {
  const { signal } = ensureOptions(options);
  const requestOptions = signal ? { signal } : undefined;
  return apiClient.get(buildUserPath(userId, 'connections'), requestOptions);
}

export async function updateConnection(userId, connectionId, payload, options = {}) {
  const safeConnectionId = ensureValue('connectionId', connectionId);
  const body = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.patch(
    buildUserPath(userId, 'connections', safeConnectionId),
    body,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export default {
  fetchProfileHub,
  updateProfileDetails,
  uploadProfileAvatar,
  listFollowers,
  saveFollower,
  deleteFollower,
  listConnections,
  updateConnection,
};
