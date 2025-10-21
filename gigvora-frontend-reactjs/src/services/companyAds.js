import { apiClient } from './apiClient.js';

function ensureId(value, message) {
  if (value === undefined || value === null || `${value}`.trim().length === 0) {
    throw new Error(message);
  }
  return typeof value === 'string' ? value.trim() : value;
}

function serialiseSurfaces(surfaces) {
  if (!surfaces) {
    return undefined;
  }
  const values = Array.isArray(surfaces)
    ? surfaces
    : `${surfaces}`
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
  if (!values.length) {
    return undefined;
  }
  return values.join(',');
}

function serialiseContext(context) {
  if (!context) {
    return undefined;
  }
  if (typeof context === 'string') {
    return context;
  }
  try {
    return JSON.stringify(context);
  } catch (error) {
    console.warn('Unable to serialise ads context payload.', error);
    return undefined;
  }
}

export function fetchCompanyAdsWorkspace({ surfaces, context, bypassCache = false, signal } = {}) {
  const params = {
    surfaces: serialiseSurfaces(surfaces),
    context: serialiseContext(context),
    bypassCache: bypassCache ? 'true' : undefined,
  };
  return apiClient.get('/company/ads/workspace', { params, signal });
}

export function createCompanyAdCampaign(payload = {}, { signal } = {}) {
  return apiClient.post('/company/ads/campaigns', payload, { signal });
}

export function updateCompanyAdCampaign(campaignId, payload = {}, { signal } = {}) {
  const resolvedCampaignId = ensureId(campaignId, 'campaignId is required to update a campaign.');
  return apiClient.put(`/company/ads/campaigns/${resolvedCampaignId}`, payload, { signal });
}

export function deleteCompanyAdCampaign(campaignId, { signal } = {}) {
  const resolvedCampaignId = ensureId(campaignId, 'campaignId is required to delete a campaign.');
  return apiClient.delete(`/company/ads/campaigns/${resolvedCampaignId}`, { signal });
}

export function createCompanyAdCreative(campaignId, payload = {}, { signal } = {}) {
  const resolvedCampaignId = ensureId(campaignId, 'campaignId is required to create a creative.');
  return apiClient.post(`/company/ads/campaigns/${resolvedCampaignId}/creatives`, payload, { signal });
}

export function updateCompanyAdCreative(creativeId, payload = {}, { signal } = {}) {
  const resolvedCreativeId = ensureId(creativeId, 'creativeId is required to update a creative.');
  return apiClient.put(`/company/ads/creatives/${resolvedCreativeId}`, payload, { signal });
}

export function deleteCompanyAdCreative(creativeId, { signal } = {}) {
  const resolvedCreativeId = ensureId(creativeId, 'creativeId is required to delete a creative.');
  return apiClient.delete(`/company/ads/creatives/${resolvedCreativeId}`, { signal });
}

export function createCompanyAdPlacement(creativeId, payload = {}, { signal } = {}) {
  const resolvedCreativeId = ensureId(creativeId, 'creativeId is required to create a placement.');
  return apiClient.post(`/company/ads/creatives/${resolvedCreativeId}/placements`, payload, { signal });
}

export function updateCompanyAdPlacement(placementId, payload = {}, { signal } = {}) {
  const resolvedPlacementId = ensureId(placementId, 'placementId is required to update a placement.');
  return apiClient.put(`/company/ads/placements/${resolvedPlacementId}`, payload, { signal });
}

export function deleteCompanyAdPlacement(placementId, { signal } = {}) {
  const resolvedPlacementId = ensureId(placementId, 'placementId is required to delete a placement.');
  return apiClient.delete(`/company/ads/placements/${resolvedPlacementId}`, { signal });
}

export function toggleCompanyAdPlacement(placementId, { signal } = {}) {
  const resolvedPlacementId = ensureId(placementId, 'placementId is required to toggle a placement.');
  return apiClient.post(`/company/ads/placements/${resolvedPlacementId}/toggle`, {}, { signal });
}

export default {
  fetchCompanyAdsWorkspace,
  createCompanyAdCampaign,
  updateCompanyAdCampaign,
  deleteCompanyAdCampaign,
  createCompanyAdCreative,
  updateCompanyAdCreative,
  deleteCompanyAdCreative,
  createCompanyAdPlacement,
  updateCompanyAdPlacement,
  deleteCompanyAdPlacement,
  toggleCompanyAdPlacement,
};
