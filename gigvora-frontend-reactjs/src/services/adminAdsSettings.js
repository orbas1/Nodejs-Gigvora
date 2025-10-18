import { apiClient } from './apiClient.js';

export async function fetchAdsSettingsSnapshot(options = {}) {
  return apiClient.get('/admin/ads/settings', options);
}

export async function saveAdSurface(surface, payload = {}, options = {}) {
  if (!surface) {
    throw new Error('surface is required');
  }
  return apiClient.put(`/admin/ads/settings/surfaces/${surface}`, payload, options);
}

export async function createAdCampaign(payload = {}, options = {}) {
  return apiClient.post('/admin/ads/settings/campaigns', payload, options);
}

export async function updateAdCampaign(campaignId, payload = {}, options = {}) {
  if (!campaignId) {
    throw new Error('campaignId is required');
  }
  return apiClient.put(`/admin/ads/settings/campaigns/${campaignId}`, payload, options);
}

export async function deleteAdCampaign(campaignId, options = {}) {
  if (!campaignId) {
    throw new Error('campaignId is required');
  }
  return apiClient.delete(`/admin/ads/settings/campaigns/${campaignId}`, options);
}

export async function createAdCreative(payload = {}, options = {}) {
  return apiClient.post('/admin/ads/settings/creatives', payload, options);
}

export async function updateAdCreative(creativeId, payload = {}, options = {}) {
  if (!creativeId) {
    throw new Error('creativeId is required');
  }
  return apiClient.put(`/admin/ads/settings/creatives/${creativeId}`, payload, options);
}

export async function deleteAdCreative(creativeId, options = {}) {
  if (!creativeId) {
    throw new Error('creativeId is required');
  }
  return apiClient.delete(`/admin/ads/settings/creatives/${creativeId}`, options);
}

export async function createAdPlacement(payload = {}, options = {}) {
  return apiClient.post('/admin/ads/settings/placements', payload, options);
}

export async function updateAdPlacement(placementId, payload = {}, options = {}) {
  if (!placementId) {
    throw new Error('placementId is required');
  }
  return apiClient.put(`/admin/ads/settings/placements/${placementId}`, payload, options);
}

export async function deleteAdPlacement(placementId, options = {}) {
  if (!placementId) {
    throw new Error('placementId is required');
  }
  return apiClient.delete(`/admin/ads/settings/placements/${placementId}`, options);
}

const adminAdsSettingsService = {
  fetchAdsSettingsSnapshot,
  saveAdSurface,
  createAdCampaign,
  updateAdCampaign,
  deleteAdCampaign,
  createAdCreative,
  updateAdCreative,
  deleteAdCreative,
  createAdPlacement,
  updateAdPlacement,
  deleteAdPlacement,
};

export default adminAdsSettingsService;
