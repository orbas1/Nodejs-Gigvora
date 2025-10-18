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
import AdminSpeedNetworkingManagementPage from './pages/dashboards/admin/AdminSpeedNetworkingManagementPage.jsx';
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

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register/company" element={<CompanyRegisterPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="preview/freelancer-reviews" element={<FreelancerReviewsPreviewPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogArticlePage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="about" element={<AboutPage />} />

        <Route element={<ProtectedRoute requiredMemberships={COMMUNITY_ACCESS_MEMBERSHIPS} />}>
          <Route path="feed" element={<FeedPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="gigs" element={<GigsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<ProjectCreatePage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/auto-match" element={<ProjectAutoMatchPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:groupId" element={<GroupProfilePage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="trust-center" element={<TrustCenterPage />} />
          <Route path="auto-assign" element={<AutoAssignQueuePage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="finance" element={<FinanceHubPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredMemberships={VOLUNTEER_ACCESS_MEMBERSHIPS} />}>
          <Route path="volunteering" element={<VolunteeringPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredMemberships={LAUNCHPAD_ALLOWED_MEMBERSHIPS} />}>
          <Route path="experience-launchpad" element={<LaunchpadPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredMemberships={SECURITY_ALLOWED_MEMBERSHIPS} />}>
          <Route path="security-operations" element={<SecurityOperationsPage />} />
        </Route>

        <Route path="mentors" element={<MentorsPage />} />
      </Route>

      <Route
        path="dashboard/user"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserDashboardPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="dashboard/user/creation-studio"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserCreationStudioPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="dashboard/user/projects"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserProjectManagementPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="dashboard/user/disputes"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserDisputesPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="dashboard/user/calendar"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserCalendarPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />
      <Route
        path="dashboard/user/profile"
        element={
          <RoleProtectedRoute allowedRoles={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
            <MembershipGate allowedMemberships={['user', 'freelancer', 'agency', 'company', 'headhunter']}>
              <UserProfileHubPage />
            </MembershipGate>
          </RoleProtectedRoute>
        }
      />

      <Route
        path="dashboard/freelancer"
        element={
          <RequireRole allowedRoles={['freelancer']}>
            <FreelancerDashboardPage />
          </RequireRole>
        }
      />
      <Route path="dashboard/freelancer/volunteer" element={<RequireRole allowedRoles={['freelancer']}><FreelancerVolunteerPage /></RequireRole>} />
      <Route path="dashboard/freelancer/planner" element={<RequireRole allowedRoles={['freelancer']}><FreelancerPlannerPage /></RequireRole>} />
      <Route path="dashboard/freelancer/automatch" element={<RequireRole allowedRoles={['freelancer']}><FreelancerAutoMatchPage /></RequireRole>} />
      <Route path="dashboard/freelancer/pipeline" element={<RequireRole allowedRoles={['freelancer']}><FreelancerPipelinePage /></RequireRole>} />
      <Route path="dashboard/freelancer/portfolio" element={<RequireRole allowedRoles={['freelancer']}><FreelancerPortfolioPage /></RequireRole>} />
      <Route path="dashboard/freelancer/creation-studio" element={<RequireRole allowedRoles={['freelancer']}><FreelancerCreationStudioPage /></RequireRole>} />
      <Route path="dashboard/freelancer/networking" element={<RequireRole allowedRoles={['freelancer']}><FreelancerNetworkingPage /></RequireRole>} />
      <Route path="dashboard/freelancer/disputes" element={<RequireRole allowedRoles={['freelancer']}><FreelancerDisputesPage /></RequireRole>} />

      <Route
        path="dashboard/company"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyDashboardPage />
          </RequireRole>
        }
      />
      <Route path="dashboard/company/profile" element={<RequireRole allowedRoles={['company']}><CompanyProfileWorkspacePage /></RequireRole>} />
      <Route path="dashboard/company/creation-studio" element={<RequireRole allowedRoles={['company']}><CompanyCreationStudioPage /></RequireRole>} />
      <Route path="dashboard/company/wallets" element={<RequireRole allowedRoles={['company']}><CompanyWalletManagementPage /></RequireRole>} />
      <Route path="dashboard/company/analytics" element={<RequireRole allowedRoles={['company']}><CompanyAnalyticsPage /></RequireRole>} />
      <Route path="dashboard/company/projects" element={<RequireRole allowedRoles={['company']}><CompanyProjectManagementPage /></RequireRole>} />
      <Route path="dashboard/company/inbox" element={<RequireRole allowedRoles={['company']}><CompanyInboxPage /></RequireRole>} />
      <Route path="dashboard/company/timeline" element={<RequireRole allowedRoles={['company']}><CompanyTimelineManagementPage /></RequireRole>} />
      <Route path="dashboard/company/ats" element={<RequireRole allowedRoles={['company']}><CompanyAtsOperationsPage /></RequireRole>} />
      <Route path="dashboard/company/calendar" element={<RequireRole allowedRoles={['company']}><CompanyCalendarPage /></RequireRole>} />
      <Route path="dashboard/company/job-management" element={<RequireRole allowedRoles={['company']}><CompanyJobManagementPage /></RequireRole>} />
      <Route path="dashboard/company/groups" element={<RequireRole allowedRoles={['company']}><CompanyGroupManagementPage /></RequireRole>} />
      <Route path="dashboard/company/workspace" element={<RequireRole allowedRoles={['company']}><CompanyProjectWorkspacePage /></RequireRole>} />
      <Route path="dashboard/company/integrations" element={<RequireRole allowedRoles={['company']}><CompanyIntegrationsPage /></RequireRole>} />
      <Route path="dashboard/company/escrow" element={<RequireRole allowedRoles={['company']}><CompanyEscrowManagementPage /></RequireRole>} />
      <Route path="dashboard/company/pages" element={<RequireRole allowedRoles={['company']}><CompanyPagesManagementPage /></RequireRole>} />
      <Route path="dashboard/company/id-verification" element={<RequireRole allowedRoles={['company']}><CompanyIdVerificationPage /></RequireRole>} />
      <Route path="dashboard/company/volunteering" element={<RequireRole allowedRoles={['company']}><CompanyVolunteeringManagementPage /></RequireRole>} />
      <Route path="dashboard/company/integrations/crm" element={<RequireRole allowedRoles={['company']}><CompanyCrmIntegrationsPage /></RequireRole>} />
      <Route path="dashboard/company/ai-auto-reply" element={<RequireRole allowedRoles={['company']}><CompanyByokAutoReplyPage /></RequireRole>} />
      <Route path="dashboard/company/disputes" element={<RequireRole allowedRoles={['company']}><CompanyDisputeManagementPage /></RequireRole>} />
      <Route path="dashboard/company/networking" element={<RequireRole allowedRoles={['company']}><CompanyNetworkingHubPage /></RequireRole>} />
      <Route path="dashboard/company/networking/sessions" element={<RequireRole allowedRoles={['company']}><NetworkingSessionsPage /></RequireRole>} />

      <Route
        path="dashboard/agency"
        element={
          <RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}>
            <AgencyDashboardPage />
          </RequireRole>
        }
      />
      <Route path="dashboard/agency/disputes" element={<RequireRole allowedRoles={['agency']}><DisputeManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/networking" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyNetworkingManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/escrow" element={<RequireRole allowedRoles={['agency']}><AgencyEscrowManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/crm" element={<RequireRole allowedRoles={['agency', 'agency_admin']}><AgencyCrmPipelinePage /></RequireRole>} />
      <Route path="dashboard/agency/integrations" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyIntegrationsPage /></RequireRole>} />
      <Route path="dashboard/agency/ai" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyAiAutomationPage /></RequireRole>} />
      <Route path="dashboard/agency/profile" element={<RequireRole allowedRoles={['agency', 'agency_admin']}><AgencyProfileManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/client-kanban" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyClientKanbanPage /></RequireRole>} />
      <Route path="dashboard/agency/wallet" element={<RequireRole allowedRoles={['agency']}><AgencyWalletManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/timeline" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyTimelineDashboardPage /></RequireRole>} />
      <Route path="dashboard/agency/blog" element={<RequireRole allowedRoles={['agency', 'agency_admin', 'admin']}><AgencyBlogManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/inbox" element={<RequireRole allowedRoles={['agency']}><AgencyInboxPage /></RequireRole>} />
      <Route path="dashboard/agency/workspace" element={<RequireRole allowedRoles={['agency']}><ProjectWorkspacePage /></RequireRole>} />
      <Route path="dashboard/agency/projects" element={<RequireRole allowedRoles={['agency']}><AgencyProjectManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/mentoring" element={<RequireRole allowedRoles={['agency']}><AgencyMentoringPage /></RequireRole>} />
      <Route path="dashboard/agency/job-management" element={<RequireRole allowedRoles={['agency']}><AgencyJobManagementPage /></RequireRole>} />
      <Route path="dashboard/agency/calendar" element={<RequireRole allowedRoles={['agency']}><AgencyCalendarPage /></RequireRole>} />
      <Route path="dashboard/agency/events" element={<RequireRole allowedRoles={['agency']}><AgencyEventManagementPage /></RequireRole>} />

      <Route
        path="dashboard/headhunter"
        element={
          <RequireRole allowedRoles={['headhunter']}>
            <HeadhunterDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="dashboard/mentor"
        element={
          <RequireRole allowedRoles={['mentor']}>
            <MentorDashboardPage />
          </RequireRole>
        }
      />
      <Route
        path="dashboard/launchpad"
        element={
          <RequireRole allowedRoles={['admin', 'mentor']}>
            <LaunchpadOperationsPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/admin"
        element={
          <RequireRole allowedRoles={['admin']}>
            <AdminDashboardPage />
          </RequireRole>
        }
      />
      <Route path="dashboard/admin/interviews" element={<RequireRole allowedRoles={['admin']}><AdminInterviewManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/volunteering" element={<RequireRole allowedRoles={['admin']}><AdminVolunteeringPage /></RequireRole>} />
      <Route path="dashboard/admin/mentoring" element={<RequireRole allowedRoles={['admin']}><AdminMentoringSessionManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/inbox" element={<RequireRole allowedRoles={['admin']}><AdminInboxPage /></RequireRole>} />
      <Route path="dashboard/admin/job-applications" element={<RequireRole allowedRoles={['admin']}><AdminJobApplicationsPage /></RequireRole>} />
      <Route path="dashboard/admin/identity-verification" element={<RequireRole allowedRoles={['admin']}><AdminIdentityVerificationPage /></RequireRole>} />
      <Route path="dashboard/admin/timelines" element={<RequireRole allowedRoles={['admin']}><AdminTimelineManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/wallets" element={<RequireRole allowedRoles={['admin']}><AdminWalletManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/disputes" element={<RequireRole allowedRoles={['admin']}><AdminDisputeManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/escrow" element={<RequireRole allowedRoles={['admin']}><AdminEscrowManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/mobile-apps" element={<RequireRole allowedRoles={['admin']}><AdminMobileAppManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/system-settings" element={<RequireRole allowedRoles={['admin']}><AdminSystemSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/homepage" element={<RequireRole allowedRoles={['admin']}><AdminHomepageSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/pages" element={<RequireRole allowedRoles={['admin']}><AdminPagesSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/site" element={<RequireRole allowedRoles={['admin']}><AdminSiteManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/appearance" element={<RequireRole allowedRoles={['admin']}><AdminAppearanceManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/policies" element={<RequireRole allowedRoles={['admin']}><AdminPolicyManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/storage" element={<RequireRole allowedRoles={['admin']}><AdminStorageManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/email" element={<RequireRole allowedRoles={['admin']}><AdminEmailManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/security/two-factor" element={<RequireRole allowedRoles={['admin']}><AdminTwoFactorManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/database" element={<RequireRole allowedRoles={['admin']}><AdminDatabaseSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/gdpr" element={<RequireRole allowedRoles={['admin']}><AdminGdprSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/ads-settings" element={<RequireRole allowedRoles={['admin']}><AdminAdsSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/blog" element={<RequireRole allowedRoles={['admin']}><AdminBlogManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/users" element={<RequireRole allowedRoles={['admin']}><AdminUserManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/api-management" element={<RequireRole allowedRoles={['admin']}><AdminApiManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/seo" element={<RequireRole allowedRoles={['admin']}><AdminSeoSettingsPage /></RequireRole>} />
      <Route path="dashboard/admin/profiles" element={<RequireRole allowedRoles={['admin']}><AdminProfileManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/calendar" element={<RequireRole allowedRoles={['admin']}><AdminCalendarPage /></RequireRole>} />
      <Route path="dashboard/admin/jobs" element={<RequireRole allowedRoles={['admin']}><AdminJobPostManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/gig-management" element={<RequireRole allowedRoles={['admin']}><AdminGigManagementPage /></RequireRole>} />
      <Route path="dashboard/admin/projects" element={<RequireRole allowedRoles={['admin']}><AdminProjectsPage /></RequireRole>} />
      <Route path="dashboard/admin/speed-networking" element={<RequireRole allowedRoles={['admin']}><AdminSpeedNetworkingManagementPage /></RequireRole>} />

      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
