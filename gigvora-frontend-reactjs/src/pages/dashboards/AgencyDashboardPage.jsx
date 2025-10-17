import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAgencyDashboard } from '../../services/agency.js';
import AgencyOverviewPanel from './agency/AgencyOverviewPanel.jsx';
import AgencyAdsManagementPanel from './agency/AgencyAdsManagementPanel.jsx';

const menuSections = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'overview', name: 'Overview', sectionId: 'agency-overview' },
      { id: 'ads', name: 'Ads', sectionId: 'agency-ads' },
    ],
  },
];

const sections = [
  { id: 'agency-overview', label: 'Overview' },
  { id: 'agency-ads', label: 'Ads' },
];

const availableDashboards = ['agency', 'company', 'user', 'freelancer'];

export default function AgencyDashboardPage() {
  const { session } = useSession();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await fetchAgencyDashboard();
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load agency dashboard', error);
      setDashboardError(error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const workspace = useMemo(() => {
    return dashboardData?.workspace ?? dashboardData?.meta?.workspace ?? null;
  }, [dashboardData]);

  const displayName = useMemo(() => {
    return session?.name || session?.firstName || 'Agency team';
  }, [session]);

  const handleMenuItemSelect = useCallback(
    (itemId) => {
      setActiveMenuItem(itemId);
      const targetId = itemId === 'overview' ? 'agency-overview' : itemId === 'ads' ? 'agency-ads' : itemId;
      if (typeof window !== 'undefined') {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Agency Control Tower"
      subtitle={`Welcome back, ${displayName}`}
      description="Monitor operations, steer growth initiatives, and manage campaigns without leaving the workspace."
      menuSections={menuSections}
      sections={sections}
      availableDashboards={availableDashboards}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={handleMenuItemSelect}
      adSurface="agency_dashboard"
    >
      <div className="space-y-10">
        <AgencyOverviewPanel
          data={dashboardData}
          loading={dashboardLoading}
          error={dashboardError}
          onRefresh={loadDashboard}
        />
        <AgencyAdsManagementPanel workspace={workspace} />
      </div>
    </DashboardLayout>
  );
}
