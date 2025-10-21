import { apiClient } from './apiClient.js';

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

export function createCompanyAdCampaign(payload, { signal } = {}) {
  return apiClient.post('/company/ads/campaigns', payload ?? {}, { signal });
}

export function updateCompanyAdCampaign(campaignId, payload, { signal } = {}) {
  return apiClient.put(`/company/ads/campaigns/${campaignId}`, payload ?? {}, { signal });
}

export function deleteCompanyAdCampaign(campaignId, { signal } = {}) {
  return apiClient.delete(`/company/ads/campaigns/${campaignId}`, { signal });
}

export function createCompanyAdCreative(campaignId, payload, { signal } = {}) {
  return apiClient.post(`/company/ads/campaigns/${campaignId}/creatives`, payload ?? {}, { signal });
}

export function updateCompanyAdCreative(creativeId, payload, { signal } = {}) {
  return apiClient.put(`/company/ads/creatives/${creativeId}`, payload ?? {}, { signal });
}

export function deleteCompanyAdCreative(creativeId, { signal } = {}) {
  return apiClient.delete(`/company/ads/creatives/${creativeId}`, { signal });
}

export function createCompanyAdPlacement(creativeId, payload, { signal } = {}) {
  return apiClient.post(`/company/ads/creatives/${creativeId}/placements`, payload ?? {}, { signal });
}

export function updateCompanyAdPlacement(placementId, payload, { signal } = {}) {
  return apiClient.put(`/company/ads/placements/${placementId}`, payload ?? {}, { signal });
}

export function deleteCompanyAdPlacement(placementId, { signal } = {}) {
  return apiClient.delete(`/company/ads/placements/${placementId}`, { signal });
}

export function toggleCompanyAdPlacement(placementId, { signal } = {}) {
  return apiClient.post(`/company/ads/placements/${placementId}/toggle`, {}, { signal });
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
