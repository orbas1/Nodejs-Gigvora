import { apiClient } from './apiClient.js';

function normaliseRoles(roles) {
  if (!roles) {
    return [];
  }
  const raw = Array.isArray(roles) ? roles : `${roles}`.split(',');
  return raw
    .map((role) => (role == null ? null : `${role}`.trim().toLowerCase()))
    .filter(Boolean);
}

export async function fetchIdentityVerification({ userId, profileId, includeHistory = true, actorRoles = [] } = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch identity verification.');
  }
  const params = {
    userId,
    includeHistory: includeHistory ? 'true' : 'false',
  };
  if (profileId) {
    params.profileId = profileId;
  }
  const normalisedRoles = normaliseRoles(actorRoles);
  if (normalisedRoles.length) {
    params.actorRoles = normalisedRoles.join(',');
  }
  return apiClient.get('/compliance/identity', { params });
}

export async function saveIdentityVerification(payload) {
  if (!payload?.userId) {
    throw new Error('userId is required to save identity verification.');
  }
  return apiClient.put('/compliance/identity', payload);
}

export async function submitIdentityVerification(payload) {
  if (!payload?.userId) {
    throw new Error('userId is required to submit identity verification.');
  }
  return apiClient.post('/compliance/identity/submit', payload);
}

export async function reviewIdentityVerification(payload) {
  if (!payload?.userId) {
    throw new Error('userId is required to review identity verification.');
  }
  if (!payload?.reviewerId) {
    throw new Error('reviewerId is required to review identity verification.');
  }
  return apiClient.post('/compliance/identity/review', payload);
}

export async function uploadIdentityDocument(payload) {
  if (!payload?.data) {
    throw new Error('data is required to upload an identity document.');
  }
  return apiClient.post('/compliance/identity/documents', payload);
}

export async function downloadIdentityDocument({ key }) {
  if (!key) {
    throw new Error('key is required to download an identity document.');
  }
  return apiClient.get('/compliance/identity/documents', { params: { key } });
}

export default {
  fetchIdentityVerification,
  saveIdentityVerification,
  submitIdentityVerification,
  reviewIdentityVerification,
  uploadIdentityDocument,
  downloadIdentityDocument,
};
