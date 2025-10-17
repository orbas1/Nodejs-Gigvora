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
import UserDisputesPage from './pages/dashboards/UserDisputesPage.jsx';
import FreelancerDashboardPage from './pages/dashboards/FreelancerDashboardPage.jsx';
import FreelancerPipelinePage from './pages/dashboards/FreelancerPipelinePage.jsx';
import CompanyDashboardPage from './pages/dashboards/CompanyDashboardPage.jsx';
import CompanyAtsOperationsPage from './pages/dashboards/CompanyAtsOperationsPage.jsx';
import CompanyAnalyticsPage from './pages/dashboards/CompanyAnalyticsPage.jsx';
import CompanyIntegrationsPage from './pages/dashboards/CompanyIntegrationsPage.jsx';
import CompanyNetworkingHubPage from './pages/networking/CompanyNetworkingHubPage.jsx';
import AgencyDashboardPage from './pages/dashboards/AgencyDashboardPage.jsx';
import HeadhunterDashboardPage from './pages/dashboards/HeadhunterDashboardPage.jsx';
import MentorDashboardPage from './pages/dashboards/MentorDashboardPage.jsx';
import LaunchpadOperationsPage from './pages/dashboards/LaunchpadOperationsPage.jsx';
import AdminDashboardPage from './pages/dashboards/AdminDashboardPage.jsx';
import AdminBlogManagementPage from './pages/admin/AdminBlogManagementPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute.jsx';
import MembershipGate from './components/auth/MembershipGate.jsx';
import RequireRole from './components/routing/RequireRole.jsx';
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
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogArticlePage />} />

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

        <Route path="mentors" element={<MentorsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="gigs" element={<GigsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectCreatePage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="projects/:projectId/auto-match" element={<ProjectAutoMatchPage />} />

        <Route element={<ProtectedRoute requiredMemberships={LAUNCHPAD_ALLOWED_MEMBERSHIPS} />}>  
          <Route path="experience-launchpad" element={<LaunchpadPage />} />
        </Route>

        <Route path="mentors" element={<MentorsPage />} />
        <Route path="volunteering" element={<VolunteeringPage />} />

        <Route element={<ProtectedRoute requiredMemberships={COMMUNITY_ACCESS_MEMBERSHIPS} />}>  
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:groupId" element={<GroupProfilePage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="inbox" element={<InboxPage />} />
        </Route>

        <Route element={<ProtectedRoute requiredMemberships={SECURITY_ALLOWED_MEMBERSHIPS} />}>  
          <Route path="security-operations" element={<SecurityOperationsPage />} />
        </Route>

        <Route path="trust-center" element={<TrustCenterPage />} />
        <Route path="finance" element={<FinanceHubPage />} />
        <Route path="auto-assign" element={<AutoAssignQueuePage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="about" element={<AboutPage />} />
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
        path="dashboard/freelancer"
        element={
          <RequireRole allowedRoles={['freelancer']}>
            <FreelancerDashboardPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/freelancer/pipeline"
        element={
          <RequireRole allowedRoles={['freelancer']}>
            <FreelancerPipelinePage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/company"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyDashboardPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/company/analytics"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyAnalyticsPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/company/ats"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyAtsOperationsPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/company/integrations"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyIntegrationsPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/company/networking"
        element={
          <RequireRole allowedRoles={['company']}>
            <CompanyNetworkingHubPage />
          </RequireRole>
        }
      />

      <Route
        path="dashboard/agency"
        element={
          <RequireRole allowedRoles={['agency']}>
            <AgencyDashboardPage />
          </RequireRole>
        }
      />

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

      <Route
        path="dashboard/admin/blog"
        element={
          <RequireRole allowedRoles={['admin']}>
            <AdminBlogManagementPage />
          </RequireRole>
        }
      />

      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
