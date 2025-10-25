import 'package:collection/collection.dart';

/// Central registry of application routes to keep navigation paths consistent
/// across the router configuration, feature modules, analytics, and deep-link
/// handling.
enum AppRoute {
  splash(name: 'splash', path: '/splash', allowDeepLink: false),
  home(name: 'home', path: '/home'),
  signup(name: 'signup', path: '/signup'),
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
  projectNew(name: 'projectNew', path: '/projects/new'),
  projectAutoMatch(name: 'projectAutoMatch', path: '/projects/:id/auto-match'),
  creationStudio(name: 'creationStudio', path: '/creation-studio'),
  blogList(name: 'blogList', path: '/blog'),
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
  freelancerWorkManagement(
      name: 'freelancerWorkManagement', path: '/dashboard/freelancer/work-management'),
  userDashboard(name: 'userDashboard', path: '/dashboard/user'),
  cvWorkspace(name: 'cvWorkspace', path: '/dashboard/user/cv-workspace'),
  mentorDashboard(name: 'mentorDashboard', path: '/dashboard/mentor'),
  agencyDashboard(name: 'agencyDashboard', path: '/dashboard/agency'),
  networking(name: 'networking', path: '/networking'),
  groupsDirectory(name: 'groupsDirectory', path: '/groups'),
  groupProfile(name: 'groupProfile', path: '/groups/:groupId'),
  profile(name: 'profile', path: '/profile'),
  projectGigManagement(name: 'projectGigManagement', path: '/operations/manage'),
  adminLogin(name: 'adminLogin', path: '/admin'),
  groupManagement(name: 'groupManagement', path: '/groups/manage'),
  adsDashboard(name: 'adsDashboard', path: '/admin/ads');

  const AppRoute({
    required this.name,
    required this.path,
    this.allowDeepLink = true,
  });

  final String name;
  final String path;
  final bool allowDeepLink;

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

  static final Set<String> _deepLinkSegments = AppRoute.values
      .where((route) => route.allowDeepLink)
      .map((route) => route.firstSegment)
      .where((segment) => segment.isNotEmpty)
      .toSet();

  static Set<String> get deepLinkSegments => _deepLinkSegments;

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
