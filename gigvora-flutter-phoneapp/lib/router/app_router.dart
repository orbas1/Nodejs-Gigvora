import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/application/session_controller.dart';
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
import '../features/marketplace/presentation/project_auto_match_screen.dart';
import '../features/marketplace/presentation/launchpad_screen.dart';
import '../features/marketplace/presentation/volunteering_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/admin/presentation/admin_login_screen.dart';
import '../features/ads/presentation/ads_dashboard_screen.dart';
import '../features/notifications/presentation/notifications_screen.dart';
import '../features/messaging/presentation/inbox_screen.dart';
import '../features/mentorship/presentation/mentorship_screen.dart';
import '../features/project_gig_management/presentation/project_gig_management_screen.dart';
import '../features/groups/presentation/groups_directory_screen.dart';
import '../features/groups/presentation/group_profile_screen.dart';
import '../features/groups/presentation/group_management_screen.dart';
import '../features/auth/application/session_controller.dart';
import '../features/pipeline/presentation/freelancer_pipeline_screen.dart';
import '../features/services/presentation/service_operations_screen.dart';
import '../features/finance/presentation/finance_screen.dart';
import '../features/pages/presentation/pages_screen.dart';
import '../features/connections/presentation/connections_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

const _notificationRoles = <String>{
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'admin',
};

final appRouterProvider = Provider<GoRouter>((ref) {
  final sessionState = ref.watch(sessionControllerProvider);

  bool canAccessNotifications() {
    final session = sessionState.session;
    if (session == null) {
      return false;
    }
    return session.memberships.any(_notificationRoles.contains);
  }

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
      GoRoute(
        path: '/projects/:id/auto-match',
        builder: (context, state) => ProjectAutoMatchScreen(
          projectId: int.tryParse(state.pathParameters['id'] ?? ''),
        ),
      ),
      GoRoute(path: '/launchpad', builder: (context, state) => const LaunchpadScreen()),
      GoRoute(path: '/volunteering', builder: (context, state) => const VolunteeringScreen()),
      GoRoute(
        path: '/notifications',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          if (!canAccessNotifications()) {
            return '/home?notice=notifications_locked';
          }
          return null;
        },
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(path: '/pages', builder: (context, state) => const PagesScreen()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
      GoRoute(path: '/inbox', builder: (context, state) => const InboxScreen()),
      GoRoute(path: '/finance', builder: (context, state) => const FinanceScreen()),
      GoRoute(path: '/connections', builder: (context, state) => const ConnectionsScreen()),
      GoRoute(path: '/operations', builder: (context, state) => const ServiceOperationsScreen()),
      GoRoute(
        path: '/dashboard/freelancer/pipeline',
        builder: (context, state) => const FreelancerPipelineScreen(),
      ),
      GoRoute(path: '/dashboard/mentor', builder: (context, state) => const MentorshipScreen()),
      GoRoute(path: '/groups', builder: (context, state) => const GroupsDirectoryScreen()),
      GoRoute(
        path: '/groups/:groupId',
        builder: (context, state) => GroupProfileScreen(
          groupId: state.pathParameters['groupId'] ?? state.uri.pathSegments.last,
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => ProfileScreen(profileId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: '/operations/manage',
        builder: (context, state) => ProjectGigManagementScreen(
          userId: state.uri.queryParameters['userId'] != null
              ? int.tryParse(state.uri.queryParameters['userId']!)
              : null,
          initialSection: sectionFromQuery(state.uri.queryParameters['section']),
        ),
      ),
      GoRoute(path: '/admin', builder: (context, state) => const AdminLoginScreen()),
      GoRoute(
        path: '/groups/manage',
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return '/login?redirect=$target';
          }
          if (!session.memberships.contains('admin')) {
            return '/home';
          }
          return null;
        },
        builder: (context, state) => const GroupManagementScreen(),
      ),
      GoRoute(path: '/admin/ads', builder: (context, state) => const AdsDashboardScreen()),
    ],
  );
});
