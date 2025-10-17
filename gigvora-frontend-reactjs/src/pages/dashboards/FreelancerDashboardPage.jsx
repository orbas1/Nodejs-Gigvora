import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';
import {
  AutomationSection,
  DeliveryOperationsSection,
  FinanceComplianceSection,
  GigMarketplaceOperationsSection,
  GigStudioSection,
  GrowthPartnershipSection,
  NetworkSection,
  OperationalQuickAccessSection,
  OperationsHQSection,
  OverviewSection,
  PlanningSection,
  ProfileShowcaseSection,
  ProjectLabSection,
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  TaskManagementSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';
import {
  fetchFreelancerDashboardOverview,
  saveFreelancerDashboardOverview,
} from '../../services/freelancerDashboard.js';

const SECTION_COMPONENTS = {
  overview: OverviewSection,
  ops: OperationsHQSection,
  delivery: DeliveryOperationsSection,
  tasks: TaskManagementSection,
  plan: PlanningSection,
  excellence: ProjectWorkspaceExcellenceSection,
  lab: ProjectLabSection,
  studio: GigStudioSection,
  market: GigMarketplaceOperationsSection,
  signals: AutomationSection,
  ledger: FinanceComplianceSection,
  settings: WorkspaceSettingsSection,
  showcase: ProfileShowcaseSection,
  reviews: ReferencesSection,
  network: NetworkSection,
  growth: GrowthPartnershipSection,
  quick: OperationalQuickAccessSection,
  help: SupportSection,
};

function buildProfileMetrics(overview) {
  if (!overview?.profile) {
    return DEFAULT_PROFILE.metrics;
  }

  const followerCount = overview.profile.followerCount ?? 0;
  const trustScore = overview.profile.trustScore;
  const rating = overview.profile.rating;
  const upcoming = overview.upcomingSchedule?.length ?? 0;

  return [
    {
      label: 'Followers',
      value: followerCount.toLocaleString(),
      hint: overview.profile.followerGoal ? `${overview.profile.followerGoal.toLocaleString()} goal` : null,
    },
    {
      label: 'Trust score',
      value: trustScore != null ? `${Math.round(trustScore)} / 100` : '—',
      hint:
        overview.profile.trustScoreChange != null
          ? `${overview.profile.trustScoreChange > 0 ? '+' : ''}${overview.profile.trustScoreChange.toFixed(1)} vs last month`
          : null,
    },
    {
      label: 'Rating',
      value: rating != null ? `${rating.toFixed(1)} / 5` : '—',
      hint: overview.profile.ratingCount ? `${overview.profile.ratingCount} reviews` : null,
    },
    {
      label: 'Upcoming engagements',
      value: upcoming,
      hint: upcoming === 1 ? 'One commitment today' : `${upcoming} commitments scheduled`,
    },
  ];
}

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const [activeSection, setActiveSection] = useState('overview');
  const [menuSections] = useState(MENU_GROUPS);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewSaving, setOverviewSaving] = useState(false);

  const freelancerId = session?.id ?? null;

  const refreshOverview = useCallback(async () => {
    if (!freelancerId) {
      return null;
    }
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const data = await fetchFreelancerDashboardOverview(freelancerId);
      setOverview(data);
      setProfile((current) => ({
        ...current,
        name: data?.profile?.name ?? current.name,
        role: data?.profile?.headline ?? current.role,
        avatarUrl: data?.profile?.avatarUrl ?? current.avatarUrl,
        metrics: buildProfileMetrics(data),
      }));
      return data;
    } catch (error) {
      console.error('Failed to load freelancer overview', error);
      setOverviewError(error instanceof Error ? error : new Error('Unable to load overview.'));
      return null;
    } finally {
      setLoadingOverview(false);
    }
  }, [freelancerId]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const handleOverviewSave = useCallback(
    async (updates) => {
      if (!freelancerId) {
        throw new Error('Freelancer session missing.');
      }
      setOverviewSaving(true);
      setOverviewError(null);
      try {
        const data = await saveFreelancerDashboardOverview(freelancerId, updates);
        setOverview(data);
        setProfile((current) => ({
          ...current,
          name: data?.profile?.name ?? current.name,
          role: data?.profile?.headline ?? current.role,
          avatarUrl: data?.profile?.avatarUrl ?? current.avatarUrl,
          metrics: buildProfileMetrics(data),
        }));
        return data;
      } catch (error) {
        console.error('Failed to update overview', error);
        setOverviewError(error instanceof Error ? error : new Error('Unable to save overview updates.'));
        throw error;
      } finally {
        setOverviewSaving(false);
      }
    },
    [freelancerId],
  );

  const renderSection = useCallback(() => {
    const Component = SECTION_COMPONENTS[activeSection] ?? OverviewSection;
    if (Component === OverviewSection) {
      return (
        <OverviewSection
          overview={overview}
          loading={loadingOverview}
          error={overviewError}
          onRefresh={refreshOverview}
          onSave={handleOverviewSave}
          saving={overviewSaving}
        />
      );
    }
    return <Component overview={overview} profile={profile} />;
  }, [activeSection, overview, loadingOverview, overviewError, refreshOverview, handleOverviewSave, overviewSaving, profile]);

  const description = useMemo(() => 'Stay on top of your gigs, relationships, and rituals.', []);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer hub"
      subtitle={profile?.role ?? 'Independent professional'}
      description={description}
      menuSections={menuSections}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-screen-2xl space-y-12 px-8 py-10">
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
