const createRoute = (path, module, meta = {}) => ({
  path,
  module,
  title: meta.title ?? null,
  description: meta.description ?? null,
  navLabel: meta.navLabel ?? meta.title ?? path,
  guard: meta.guard ?? 'public',
  roles: meta.roles ?? null,
  category: meta.category ?? meta.guard ?? 'public',
});

export const COMMUNITY_ACCESS_MEMBERSHIPS = Object.freeze([
  'user',
  'freelancer',
  'agency',
  'company',
  'mentor',
  'headhunter',
]);

export const VOLUNTEER_ACCESS_MEMBERSHIPS = Object.freeze(['volunteer', 'mentor', 'admin']);

export const LAUNCHPAD_ALLOWED_MEMBERSHIPS = Object.freeze(['mentor', 'admin', 'agency']);

export const SECURITY_ALLOWED_MEMBERSHIPS = Object.freeze(['admin', 'security', 'agency']);

const publicRoutes = [
  createRoute('login', './pages/LoginPage.jsx', { title: 'Sign in', category: 'public' }),
  createRoute('register', './pages/RegisterPage.jsx', { title: 'Create account', category: 'public' }),
  createRoute('register/company', './pages/CompanyRegisterPage.jsx', {
    title: 'Register company',
    category: 'public',
  }),
  createRoute('profile/:id', './pages/ProfilePage.jsx', { title: 'Public profile', category: 'public' }),
  createRoute('terms', './pages/TermsPage.jsx', { title: 'Terms of service', category: 'policy' }),
  createRoute('privacy', './pages/PrivacyPage.jsx', { title: 'Privacy policy', category: 'policy' }),
  createRoute('refunds', './pages/RefundPolicyPage.jsx', { title: 'Refund policy', category: 'policy' }),
  createRoute('community-guidelines', './pages/CommunityGuidelinesPage.jsx', {
    title: 'Community guidelines',
    category: 'policy',
  }),
  createRoute('faq', './pages/FaqPage.jsx', { title: 'Frequently asked questions', category: 'support' }),
  createRoute('about', './pages/AboutPage.jsx', { title: 'About Gigvora', category: 'marketing' }),
  createRoute('preview/freelancer-reviews', './pages/previews/FreelancerReviewsPreviewPage.jsx', {
    title: 'Freelancer reviews preview',
    category: 'marketing',
  }),
  createRoute('blog', './pages/BlogPage.jsx', { title: 'Blog', category: 'marketing' }),
  createRoute('blog/:slug', './pages/BlogArticlePage.jsx', { title: 'Blog article', category: 'marketing' }),
  createRoute('mentors', './pages/MentorsPage.jsx', { title: 'Mentors', category: 'marketing' }),
];

const communityRoutes = [
  createRoute('feed', './pages/FeedPage.jsx', { title: 'Community feed', guard: 'community' }),
  createRoute('search', './pages/SearchPage.jsx', { title: 'Global search', guard: 'community' }),
  createRoute('explorer/:category/:recordId', './pages/ExplorerRecordPage.jsx', {
    title: 'Explorer record',
    guard: 'community',
  }),
  createRoute('jobs', './pages/JobsPage.jsx', { title: 'Jobs marketplace', guard: 'community' }),
  createRoute('gigs', './pages/GigsPage.jsx', { title: 'Gig marketplace', guard: 'community' }),
  createRoute('projects', './pages/ProjectsPage.jsx', { title: 'Projects marketplace', guard: 'community' }),
  createRoute('creation-studio', './pages/CreationStudioWizardPage.jsx', {
    title: 'Creation studio wizard',
    guard: 'community',
  }),
  createRoute('users/:userId', './pages/UserProfileViewPage.jsx', { title: 'User profile', guard: 'community' }),
  createRoute('projects/new', './pages/ProjectCreatePage.jsx', { title: 'Create project', guard: 'community' }),
  createRoute('projects/:projectId', './pages/ProjectDetailPage.jsx', {
    title: 'Project details',
    guard: 'community',
  }),
  createRoute('projects/:projectId/auto-match', './pages/ProjectAutoMatchPage.jsx', {
    title: 'Project auto-match',
    guard: 'community',
  }),
  createRoute('groups', './pages/GroupsPage.jsx', { title: 'Groups', guard: 'community' }),
  createRoute('groups/:groupId', './pages/GroupProfilePage.jsx', { title: 'Group profile', guard: 'community' }),
  createRoute('pages', './pages/PagesPage.jsx', { title: 'Pages', guard: 'community' }),
  createRoute('connections', './pages/ConnectionsPage.jsx', { title: 'Connections', guard: 'community' }),
  createRoute('notifications', './pages/NotificationsPage.jsx', { title: 'Notifications', guard: 'community' }),
  createRoute('trust-center', './pages/TrustCenter.jsx', { title: 'Trust center', guard: 'community' }),
  createRoute('auto-assign', './pages/AutoAssignQueuePage.jsx', { title: 'Auto-assign', guard: 'community' }),
  createRoute('inbox', './pages/InboxPage.jsx', { title: 'Inbox', guard: 'community' }),
  createRoute('settings', './pages/SettingsPage.jsx', { title: 'Settings', guard: 'community' }),
  createRoute('finance', './pages/FinanceHubPage.jsx', { title: 'Finance hub', guard: 'community' }),
];

const volunteerRoutes = [
  createRoute('volunteering', './pages/VolunteeringPage.jsx', { title: 'Volunteering hub', guard: 'volunteer' }),
];

const launchpadRoutes = [
  createRoute('experience-launchpad', './pages/LaunchpadPage.jsx', { title: 'Experience launchpad', guard: 'launchpad' }),
];

const securityRoutes = [
  createRoute('security-operations', './pages/SecurityOperationsPage.jsx', {
    title: 'Security operations',
    guard: 'security',
  }),
];

const userDashboardRoutes = [
  createRoute('dashboard/user', './pages/dashboards/UserDashboardPage.jsx', {
    title: 'User dashboard',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
  createRoute('dashboard/user/creation-studio', './pages/dashboards/UserCreationStudioPage.jsx', {
    title: 'User creation studio',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
  createRoute('dashboard/user/projects', './pages/dashboards/UserProjectManagementPage.jsx', {
    title: 'User projects',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
  createRoute('dashboard/user/disputes', './pages/dashboards/UserDisputesPage.jsx', {
    title: 'User disputes',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
  createRoute('dashboard/user/calendar', './pages/dashboards/user/UserCalendarPage.jsx', {
    title: 'User calendar',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
  createRoute('dashboard/user/profile', './pages/dashboards/UserProfileHubPage.jsx', {
    title: 'User profile hub',
    guard: 'dashboard',
    roles: ['user', 'freelancer', 'agency', 'company', 'headhunter'],
  }),
];

const freelancerRoutes = [
  createRoute('dashboard/freelancer', './pages/dashboards/FreelancerDashboardPage.jsx', {
    title: 'Freelancer dashboard',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/volunteer', './pages/dashboards/FreelancerVolunteerPage.jsx', {
    title: 'Freelancer volunteering',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/planner', './pages/dashboards/FreelancerPlannerPage.jsx', {
    title: 'Freelancer planner',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/automatch', './pages/dashboards/FreelancerAutoMatchPage.jsx', {
    title: 'Freelancer auto-match',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/pipeline', './pages/dashboards/FreelancerPipelinePage.jsx', {
    title: 'Freelancer pipeline',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/portfolio', './pages/dashboards/FreelancerPortfolioPage.jsx', {
    title: 'Freelancer portfolio',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/creation-studio', './pages/dashboards/FreelancerCreationStudioPage.jsx', {
    title: 'Freelancer creation studio',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/documents', './pages/dashboards/freelancer/FreelancerDocumentsPage.jsx', {
    title: 'Freelancer documents',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/networking', './pages/dashboards/freelancer/FreelancerNetworkingPage.jsx', {
    title: 'Freelancer networking',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
  createRoute('dashboard/freelancer/disputes', './pages/dashboards/freelancer/FreelancerDisputesPage.jsx', {
    title: 'Freelancer disputes',
    guard: 'dashboard',
    roles: ['freelancer'],
  }),
];

const companyRoutes = [
  createRoute('dashboard/company', './pages/dashboards/CompanyDashboardPage.jsx', {
    title: 'Company dashboard',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/profile', './pages/dashboards/CompanyProfileWorkspacePage.jsx', {
    title: 'Company profile workspace',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/creation-studio', './pages/dashboards/CompanyCreationStudioPage.jsx', {
    title: 'Company creation studio',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/hub', './pages/dashboards/CompanyHubPage.jsx', {
    title: 'Company hub',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/metrics', './pages/dashboards/CompanyMetricsPage.jsx', {
    title: 'Company metrics',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/wallets', './pages/dashboards/CompanyWalletManagementPage.jsx', {
    title: 'Company wallets',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/settings', './pages/dashboards/CompanySettingsPage.jsx', {
    title: 'Company settings',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/system-preferences', './pages/dashboards/CompanySystemPreferencesPage.jsx', {
    title: 'Company system preferences',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/analytics', './pages/dashboards/CompanyAnalyticsPage.jsx', {
    title: 'Company analytics',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/projects', './pages/dashboards/CompanyProjectManagementPage.jsx', {
    title: 'Company project management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/workspace', './pages/dashboards/company/CompanyProjectWorkspacePage.jsx', {
    title: 'Company project workspace',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/inbox', './pages/dashboards/CompanyInboxPage.jsx', {
    title: 'Company inbox',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/timeline', './pages/dashboards/CompanyTimelineManagementPage.jsx', {
    title: 'Company timeline management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/ats', './pages/dashboards/CompanyAtsOperationsPage.jsx', {
    title: 'Company ATS operations',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/calendar', './pages/dashboards/CompanyCalendarPage.jsx', {
    title: 'Company calendar',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/job-management', './pages/dashboards/CompanyJobManagementPage.jsx', {
    title: 'Company job management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/launchpad-jobs', './pages/dashboards/CompanyLaunchpadJobManagementPage.jsx', {
    title: 'Company launchpad jobs',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/orders', './pages/dashboards/CompanyOrdersPage.jsx', {
    title: 'Company orders',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/ads', './pages/dashboards/CompanyAdsPage.jsx', {
    title: 'Company ads',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/groups', './pages/dashboards/CompanyGroupManagementPage.jsx', {
    title: 'Company group management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/integrations', './pages/dashboards/CompanyIntegrationsPage.jsx', {
    title: 'Company integrations',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/escrow', './pages/dashboards/CompanyEscrowManagementPage.jsx', {
    title: 'Company escrow',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/pages', './pages/dashboards/CompanyPagesManagementPage.jsx', {
    title: 'Company pages management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/id-verification', './pages/dashboards/CompanyIdVerificationPage.jsx', {
    title: 'Company ID verification',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/volunteering', './pages/dashboards/CompanyVolunteeringManagementPage.jsx', {
    title: 'Company volunteering',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/integrations/crm', './pages/dashboards/CompanyCrmIntegrationsPage.jsx', {
    title: 'Company CRM integrations',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/ai-auto-reply', './pages/dashboards/CompanyByokAutoReplyPage.jsx', {
    title: 'Company AI auto reply',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/disputes', './pages/dashboards/company/CompanyDisputeManagementPage.jsx', {
    title: 'Company dispute management',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/networking', './pages/networking/CompanyNetworkingHubPage.jsx', {
    title: 'Company networking hub',
    guard: 'dashboard',
    roles: ['company'],
  }),
  createRoute('dashboard/company/networking/sessions', './pages/networking/NetworkingSessionsPage.jsx', {
    title: 'Networking sessions',
    guard: 'dashboard',
    roles: ['company'],
  }),
];

const agencyRoutes = [
  createRoute('dashboard/agency', './pages/dashboards/AgencyDashboardPage.jsx', {
    title: 'Agency dashboard',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/disputes', './pages/dashboards/agency/DisputeManagementPage.jsx', {
    title: 'Agency disputes',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/escrow', './pages/dashboards/agency/AgencyEscrowManagementPage.jsx', {
    title: 'Agency escrow',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/crm', './pages/dashboards/AgencyCrmPipelinePage.jsx', {
    title: 'Agency CRM pipeline',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin'],
  }),
  createRoute('dashboard/agency/integrations', './pages/dashboards/AgencyIntegrationsPage.jsx', {
    title: 'Agency integrations',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/ai', './pages/dashboards/AgencyAiAutomationPage.jsx', {
    title: 'Agency AI automation',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/profile', './pages/dashboards/AgencyProfileManagementPage.jsx', {
    title: 'Agency profile management',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin'],
  }),
  createRoute('dashboard/agency/client-kanban', './pages/dashboards/AgencyClientKanbanPage.jsx', {
    title: 'Agency client kanban',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/wallet', './pages/dashboards/agency/AgencyWalletManagementPage.jsx', {
    title: 'Agency wallet management',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/timeline', './pages/dashboards/agency/AgencyTimelineDashboardPage.jsx', {
    title: 'Agency timeline',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/blog', './pages/dashboards/AgencyBlogManagementPage.jsx', {
    title: 'Agency blog management',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/inbox', './pages/dashboards/agency/AgencyInboxPage.jsx', {
    title: 'Agency inbox',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/workspace', './pages/dashboards/agency/ProjectWorkspacePage.jsx', {
    title: 'Agency workspace',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/projects', './pages/dashboards/AgencyProjectManagementPage.jsx', {
    title: 'Agency projects',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/mentoring', './pages/dashboards/AgencyMentoringPage.jsx', {
    title: 'Agency mentoring',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/job-management', './pages/dashboards/agency/AgencyJobManagementPage.jsx', {
    title: 'Agency job management',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/interviews', './pages/dashboards/agency/AgencyInterviewsPage.jsx', {
    title: 'Agency interviews',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/calendar', './pages/dashboards/agency/AgencyCalendarPage.jsx', {
    title: 'Agency calendar',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/id-verification', './pages/dashboards/agency/AgencyIdVerificationPage.jsx', {
    title: 'Agency ID verification',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
  createRoute('dashboard/agency/support', './pages/dashboards/agency/AgencySupportDeskPage.jsx', {
    title: 'Agency support desk',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/events', './pages/dashboards/agency/AgencyEventManagementPage.jsx', {
    title: 'Agency events',
    guard: 'dashboard',
    roles: ['agency'],
  }),
  createRoute('dashboard/agency/networking', './pages/dashboards/agency/AgencyNetworkingManagementPage.jsx', {
    title: 'Agency networking',
    guard: 'dashboard',
    roles: ['agency', 'agency_admin', 'admin'],
  }),
];

const headhunterRoutes = [
  createRoute('dashboard/headhunter', './pages/dashboards/HeadhunterDashboardPage.jsx', {
    title: 'Headhunter dashboard',
    guard: 'dashboard',
    roles: ['headhunter'],
  }),
];

const mentorRoutes = [
  createRoute('dashboard/mentor', './pages/dashboards/MentorDashboardPage.jsx', {
    title: 'Mentor dashboard',
    guard: 'dashboard',
    roles: ['mentor'],
  }),
];

const launchpadOperationsRoutes = [
  createRoute('dashboard/launchpad', './pages/dashboards/LaunchpadOperationsPage.jsx', {
    title: 'Launchpad operations',
    guard: 'dashboard',
    roles: ['admin', 'mentor'],
  }),
];

const adminRoutes = [
  createRoute('dashboard/admin', './pages/dashboards/AdminDashboardPage.jsx', { title: 'Admin dashboard', guard: 'admin' }),
  createRoute('dashboard/admin/finance', './pages/dashboards/admin/AdminFinancialManagementPage.jsx', {
    title: 'Admin finance',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/interviews', './pages/dashboards/AdminInterviewManagementPage.jsx', {
    title: 'Admin interviews',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/inbox', './pages/dashboards/AdminInboxPage.jsx', { title: 'Admin inbox', guard: 'admin' }),
  createRoute('dashboard/admin/moderation', './pages/dashboards/admin/AdminModerationDashboardPage.jsx', {
    title: 'Admin moderation',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/timelines', './pages/dashboards/admin/AdminTimelineManagementPage.jsx', {
    title: 'Admin timelines',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/appearance', './pages/dashboards/admin/AdminAppearanceManagementPage.jsx', {
    title: 'Admin appearance',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/storage', './pages/dashboards/admin/AdminStorageManagementPage.jsx', {
    title: 'Admin storage',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/database', './pages/dashboards/AdminDatabaseSettingsPage.jsx', {
    title: 'Admin database settings',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/gdpr', './pages/dashboards/admin/AdminGdprSettingsPage.jsx', {
    title: 'Admin GDPR settings',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/compliance', './pages/dashboards/admin/AdminComplianceManagementPage.jsx', {
    title: 'Admin compliance',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/maintenance', './pages/dashboards/admin/AdminMaintenanceModePage.jsx', {
    title: 'Admin maintenance',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/documents', './pages/dashboards/admin/AdminDocumentsManagementPage.jsx', {
    title: 'Admin documents',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/ads-settings', './pages/dashboards/admin/AdminAdsSettingsPage.jsx', {
    title: 'Admin ads settings',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/blog', './pages/admin/AdminBlogManagementPage.jsx', { title: 'Admin blog', guard: 'admin' }),
  createRoute('dashboard/admin/volunteering', './pages/dashboards/admin/AdminVolunteeringPage.jsx', {
    title: 'Admin volunteering',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/projects', './pages/admin/AdminProjectsPage.jsx', { title: 'Admin projects', guard: 'admin' }),
  createRoute('dashboard/admin/gigs', './pages/admin/AdminGigManagementPage.jsx', { title: 'Admin gigs', guard: 'admin' }),
  createRoute('dashboard/admin/jobs', './pages/dashboards/admin/AdminJobPostManagementPage.jsx', {
    title: 'Admin jobs',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/job-applications', './pages/dashboards/admin/AdminJobApplicationsPage.jsx', {
    title: 'Admin job applications',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/calendar', './pages/admin/AdminCalendarPage.jsx', { title: 'Admin calendar', guard: 'admin' }),
  createRoute('dashboard/admin/identity-verification', './pages/dashboards/admin/AdminIdentityVerificationPage.jsx', {
    title: 'Admin identity verification',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/wallets', './pages/dashboards/admin/AdminWalletManagementPage.jsx', {
    title: 'Admin wallets',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/disputes', './pages/dashboards/admin/AdminDisputeManagementPage.jsx', {
    title: 'Admin disputes',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/escrow', './pages/dashboards/admin/AdminEscrowManagementPage.jsx', {
    title: 'Admin escrow',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/mobile-apps', './pages/admin/AdminMobileAppManagementPage.jsx', {
    title: 'Admin mobile apps',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/system-settings', './pages/dashboards/admin/SystemSettingsPage.jsx', {
    title: 'Admin system settings',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/homepage', './pages/admin/AdminHomepageSettingsPage.jsx', {
    title: 'Admin homepage',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/pages', './pages/dashboards/AdminPagesSettingsPage.jsx', {
    title: 'Admin pages',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/users', './pages/dashboards/admin/AdminUserManagementPage.jsx', {
    title: 'Admin users',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/site', './pages/dashboards/admin/AdminSiteManagementPage.jsx', {
    title: 'Admin site management',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/policies', './pages/dashboards/admin/AdminPolicyManagementPage.jsx', {
    title: 'Admin policies',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/api-management', './pages/admin/AdminApiManagementPage.jsx', {
    title: 'Admin API management',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/email', './pages/dashboards/admin/email/AdminEmailManagementPage.jsx', {
    title: 'Admin email',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/security/two-factor', './pages/dashboards/admin/AdminTwoFactorManagementPage.jsx', {
    title: 'Admin two-factor',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/seo', './pages/dashboards/admin/AdminSeoSettingsPage.jsx', {
    title: 'Admin SEO',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/profiles', './pages/admin/AdminProfileManagementPage.jsx', {
    title: 'Admin profiles',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/speed-networking', './pages/dashboards/admin/AdminSpeedNetworkingManagementPage.jsx', {
    title: 'Admin speed networking',
    guard: 'admin',
  }),
  createRoute('dashboard/admin/mentoring', './pages/dashboards/admin/AdminMentoringSessionManagementPage.jsx', {
    title: 'Admin mentoring',
    guard: 'admin',
  }),
];

export const ROUTE_GROUPS = Object.freeze({
  public: publicRoutes,
  community: communityRoutes,
  volunteer: volunteerRoutes,
  launchpad: launchpadRoutes,
  security: securityRoutes,
  userDashboard: userDashboardRoutes,
  freelancer: freelancerRoutes,
  company: companyRoutes,
  agency: agencyRoutes,
  headhunter: headhunterRoutes,
  mentor: mentorRoutes,
  launchpadOps: launchpadOperationsRoutes,
  admin: adminRoutes,
});

const metadataIndex = new Map();
Object.values(ROUTE_GROUPS).forEach((routes) => {
  routes.forEach((route) => {
    metadataIndex.set(route.path, route);
  });
});

export function getRouteGroup(groupKey) {
  return ROUTE_GROUPS[groupKey] ?? [];
}

export function getRouteMetadata(path) {
  return metadataIndex.get(path) ?? null;
}

export function listAllRoutes() {
  return Array.from(metadataIndex.values());
}
