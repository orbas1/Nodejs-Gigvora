import { apiClient } from './apiClient.js';

function normaliseRoles(roles) {
  if (!roles) {
    return [];
  }

  const raw = Array.isArray(roles) ? roles : `${roles}`.split(',');
  return Array.from(
    new Set(
      raw
        .map((role) => (role == null ? null : `${role}`.trim().toLowerCase()))
        .filter(Boolean),
    ),
  );
}

function sanitiseQuery(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function applyActorContext(params = {}, { actorId, actorRoles } = {}) {
  const query = { ...params };
  if (actorId) {
    query.actorId = actorId;
  }
  const roles = normaliseRoles(actorRoles);
  if (roles.length) {
    query.actorRoles = roles.join(',');
  }
  return query;
}

export async function fetchIdentityVerification({
  userId,
  profileId,
  includeHistory = true,
  actorRoles = [],
  actorId,
  signal,
} = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch identity verification.');
  }

  const params = applyActorContext(
    sanitiseQuery({ userId, profileId, includeHistory: includeHistory ? 'true' : 'false' }),
    { actorId, actorRoles },
  );

  return apiClient.get('/compliance/identity', { params, signal });
}

export async function saveIdentityVerification(payload = {}, { signal } = {}) {
  if (!payload.userId) {
    throw new Error('userId is required to save identity verification.');
  }
  return apiClient.put('/compliance/identity', payload, { signal });
}

export async function submitIdentityVerification(payload = {}, { signal } = {}) {
  if (!payload.userId) {
    throw new Error('userId is required to submit identity verification.');
  }
  return apiClient.post('/compliance/identity/submit', payload, { signal });
}

export async function reviewIdentityVerification(payload = {}, { signal } = {}) {
  if (!payload.userId) {
    throw new Error('userId is required to review identity verification.');
  }
  if (!payload.reviewerId) {
    throw new Error('reviewerId is required to review identity verification.');
  }
  return apiClient.post('/compliance/identity/review', payload, { signal });
}

export async function uploadIdentityDocument(payload = {}, { signal } = {}) {
  if (!payload.data) {
    throw new Error('data is required to upload an identity document.');
  }
  return apiClient.post('/compliance/identity/documents', payload, { signal });
}

export async function downloadIdentityDocument({ key, signal } = {}) {
  if (!key) {
    throw new Error('key is required to download an identity document.');
  }
  return apiClient.get('/compliance/identity/documents', { params: { key }, signal });
}

export async function listIdentityVerifications(params = {}, { signal, actorRoles, actorId } = {}) {
  return apiClient.get('/agency/id-verifications', {
    params: applyActorContext(sanitiseQuery(params), { actorId, actorRoles }),
    signal,
  });
}

export async function fetchIdentityVerificationSummary(params = {}, { signal, actorRoles, actorId } = {}) {
  return apiClient.get('/agency/id-verifications/summary', {
    params: applyActorContext(sanitiseQuery(params), { actorId, actorRoles }),
    signal,
  });
}

export async function createIdentityVerification(payload = {}, { signal } = {}) {
  if (!payload.userId) {
    throw new Error('userId is required to create an identity verification.');
  }
  return apiClient.post('/agency/id-verifications', payload, { signal });
}

export async function updateIdentityVerification(verificationId, payload = {}, { signal } = {}) {
  if (!verificationId) {
    throw new Error('verificationId is required to update an identity verification.');
  }
  return apiClient.patch(`/agency/id-verifications/${verificationId}`, payload, { signal });
}

export async function createIdentityVerificationEvent(verificationId, payload = {}, { signal } = {}) {
  if (!verificationId) {
    throw new Error('verificationId is required to create an identity verification event.');
  }
  if (!payload.type) {
    throw new Error('type is required to create an identity verification event.');
  }
  return apiClient.post(`/agency/id-verifications/${verificationId}/events`, payload, { signal });
}

export async function fetchIdentityVerificationSettings(params = {}, { signal } = {}) {
  return apiClient.get('/agency/id-verifications/settings', { params: sanitiseQuery(params), signal });
}

export async function updateIdentityVerificationSettings(payload = {}, { signal } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('A payload is required to update identity verification settings.');
  }
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
