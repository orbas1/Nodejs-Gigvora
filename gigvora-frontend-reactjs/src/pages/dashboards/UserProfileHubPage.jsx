import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import useSession from '../../hooks/useSession.js';
import DataStatus from '../../components/DataStatus.jsx';
import ProfileHubWorkspace from '../../components/profileHub/workspace/ProfileHubWorkspace.jsx';
import ProfileOverview from '../../components/profileHub/ProfileOverview.jsx';
import ExperienceTimeline from '../../components/profileHub/ExperienceTimeline.jsx';
import PortfolioGallery from '../../components/profileHub/PortfolioGallery.jsx';
import { fetchProfile } from '../../services/profile.js';
import { fetchProfileHub } from '../../services/profileHub.js';

const MENU_SECTIONS = [
  {
    label: 'Profile',
    items: [
      { id: 'profile-hub', name: 'Workspace', sectionId: 'profile-hub', href: '/dashboard/user/profile' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

const ALLOWED_ROLES = AVAILABLE_DASHBOARDS;

function resolveUserId(session) {
  if (!session) {
    return null;
  }
  return session.userId ?? session.user?.id ?? session.id ?? null;
}

export default function UserProfileHubPage() {
  const { session, isAuthenticated } = useSession();
  const userId = resolveUserId(session);
  const enabled = Boolean(isAuthenticated && userId);

  const { data, loading, error, fromCache, lastUpdated, refresh } = useCachedResource(
    userId ? `profile-hub:workspace:${userId}` : 'profile-hub:workspace:none',
    async ({ signal }) => {
      if (!userId) {
        throw new Error('A userId is required.');
      }
      const [profileOverview, profileHub] = await Promise.all([
        fetchProfile(userId, { signal, force: true }),
        fetchProfileHub(userId, { signal, fresh: true }),
      ]);
      return { profileOverview, profileHub };
    },
    { dependencies: [userId], enabled },
  );

  const profileOverview = data?.profileOverview ?? null;
  const profileHub = data?.profileHub ?? null;
  const viewerPersona = profileHub?.viewerPersona ?? profileHub?.targetPersona ?? null;
  const experienceTimeline = profileHub?.experienceTimeline ?? profileHub?.timeline ?? profileHub?.experience ?? {};
  const timelineItems =
    experienceTimeline?.items ??
    experienceTimeline?.entries ??
    experienceTimeline?.highlights ??
    [];
  const timelineFilters = experienceTimeline?.filters ?? experienceTimeline?.categories ?? undefined;
  const timelineDefaultFilter = experienceTimeline?.defaultFilter ?? experienceTimeline?.initialFilter ?? undefined;
  const timelineDefaultView = experienceTimeline?.defaultView ?? experienceTimeline?.view ?? 'timeline';

  const portfolio = profileHub?.portfolioGallery ?? profileHub?.portfolio ?? profileHub?.showcase ?? {};
  const portfolioItems = portfolio?.items ?? portfolio?.entries ?? portfolio?.gallery ?? [];
  const portfolioCategories = portfolio?.categories ?? portfolio?.tags ?? undefined;
  const portfolioDefaultCategory = portfolio?.defaultCategory ?? portfolio?.initialCategory ?? undefined;
  const portfolioLoading = Boolean(portfolio?.loading);

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="user"
        title="Profile Hub"
        subtitle="Workspace"
        menuSections={MENU_SECTIONS}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="profile-hub"
      >
      <div className="space-y-6">
        <DataStatus
          loading={loading}
          error={error?.message}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRetry={() => refresh({ force: true })}
        />
        {profileOverview && profileHub ? (
          <>
            <ProfileHubWorkspace
              userId={userId}
              profileOverview={profileOverview}
              profileHub={profileHub}
              onRefresh={() => refresh({ force: true })}
            />

            <div className="space-y-6">
              <ProfileOverview
                profileOverview={profileOverview}
                profileHub={profileHub}
                viewerPersona={viewerPersona}
              />
              <ExperienceTimeline
                items={timelineItems}
                filters={timelineFilters}
                defaultFilter={timelineDefaultFilter}
                defaultView={timelineDefaultView}
              />
              <PortfolioGallery
                items={portfolioItems}
                categories={portfolioCategories}
                defaultCategory={portfolioDefaultCategory}
                loading={portfolioLoading}
              />
            </div>
          </>
        ) : null}
      </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
