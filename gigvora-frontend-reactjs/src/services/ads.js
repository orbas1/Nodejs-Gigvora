import { apiClient } from './apiClient.js';

function normaliseSurface(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'object' && value.surface) {
    return normaliseSurface(value.surface);
  }
  return null;
}

function serialiseSurfaces(surfaces) {
  if (!Array.isArray(surfaces)) {
    return undefined;
  }

  const normalised = surfaces.map(normaliseSurface).filter(Boolean);
  if (!normalised.length) {
    return undefined;
  }

  return Array.from(new Set(normalised)).join(',');
}

function serialiseContext(context) {
  if (!context || typeof context !== 'object') {
    return undefined;
  }

  try {
    return JSON.stringify(context);
  } catch (error) {
    console.warn('Unable to serialise ads context payload.', error);
    return undefined;
  }
}

function buildAdminHeaders(additionalHeaders = {}) {
  return {
    'x-user-type': 'admin',
    ...additionalHeaders,
  };
}

export async function getAdsDashboard({ surfaces, context, bypassCache = false, signal } = {}) {
  const params = {
    surfaces: serialiseSurfaces(surfaces),
    bypassCache: bypassCache ? 'true' : undefined,
    context: serialiseContext(context),
  };

  return apiClient.get('/ads/dashboard', {
    params,
    signal,
    headers: buildAdminHeaders(),
  });
}

export async function listAdsPlacements({ surfaces, status, signal } = {}) {
  const params = {
    surfaces: serialiseSurfaces(surfaces),
    status,
  };

  return apiClient.get('/ads/placements', {
    params,
    signal,
    headers: buildAdminHeaders(),
  });
}

export async function fetchAdPlacements({ surface, surfaces, status, signal } = {}) {
  const resolvedSurfaces = Array.isArray(surfaces)
    ? surfaces
    : surface
    ? [surface]
    : undefined;

  const response = await listAdsPlacements({ surfaces: resolvedSurfaces, status, signal });
  if (Array.isArray(response?.placements)) {
    return response.placements;
  }
  if (Array.isArray(response?.surface?.placements)) {
    return response.surface.placements;
  }
  return Array.isArray(response) ? response : [];
}

export async function fetchAdDashboard(params = {}) {
  return apiClient.get('/ads/dashboard', {
    params,
    headers: buildAdminHeaders(),
  });
}

const adsService = {
  fetchAdPlacements,
  fetchAdDashboard,
  getAdsDashboard,
  listAdsPlacements,
  listAgencyAdCampaigns,
  createAgencyAdCampaign,
  updateAgencyAdCampaign,
  getAgencyAdCampaign,
  createAgencyAdCreative,
  updateAgencyAdCreative,
  createAgencyAdPlacement,
  updateAgencyAdPlacement,
  getAgencyAdReferenceData,
};

export default adsService;

export function listAgencyAdCampaigns({ workspaceId, status, search, page, pageSize, signal } = {}) {
  const params = {
    workspaceId,
    status,
    search,
    page,
    pageSize,
  };
  return apiClient.get('/agency/ads/campaigns', { params, signal });
}

export function createAgencyAdCampaign(payload, { signal } = {}) {
  return apiClient.post('/agency/ads/campaigns', payload, { signal });
}

export function updateAgencyAdCampaign(campaignId, payload, { signal } = {}) {
  return apiClient.put(`/agency/ads/campaigns/${campaignId}`, payload, { signal });
}

export function getAgencyAdCampaign(campaignId, { workspaceId, signal } = {}) {
  const params = {
    workspaceId,
  };
  return apiClient.get(`/agency/ads/campaigns/${campaignId}`, { params, signal });
}

export function createAgencyAdCreative(campaignId, payload, { signal } = {}) {
  return apiClient.post(`/agency/ads/campaigns/${campaignId}/creatives`, payload, { signal });
}

export function updateAgencyAdCreative(creativeId, payload, { signal } = {}) {
  return apiClient.put(`/agency/ads/creatives/${creativeId}`, payload, { signal });
}

export function createAgencyAdPlacement(campaignId, payload, { signal } = {}) {
  return apiClient.post(`/agency/ads/campaigns/${campaignId}/placements`, payload, { signal });
}

export function updateAgencyAdPlacement(placementId, payload, { signal } = {}) {
  return apiClient.put(`/agency/ads/placements/${placementId}`, payload, { signal });
}

export function getAgencyAdReferenceData({ signal } = {}) {
  return apiClient.get('/agency/ads/reference-data', { signal });
}
