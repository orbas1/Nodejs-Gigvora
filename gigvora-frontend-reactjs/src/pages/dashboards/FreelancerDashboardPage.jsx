import { useCallback, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useFreelancerProfileOverview from '../../hooks/useFreelancerProfileOverview.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
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
  PlanningSection,
  ProfileOverviewSection,
  ProfileShowcaseSection,
  ProjectLabSection,
  ProjectWorkspaceExcellenceSection,
  ReferencesSection,
  SupportSection,
  TaskManagementSection,
  WorkspaceSettingsSection,
} from './freelancer/sections/index.js';
import { DEFAULT_PROFILE } from './freelancer/sampleData.js';

const SECTION_COMPONENTS = {
  'profile-overview': ProfileOverviewSection,
  'operations-hq': OperationsHQSection,
  'delivery-ops': DeliveryOperationsSection,
  'task-management': TaskManagementSection,
  planning: PlanningSection,
  'project-excellence': ProjectWorkspaceExcellenceSection,
  'project-lab': ProjectLabSection,
  'gig-studio': GigStudioSection,
  'gig-marketplace': GigMarketplaceOperationsSection,
  automation: AutomationSection,
  'finance-compliance': FinanceComplianceSection,
  'workspace-settings': WorkspaceSettingsSection,
  'profile-showcase': ProfileShowcaseSection,
  references: ReferencesSection,
  network: NetworkSection,
  'growth-partnerships': GrowthPartnershipSection,
  'quick-access': OperationalQuickAccessSection,
  support: SupportSection,
};

function deriveInitials(value) {
  if (!value) {
    return 'GV';
  }
  const parts = value
    .toString()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase())
    .filter(Boolean);
  if (!parts.length) {
    return 'GV';
  }
  return parts.join('').slice(0, 2);
}

function buildFallbackOverview(session) {
  const fallbackName = session?.name ?? DEFAULT_PROFILE.name;
  const nameParts = fallbackName ? fallbackName.trim().split(/\s+/) : [];
  const firstName = session?.firstName ?? nameParts[0] ?? '';
  const lastName = session?.lastName ?? (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
  const headline = session?.title ?? DEFAULT_PROFILE.role;
  const location = session?.location ?? 'Remote';
  const initials = deriveInitials(session?.avatarSeed ?? fallbackName ?? DEFAULT_PROFILE.initials);

  return {
    profile: {
      firstName,
      lastName,
      fullName: fallbackName,
      headline,
      title: headline,
      bio: '',
      missionStatement: '',
      location,
      locationDetails: { summary: location },
      timezone: 'UTC',
      hourlyRate: null,
      availability: {
        status: 'limited',
        hoursPerWeek: null,
        openToRemote: true,
        notes: '',
      },
      skills: [],
      stats: {
        followerCount: 0,
        connectionCount: 0,
        pendingConnections: 0,
      },
      connections: {
        pendingIncoming: [],
        pendingOutgoing: [],
        accepted: [],
      },
      followers: { preview: [] },
      avatar: {
        url: DEFAULT_PROFILE.avatarUrl ?? null,
        initials,
      },
    },
  };
}

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const [activeSection, setActiveSection] = useState('profile-overview');
  const menuSections = useMemo(() => MENU_GROUPS, []);
  const dashboards = useMemo(() => AVAILABLE_DASHBOARDS, []);
  const userId = session?.id ?? null;

  const {
    overview,
    loading,
    saving,
    avatarUploading,
    connectionSaving,
    error,
    refresh,
    saveProfile,
    uploadAvatar,
    createConnection,
    updateConnection,
    deleteConnection,
  } = useFreelancerProfileOverview({ userId, enabled: Boolean(userId) });

  const overviewData = useMemo(() => overview ?? buildFallbackOverview(session), [overview, session]);

  const sectionComponent = SECTION_COMPONENTS[activeSection] ?? ProfileOverviewSection;

  const profileOverviewProps = useMemo(
    () => ({
      overview: overviewData,
      loading,
      saving,
      avatarUploading,
      connectionSaving,
      error,
      onRefresh: refresh,
      onSave: userId ? saveProfile : undefined,
      onUploadAvatar: userId ? uploadAvatar : undefined,
      onCreateConnection: userId ? createConnection : undefined,
      onUpdateConnection: userId ? updateConnection : undefined,
      onDeleteConnection: userId ? deleteConnection : undefined,
    }),
    [
      overviewData,
      loading,
      saving,
      avatarUploading,
      connectionSaving,
      error,
      refresh,
      userId,
      saveProfile,
      uploadAvatar,
      createConnection,
      updateConnection,
      deleteConnection,
    ],
  );

  const handleMenuSelect = useCallback((itemId) => {
    if (!itemId) {
      return;
    }
    if (SECTION_COMPONENTS[itemId]) {
      setActiveSection(itemId);
    } else {
      setActiveSection('profile-overview');
    }
  }, []);

  const heroTitle = 'Freelancer Hub';
  const heroSubtitle = 'Profile';
  const heroDescription = '';

  const renderSection = () => {
    if (sectionComponent === ProfileOverviewSection) {
      return <ProfileOverviewSection {...profileOverviewProps} />;
    }

    const Component = sectionComponent;
    return <Component />;
  };

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      availableDashboards={dashboards}
      activeMenuItem={activeSection}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="mx-auto w-full max-w-6xl space-y-10 px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {overviewData?.profile?.fullName ?? session?.name ?? 'Freelancer'}
              </p>
              {overviewData?.profile?.headline ? (
                <p className="text-sm text-slate-500">{overviewData.profile.headline}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold">
                Followers
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {overviewData?.profile?.stats?.followerCount ?? 0}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold">
                Connections
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {overviewData?.profile?.stats?.connectionCount ?? 0}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold">
                Pending
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {overviewData?.profile?.stats?.pendingConnections ?? 0}
                </span>
              </span>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error?.message ?? 'Unable to sync your profile overview right now.'}
            </div>
          ) : null}
        </div>

        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
