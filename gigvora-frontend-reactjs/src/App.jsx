import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CompanyRegisterPage from './pages/CompanyRegisterPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import GigsPage from './pages/GigsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectCreatePage from './pages/ProjectCreatePage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import ProjectAutoMatchPage from './pages/ProjectAutoMatchPage.jsx';
import LaunchpadPage from './pages/LaunchpadPage.jsx';
import MentorsPage from './pages/MentorsPage.jsx';
import VolunteeringPage from './pages/VolunteeringPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupProfilePage from './pages/GroupProfilePage.jsx';
import PagesPage from './pages/PagesPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import TrustCenterPage from './pages/TrustCenter.jsx';
import AutoAssignQueuePage from './pages/AutoAssignQueuePage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import FinanceHubPage from './pages/FinanceHubPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import BlogArticlePage from './pages/BlogArticlePage.jsx';
import SecurityOperationsPage from './pages/SecurityOperationsPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import UserDashboardPage from './pages/dashboards/UserDashboardPage.jsx';
import UserProfileHubPage from './pages/dashboards/UserProfileHubPage.jsx';
import UserCalendarPage from './pages/dashboards/user/UserCalendarPage.jsx';
import UserCreationStudioPage from './pages/dashboards/UserCreationStudioPage.jsx';
import UserProjectManagementPage from './pages/dashboards/UserProjectManagementPage.jsx';
import UserDisputesPage from './pages/dashboards/UserDisputesPage.jsx';
import FreelancerDashboardPage from './pages/dashboards/FreelancerDashboardPage.jsx';
import FreelancerAutoMatchPage from './pages/dashboards/FreelancerAutoMatchPage.jsx';
import FreelancerPlannerPage from './pages/dashboards/FreelancerPlannerPage.jsx';
import FreelancerVolunteerPage from './pages/dashboards/FreelancerVolunteerPage.jsx';
import FreelancerPipelinePage from './pages/dashboards/FreelancerPipelinePage.jsx';
import FreelancerPortfolioPage from './pages/dashboards/FreelancerPortfolioPage.jsx';
import FreelancerCreationStudioPage from './pages/dashboards/FreelancerCreationStudioPage.jsx';
import FreelancerNetworkingPage from './pages/dashboards/freelancer/FreelancerNetworkingPage.jsx';
import FreelancerDisputesPage from './pages/dashboards/freelancer/FreelancerDisputesPage.jsx';
import FreelancerDocumentsPage from './pages/dashboards/freelancer/FreelancerDocumentsPage.jsx';
import CompanyDashboardPage from './pages/dashboards/CompanyDashboardPage.jsx';
import CompanyAtsOperationsPage from './pages/dashboards/CompanyAtsOperationsPage.jsx';
import CompanyAnalyticsPage from './pages/dashboards/CompanyAnalyticsPage.jsx';
import CompanyIntegrationsPage from './pages/dashboards/CompanyIntegrationsPage.jsx';
import CompanyPagesManagementPage from './pages/dashboards/CompanyPagesManagementPage.jsx';
import CompanyProfileWorkspacePage from './pages/dashboards/CompanyProfileWorkspacePage.jsx';
import CompanyIdVerificationPage from './pages/dashboards/CompanyIdVerificationPage.jsx';
import CompanyCalendarPage from './pages/dashboards/CompanyCalendarPage.jsx';
import CompanyCreationStudioPage from './pages/dashboards/CompanyCreationStudioPage.jsx';
import CompanyJobManagementPage from './pages/dashboards/CompanyJobManagementPage.jsx';
import CompanyGroupManagementPage from './pages/dashboards/CompanyGroupManagementPage.jsx';
import CompanyVolunteeringManagementPage from './pages/dashboards/CompanyVolunteeringManagementPage.jsx';
import CompanyCrmIntegrationsPage from './pages/dashboards/CompanyCrmIntegrationsPage.jsx';
import CompanyByokAutoReplyPage from './pages/dashboards/CompanyByokAutoReplyPage.jsx';
import CompanyProjectWorkspacePage from './pages/dashboards/company/CompanyProjectWorkspacePage.jsx';
import CompanyInboxPage from './pages/dashboards/CompanyInboxPage.jsx';
import CompanyTimelineManagementPage from './pages/dashboards/CompanyTimelineManagementPage.jsx';
import CompanyWalletManagementPage from './pages/dashboards/CompanyWalletManagementPage.jsx';
import CompanyNetworkingHubPage from './pages/networking/CompanyNetworkingHubPage.jsx';
import NetworkingSessionsPage from './pages/networking/NetworkingSessionsPage.jsx';
import CompanyProjectManagementPage from './pages/dashboards/CompanyProjectManagementPage.jsx';
import CompanyDisputeManagementPage from './pages/dashboards/company/CompanyDisputeManagementPage.jsx';
import CompanyEscrowManagementPage from './pages/dashboards/CompanyEscrowManagementPage.jsx';
import AgencyDashboardPage from './pages/dashboards/AgencyDashboardPage.jsx';
import AgencyCalendarPage from './pages/dashboards/agency/AgencyCalendarPage.jsx';
import AgencyEventManagementPage from './pages/dashboards/agency/AgencyEventManagementPage.jsx';
import AgencyJobManagementPage from './pages/dashboards/agency/AgencyJobManagementPage.jsx';
import AgencyMentoringPage from './pages/dashboards/AgencyMentoringPage.jsx';
import AgencyProjectManagementPage from './pages/dashboards/AgencyProjectManagementPage.jsx';
import ProjectWorkspacePage from './pages/dashboards/agency/ProjectWorkspacePage.jsx';
import AgencyInboxPage from './pages/dashboards/agency/AgencyInboxPage.jsx';
import AgencyBlogManagementPage from './pages/dashboards/AgencyBlogManagementPage.jsx';
import AgencyTimelineDashboardPage from './pages/dashboards/agency/AgencyTimelineDashboardPage.jsx';
import AgencyWalletManagementPage from './pages/dashboards/agency/AgencyWalletManagementPage.jsx';
import AgencyNetworkingManagementPage from './pages/dashboards/agency/AgencyNetworkingManagementPage.jsx';
import DisputeManagementPage from './pages/dashboards/agency/DisputeManagementPage.jsx';
import AgencyEscrowManagementPage from './pages/dashboards/agency/AgencyEscrowManagementPage.jsx';
import AgencyCrmPipelinePage from './pages/dashboards/AgencyCrmPipelinePage.jsx';
import AgencyIntegrationsPage from './pages/dashboards/AgencyIntegrationsPage.jsx';
import AgencyAiAutomationPage from './pages/dashboards/AgencyAiAutomationPage.jsx';
import AgencyProfileManagementPage from './pages/dashboards/AgencyProfileManagementPage.jsx';
import AgencyClientKanbanPage from './pages/dashboards/AgencyClientKanbanPage.jsx';
import HeadhunterDashboardPage from './pages/dashboards/HeadhunterDashboardPage.jsx';
import MentorDashboardPage from './pages/dashboards/MentorDashboardPage.jsx';
import LaunchpadOperationsPage from './pages/dashboards/LaunchpadOperationsPage.jsx';
import AdminDashboardPage from './pages/dashboards/AdminDashboardPage.jsx';
import AdminInterviewManagementPage from './pages/dashboards/AdminInterviewManagementPage.jsx';
import AdminInboxPage from './pages/dashboards/AdminInboxPage.jsx';
import AdminTimelineManagementPage from './pages/dashboards/admin/AdminTimelineManagementPage.jsx';
import AdminAppearanceManagementPage from './pages/dashboards/admin/AdminAppearanceManagementPage.jsx';
import AdminStorageManagementPage from './pages/dashboards/admin/AdminStorageManagementPage.jsx';
import AdminDatabaseSettingsPage from './pages/dashboards/AdminDatabaseSettingsPage.jsx';
import AdminGdprSettingsPage from './pages/dashboards/admin/AdminGdprSettingsPage.jsx';
import AdminAdsSettingsPage from './pages/dashboards/admin/AdminAdsSettingsPage.jsx';
import AdminBlogManagementPage from './pages/admin/AdminBlogManagementPage.jsx';
import AdminVolunteeringPage from './pages/dashboards/admin/AdminVolunteeringPage.jsx';
import AdminProjectsPage from './pages/admin/AdminProjectsPage.jsx';
import AdminGigManagementPage from './pages/admin/AdminGigManagementPage.jsx';
import AdminJobPostManagementPage from './pages/dashboards/admin/AdminJobPostManagementPage.jsx';
import AdminJobApplicationsPage from './pages/dashboards/admin/AdminJobApplicationsPage.jsx';
import AdminCalendarPage from './pages/admin/AdminCalendarPage.jsx';
import AdminIdentityVerificationPage from './pages/dashboards/admin/AdminIdentityVerificationPage.jsx';
import AdminWalletManagementPage from './pages/dashboards/admin/AdminWalletManagementPage.jsx';
import AdminDisputeManagementPage from './pages/dashboards/admin/AdminDisputeManagementPage.jsx';
import AdminEscrowManagementPage from './pages/dashboards/admin/AdminEscrowManagementPage.jsx';
import AdminMobileAppManagementPage from './pages/admin/AdminMobileAppManagementPage.jsx';
import AdminSystemSettingsPage from './pages/dashboards/admin/SystemSettingsPage.jsx';
import AdminHomepageSettingsPage from './pages/admin/AdminHomepageSettingsPage.jsx';
import AdminPagesSettingsPage from './pages/dashboards/AdminPagesSettingsPage.jsx';
import AdminUserManagementPage from './pages/dashboards/admin/AdminUserManagementPage.jsx';
import AdminSiteManagementPage from './pages/dashboards/admin/AdminSiteManagementPage.jsx';
import AdminPolicyManagementPage from './pages/dashboards/admin/AdminPolicyManagementPage.jsx';
import AdminApiManagementPage from './pages/admin/AdminApiManagementPage.jsx';
import AdminEmailManagementPage from './pages/dashboards/admin/email/AdminEmailManagementPage.jsx';
import AdminTwoFactorManagementPage from './pages/dashboards/admin/AdminTwoFactorManagementPage.jsx';
import AdminSeoSettingsPage from './pages/dashboards/admin/AdminSeoSettingsPage.jsx';
import AdminProfileManagementPage from './pages/admin/AdminProfileManagementPage.jsx';
import FreelancerReviewsPreviewPage from './pages/previews/FreelancerReviewsPreviewPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute.jsx';
import MembershipGate from './components/auth/MembershipGate.jsx';
import RequireRole from './components/routing/RequireRole.jsx';
import AdminMentoringSessionManagementPage from './pages/dashboards/admin/AdminMentoringSessionManagementPage.jsx';
import { LAUNCHPAD_ALLOWED_MEMBERSHIPS, SECURITY_ALLOWED_MEMBERSHIPS } from './constants/access.js';

const COMMUNITY_ACCESS_MEMBERSHIPS = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
]);

const VOLUNTEER_ACCESS_MEMBERSHIPS = Object.freeze(['volunteer', 'mentor', 'admin']);

const userRoles = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

const PUBLIC_ROUTES = [
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
  { path: 'register/company', element: <CompanyRegisterPage /> },
  { path: 'profile/:id', element: <ProfilePage /> },
  { path: 'terms', element: <TermsPage /> },
  { path: 'privacy', element: <PrivacyPage /> },
  { path: 'about', element: <AboutPage /> },
  { path: 'preview/freelancer-reviews', element: <FreelancerReviewsPreviewPage /> },
  { path: 'blog', element: <BlogPage /> },
  { path: 'blog/:slug', element: <BlogArticlePage /> },
  { path: 'mentors', element: <MentorsPage /> },
];

const COMMUNITY_ROUTES = [
  { path: 'feed', element: <FeedPage /> },
  { path: 'search', element: <SearchPage /> },
  { path: 'jobs', element: <JobsPage /> },
  { path: 'gigs', element: <GigsPage /> },
  { path: 'projects', element: <ProjectsPage /> },
  { path: 'projects/new', element: <ProjectCreatePage /> },
  { path: 'projects/:projectId', element: <ProjectDetailPage /> },
  { path: 'projects/:projectId/auto-match', element: <ProjectAutoMatchPage /> },
  { path: 'groups', element: <GroupsPage /> },
  { path: 'groups/:groupId', element: <GroupProfilePage /> },
  { path: 'pages', element: <PagesPage /> },
  { path: 'connections', element: <ConnectionsPage /> },
  { path: 'notifications', element: <NotificationsPage /> },
  { path: 'trust-center', element: <TrustCenterPage /> },
  { path: 'auto-assign', element: <AutoAssignQueuePage /> },
  { path: 'inbox', element: <InboxPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: 'finance', element: <FinanceHubPage /> },
];

const VOLUNTEER_ROUTES = [{ path: 'volunteering', element: <VolunteeringPage /> }];

const LAUNCHPAD_ROUTES = [{ path: 'experience-launchpad', element: <LaunchpadPage /> }];

const SECURITY_ROUTES = [{ path: 'security-operations', element: <SecurityOperationsPage /> }];

const userDashboardRoutes = [
  { path: 'dashboard/user', element: <UserDashboardPage /> },
  { path: 'dashboard/user/creation-studio', element: <UserCreationStudioPage /> },
  { path: 'dashboard/user/projects', element: <UserProjectManagementPage /> },
  { path: 'dashboard/user/disputes', element: <UserDisputesPage /> },
  { path: 'dashboard/user/calendar', element: <UserCalendarPage /> },
  { path: 'dashboard/user/profile', element: <UserProfileHubPage /> },
];

const freelancerRoutes = [
  { path: 'dashboard/freelancer', element: <FreelancerDashboardPage /> },
  { path: 'dashboard/freelancer/volunteer', element: <FreelancerVolunteerPage /> },
  { path: 'dashboard/freelancer/planner', element: <FreelancerPlannerPage /> },
  { path: 'dashboard/freelancer/automatch', element: <FreelancerAutoMatchPage /> },
  { path: 'dashboard/freelancer/pipeline', element: <FreelancerPipelinePage /> },
  { path: 'dashboard/freelancer/portfolio', element: <FreelancerPortfolioPage /> },
  { path: 'dashboard/freelancer/creation-studio', element: <FreelancerCreationStudioPage /> },
  { path: 'dashboard/freelancer/documents', element: <FreelancerDocumentsPage /> },
  { path: 'dashboard/freelancer/networking', element: <FreelancerNetworkingPage /> },
  { path: 'dashboard/freelancer/disputes', element: <FreelancerDisputesPage /> },
];

const companyRoutes = [
  { path: 'dashboard/company', element: <CompanyDashboardPage /> },
  { path: 'dashboard/company/profile', element: <CompanyProfileWorkspacePage /> },
  { path: 'dashboard/company/creation-studio', element: <CompanyCreationStudioPage /> },
  { path: 'dashboard/company/wallets', element: <CompanyWalletManagementPage /> },
  { path: 'dashboard/company/analytics', element: <CompanyAnalyticsPage /> },
  { path: 'dashboard/company/projects', element: <CompanyProjectManagementPage /> },
  { path: 'dashboard/company/workspace', element: <CompanyProjectWorkspacePage /> },
  { path: 'dashboard/company/inbox', element: <CompanyInboxPage /> },
  { path: 'dashboard/company/timeline', element: <CompanyTimelineManagementPage /> },
  { path: 'dashboard/company/ats', element: <CompanyAtsOperationsPage /> },
  { path: 'dashboard/company/calendar', element: <CompanyCalendarPage /> },
  { path: 'dashboard/company/job-management', element: <CompanyJobManagementPage /> },
  { path: 'dashboard/company/groups', element: <CompanyGroupManagementPage /> },
  { path: 'dashboard/company/integrations', element: <CompanyIntegrationsPage /> },
  { path: 'dashboard/company/escrow', element: <CompanyEscrowManagementPage /> },
  { path: 'dashboard/company/pages', element: <CompanyPagesManagementPage /> },
  { path: 'dashboard/company/id-verification', element: <CompanyIdVerificationPage /> },
  { path: 'dashboard/company/volunteering', element: <CompanyVolunteeringManagementPage /> },
  { path: 'dashboard/company/integrations/crm', element: <CompanyCrmIntegrationsPage /> },
  { path: 'dashboard/company/ai-auto-reply', element: <CompanyByokAutoReplyPage /> },
  { path: 'dashboard/company/disputes', element: <CompanyDisputeManagementPage /> },
  { path: 'dashboard/company/networking', element: <CompanyNetworkingHubPage /> },
  { path: 'dashboard/company/networking/sessions', element: <NetworkingSessionsPage /> },
];

const agencyRoutes = [
  { path: 'dashboard/agency', element: <AgencyDashboardPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/disputes', element: <DisputeManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/escrow', element: <AgencyEscrowManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/crm', element: <AgencyCrmPipelinePage />, roles: ['agency', 'agency_admin'] },
  { path: 'dashboard/agency/integrations', element: <AgencyIntegrationsPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/ai', element: <AgencyAiAutomationPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/profile', element: <AgencyProfileManagementPage />, roles: ['agency', 'agency_admin'] },
  { path: 'dashboard/agency/client-kanban', element: <AgencyClientKanbanPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/wallet', element: <AgencyWalletManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/timeline', element: <AgencyTimelineDashboardPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/blog', element: <AgencyBlogManagementPage />, roles: ['agency', 'agency_admin', 'admin'] },
  { path: 'dashboard/agency/inbox', element: <AgencyInboxPage />, roles: ['agency'] },
  { path: 'dashboard/agency/workspace', element: <ProjectWorkspacePage />, roles: ['agency'] },
  { path: 'dashboard/agency/projects', element: <AgencyProjectManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/mentoring', element: <AgencyMentoringPage />, roles: ['agency'] },
  { path: 'dashboard/agency/job-management', element: <AgencyJobManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/calendar', element: <AgencyCalendarPage />, roles: ['agency'] },
  { path: 'dashboard/agency/events', element: <AgencyEventManagementPage />, roles: ['agency'] },
  { path: 'dashboard/agency/networking', element: <AgencyNetworkingManagementPage />, roles: ['agency', 'agency_admin', 'admin'] },
];

const headhunterRoutes = [{ path: 'dashboard/headhunter', element: <HeadhunterDashboardPage />, roles: ['headhunter'] }];

const mentorRoutes = [{ path: 'dashboard/mentor', element: <MentorDashboardPage />, roles: ['mentor'] }];

const launchpadRoutes = [{ path: 'dashboard/launchpad', element: <LaunchpadOperationsPage />, roles: ['admin', 'mentor'] }];

const adminRoutes = [
  { path: 'dashboard/admin', element: <AdminDashboardPage /> },
  { path: 'dashboard/admin/interviews', element: <AdminInterviewManagementPage /> },
  { path: 'dashboard/admin/inbox', element: <AdminInboxPage /> },
  { path: 'dashboard/admin/timelines', element: <AdminTimelineManagementPage /> },
  { path: 'dashboard/admin/appearance', element: <AdminAppearanceManagementPage /> },
  { path: 'dashboard/admin/storage', element: <AdminStorageManagementPage /> },
  { path: 'dashboard/admin/database', element: <AdminDatabaseSettingsPage /> },
  { path: 'dashboard/admin/gdpr', element: <AdminGdprSettingsPage /> },
  { path: 'dashboard/admin/ads-settings', element: <AdminAdsSettingsPage /> },
  { path: 'dashboard/admin/blog', element: <AdminBlogManagementPage /> },
  { path: 'dashboard/admin/volunteering', element: <AdminVolunteeringPage /> },
  { path: 'dashboard/admin/projects', element: <AdminProjectsPage /> },
  { path: 'dashboard/admin/gigs', element: <AdminGigManagementPage /> },
  { path: 'dashboard/admin/jobs', element: <AdminJobPostManagementPage /> },
  { path: 'dashboard/admin/job-applications', element: <AdminJobApplicationsPage /> },
  { path: 'dashboard/admin/calendar', element: <AdminCalendarPage /> },
  { path: 'dashboard/admin/identity-verification', element: <AdminIdentityVerificationPage /> },
  { path: 'dashboard/admin/wallets', element: <AdminWalletManagementPage /> },
  { path: 'dashboard/admin/disputes', element: <AdminDisputeManagementPage /> },
  { path: 'dashboard/admin/escrow', element: <AdminEscrowManagementPage /> },
  { path: 'dashboard/admin/mobile-apps', element: <AdminMobileAppManagementPage /> },
  { path: 'dashboard/admin/system-settings', element: <AdminSystemSettingsPage /> },
  { path: 'dashboard/admin/homepage', element: <AdminHomepageSettingsPage /> },
  { path: 'dashboard/admin/pages', element: <AdminPagesSettingsPage /> },
  { path: 'dashboard/admin/users', element: <AdminUserManagementPage /> },
  { path: 'dashboard/admin/site', element: <AdminSiteManagementPage /> },
  { path: 'dashboard/admin/policies', element: <AdminPolicyManagementPage /> },
  { path: 'dashboard/admin/api-management', element: <AdminApiManagementPage /> },
  { path: 'dashboard/admin/email', element: <AdminEmailManagementPage /> },
  { path: 'dashboard/admin/security/two-factor', element: <AdminTwoFactorManagementPage /> },
  { path: 'dashboard/admin/seo', element: <AdminSeoSettingsPage /> },
  { path: 'dashboard/admin/profiles', element: <AdminProfileManagementPage /> },
  { path: 'dashboard/admin/mentoring', element: <AdminMentoringSessionManagementPage /> },
];

function renderRoutes(routes) {
  return routes.map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));
}

function renderRequireRoleRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={<RequireRole allowedRoles={route.roles}>{route.element}</RequireRole>}
    />
  ));
}

function renderAdminRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={<RequireRole allowedRoles={['admin']}>{route.element}</RequireRole>}
    />
  ));
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
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
              <MembershipGate allowedMemberships={userRoles}>{route.element}</MembershipGate>
            </RoleProtectedRoute>
          }
        />
      ))}

      {freelancerRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<RequireRole allowedRoles={['freelancer']}>{route.element}</RequireRole>}
        />
      ))}

      {companyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<RequireRole allowedRoles={['company']}>{route.element}</RequireRole>}
        />
      ))}

      {renderRequireRoleRoutes(agencyRoutes)}
      {renderRequireRoleRoutes(headhunterRoutes)}
      {renderRequireRoleRoutes(mentorRoutes)}
      {renderRequireRoleRoutes(launchpadRoutes)}
      {renderAdminRoutes(adminRoutes)}

      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
