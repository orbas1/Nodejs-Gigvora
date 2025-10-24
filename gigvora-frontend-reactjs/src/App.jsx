import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute.jsx';
import MembershipGate from './components/auth/MembershipGate.jsx';
import RequireRole from './components/routing/RequireRole.jsx';
import RouteLoading from './components/routing/RouteLoading.jsx';
import { LAUNCHPAD_ALLOWED_MEMBERSHIPS, SECURITY_ALLOWED_MEMBERSHIPS } from './constants/access.js';

const pageModules = import.meta.glob('./pages/**/*.jsx');
const layoutModules = import.meta.glob('./layouts/**/*.jsx');

const mainLayoutLoader = layoutModules['./layouts/MainLayout.jsx'];
if (!mainLayoutLoader) {
  throw new Error('MainLayout layout module is missing.');
}

const MainLayout = lazy(mainLayoutLoader);

const lazyComponentCache = new Map();

function resolveComponent(modulePath) {
  const loader = pageModules[modulePath];
  if (!loader) {
    throw new Error(`Unknown page module: ${modulePath}`);
  }
  if (!lazyComponentCache.has(modulePath)) {
    lazyComponentCache.set(modulePath, lazy(loader));
  }
  return lazyComponentCache.get(modulePath);
}

function LoadableRoute({ modulePath }) {
  const Component = resolveComponent(modulePath);
  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}

export const COMMUNITY_ACCESS_MEMBERSHIPS = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
]);

export const VOLUNTEER_ACCESS_MEMBERSHIPS = Object.freeze(['volunteer', 'mentor', 'admin']);

const userRoles = Object.freeze(['user', 'freelancer', 'agency', 'company', 'headhunter']);

export const PUBLIC_ROUTES = [
  { path: 'login', module: './pages/LoginPage.jsx' },
  { path: 'register', module: './pages/RegisterPage.jsx' },
  { path: 'register/company', module: './pages/CompanyRegisterPage.jsx' },
  { path: 'profile/:id', module: './pages/ProfilePage.jsx' },
  { path: 'terms', module: './pages/TermsPage.jsx' },
  { path: 'privacy', module: './pages/PrivacyPage.jsx' },
  { path: 'refunds', module: './pages/RefundPolicyPage.jsx' },
  { path: 'community-guidelines', module: './pages/CommunityGuidelinesPage.jsx' },
  { path: 'faq', module: './pages/FaqPage.jsx' },
  { path: 'about', module: './pages/AboutPage.jsx' },
  { path: 'preview/freelancer-reviews', module: './pages/previews/FreelancerReviewsPreviewPage.jsx' },
  { path: 'blog', module: './pages/BlogPage.jsx' },
  { path: 'blog/:slug', module: './pages/BlogArticlePage.jsx' },
  { path: 'mentors', module: './pages/MentorsPage.jsx' },
];

export const COMMUNITY_ROUTES = [
  { path: 'feed', module: './pages/FeedPage.jsx' },
  { path: 'search', module: './pages/SearchPage.jsx' },
  { path: 'explorer/:category/:recordId', module: './pages/ExplorerRecordPage.jsx' },
  { path: 'jobs', module: './pages/JobsPage.jsx' },
  { path: 'gigs', module: './pages/GigsPage.jsx' },
  { path: 'projects', module: './pages/ProjectsPage.jsx' },
  { path: 'creation-studio', module: './pages/CreationStudioWizardPage.jsx' },
  { path: 'users/:userId', module: './pages/UserProfileViewPage.jsx' },
  { path: 'projects/new', module: './pages/ProjectCreatePage.jsx' },
  { path: 'projects/:projectId', module: './pages/ProjectDetailPage.jsx' },
  { path: 'projects/:projectId/auto-match', module: './pages/ProjectAutoMatchPage.jsx' },
  { path: 'groups', module: './pages/GroupsPage.jsx' },
  { path: 'groups/:groupId', module: './pages/GroupProfilePage.jsx' },
  { path: 'pages', module: './pages/PagesPage.jsx' },
  { path: 'connections', module: './pages/ConnectionsPage.jsx' },
  { path: 'notifications', module: './pages/NotificationsPage.jsx' },
  { path: 'trust-center', module: './pages/TrustCenter.jsx' },
  { path: 'auto-assign', module: './pages/AutoAssignQueuePage.jsx' },
  { path: 'inbox', module: './pages/InboxPage.jsx' },
  { path: 'settings', module: './pages/SettingsPage.jsx' },
  { path: 'finance', module: './pages/FinanceHubPage.jsx' },
];

export const VOLUNTEER_ROUTES = [{ path: 'volunteering', module: './pages/VolunteeringPage.jsx' }];

export const LAUNCHPAD_ROUTES = [{ path: 'experience-launchpad', module: './pages/LaunchpadPage.jsx' }];

export const SECURITY_ROUTES = [{ path: 'security-operations', module: './pages/SecurityOperationsPage.jsx' }];

export const userDashboardRoutes = [
  { path: 'dashboard/user', module: './pages/dashboards/UserDashboardPage.jsx' },
  { path: 'dashboard/user/creation-studio', module: './pages/dashboards/UserCreationStudioPage.jsx' },
  { path: 'dashboard/user/projects', module: './pages/dashboards/UserProjectManagementPage.jsx' },
  { path: 'dashboard/user/disputes', module: './pages/dashboards/UserDisputesPage.jsx' },
  { path: 'dashboard/user/calendar', module: './pages/dashboards/user/UserCalendarPage.jsx' },
  { path: 'dashboard/user/profile', module: './pages/dashboards/UserProfileHubPage.jsx' },
];

export const freelancerRoutes = [
  { path: 'dashboard/freelancer', module: './pages/dashboards/FreelancerDashboardPage.jsx' },
  { path: 'dashboard/freelancer/volunteer', module: './pages/dashboards/FreelancerVolunteerPage.jsx' },
  { path: 'dashboard/freelancer/planner', module: './pages/dashboards/FreelancerPlannerPage.jsx' },
  { path: 'dashboard/freelancer/automatch', module: './pages/dashboards/FreelancerAutoMatchPage.jsx' },
  { path: 'dashboard/freelancer/pipeline', module: './pages/dashboards/FreelancerPipelinePage.jsx' },
  { path: 'dashboard/freelancer/portfolio', module: './pages/dashboards/FreelancerPortfolioPage.jsx' },
  { path: 'dashboard/freelancer/creation-studio', module: './pages/dashboards/FreelancerCreationStudioPage.jsx' },
  { path: 'dashboard/freelancer/documents', module: './pages/dashboards/freelancer/FreelancerDocumentsPage.jsx' },
  { path: 'dashboard/freelancer/networking', module: './pages/dashboards/freelancer/FreelancerNetworkingPage.jsx' },
  { path: 'dashboard/freelancer/disputes', module: './pages/dashboards/freelancer/FreelancerDisputesPage.jsx' },
];

export const companyRoutes = [
  { path: 'dashboard/company', module: './pages/dashboards/CompanyDashboardPage.jsx' },
  { path: 'dashboard/company/profile', module: './pages/dashboards/CompanyProfileWorkspacePage.jsx' },
  { path: 'dashboard/company/creation-studio', module: './pages/dashboards/CompanyCreationStudioPage.jsx' },
  { path: 'dashboard/company/hub', module: './pages/dashboards/CompanyHubPage.jsx' },
  { path: 'dashboard/company/metrics', module: './pages/dashboards/CompanyMetricsPage.jsx' },
  { path: 'dashboard/company/wallets', module: './pages/dashboards/CompanyWalletManagementPage.jsx' },
  { path: 'dashboard/company/settings', module: './pages/dashboards/CompanySettingsPage.jsx' },
  { path: 'dashboard/company/system-preferences', module: './pages/dashboards/CompanySystemPreferencesPage.jsx' },
  { path: 'dashboard/company/analytics', module: './pages/dashboards/CompanyAnalyticsPage.jsx' },
  { path: 'dashboard/company/projects', module: './pages/dashboards/CompanyProjectManagementPage.jsx' },
  { path: 'dashboard/company/workspace', module: './pages/dashboards/company/CompanyProjectWorkspacePage.jsx' },
  { path: 'dashboard/company/inbox', module: './pages/dashboards/CompanyInboxPage.jsx' },
  { path: 'dashboard/company/timeline', module: './pages/dashboards/CompanyTimelineManagementPage.jsx' },
  { path: 'dashboard/company/ats', module: './pages/dashboards/CompanyAtsOperationsPage.jsx' },
  { path: 'dashboard/company/calendar', module: './pages/dashboards/CompanyCalendarPage.jsx' },
  { path: 'dashboard/company/job-management', module: './pages/dashboards/CompanyJobManagementPage.jsx' },
  { path: 'dashboard/company/launchpad-jobs', module: './pages/dashboards/CompanyLaunchpadJobManagementPage.jsx' },
  { path: 'dashboard/company/orders', module: './pages/dashboards/CompanyOrdersPage.jsx' },
  { path: 'dashboard/company/ads', module: './pages/dashboards/CompanyAdsPage.jsx' },
  { path: 'dashboard/company/groups', module: './pages/dashboards/CompanyGroupManagementPage.jsx' },
  { path: 'dashboard/company/integrations', module: './pages/dashboards/CompanyIntegrationsPage.jsx' },
  { path: 'dashboard/company/escrow', module: './pages/dashboards/CompanyEscrowManagementPage.jsx' },
  { path: 'dashboard/company/pages', module: './pages/dashboards/CompanyPagesManagementPage.jsx' },
  { path: 'dashboard/company/id-verification', module: './pages/dashboards/CompanyIdVerificationPage.jsx' },
  { path: 'dashboard/company/volunteering', module: './pages/dashboards/CompanyVolunteeringManagementPage.jsx' },
  { path: 'dashboard/company/integrations/crm', module: './pages/dashboards/CompanyCrmIntegrationsPage.jsx' },
  { path: 'dashboard/company/ai-auto-reply', module: './pages/dashboards/CompanyByokAutoReplyPage.jsx' },
  { path: 'dashboard/company/disputes', module: './pages/dashboards/company/CompanyDisputeManagementPage.jsx' },
  { path: 'dashboard/company/networking', module: './pages/networking/CompanyNetworkingHubPage.jsx' },
  { path: 'dashboard/company/networking/sessions', module: './pages/networking/NetworkingSessionsPage.jsx' },
];

export const agencyRoutes = [
  {
    path: 'dashboard/agency',
    module: './pages/dashboards/AgencyDashboardPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/disputes',
    module: './pages/dashboards/agency/DisputeManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/escrow',
    module: './pages/dashboards/agency/AgencyEscrowManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/crm',
    module: './pages/dashboards/AgencyCrmPipelinePage.jsx',
    roles: ['agency', 'agency_admin'],
  },
  {
    path: 'dashboard/agency/integrations',
    module: './pages/dashboards/AgencyIntegrationsPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/ai',
    module: './pages/dashboards/AgencyAiAutomationPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/profile',
    module: './pages/dashboards/AgencyProfileManagementPage.jsx',
    roles: ['agency', 'agency_admin'],
  },
  {
    path: 'dashboard/agency/client-kanban',
    module: './pages/dashboards/AgencyClientKanbanPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/wallet',
    module: './pages/dashboards/agency/AgencyWalletManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/timeline',
    module: './pages/dashboards/agency/AgencyTimelineDashboardPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/blog',
    module: './pages/dashboards/AgencyBlogManagementPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/inbox',
    module: './pages/dashboards/agency/AgencyInboxPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/workspace',
    module: './pages/dashboards/agency/ProjectWorkspacePage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/projects',
    module: './pages/dashboards/AgencyProjectManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/mentoring',
    module: './pages/dashboards/AgencyMentoringPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/job-management',
    module: './pages/dashboards/agency/AgencyJobManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/interviews',
    module: './pages/dashboards/agency/AgencyInterviewsPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/calendar',
    module: './pages/dashboards/agency/AgencyCalendarPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/id-verification',
    module: './pages/dashboards/agency/AgencyIdVerificationPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
  {
    path: 'dashboard/agency/support',
    module: './pages/dashboards/agency/AgencySupportDeskPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/events',
    module: './pages/dashboards/agency/AgencyEventManagementPage.jsx',
    roles: ['agency'],
  },
  {
    path: 'dashboard/agency/networking',
    module: './pages/dashboards/agency/AgencyNetworkingManagementPage.jsx',
    roles: ['agency', 'agency_admin', 'admin'],
  },
];

export const headhunterRoutes = [
  { path: 'dashboard/headhunter', module: './pages/dashboards/HeadhunterDashboardPage.jsx', roles: ['headhunter'] },
];

export const mentorRoutes = [
  { path: 'dashboard/mentor', module: './pages/dashboards/MentorDashboardPage.jsx', roles: ['mentor'] },
];

export const launchpadRoutes = [
  { path: 'dashboard/launchpad', module: './pages/dashboards/LaunchpadOperationsPage.jsx', roles: ['admin', 'mentor'] },
];

export const adminRoutes = [
  { path: 'dashboard/admin', module: './pages/dashboards/AdminDashboardPage.jsx' },
  { path: 'dashboard/admin/finance', module: './pages/dashboards/admin/AdminFinancialManagementPage.jsx' },
  { path: 'dashboard/admin/interviews', module: './pages/dashboards/AdminInterviewManagementPage.jsx' },
  { path: 'dashboard/admin/inbox', module: './pages/dashboards/AdminInboxPage.jsx' },
  { path: 'dashboard/admin/moderation', module: './pages/dashboards/admin/AdminModerationDashboardPage.jsx' },
  { path: 'dashboard/admin/timelines', module: './pages/dashboards/admin/AdminTimelineManagementPage.jsx' },
  { path: 'dashboard/admin/appearance', module: './pages/dashboards/admin/AdminAppearanceManagementPage.jsx' },
  { path: 'dashboard/admin/storage', module: './pages/dashboards/admin/AdminStorageManagementPage.jsx' },
  { path: 'dashboard/admin/database', module: './pages/dashboards/AdminDatabaseSettingsPage.jsx' },
  { path: 'dashboard/admin/gdpr', module: './pages/dashboards/admin/AdminGdprSettingsPage.jsx' },
  { path: 'dashboard/admin/compliance', module: './pages/dashboards/admin/AdminComplianceManagementPage.jsx' },
  { path: 'dashboard/admin/maintenance', module: './pages/dashboards/admin/AdminMaintenanceModePage.jsx' },
  { path: 'dashboard/admin/documents', module: './pages/dashboards/admin/AdminDocumentsManagementPage.jsx' },
  { path: 'dashboard/admin/ads-settings', module: './pages/dashboards/admin/AdminAdsSettingsPage.jsx' },
  { path: 'dashboard/admin/blog', module: './pages/admin/AdminBlogManagementPage.jsx' },
  { path: 'dashboard/admin/volunteering', module: './pages/dashboards/admin/AdminVolunteeringPage.jsx' },
  { path: 'dashboard/admin/projects', module: './pages/admin/AdminProjectsPage.jsx' },
  { path: 'dashboard/admin/gigs', module: './pages/admin/AdminGigManagementPage.jsx' },
  { path: 'dashboard/admin/jobs', module: './pages/dashboards/admin/AdminJobPostManagementPage.jsx' },
  { path: 'dashboard/admin/job-applications', module: './pages/dashboards/admin/AdminJobApplicationsPage.jsx' },
  { path: 'dashboard/admin/calendar', module: './pages/admin/AdminCalendarPage.jsx' },
  { path: 'dashboard/admin/identity-verification', module: './pages/dashboards/admin/AdminIdentityVerificationPage.jsx' },
  { path: 'dashboard/admin/wallets', module: './pages/dashboards/admin/AdminWalletManagementPage.jsx' },
  { path: 'dashboard/admin/disputes', module: './pages/dashboards/admin/AdminDisputeManagementPage.jsx' },
  { path: 'dashboard/admin/escrow', module: './pages/dashboards/admin/AdminEscrowManagementPage.jsx' },
  { path: 'dashboard/admin/mobile-apps', module: './pages/admin/AdminMobileAppManagementPage.jsx' },
  { path: 'dashboard/admin/system-settings', module: './pages/dashboards/admin/SystemSettingsPage.jsx' },
  { path: 'dashboard/admin/homepage', module: './pages/admin/AdminHomepageSettingsPage.jsx' },
  { path: 'dashboard/admin/pages', module: './pages/dashboards/AdminPagesSettingsPage.jsx' },
  { path: 'dashboard/admin/users', module: './pages/dashboards/admin/AdminUserManagementPage.jsx' },
  { path: 'dashboard/admin/site', module: './pages/dashboards/admin/AdminSiteManagementPage.jsx' },
  { path: 'dashboard/admin/policies', module: './pages/dashboards/admin/AdminPolicyManagementPage.jsx' },
  { path: 'dashboard/admin/api-management', module: './pages/admin/AdminApiManagementPage.jsx' },
  { path: 'dashboard/admin/email', module: './pages/dashboards/admin/email/AdminEmailManagementPage.jsx' },
  { path: 'dashboard/admin/security/two-factor', module: './pages/dashboards/admin/AdminTwoFactorManagementPage.jsx' },
  { path: 'dashboard/admin/seo', module: './pages/dashboards/admin/AdminSeoSettingsPage.jsx' },
  { path: 'dashboard/admin/profiles', module: './pages/admin/AdminProfileManagementPage.jsx' },
  { path: 'dashboard/admin/speed-networking', module: './pages/dashboards/admin/AdminSpeedNetworkingManagementPage.jsx' },
  { path: 'dashboard/admin/mentoring', module: './pages/dashboards/admin/AdminMentoringSessionManagementPage.jsx' },
];

function renderRoutes(routes) {
  return routes.map((route) => (
    <Route key={route.path} path={route.path} element={<LoadableRoute modulePath={route.module} />} />
  ));
}

function renderRequireRoleRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RequireRole allowedRoles={route.roles}>
          <LoadableRoute modulePath={route.module} />
        </RequireRole>
      }
    />
  ));
}

function renderAdminRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RequireRole allowedRoles={['admin']}>
          <LoadableRoute modulePath={route.module} />
        </RequireRole>
      }
    />
  ));
}

export const ROUTE_COLLECTIONS = Object.freeze({
  public: PUBLIC_ROUTES,
  community: COMMUNITY_ROUTES,
  volunteer: VOLUNTEER_ROUTES,
  launchpad: LAUNCHPAD_ROUTES,
  security: SECURITY_ROUTES,
  userDashboards: userDashboardRoutes,
  freelancer: freelancerRoutes,
  company: companyRoutes,
  agency: agencyRoutes,
  headhunter: headhunterRoutes,
  mentor: mentorRoutes,
  launchpadOps: launchpadRoutes,
  admin: adminRoutes,
});

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <Suspense fallback={<RouteLoading />}>
            <MainLayout />
          </Suspense>
        }
      >
        <Route index element={<LoadableRoute modulePath="./pages/HomePage.jsx" />} />
        {renderRoutes(PUBLIC_ROUTES)}
        <Route element={<ProtectedRoute requiredMemberships={COMMUNITY_ACCESS_MEMBERSHIPS} />}>
          {renderRoutes(COMMUNITY_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={VOLUNTEER_ACCESS_MEMBERSHIPS} />}>
          {renderRoutes(VOLUNTEER_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={LAUNCHPAD_ALLOWED_MEMBERSHIPS} />}>
          {renderRoutes(LAUNCHPAD_ROUTES)}
        </Route>
        <Route element={<ProtectedRoute requiredMemberships={SECURITY_ALLOWED_MEMBERSHIPS} />}>
          {renderRoutes(SECURITY_ROUTES)}
        </Route>
      </Route>

      {userDashboardRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RoleProtectedRoute allowedRoles={userRoles}>
              <MembershipGate allowedMemberships={userRoles}>
                <LoadableRoute modulePath={route.module} />
              </MembershipGate>
            </RoleProtectedRoute>
          }
        />
      ))}

      {freelancerRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RequireRole allowedRoles={['freelancer']}>
              <LoadableRoute modulePath={route.module} />
            </RequireRole>
          }
        />
      ))}

      {companyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RequireRole allowedRoles={['company']}>
              <LoadableRoute modulePath={route.module} />
            </RequireRole>
          }
        />
      ))}

      {renderRequireRoleRoutes(agencyRoutes)}
      {renderRequireRoleRoutes(headhunterRoutes)}
      {renderRequireRoleRoutes(mentorRoutes)}
      {renderRequireRoleRoutes(launchpadRoutes)}
      {renderAdminRoutes(adminRoutes)}

      <Route path="admin" element={<LoadableRoute modulePath="./pages/AdminLoginPage.jsx" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
