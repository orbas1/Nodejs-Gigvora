import { Routes, Route } from 'react-router-dom';
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
import LaunchpadPage from './pages/LaunchpadPage.jsx';
import MentorsPage from './pages/MentorsPage.jsx';
import VolunteeringPage from './pages/VolunteeringPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupProfilePage from './pages/GroupProfilePage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import TrustCenterPage from './pages/TrustCenter.jsx';
import AutoAssignQueuePage from './pages/AutoAssignQueuePage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import FinanceHubPage from './pages/FinanceHubPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import UserDashboardPage from './pages/dashboards/UserDashboardPage.jsx';
import FreelancerDashboardPage from './pages/dashboards/FreelancerDashboardPage.jsx';
import FreelancerPipelinePage from './pages/dashboards/FreelancerPipelinePage.jsx';
import AdminDashboardPage from './pages/dashboards/AdminDashboardPage.jsx';
import AgencyDashboardPage from './pages/dashboards/AgencyDashboardPage.jsx';
import CompanyDashboardPage from './pages/dashboards/CompanyDashboardPage.jsx';
import HeadhunterDashboardPage from './pages/dashboards/HeadhunterDashboardPage.jsx';
import CompanyNetworkingHubPage from './pages/networking/CompanyNetworkingHubPage.jsx';
import MentorDashboardPage from './pages/dashboards/MentorDashboardPage.jsx';
import LaunchpadOperationsPage from './pages/dashboards/LaunchpadOperationsPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';

const COMMUNITY_ACCESS_MEMBERSHIPS = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'];

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register/company" element={<CompanyRegisterPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="gigs" element={<GigsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectCreatePage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="experience-launchpad" element={<LaunchpadPage />} />
        <Route path="mentors" element={<MentorsPage />} />
        <Route path="volunteering" element={<VolunteeringPage />} />
        <Route element={<ProtectedRoute requiredMemberships={COMMUNITY_ACCESS_MEMBERSHIPS} />}>
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:groupId" element={<GroupProfilePage />} />
        </Route>
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="trust-center" element={<TrustCenterPage />} />
        <Route path="auto-assign" element={<AutoAssignQueuePage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="finance" element={<FinanceHubPage />} />
      </Route>
      <Route path="dashboard/user" element={<UserDashboardPage />} />
      <Route path="dashboard/freelancer" element={<FreelancerDashboardPage />} />
      <Route path="dashboard/freelancer/pipeline" element={<FreelancerPipelinePage />} />
      <Route path="dashboard/admin" element={<AdminDashboardPage />} />
      <Route path="dashboard/agency" element={<AgencyDashboardPage />} />
      <Route path="dashboard/company" element={<CompanyDashboardPage />} />
      <Route path="dashboard/company/networking" element={<CompanyNetworkingHubPage />} />
      <Route path="dashboard/headhunter" element={<HeadhunterDashboardPage />} />
      <Route path="dashboard/mentor" element={<MentorDashboardPage />} />
      <Route path="dashboard/launchpad" element={<LaunchpadOperationsPage />} />
      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
