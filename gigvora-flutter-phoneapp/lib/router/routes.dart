enum AppRoute {
  splash(name: 'splash', path: '/splash'),
  home(name: 'home', path: '/home'),
  signUp(name: 'signup', path: '/signup'),
  login(name: 'login', path: '/login'),
  register(name: 'register', path: '/register'),
  registerCompany(name: 'registerCompany', path: '/register/company'),
  feed(name: 'feed', path: '/feed'),
  calendar(name: 'calendar', path: '/calendar'),
  explorer(name: 'explorer', path: '/explorer'),
  jobs(name: 'jobs', path: '/jobs'),
  jobDetail(name: 'jobDetail', path: '/jobs/:id'),
  gigs(name: 'gigs', path: '/gigs'),
  gigPurchase(name: 'gigPurchase', path: '/gigs/purchase'),
  projects(name: 'projects', path: '/projects'),
  projectPost(name: 'projectPost', path: '/projects/new'),
  projectAutoMatch(name: 'projectAutoMatch', path: '/projects/:id/auto-match'),
  creationStudio(name: 'creationStudio', path: '/creation-studio'),
  blogList(name: 'blog', path: '/blog'),
  blogDetail(name: 'blogDetail', path: '/blog/:slug'),
  launchpad(name: 'launchpad', path: '/launchpad'),
  volunteering(name: 'volunteering', path: '/volunteering'),
  notifications(name: 'notifications', path: '/notifications'),
  pages(name: 'pages', path: '/pages'),
  support(name: 'support', path: '/support'),
  settings(name: 'settings', path: '/settings'),
  about(name: 'about', path: '/about'),
  privacy(name: 'privacy', path: '/privacy'),
  inbox(name: 'inbox', path: '/inbox'),
  mentorProfile(name: 'mentorProfile', path: '/mentors/:id'),
  finance(name: 'finance', path: '/finance'),
  connections(name: 'connections', path: '/connections'),
  serviceOperations(name: 'serviceOperations', path: '/operations'),
  securityOperations(name: 'securityOperations', path: '/security/operations'),
  companyIntegrations(name: 'companyIntegrations', path: '/dashboard/company/integrations'),
  companyAts(name: 'companyAts', path: '/dashboard/company/ats'),
  companyAnalytics(name: 'companyAnalytics', path: '/dashboard/company/analytics'),
  freelancerPipeline(name: 'freelancerPipeline', path: '/dashboard/freelancer/pipeline'),
  freelancerWorkManagement(name: 'freelancerWorkManagement', path: '/dashboard/freelancer/work-management'),
  userDashboard(name: 'userDashboard', path: '/dashboard/user'),
  userCvWorkspace(name: 'userCvWorkspace', path: '/dashboard/user/cv-workspace'),
  mentorDashboard(name: 'mentorDashboard', path: '/dashboard/mentor'),
  agencyDashboard(name: 'agencyDashboard', path: '/dashboard/agency'),
  networking(name: 'networking', path: '/networking'),
  groupsDirectory(name: 'groups', path: '/groups'),
  groupProfile(name: 'groupProfile', path: '/groups/:groupId'),
  profile(name: 'profile', path: '/profile'),
  projectOperations(name: 'projectOperations', path: '/operations/manage'),
  adminLogin(name: 'adminLogin', path: '/admin'),
  groupsManage(name: 'groupsManage', path: '/groups/manage'),
  adminAds(name: 'adminAds', path: '/admin/ads');

  const AppRoute({required this.name, required this.path});

  final String name;
  final String path;

  String location({
    Map<String, String>? pathParameters,
    Map<String, String>? queryParameters,
  }) {
    var resolved = path;
    if (pathParameters != null) {
      for (final entry in pathParameters.entries) {
        resolved = resolved.replaceAll(':${entry.key}', entry.value);
      }
    }
    if (queryParameters != null && queryParameters.isNotEmpty) {
      final encoded = Uri(queryParameters: queryParameters).query;
      resolved = '$resolved?$encoded';
    }
    return resolved;
  }
}
