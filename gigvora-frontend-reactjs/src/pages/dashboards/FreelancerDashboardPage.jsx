import { useCallback, useMemo, useState } from 'react';
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import useFreelancerProfileOverview from '../../hooks/useFreelancerProfileOverview.js';
import { AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';
import OverviewSection from './freelancer/sections/OverviewSection.jsx';
import ProfileOverviewSection from './freelancer/sections/ProfileOverviewSection.jsx';
import PlanningSection from './freelancer/sections/PlanningSection.jsx';
import ProjectManagementSection from './freelancer/sections/project-management/ProjectManagementSection.jsx';
import EscrowManagementSection from './freelancer/sections/EscrowManagementSection.jsx';
import { fetchFreelancerDashboardOverview, saveFreelancerDashboardOverview } from '../../services/freelancerDashboard.js';

function resolveFreelancerId(session) {
  if (!session) return null;
  const candidates = [session.freelancerId, session.id, session.userId];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

const MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      {
        id: 'mission-control',
        name: 'Mission control',
        description: 'Live overview',
        sectionId: 'overview',
        icon: HomeModernIcon,
      },
    ],
  },
  {
    label: 'Profile',
    items: [
      {
        id: 'profile-overview',
        name: 'Profile',
        description: 'Story & relationships',
        sectionId: 'profile',
        icon: UserCircleIcon,
      },
    ],
  },
  {
    label: 'Planner',
    items: [
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Schedule & focus',
        sectionId: 'planning',
        icon: CalendarDaysIcon,
      },
    ],
  },
  {
    label: 'Delivery',
    items: [
      {
        id: 'gig-management',
        name: 'Gig management',
        description: 'Projects & orders',
        sectionId: 'project-management',
        icon: BriefcaseIcon,
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        id: 'escrow',
        name: 'Escrow',
        description: 'Accounts & releases',
        sectionId: 'escrow-management',
        icon: LockClosedIcon,
      },
    ],
  },
];

export default function FreelancerDashboardPage() {
  const { session } = useSession();
  const freelancerId = useMemo(() => resolveFreelancerId(session), [session]);

  const overviewResource = useCachedResource(
    freelancerId ? `freelancer:${freelancerId}:dashboard-overview` : 'freelancer:dashboard-overview:pending',
    () => (freelancerId ? fetchFreelancerDashboardOverview(freelancerId) : Promise.resolve(null)),
    { enabled: Boolean(freelancerId), dependencies: [freelancerId] },
  );

  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
  } = overviewResource;

  const {
    overview: profileOverview,
    loading: profileLoading,
    saving: profileSaving,
    avatarUploading,
    connectionSaving,
    error: profileError,
    refresh: refreshProfile,
    saveProfile,
    uploadAvatar,
    createConnection,
    updateConnection,
    deleteConnection,
  } = useFreelancerProfileOverview({ userId: freelancerId, enabled: Boolean(freelancerId) });

  const [savingOverview, setSavingOverview] = useState(false);

  const handleSaveOverview = useCallback(
    async (payload) => {
      if (!freelancerId) {
        throw new Error('Freelancer workspace required.');
      }
      setSavingOverview(true);
      try {
        const result = await saveFreelancerDashboardOverview(freelancerId, payload);
        await refreshOverview({ force: true });
        return result;
      } catch (error) {
        const normalised = error instanceof Error ? error : new Error('Unable to update overview.');
        throw normalised;
      } finally {
        setSavingOverview(false);
      }
    },
    [freelancerId, refreshOverview],
  );

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer mission control"
      subtitle="Signals, revenue, and relationships"
      description="Keep your Gigvora career in flow with a personalised control centre for operations, growth, and support."
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="mission-control"
    >
      <div className="mx-auto w-full max-w-7xl space-y-16 px-6 py-10">
        <OverviewSection
          overview={overviewData}
          loading={overviewLoading}
          error={overviewError}
          onRefresh={() => refreshOverview({ force: true })}
          onSave={handleSaveOverview}
          saving={savingOverview}
        />

        <ProfileOverviewSection
          overview={profileOverview}
          loading={profileLoading}
          saving={profileSaving}
          avatarUploading={avatarUploading}
          connectionSaving={connectionSaving}
          error={profileError}
          onRefresh={() => refreshProfile({ fresh: true })}
          onSave={saveProfile}
          onUploadAvatar={uploadAvatar}
          onCreateConnection={createConnection}
          onUpdateConnection={updateConnection}
          onDeleteConnection={deleteConnection}
        />

        <PlanningSection freelancerId={freelancerId} />
        <ProjectManagementSection freelancerId={freelancerId} />
        <EscrowManagementSection />
      </div>
    </DashboardLayout>
  );
}
