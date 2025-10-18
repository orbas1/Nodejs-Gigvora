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

export async function listIdentityVerifications(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications', { params, signal });
}

export async function fetchIdentityVerificationSummary(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications/summary', { params, signal });
}

export async function createIdentityVerification(payload, { signal } = {}) {
  return apiClient.post('/agency/id-verifications', payload, { signal });
}

export async function updateIdentityVerification(verificationId, payload, { signal } = {}) {
  return apiClient.patch(`/agency/id-verifications/${verificationId}`, payload, { signal });
}

export async function createIdentityVerificationEvent(verificationId, payload, { signal } = {}) {
  return apiClient.post(`/agency/id-verifications/${verificationId}/events`, payload, { signal });
}

export async function fetchIdentityVerificationSettings(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications/settings', { params, signal });
}

export async function updateIdentityVerificationSettings(payload, { signal } = {}) {
  return apiClient.patch('/agency/id-verifications/settings', payload, { signal });
}

const identityVerificationService = {
  fetchIdentityVerification,
  saveIdentityVerification,
  submitIdentityVerification,
  reviewIdentityVerification,
  uploadIdentityDocument,
  downloadIdentityDocument,
  listIdentityVerifications,
  fetchIdentityVerificationSummary,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
};

export default identityVerificationService;
