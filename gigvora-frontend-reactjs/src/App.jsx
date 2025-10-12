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
import LaunchpadPage from './pages/LaunchpadPage.jsx';
import VolunteeringPage from './pages/VolunteeringPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import TrustCenterPage from './pages/TrustCenter.jsx';
import AutoAssignQueuePage from './pages/AutoAssignQueuePage.jsx';

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
        <Route path="experience-launchpad" element={<LaunchpadPage />} />
        <Route path="volunteering" element={<VolunteeringPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="trust-center" element={<TrustCenterPage />} />
        <Route path="auto-assign" element={<AutoAssignQueuePage />} />
      </Route>
      <Route path="admin" element={<AdminLoginPage />} />
    </Routes>
  );
}
