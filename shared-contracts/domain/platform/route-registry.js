import { freezeDeep } from '../utils/freezeDeep.js';

const COMMUNITY_MEMBERSHIPS = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter'];
const VOLUNTEER_MEMBERSHIPS = ['volunteer', 'mentor', 'admin'];
const USER_ROLES = ['user', 'freelancer', 'agency', 'company', 'headhunter'];
const LAUNCHPAD_MEMBERSHIPS = ['freelancer', 'mentor', 'agency', 'company', 'admin'];
const SECURITY_MEMBERSHIPS = ['security', 'trust', 'admin'];

const ROUTE_COLLECTION_DEFINITIONS = {
  standalone: {
    persona: 'public',
    icon: 'home',
    routes: [
      {
        key: 'home',
        path: '/',
        index: true,
        module: 'pages/HomePage.jsx',
        title: 'Home',
        icon: 'home',
      },
      {
        key: 'adminLogin',
        path: '/admin',
        module: 'pages/AdminLoginPage.jsx',
        title: 'Admin Login',
        icon: 'shield-exclamation',
        persona: 'admin',
        featureFlag: 'admin.access',
        shellTheme: 'midnight',
      },
    ],
  },
  public: {
    persona: 'public',
    icon: 'globe-alt',
    routes: [
      { path: 'login', module: 'pages/LoginPage.jsx' },
      { path: 'register', module: 'pages/RegisterPage.jsx' },
      { path: 'register/company', module: 'pages/CompanyRegisterPage.jsx' },
      { path: 'forgot-password', module: 'pages/ForgotPasswordPage.jsx' },
      { path: 'reset-password', module: 'pages/ResetPasswordPage.jsx' },
      { path: 'auth/callback', module: 'pages/SocialAuthCallbackPage.jsx' },
      { path: 'profile/:id', module: 'pages/ProfilePage.jsx' },
      { path: 'terms', module: 'pages/TermsPage.jsx' },
      { path: 'privacy', module: 'pages/PrivacyPage.jsx' },
      { path: 'refunds', module: 'pages/RefundPolicyPage.jsx' },
      { path: 'community-guidelines', module: 'pages/CommunityGuidelinesPage.jsx' },
      { path: 'faq', module: 'pages/FaqPage.jsx' },
      { path: 'about', module: 'pages/AboutPage.jsx' },
      { path: 'preview/freelancer-reviews', module: 'pages/previews/FreelancerReviewsPreviewPage.jsx' },
      { path: 'blog', module: 'pages/BlogPage.jsx' },
      { path: 'blog/:slug', module: 'pages/BlogArticlePage.jsx' },
      { path: 'mentors', module: 'pages/MentorsPage.jsx' },
    ],
  },
  community: {
    persona: 'community',
    icon: 'squares-2x2',
    defaultMemberships: COMMUNITY_MEMBERSHIPS,
    routes: [
      { path: 'feed', module: 'pages/FeedPage.jsx', title: 'Community Feed', icon: 'rss' },
      { path: 'search', module: 'pages/SearchPage.jsx' },
      { path: 'explorer/:category/:recordId', module: 'pages/ExplorerRecordPage.jsx' },
      { path: 'jobs', module: 'pages/JobsPage.jsx' },
      { path: 'gigs', module: 'pages/GigsPage.jsx' },
      { path: 'projects', module: 'pages/ProjectsPage.jsx' },
      { path: 'creation-studio', module: 'pages/CreationStudioWizardPage.jsx' },
      { path: 'users/:userId', module: 'pages/UserProfileViewPage.jsx' },
      { path: 'projects/new', module: 'pages/ProjectCreatePage.jsx' },
      { path: 'projects/:projectId', module: 'pages/ProjectDetailPage.jsx' },
      { path: 'projects/:projectId/auto-match', module: 'pages/ProjectAutoMatchPage.jsx' },
      { path: 'groups', module: 'pages/GroupsPage.jsx' },
      { path: 'groups/:groupId', module: 'pages/GroupProfilePage.jsx' },
      { path: 'community-events', module: 'pages/CommunityEventsPage.jsx', title: 'Community events', icon: 'calendar-days' },
      { path: 'pages', module: 'pages/PagesPage.jsx' },
      { path: 'connections', module: 'pages/ConnectionsPage.jsx' },
      { path: 'notifications', module: 'pages/NotificationsPage.jsx' },
      { path: 'trust-center', module: 'pages/TrustCenter.jsx' },
      { path: 'auto-assign', module: 'pages/AutoAssignQueuePage.jsx' },
      { path: 'inbox', module: 'pages/InboxPage.jsx' },
      { path: 'settings', module: 'pages/SettingsPage.jsx' },
      { path: 'finance', module: 'pages/FinanceHubPage.jsx' },
    ],
  },
  volunteer: {
    persona: 'volunteer',
    icon: 'heart',
    defaultMemberships: VOLUNTEER_MEMBERSHIPS,
    routes: [{ path: 'volunteering', module: 'pages/VolunteeringPage.jsx' }],
  },
  launchpad: {
    persona: 'launchpad',
    icon: 'rocket-launch',
    defaultMemberships: LAUNCHPAD_MEMBERSHIPS,
    routes: [
      {
        path: 'experience-launchpad',
        module: 'pages/LaunchpadPage.jsx',
        title: 'Experience Launchpad',
        icon: 'rocket-launch',
        featureFlag: 'launchpad.beta',
      },
    ],
  },
  security: {
    persona: 'security',
    icon: 'shield-check',
    defaultMemberships: SECURITY_MEMBERSHIPS,
    defaultShellTheme: 'midnight',
    routes: [
      {
        path: 'security-operations',
        module: 'pages/SecurityOperationsPage.jsx',
        icon: 'shield-exclamation',
        featureFlag: 'security.operations',
        shellTheme: 'midnight',
      },
    ],
  },
  userDashboards: {
    persona: 'member',
    icon: 'user-circle',
    defaultMemberships: USER_ROLES,
    defaultRoles: USER_ROLES,
    routes: [
      { path: 'dashboard/user', module: 'pages/dashboards/UserDashboardPage.jsx' },
      { path: 'dashboard/user/creation-studio', module: 'pages/dashboards/UserCreationStudioPage.jsx' },
      { path: 'dashboard/user/projects', module: 'pages/dashboards/UserProjectManagementPage.jsx' },
      { path: 'dashboard/user/disputes', module: 'pages/dashboards/UserDisputesPage.jsx' },
      { path: 'dashboard/user/calendar', module: 'pages/dashboards/user/UserCalendarPage.jsx' },
      { path: 'dashboard/user/profile', module: 'pages/dashboards/UserProfileHubPage.jsx' },
    ],
  },
  freelancer: {
    persona: 'freelancer',
    icon: 'briefcase',
    defaultRoles: ['freelancer'],
    defaultMemberships: ['freelancer'],
    routes: [
      { path: 'dashboard/freelancer', module: 'pages/dashboards/FreelancerDashboardPage.jsx' },
      { path: 'dashboard/freelancer/volunteer', module: 'pages/dashboards/FreelancerVolunteerPage.jsx' },
      { path: 'dashboard/freelancer/planner', module: 'pages/dashboards/FreelancerPlannerPage.jsx' },
      { path: 'dashboard/freelancer/automatch', module: 'pages/dashboards/FreelancerAutoMatchPage.jsx' },
      { path: 'dashboard/freelancer/pipeline', module: 'pages/dashboards/FreelancerPipelinePage.jsx' },
      { path: 'dashboard/freelancer/portfolio', module: 'pages/dashboards/FreelancerPortfolioPage.jsx' },
      { path: 'dashboard/freelancer/creation-studio', module: 'pages/dashboards/FreelancerCreationStudioPage.jsx' },
      { path: 'dashboard/freelancer/documents', module: 'pages/dashboards/freelancer/FreelancerDocumentsPage.jsx' },
      { path: 'dashboard/freelancer/networking', module: 'pages/dashboards/freelancer/FreelancerNetworkingPage.jsx' },
      { path: 'dashboard/freelancer/disputes', module: 'pages/dashboards/freelancer/FreelancerDisputesPage.jsx' },
    ],
  },
  company: {
    persona: 'company',
    icon: 'building-office',
    defaultRoles: ['company'],
    defaultMemberships: ['company'],
    routes: [
      { path: 'dashboard/company', module: 'pages/dashboards/CompanyDashboardPage.jsx' },
      { path: 'dashboard/company/profile', module: 'pages/dashboards/CompanyProfileWorkspacePage.jsx' },
      { path: 'dashboard/company/creation-studio', module: 'pages/dashboards/CompanyCreationStudioPage.jsx' },
      { path: 'dashboard/company/hub', module: 'pages/dashboards/CompanyHubPage.jsx' },
      { path: 'dashboard/company/metrics', module: 'pages/dashboards/CompanyMetricsPage.jsx' },
      { path: 'dashboard/company/wallets', module: 'pages/dashboards/CompanyWalletManagementPage.jsx' },
      { path: 'dashboard/company/settings', module: 'pages/dashboards/CompanySettingsPage.jsx' },
      {
        path: 'dashboard/company/system-preferences',
        module: 'pages/dashboards/CompanySystemPreferencesPage.jsx',
      },
      { path: 'dashboard/company/analytics', module: 'pages/dashboards/CompanyAnalyticsPage.jsx' },
      { path: 'dashboard/company/projects', module: 'pages/dashboards/CompanyProjectManagementPage.jsx' },
      {
        path: 'dashboard/company/workspace',
        module: 'pages/dashboards/company/CompanyProjectWorkspacePage.jsx',
      },
      { path: 'dashboard/company/inbox', module: 'pages/dashboards/CompanyInboxPage.jsx' },
      { path: 'dashboard/company/timeline', module: 'pages/dashboards/CompanyTimelineManagementPage.jsx' },
      { path: 'dashboard/company/ats', module: 'pages/dashboards/CompanyAtsOperationsPage.jsx' },
      { path: 'dashboard/company/calendar', module: 'pages/dashboards/CompanyCalendarPage.jsx' },
      { path: 'dashboard/company/job-management', module: 'pages/dashboards/CompanyJobManagementPage.jsx' },
      {
        path: 'dashboard/company/launchpad-jobs',
        module: 'pages/dashboards/CompanyLaunchpadJobManagementPage.jsx',
      },
      { path: 'dashboard/company/orders', module: 'pages/dashboards/CompanyOrdersPage.jsx' },
      { path: 'dashboard/company/ads', module: 'pages/dashboards/CompanyAdsPage.jsx' },
      { path: 'dashboard/company/groups', module: 'pages/dashboards/CompanyGroupManagementPage.jsx' },
      {
        path: 'dashboard/company/integrations',
        module: 'pages/dashboards/CompanyIntegrationsPage.jsx',
      },
      { path: 'dashboard/company/escrow', module: 'pages/dashboards/CompanyEscrowManagementPage.jsx' },
      { path: 'dashboard/company/pages', module: 'pages/dashboards/CompanyPagesManagementPage.jsx' },
      { path: 'dashboard/company/id-verification', module: 'pages/dashboards/CompanyIdVerificationPage.jsx' },
      {
        path: 'dashboard/company/volunteering',
        module: 'pages/dashboards/CompanyVolunteeringManagementPage.jsx',
      },
      {
        path: 'dashboard/company/integrations/crm',
        module: 'pages/dashboards/CompanyCrmIntegrationsPage.jsx',
      },
      { path: 'dashboard/company/ai-auto-reply', module: 'pages/dashboards/CompanyByokAutoReplyPage.jsx' },
      {
        path: 'dashboard/company/disputes',
        module: 'pages/dashboards/company/CompanyDisputeManagementPage.jsx',
      },
      { path: 'dashboard/company/networking', module: 'pages/networking/CompanyNetworkingHubPage.jsx' },
      {
        path: 'dashboard/company/networking/sessions',
        module: 'pages/networking/NetworkingSessionsPage.jsx',
      },
    ],
  },
  agency: {
    persona: 'agency',
    icon: 'users',
    defaultRoles: ['agency'],
    defaultMemberships: ['agency'],
    routes: [
      {
        path: 'dashboard/agency',
        module: 'pages/dashboards/AgencyDashboardPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      {
        path: 'dashboard/agency/disputes',
        module: 'pages/dashboards/agency/DisputeManagementPage.jsx',
        roles: ['agency'],
      },
      {
        path: 'dashboard/agency/escrow',
        module: 'pages/dashboards/agency/AgencyEscrowManagementPage.jsx',
        roles: ['agency'],
      },
      {
        path: 'dashboard/agency/crm',
        module: 'pages/dashboards/AgencyCrmPipelinePage.jsx',
        allowedRoles: ['agency', 'agency_admin'],
        roles: ['agency', 'agency_admin'],
      },
      {
        path: 'dashboard/agency/integrations',
        module: 'pages/dashboards/AgencyIntegrationsPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      {
        path: 'dashboard/agency/ai',
        module: 'pages/dashboards/AgencyAiAutomationPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      {
        path: 'dashboard/agency/profile',
        module: 'pages/dashboards/AgencyProfileManagementPage.jsx',
        allowedRoles: ['agency', 'agency_admin'],
        roles: ['agency', 'agency_admin'],
      },
      {
        path: 'dashboard/agency/client-kanban',
        module: 'pages/dashboards/AgencyClientKanbanPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      {
        path: 'dashboard/agency/wallet',
        module: 'pages/dashboards/agency/AgencyWalletManagementPage.jsx',
        roles: ['agency'],
      },
      {
        path: 'dashboard/agency/timeline',
        module: 'pages/dashboards/agency/AgencyTimelineDashboardPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      {
        path: 'dashboard/agency/blog',
        module: 'pages/dashboards/AgencyBlogManagementPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      { path: 'dashboard/agency/inbox', module: 'pages/dashboards/agency/AgencyInboxPage.jsx', roles: ['agency'] },
      {
        path: 'dashboard/agency/workspace',
        module: 'pages/dashboards/agency/ProjectWorkspacePage.jsx',
        roles: ['agency'],
      },
      {
        path: 'dashboard/agency/projects',
        module: 'pages/dashboards/AgencyProjectManagementPage.jsx',
        roles: ['agency'],
      },
      { path: 'dashboard/agency/mentoring', module: 'pages/dashboards/AgencyMentoringPage.jsx' },
      {
        path: 'dashboard/agency/job-management',
        module: 'pages/dashboards/agency/AgencyJobManagementPage.jsx',
        roles: ['agency'],
      },
      {
        path: 'dashboard/agency/interviews',
        module: 'pages/dashboards/agency/AgencyInterviewsPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      { path: 'dashboard/agency/calendar', module: 'pages/dashboards/agency/AgencyCalendarPage.jsx', roles: ['agency'] },
      {
        path: 'dashboard/agency/id-verification',
        module: 'pages/dashboards/agency/AgencyIdVerificationPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
      { path: 'dashboard/agency/support', module: 'pages/dashboards/agency/AgencySupportDeskPage.jsx', roles: ['agency'] },
      { path: 'dashboard/agency/events', module: 'pages/dashboards/agency/AgencyEventManagementPage.jsx', roles: ['agency'] },
      {
        path: 'dashboard/agency/networking',
        module: 'pages/dashboards/agency/AgencyNetworkingManagementPage.jsx',
        allowedRoles: ['agency', 'agency_admin', 'admin'],
        roles: ['agency', 'agency_admin', 'admin'],
      },
    ],
  },
  headhunter: {
    persona: 'headhunter',
    icon: 'magnifying-glass',
    defaultRoles: ['headhunter'],
    defaultMemberships: ['headhunter'],
    routes: [
      { path: 'dashboard/headhunter', module: 'pages/dashboards/HeadhunterDashboardPage.jsx', roles: ['headhunter'] },
    ],
  },
  mentor: {
    persona: 'mentor',
    icon: 'academic-cap',
    defaultRoles: ['mentor'],
    defaultMemberships: ['mentor'],
    routes: [
      { path: 'dashboard/mentor', module: 'pages/dashboards/MentorDashboardPage.jsx', roles: ['mentor'] },
    ],
  },
  launchpadOps: {
    persona: 'launchpad-ops',
    icon: 'sparkles',
    defaultRoles: ['admin', 'mentor'],
    defaultMemberships: ['admin', 'mentor'],
    routes: [
      {
        path: 'dashboard/launchpad',
        module: 'pages/dashboards/LaunchpadOperationsPage.jsx',
        roles: ['admin', 'mentor'],
      },
    ],
  },
  admin: {
    persona: 'admin',
    icon: 'shield-check',
    defaultRoles: ['admin'],
    defaultMemberships: ['admin'],
    defaultShellTheme: 'midnight',
    routes: [
      {
        path: 'dashboard/admin',
        module: 'pages/dashboards/AdminDashboardPage.jsx',
        relativePath: '',
        index: true,
        title: 'Admin Overview',
        icon: 'shield-check',
        featureFlag: 'admin.core',
        shellTheme: 'midnight',
      },
      {
        path: 'dashboard/admin/finance',
        module: 'pages/dashboards/admin/AdminFinancialManagementPage.jsx',
        relativePath: 'finance',
      },
      {
        path: 'dashboard/admin/interviews',
        module: 'pages/dashboards/AdminInterviewManagementPage.jsx',
        relativePath: 'interviews',
      },
      { path: 'dashboard/admin/inbox', module: 'pages/dashboards/AdminInboxPage.jsx', relativePath: 'inbox' },
      {
        path: 'dashboard/admin/moderation',
        module: 'pages/dashboards/admin/AdminModerationDashboardPage.jsx',
        relativePath: 'moderation',
      },
      {
        path: 'dashboard/admin/timelines',
        module: 'pages/dashboards/admin/AdminTimelineManagementPage.jsx',
        relativePath: 'timelines',
      },
      {
        path: 'dashboard/admin/appearance',
        module: 'pages/dashboards/admin/AdminAppearanceManagementPage.jsx',
        relativePath: 'appearance',
      },
      {
        path: 'dashboard/admin/storage',
        module: 'pages/dashboards/admin/AdminStorageManagementPage.jsx',
        relativePath: 'storage',
      },
      {
        path: 'dashboard/admin/database',
        module: 'pages/dashboards/AdminDatabaseSettingsPage.jsx',
        relativePath: 'database',
      },
      {
        path: 'dashboard/admin/gdpr',
        module: 'pages/dashboards/admin/AdminGdprSettingsPage.jsx',
        relativePath: 'gdpr',
      },
      {
        path: 'dashboard/admin/compliance',
        module: 'pages/dashboards/admin/AdminComplianceManagementPage.jsx',
        relativePath: 'compliance',
      },
      {
        path: 'dashboard/admin/maintenance',
        module: 'pages/dashboards/admin/AdminMaintenanceModePage.jsx',
        relativePath: 'maintenance',
      },
      {
        path: 'dashboard/admin/release-operations',
        module: 'pages/dashboards/admin/AdminReleaseEngineeringDashboard.jsx',
        relativePath: 'release-operations',
      },
      {
        path: 'dashboard/admin/governance',
        module: 'pages/dashboards/admin/AdminGovernancePortalPage.jsx',
        relativePath: 'governance',
      },
      {
        path: 'dashboard/admin/governance/policies',
        module: 'pages/dashboards/admin/AdminPolicyManagementPage.jsx',
        relativePath: 'governance/policies',
      },
      {
        path: 'dashboard/admin/governance/documents',
        module: 'pages/dashboards/admin/AdminDocumentsManagementPage.jsx',
        relativePath: 'governance/documents',
      },
      {
        path: 'dashboard/admin/documents',
        module: 'pages/dashboards/admin/AdminDocumentsManagementPage.jsx',
        relativePath: 'documents',
      },
      {
        path: 'dashboard/admin/ads-settings',
        module: 'pages/dashboards/admin/AdminAdsSettingsPage.jsx',
        relativePath: 'ads-settings',
      },
      {
        path: 'dashboard/admin/blog',
        module: 'pages/admin/AdminBlogManagementPage.jsx',
        relativePath: 'blog',
      },
      {
        path: 'dashboard/admin/volunteering',
        module: 'pages/dashboards/admin/AdminVolunteeringPage.jsx',
        relativePath: 'volunteering',
      },
      {
        path: 'dashboard/admin/projects',
        module: 'pages/admin/AdminProjectsPage.jsx',
        relativePath: 'projects',
      },
      {
        path: 'dashboard/admin/gigs',
        module: 'pages/admin/AdminGigManagementPage.jsx',
        relativePath: 'gigs',
      },
      {
        path: 'dashboard/admin/jobs',
        module: 'pages/dashboards/admin/AdminJobPostManagementPage.jsx',
        relativePath: 'jobs',
      },
      {
        path: 'dashboard/admin/job-applications',
        module: 'pages/dashboards/admin/AdminJobApplicationsPage.jsx',
        relativePath: 'job-applications',
      },
      {
        path: 'dashboard/admin/calendar',
        module: 'pages/admin/AdminCalendarPage.jsx',
        relativePath: 'calendar',
      },
      {
        path: 'dashboard/admin/identity-verification',
        module: 'pages/dashboards/admin/AdminIdentityVerificationPage.jsx',
        relativePath: 'identity-verification',
      },
      {
        path: 'dashboard/admin/wallets',
        module: 'pages/dashboards/admin/AdminWalletManagementPage.jsx',
        relativePath: 'wallets',
      },
      {
        path: 'dashboard/admin/disputes',
        module: 'pages/dashboards/admin/AdminDisputeManagementPage.jsx',
        relativePath: 'disputes',
      },
      {
        path: 'dashboard/admin/escrow',
        module: 'pages/dashboards/admin/AdminEscrowManagementPage.jsx',
        relativePath: 'escrow',
      },
      {
        path: 'dashboard/admin/mobile-apps',
        module: 'pages/admin/AdminMobileAppManagementPage.jsx',
        relativePath: 'mobile-apps',
      },
      {
        path: 'dashboard/admin/system-settings',
        module: 'pages/dashboards/admin/SystemSettingsPage.jsx',
        relativePath: 'system-settings',
      },
      {
        path: 'dashboard/admin/homepage',
        module: 'pages/admin/AdminHomepageSettingsPage.jsx',
        relativePath: 'homepage',
      },
      {
        path: 'dashboard/admin/pages',
        module: 'pages/dashboards/AdminPagesSettingsPage.jsx',
        relativePath: 'pages',
      },
      {
        path: 'dashboard/admin/users',
        module: 'pages/dashboards/admin/AdminUserManagementPage.jsx',
        relativePath: 'users',
      },
      {
        path: 'dashboard/admin/site',
        module: 'pages/dashboards/admin/AdminSiteManagementPage.jsx',
        relativePath: 'site',
      },
      {
        path: 'dashboard/admin/policies',
        module: 'pages/dashboards/admin/AdminPolicyManagementPage.jsx',
        relativePath: 'policies',
      },
      {
        path: 'dashboard/admin/api-management',
        module: 'pages/admin/AdminApiManagementPage.jsx',
        relativePath: 'api-management',
      },
      {
        path: 'dashboard/admin/email',
        module: 'pages/dashboards/admin/email/AdminEmailManagementPage.jsx',
        relativePath: 'email',
      },
      {
        path: 'dashboard/admin/security/two-factor',
        module: 'pages/dashboards/admin/AdminTwoFactorManagementPage.jsx',
        relativePath: 'security/two-factor',
      },
      {
        path: 'dashboard/admin/seo',
        module: 'pages/dashboards/admin/AdminSeoSettingsPage.jsx',
        relativePath: 'seo',
      },
      {
        path: 'dashboard/admin/profiles',
        module: 'pages/admin/AdminProfileManagementPage.jsx',
        relativePath: 'profiles',
      },
      {
        path: 'dashboard/admin/speed-networking',
        module: 'pages/dashboards/admin/AdminSpeedNetworkingManagementPage.jsx',
        relativePath: 'speed-networking',
      },
      {
        path: 'dashboard/admin/mentoring',
        module: 'pages/dashboards/admin/AdminMentoringSessionManagementPage.jsx',
        relativePath: 'mentoring',
      },
    ],
  },
};

function normalisePath(path = '') {
  return `${path ?? ''}`.replace(/^[\/]+/, '').replace(/[\/]+$/, '');
}

export function toAbsolutePath(path = '') {
  const normalised = normalisePath(path);
  return normalised ? `/${normalised}` : '/';
}

export function createRouteId(collectionKey, absolutePath) {
  const cleanedCollection = collectionKey ?? 'route';
  const cleanedPath = (absolutePath || '/').replace(/\*/g, 'wildcard').replace(/[:/]+/g, '_').replace(/^_+|_+$/g, '');
  return cleanedPath ? `${cleanedCollection}.${cleanedPath}` : `${cleanedCollection}.root`;
}

function inferTitleFromPath(path = '') {
  const normalised = normalisePath(path);
  if (!normalised) {
    return 'Home';
  }
  const segments = normalised.split('/').filter(Boolean);
  let candidate = segments[segments.length - 1] || '';
  if (candidate === '*' && segments.length > 1) {
    candidate = segments[segments.length - 2];
  }
  if (candidate.startsWith(':')) {
    candidate = segments[segments.length - 2] || candidate.slice(1);
  }
  const cleaned = candidate.replace(/[-_]+/g, ' ').trim();
  if (!cleaned) {
    return 'Overview';
  }
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveRoutePersona(collectionKey, routeDefinition) {
  return routeDefinition.persona || ROUTE_COLLECTION_DEFINITIONS[collectionKey]?.persona || null;
}

function resolveShellTheme(collectionKey, routeDefinition) {
  return routeDefinition.shellTheme || ROUTE_COLLECTION_DEFINITIONS[collectionKey]?.defaultShellTheme || null;
}

function resolveMemberships(collectionKey, routeDefinition) {
  const collectionDefaults = ROUTE_COLLECTION_DEFINITIONS[collectionKey]?.defaultMemberships || [];
  return routeDefinition.allowedMemberships || collectionDefaults;
}

function resolveRoles(collectionKey, routeDefinition) {
  const collectionDefaults = ROUTE_COLLECTION_DEFINITIONS[collectionKey]?.defaultRoles || [];
  return routeDefinition.allowedRoles || collectionDefaults;
}

export function flattenRouteRegistry(registry = ROUTE_COLLECTION_DEFINITIONS) {
  const entries = [];
  Object.entries(registry).forEach(([collectionKey, definition]) => {
    definition.routes.forEach((route) => {
      const absolutePath = route.path.startsWith('/') || route.path === ''
        ? (route.path || '/')
        : toAbsolutePath(route.path);
      const persona = resolveRoutePersona(collectionKey, route);
      const shellTheme = resolveShellTheme(collectionKey, route);
      const title = route.title || inferTitleFromPath(route.path);
      entries.push({
        key: route.key || route.path || route.module,
        collection: collectionKey,
        path: route.path,
        absolutePath,
        module: route.module,
        title,
        icon: route.icon || definition.icon || null,
        persona,
        featureFlag: route.featureFlag || null,
        shellTheme,
        index: Boolean(route.index),
        relativePath: route.relativePath || null,
        allowedRoles: resolveRoles(collectionKey, route),
        allowedMemberships: resolveMemberships(collectionKey, route),
        routeId: createRouteId(collectionKey, absolutePath),
      });
    });
  });
  return entries;
}

export const COMMUNITY_ACCESS_MEMBERSHIPS = Object.freeze([...COMMUNITY_MEMBERSHIPS]);
export const VOLUNTEER_ACCESS_MEMBERSHIPS = Object.freeze([...VOLUNTEER_MEMBERSHIPS]);
export const USER_DASHBOARD_ROLES = Object.freeze([...USER_ROLES]);
export const LAUNCHPAD_ACCESS_MEMBERSHIPS = Object.freeze([...LAUNCHPAD_MEMBERSHIPS]);
export const SECURITY_ACCESS_MEMBERSHIPS = Object.freeze([...SECURITY_MEMBERSHIPS]);

export const ROUTE_COLLECTIONS = freezeDeep(ROUTE_COLLECTION_DEFINITIONS);

export default ROUTE_COLLECTIONS;
