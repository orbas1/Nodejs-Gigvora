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
import FreelancerDashboardPage from './pages/dashboards/FreelancerDashboardPage.jsx';
import CompanyDashboardPage from './pages/dashboards/CompanyDashboardPage.jsx';
import AgencyDashboardPage from './pages/dashboards/AgencyDashboardPage.jsx';
import HeadhunterDashboardPage from './pages/dashboards/HeadhunterDashboardPage.jsx';
import MentorDashboardPage from './pages/dashboards/MentorDashboardPage.jsx';
import LaunchpadOperationsPage from './pages/dashboards/LaunchpadOperationsPage.jsx';
import AdminDashboardPage from './pages/dashboards/AdminDashboardPage.jsx';
import FreelancerReviewsPreviewPage from './pages/previews/FreelancerReviewsPreviewPage.jsx';
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
];

const freelancerRoutes = [
  { path: 'dashboard/freelancer', element: <FreelancerDashboardPage />, roles: ['freelancer'] },
];

const companyRoutes = [
  { path: 'dashboard/company', element: <CompanyDashboardPage />, roles: ['company'] },
];

const agencyRoutes = [
  { path: 'dashboard/agency', element: <AgencyDashboardPage />, roles: ['agency', 'agency_admin', 'admin'] },
];

const headhunterRoutes = [{ path: 'dashboard/headhunter', element: <HeadhunterDashboardPage />, roles: ['headhunter'] }];

const mentorRoutes = [{ path: 'dashboard/mentor', element: <MentorDashboardPage />, roles: ['mentor'] }];

const launchpadRoutes = [{ path: 'dashboard/launchpad', element: <LaunchpadOperationsPage />, roles: ['admin', 'mentor'] }];

const adminRoutes = [{ path: 'dashboard/admin', element: <AdminDashboardPage />, roles: ['admin'] }];

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

function renderUserDashboardRoutes(routes) {
  return routes.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RoleProtectedRoute allowedRoles={userRoles}>
          <MembershipGate allowedMemberships={userRoles}>{route.element}</MembershipGate>
        </RoleProtectedRoute>
      }
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

      {renderUserDashboardRoutes(userDashboardRoutes)}
      {renderRequireRoleRoutes(freelancerRoutes)}
      {renderRequireRoleRoutes(companyRoutes)}
      {renderRequireRoleRoutes(agencyRoutes)}
      {renderRequireRoleRoutes(headhunterRoutes)}
      {renderRequireRoleRoutes(mentorRoutes)}
      {renderRequireRoleRoutes(launchpadRoutes)}
      {renderRequireRoleRoutes(adminRoutes)}
      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
