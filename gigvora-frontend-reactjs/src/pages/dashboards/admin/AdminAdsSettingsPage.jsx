import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import AdsSurfaceConfigurator from '../../../components/admin/ads/AdsSurfaceConfigurator.jsx';
import AdsCampaignManager from '../../../components/admin/ads/AdsCampaignManager.jsx';
import AdsCreativeManager from '../../../components/admin/ads/AdsCreativeManager.jsx';
import AdsPlacementManager from '../../../components/admin/ads/AdsPlacementManager.jsx';
import {
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
} from '../../../services/adminAdsSettings.js';
import useSession from '../../../hooks/useSession.js';

const MENU_SECTIONS = [
  {
    label: 'Ads settings',
    items: [
      { name: 'Surfaces', sectionId: 'ads-surfaces', description: 'Configure surface availability and layout.' },
      { name: 'Campaigns', sectionId: 'ads-campaigns', description: 'Manage campaign objectives and budgets.' },
      { name: 'Creatives', sectionId: 'ads-creatives', description: 'Upload copy, assets, and CTAs.' },
      { name: 'Placements', sectionId: 'ads-placements', description: 'Schedule creatives across surfaces.' },
    ],
  },
];

export default function AdminAdsSettingsPage() {
  const { profile } = useSession();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdsSettingsSnapshot();
      setSnapshot(response);
    } catch (err) {
      setError(err?.message ?? 'Unable to load ads settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot, refreshIndex]);

  const enums = snapshot?.enums ?? {};

  const handleSurfaceSave = useCallback(async (surface, payload) => {
    await saveAdSurface(surface, payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCampaignCreate = useCallback(async (payload) => {
    await createAdCampaign(payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCampaignUpdate = useCallback(async (campaignId, payload) => {
    await updateAdCampaign(campaignId, payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCampaignDelete = useCallback(async (campaignId) => {
    await deleteAdCampaign(campaignId);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCreativeCreate = useCallback(async (payload) => {
    await createAdCreative(payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCreativeUpdate = useCallback(async (creativeId, payload) => {
    await updateAdCreative(creativeId, payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCreativeDelete = useCallback(async (creativeId) => {
    await deleteAdCreative(creativeId);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handlePlacementCreate = useCallback(async (payload) => {
    await createAdPlacement(payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handlePlacementUpdate = useCallback(async (placementId, payload) => {
    await updateAdPlacement(placementId, payload);
    setRefreshIndex((index) => index + 1);
  }, []);

  const handlePlacementDelete = useCallback(async (placementId) => {
    await deleteAdPlacement(placementId);
    setRefreshIndex((index) => index + 1);
  }, []);

  const surfaces = useMemo(() => snapshot?.surfaces ?? [], [snapshot]);
  const campaigns = useMemo(() => snapshot?.campaigns ?? [], [snapshot]);
  const creatives = useMemo(() => snapshot?.creatives ?? [], [snapshot]);
  const placements = useMemo(() => snapshot?.placements ?? [], [snapshot]);
  const coupons = useMemo(() => snapshot?.coupons ?? [], [snapshot]);

  let content = null;

  if (loading) {
    content = (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        <p className="font-semibold">{error}</p>
        <p className="mt-2">Refresh the page or try again later.</p>
      </div>
    );
  } else if (snapshot) {
    content = (
      <div className="space-y-10">
        <section id="ads-surfaces">
          <AdsSurfaceConfigurator
            surfaces={surfaces}
            layoutModes={enums.layoutModes}
            positions={enums.positions}
            onSave={handleSurfaceSave}
          />
        </section>

        <section id="ads-campaigns">
          <AdsCampaignManager
            campaigns={campaigns}
            objectives={enums.objectives}
            statuses={enums.statuses}
            onCreate={handleCampaignCreate}
            onUpdate={handleCampaignUpdate}
            onDelete={handleCampaignDelete}
          />
        </section>

        <section id="ads-creatives">
          <AdsCreativeManager
            creatives={creatives}
            campaigns={campaigns}
            adTypes={enums.adTypes}
            statuses={enums.statuses}
            onCreate={handleCreativeCreate}
            onUpdate={handleCreativeUpdate}
            onDelete={handleCreativeDelete}
          />
        </section>

        <section id="ads-placements">
          <AdsPlacementManager
            placements={placements}
            surfaces={surfaces.map((surface) => ({ surface: surface.surface, name: surface.name }))}
            creatives={creatives}
            statuses={enums.statuses}
            positions={enums.positions}
            pacingModes={enums.pacingModes}
            opportunityTypes={enums.opportunityTypes}
            coupons={coupons}
            onCreate={handlePlacementCreate}
            onUpdate={handlePlacementUpdate}
            onDelete={handlePlacementDelete}
          />
        </section>
      </div>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Gigvora Ads Settings"
      subtitle="Control campaigns, creatives, and placements"
      description="Configure every surface, creative, and placement powering Gigvora Ads."
      menuSections={MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      adSurface="admin_dashboard"
    >
      {content}
    </DashboardLayout>
  );
}
