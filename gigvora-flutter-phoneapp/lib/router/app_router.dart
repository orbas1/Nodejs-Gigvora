import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/company_register_screen.dart';
import '../features/auth/presentation/sign_up_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/feed/presentation/feed_screen.dart';
import '../features/explorer/presentation/explorer_screen.dart';
import '../features/marketplace/presentation/jobs_screen.dart';
import '../features/marketplace/presentation/gigs_screen.dart';
import '../features/marketplace/presentation/projects_screen.dart';
import '../features/marketplace/presentation/project_post_screen.dart';
import '../features/marketplace/presentation/launchpad_screen.dart';
import '../features/marketplace/presentation/volunteering_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/admin/presentation/admin_login_screen.dart';
import '../features/ads/presentation/ads_dashboard_screen.dart';
import '../features/notifications/presentation/notifications_screen.dart';
import '../features/messaging/presentation/inbox_screen.dart';
import '../features/services/presentation/service_operations_screen.dart';
import '../features/mentorship/presentation/mentorship_screen.dart';
import '../features/project_gig_management/presentation/project_gig_management_screen.dart';
import '../features/pages/presentation/pages_screen.dart';
import '../features/connections/presentation/connections_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    routes: [
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignUpScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/register/company', builder: (context, state) => const CompanyRegisterScreen()),
      GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
      GoRoute(path: '/explorer', builder: (context, state) => const ExplorerScreen()),
      GoRoute(path: '/jobs', builder: (context, state) => const JobsScreen()),
      GoRoute(path: '/gigs', builder: (context, state) => const GigsScreen()),
      GoRoute(path: '/projects', builder: (context, state) => const ProjectsScreen()),
      GoRoute(path: '/projects/new', builder: (context, state) => const ProjectPostScreen()),
      GoRoute(path: '/launchpad', builder: (context, state) => const LaunchpadScreen()),
      GoRoute(path: '/volunteering', builder: (context, state) => const VolunteeringScreen()),
      GoRoute(path: '/pages', builder: (context, state) => const PagesScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/inbox', builder: (context, state) => const InboxScreen()),
      GoRoute(path: '/connections', builder: (context, state) => const ConnectionsScreen()),
      GoRoute(path: '/operations', builder: (context, state) => const ServiceOperationsScreen()),
      GoRoute(path: '/dashboard/mentor', builder: (context, state) => const MentorshipScreen()),
      GoRoute(
        path: '/profile',
        builder: (context, state) => ProfileScreen(profileId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: '/operations',
        builder: (context, state) => ProjectGigManagementScreen(
          userId: state.uri.queryParameters['userId'] != null
              ? int.tryParse(state.uri.queryParameters['userId']!)
              : null,
          initialSection: sectionFromQuery(state.uri.queryParameters['section']),
        ),
      ),
      GoRoute(path: '/admin', builder: (context, state) => const AdminLoginScreen()),
      GoRoute(path: '/admin/ads', builder: (context, state) => const AdsDashboardScreen()),
    ],
  );
});
