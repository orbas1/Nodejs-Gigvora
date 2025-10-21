import { apiClient } from './apiClient.js';

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

function withFreshParam(fresh) {
  return fresh ? { fresh: 'true' } : {};
}

export async function fetchProfileHub(userId, options = {}) {
  const { signal, fresh = false, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const params = { ...withFreshParam(fresh), ...(safeOptions.params ?? {}) };
  const requestOptions = { ...safeOptions, params };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildUserPath(userId, 'profile-hub'), requestOptions);
}

export async function updateProfileDetails(userId, payload, options) {
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.put(
    buildUserPath(userId, 'profile'),
    safePayload,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function uploadProfileAvatar(userId, { file, avatarUrl, metadata, ...rest } = {}) {
  if (!file && !avatarUrl) {
    throw new Error('Provide a file or avatarUrl to update the profile picture.');
  }

  const safeOptions = ensureOptions(rest);
  const formData = new FormData();

  if (file) {
    formData.append('avatar', file);
  }
  if (avatarUrl) {
    formData.append('avatarUrl', `${avatarUrl}`.trim());
  }
  if (metadata !== undefined) {
    if (typeof metadata !== 'object' || metadata === null) {
      throw new Error('metadata must be an object when provided.');
    }
    formData.append('metadata', JSON.stringify(metadata));
  }

  return apiClient.post(
    buildUserPath(userId, 'profile', 'avatar'),
    formData,
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function listFollowers(userId, options = {}) {
  const { signal, fresh = false, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const params = { ...withFreshParam(fresh), ...(safeOptions.params ?? {}) };
  const requestOptions = { ...safeOptions, params };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildUserPath(userId, 'profile', 'followers'), requestOptions);
}

export async function saveFollower(userId, payload, options) {
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  const followerId = safePayload.followerId ? ensureIdentifier('followerId', safePayload.followerId) : null;
  const method = followerId ? 'patch' : 'post';
  const path = followerId
    ? buildUserPath(userId, 'profile', 'followers', followerId)
    : buildUserPath(userId, 'profile', 'followers');
  const client = method === 'patch' ? apiClient.patch : apiClient.post;
  const payloadWithoutId = followerId ? { ...safePayload, followerId: followerId } : safePayload;
  return client(path, payloadWithoutId, Object.keys(safeOptions).length ? safeOptions : undefined);
}

export async function deleteFollower(userId, followerId, options) {
  const safeOptions = ensureOptions(options);
  return apiClient.delete(
    buildUserPath(userId, 'profile', 'followers', ensureIdentifier('followerId', followerId)),
    Object.keys(safeOptions).length ? safeOptions : undefined,
  );
}

export async function listConnections(userId, options = {}) {
  const { signal, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = { ...safeOptions };
  if (signal) {
    requestOptions.signal = signal;
  }
  return apiClient.get(buildUserPath(userId, 'connections'), requestOptions);
}

export async function updateConnection(userId, connectionId, payload, options) {
  const safePayload = ensurePayload(payload);
  const safeOptions = ensureOptions(options);
  return apiClient.patch(
    buildUserPath(userId, 'connections', ensureIdentifier('connectionId', connectionId)),
    safePayload,
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
