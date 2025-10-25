import 'package:collection/collection.dart';

/// Central registry of application routes to keep navigation paths consistent
/// across the router configuration, feature modules, analytics, and deep-link
/// handling.
enum AppRoute {
  splash(
    name: 'splash',
    path: '/splash',
    routeId: 'mobile.splash',
    allowDeepLink: false,
    requiresAuth: false,
  ),
  home(name: 'home', path: '/', routeId: 'mobile.home', requiresAuth: false),
  signup(name: 'signup', path: '/signup', routeId: 'mobile.signup', requiresAuth: false),
  login(name: 'login', path: '/login', routeId: 'mobile.login', requiresAuth: false),
  register(name: 'register', path: '/register', routeId: 'mobile.register', requiresAuth: false),
  registerCompany(
    name: 'registerCompany',
    path: '/register/company',
    routeId: 'mobile.register-company',
    requiresAuth: false,
  ),
  feed(name: 'feed', path: '/feed', routeId: 'mobile.feed', requiresAuth: true),
  calendar(name: 'calendar', path: '/calendar', routeId: 'mobile.calendar', requiresAuth: true),
  explorer(name: 'explorer', path: '/explorer', routeId: 'mobile.explorer', requiresAuth: true),
  jobs(name: 'jobs', path: '/jobs', routeId: 'mobile.jobs', requiresAuth: false),
  jobDetail(
    name: 'jobDetail',
    path: '/jobs/:id',
    routeId: 'mobile.job-detail',
    requiresAuth: false,
  ),
  gigs(name: 'gigs', path: '/gigs', routeId: 'mobile.gigs', requiresAuth: false),
  gigPurchase(
    name: 'gigPurchase',
    path: '/gigs/purchase',
    routeId: 'mobile.gig-purchase',
    requiresAuth: true,
  ),
  projects(name: 'projects', path: '/projects', routeId: 'mobile.projects', requiresAuth: true),
  projectNew(
    name: 'projectNew',
    path: '/projects/new',
    routeId: 'mobile.project-new',
    requiresAuth: true,
  ),
  projectAutoMatch(
    name: 'projectAutoMatch',
    path: '/projects/:id/auto-match',
    routeId: 'mobile.project-auto-match',
    requiresAuth: true,
  ),
  creationStudio(
    name: 'creationStudio',
    path: '/creation-studio',
    routeId: 'mobile.creation-studio',
    requiresAuth: true,
  ),
  blogList(name: 'blogList', path: '/blog', routeId: 'mobile.blog-list', requiresAuth: false),
  blogDetail(
    name: 'blogDetail',
    path: '/blog/:slug',
    routeId: 'mobile.blog-detail',
    requiresAuth: false,
  ),
  launchpad(name: 'launchpad', path: '/launchpad', routeId: 'mobile.launchpad', requiresAuth: true),
  volunteering(
    name: 'volunteering',
    path: '/volunteering',
    routeId: 'mobile.volunteering',
    requiresAuth: true,
  ),
  notifications(
    name: 'notifications',
    path: '/notifications',
    routeId: 'mobile.notifications',
    requiresAuth: true,
  ),
  pages(name: 'pages', path: '/pages', routeId: 'mobile.pages', requiresAuth: true),
  support(name: 'support', path: '/support', routeId: 'mobile.support', requiresAuth: true),
  settings(name: 'settings', path: '/settings', routeId: 'mobile.settings', requiresAuth: true),
  about(name: 'about', path: '/about', routeId: 'mobile.about', requiresAuth: false),
  privacy(name: 'privacy', path: '/privacy', routeId: 'mobile.privacy', requiresAuth: false),
  inbox(name: 'inbox', path: '/inbox', routeId: 'mobile.inbox', requiresAuth: true),
  mentorProfile(
    name: 'mentorProfile',
    path: '/mentors/:id',
    routeId: 'mobile.mentor-profile',
    requiresAuth: false,
  ),
  finance(name: 'finance', path: '/finance', routeId: 'mobile.finance', requiresAuth: true),
  connections(
    name: 'connections',
    path: '/connections',
    routeId: 'mobile.connections',
    requiresAuth: true,
  ),
  serviceOperations(
    name: 'serviceOperations',
    path: '/operations',
    routeId: 'mobile.service-operations',
    requiresAuth: true,
  ),
  securityOperations(
    name: 'securityOperations',
    path: '/security/operations',
    routeId: 'mobile.security-operations',
    allowDeepLink: false,
    requiresAuth: true,
  ),
  companyIntegrations(
    name: 'companyIntegrations',
    path: '/dashboard/company/integrations',
    routeId: 'mobile.company-integrations',
    requiresAuth: true,
  ),
  companyAts(
    name: 'companyAts',
    path: '/dashboard/company/ats',
    routeId: 'mobile.company-ats',
    requiresAuth: true,
  ),
  companyAnalytics(
    name: 'companyAnalytics',
    path: '/dashboard/company/analytics',
    routeId: 'mobile.company-analytics',
    requiresAuth: true,
  ),
  freelancerPipeline(
    name: 'freelancerPipeline',
    path: '/dashboard/freelancer/pipeline',
    routeId: 'mobile.freelancer-pipeline',
    requiresAuth: true,
  ),
  freelancerWorkManagement(
    name: 'freelancerWorkManagement',
    path: '/dashboard/freelancer/work-management',
    routeId: 'mobile.freelancer-work-management',
    requiresAuth: true,
  ),
  userDashboard(
    name: 'userDashboard',
    path: '/dashboard/user',
    routeId: 'mobile.user-dashboard',
    requiresAuth: true,
  ),
  cvWorkspace(
    name: 'cvWorkspace',
    path: '/dashboard/user/cv-workspace',
    routeId: 'mobile.cv-workspace',
    requiresAuth: true,
  ),
  mentorDashboard(
    name: 'mentorDashboard',
    path: '/dashboard/mentor',
    routeId: 'mobile.mentor-dashboard',
    requiresAuth: true,
  ),
  agencyDashboard(
    name: 'agencyDashboard',
    path: '/dashboard/agency',
    routeId: 'mobile.agency-dashboard',
    requiresAuth: true,
  ),
  networking(name: 'networking', path: '/networking', routeId: 'mobile.networking', requiresAuth: true),
  groupsDirectory(
    name: 'groupsDirectory',
    path: '/groups',
    routeId: 'mobile.groups-directory',
    requiresAuth: true,
  ),
  groupProfile(
    name: 'groupProfile',
    path: '/groups/:groupId',
    routeId: 'mobile.group-profile',
    requiresAuth: true,
  ),
  profile(name: 'profile', path: '/profile', routeId: 'mobile.profile', requiresAuth: true),
  projectGigManagement(
    name: 'projectGigManagement',
    path: '/operations/manage',
    routeId: 'mobile.project-gig-management',
    requiresAuth: true,
  ),
  adminLogin(
    name: 'adminLogin',
    path: '/admin',
    routeId: 'mobile.admin-login',
    allowDeepLink: false,
    requiresAuth: false,
  ),
  groupManagement(
    name: 'groupManagement',
    path: '/groups/manage',
    routeId: 'mobile.group-management',
    requiresAuth: true,
  ),
  adsDashboard(
    name: 'adsDashboard',
    path: '/admin/ads',
    routeId: 'mobile.ads-dashboard',
    allowDeepLink: false,
    requiresAuth: true,
  );

  const AppRoute({
    required this.name,
    required this.path,
    required this.routeId,
    this.allowDeepLink = true,
    this.requiresAuth = false,
    this.metadata = const <String, dynamic>{},
  });

  final String name;
  final String path;
  final String routeId;
  final bool allowDeepLink;
  final bool requiresAuth;
  final Map<String, dynamic> metadata;

  static AppRoute? fromRouteId(String? routeId) {
    if (routeId == null || routeId.isEmpty) {
      return null;
    }
    return AppRoute.values.firstWhereOrNull((route) => route.routeId == routeId);
  }

  static AppRoute? fromName(String? name) {
    if (name == null || name.isEmpty) {
      return null;
    }
    return AppRoute.values.firstWhereOrNull((route) => route.name == name);
  }

  /// Builds a concrete location for the current route.
  String location({
    Map<String, String>? pathParameters,
    Map<String, String>? queryParameters,
  }) {
    var resolvedPath = path;
    if (pathParameters != null) {
      pathParameters.forEach((key, value) {
        resolvedPath = resolvedPath.replaceAll(':$key', Uri.encodeComponent(value));
      });
    }

    if (resolvedPath.contains('/:')) {
      final missingSegments = RegExp(r':([a-zA-Z0-9_]+)')
          .allMatches(resolvedPath)
          .map((match) => match.group(1))
          .whereNotNull()
          .toList(growable: false);
      throw ArgumentError('Missing path parameters for route "$name": $missingSegments');
    }

    if (queryParameters == null || queryParameters.isEmpty) {
      return resolvedPath;
    }

    final query = queryParameters.entries
        .map((entry) =>
            '${Uri.encodeQueryComponent(entry.key)}=${Uri.encodeQueryComponent(entry.value)}')
        .join('&');

    return '$resolvedPath?$query';
  }

  String get firstSegment {
    final segments = path.split('/')
      ..removeWhere((segment) => segment.isEmpty || segment.startsWith(':'));
    return segments.isEmpty ? '' : segments.first;
  }
}

class AppRouteRegistry {
  AppRouteRegistry._();

  static final Set<String> _defaultDeepLinkSegments = AppRoute.values
      .where((route) => route.allowDeepLink)
      .map((route) => route.firstSegment)
      .where((segment) => segment.isNotEmpty)
      .toSet();

  static final Set<String> _deepLinkSegments = {..._defaultDeepLinkSegments};

  static Set<String> get deepLinkSegments => Set.unmodifiable(_deepLinkSegments);

  static void syncDeepLinkSegments(Iterable<String> segments) {
    _deepLinkSegments
      ..clear()
      ..addAll(segments.map((segment) => segment.trim()).where((segment) => segment.isNotEmpty));
    if (_deepLinkSegments.isEmpty) {
      _deepLinkSegments.addAll(_defaultDeepLinkSegments);
    }
  }

  static void resetDeepLinkSegments() {
    _deepLinkSegments
      ..clear()
      ..addAll(_defaultDeepLinkSegments);
  }

  /// Resolves a deep-link [Uri] to an in-app location string if supported.
  static String? resolveDeepLink(Uri uri) {
    final normalized = _normalizeUri(uri);

    // Some providers emit deep links via fragment components (e.g. `#/home`).
    if (normalized.pathSegments.isEmpty && normalized.fragment.isNotEmpty) {
      final fragmentUri = Uri.parse(normalized.fragment.startsWith('/')
          ? normalized.fragment
          : '/${normalized.fragment}');
      return resolveDeepLink(fragmentUri);
    }

    final segments = normalized.pathSegments.where((segment) => segment.isNotEmpty).toList();
    if (segments.isEmpty) {
      // Treat bare domain launches as a shortcut to home.
      return AppRoute.home.path;
    }

    final firstSegment = segments.first;
    if (!_deepLinkSegments.contains(firstSegment)) {
      return null;
    }

    final path = '/${segments.join('/')}';
    final query = normalized.hasQuery ? '?${normalized.query}' : '';
    return '$path$query';
  }

  static Uri _normalizeUri(Uri uri) {
    if (uri.path.isEmpty && uri.fragment.isEmpty) {
      return uri.replace(path: '/');
    }

    if (!uri.path.startsWith('/') && uri.path.isNotEmpty) {
      return uri.replace(path: '/${uri.path}');
    }

    return uri;
  }
}
