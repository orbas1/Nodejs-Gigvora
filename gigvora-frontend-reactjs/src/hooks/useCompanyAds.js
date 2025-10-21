import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
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
} from '../services/companyAds.js';

function buildCacheKey(surfaces, context) {
  const surfaceKey = Array.isArray(surfaces) ? surfaces.join('|') : surfaces ?? 'all';
  const contextKey = context ? JSON.stringify(context) : 'default';
  return `company:ads:${surfaceKey}:${contextKey}`;
}

export function useCompanyAds({ surfaces, context, enabled = true } = {}) {
  const cacheKey = useMemo(() => buildCacheKey(surfaces ?? null, context ?? null), [surfaces, context]);

  const fetcher = useCallback(
    ({ signal } = {}) =>
      fetchCompanyAdsWorkspace({
        surfaces,
        context,
        signal,
      }),
    [surfaces, context],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled,
    dependencies: [surfaces, context],
    ttl: 1000 * 30,
  });

  const { refresh } = resource;

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      await refresh({ force: true });
      return result;
    },
    [refresh],
  );

  return {
    ...resource,
    campaigns: resource.data?.campaigns ?? [],
    placements: resource.data?.placements ?? [],
    insights: resource.data?.insights ?? null,
    dashboard: resource.data?.dashboard ?? null,
    metrics: resource.data?.metrics ?? {
      campaignTotals: { total: 0, active: 0, paused: 0, scheduled: 0 },
      placementTotals: { total: 0, active: 0, upcoming: 0 },
      performance: { impressions: 0, clicks: 0, spend: 0, ctr: 0 },
    },
    permissions: resource.data?.permissions ?? {
      canManageCampaigns: true,
      canManageCreatives: true,
      canManagePlacements: true,
    },
    createCampaign: useCallback((payload) => withRefresh(() => createCompanyAdCampaign(payload)), [withRefresh]),
    updateCampaign: useCallback(
      (campaignId, payload) => withRefresh(() => updateCompanyAdCampaign(campaignId, payload)),
      [withRefresh],
    ),
    deleteCampaign: useCallback((campaignId) => withRefresh(() => deleteCompanyAdCampaign(campaignId)), [withRefresh]),
    createCreative: useCallback(
      (campaignId, payload) => withRefresh(() => createCompanyAdCreative(campaignId, payload)),
      [withRefresh],
    ),
    updateCreative: useCallback(
      (creativeId, payload) => withRefresh(() => updateCompanyAdCreative(creativeId, payload)),
      [withRefresh],
    ),
    deleteCreative: useCallback((creativeId) => withRefresh(() => deleteCompanyAdCreative(creativeId)), [withRefresh]),
    createPlacement: useCallback(
      (creativeId, payload) => withRefresh(() => createCompanyAdPlacement(creativeId, payload)),
      [withRefresh],
    ),
    updatePlacement: useCallback(
      (placementId, payload) => withRefresh(() => updateCompanyAdPlacement(placementId, payload)),
      [withRefresh],
    ),
    deletePlacement: useCallback(
      (placementId) => withRefresh(() => deleteCompanyAdPlacement(placementId)),
      [withRefresh],
    ),
    togglePlacement: useCallback(
      (placementId) => withRefresh(() => toggleCompanyAdPlacement(placementId)),
      [withRefresh],
    ),
  };
}

export default useCompanyAds;
