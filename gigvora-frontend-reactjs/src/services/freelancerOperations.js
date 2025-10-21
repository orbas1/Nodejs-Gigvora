import apiClient from './apiClient.js';

function buildCacheKey(freelancerId) {
  return `freelancer:operations-hq:${freelancerId}`;
}

export async function fetchOperationsHq(freelancerId, { signal, fresh = false } = {}) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to load operations HQ data.');
  }
  const params = fresh ? { fresh: 'true' } : undefined;
  return apiClient.get(`/freelancers/${freelancerId}/operations/hq`, { signal, params });
}

export async function requestOperationsMembership(freelancerId, membershipId, payload = {}) {
  if (!freelancerId || !membershipId) {
    throw new Error('Freelancer and membership identifiers are required to request access.');
  }
  const data = await apiClient.post(
    `/freelancers/${freelancerId}/operations/memberships/${membershipId}/requests`,
    payload,
  );
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function updateOperationsMembership(freelancerId, membershipId, payload = {}) {
  if (!freelancerId || !membershipId) {
    throw new Error('Freelancer and membership identifiers are required to update membership.');
  }
  const data = await apiClient.put(
    `/freelancers/${freelancerId}/operations/memberships/${membershipId}`,
    payload,
  );
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function acknowledgeOperationsNotice(freelancerId, noticeId) {
  if (!freelancerId || !noticeId) {
    throw new Error('Freelancer and notice identifiers are required to acknowledge notices.');
  }
  const data = await apiClient.post(
    `/freelancers/${freelancerId}/operations/notices/${noticeId}/acknowledge`,
    {},
  );
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export async function syncOperationsHq(freelancerId) {
  if (!freelancerId) {
    throw new Error('Freelancer identifier is required to sync operations HQ.');
  }
  const data = await apiClient.post(`/freelancers/${freelancerId}/operations/hq/sync`, {});
  apiClient.removeCache(buildCacheKey(freelancerId));
  return data;
}

export default {
  fetchOperationsHq,
  requestOperationsMembership,
  updateOperationsMembership,
  acknowledgeOperationsNotice,
  syncOperationsHq,
};
