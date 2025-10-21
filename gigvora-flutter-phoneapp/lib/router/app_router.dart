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
import '../features/marketplace/presentation/gig_purchase_screen.dart';
import '../features/marketplace/presentation/job_detail_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/admin/presentation/admin_login_screen.dart';
import '../features/ads/presentation/ads_dashboard_screen.dart';
import '../features/notifications/presentation/notifications_screen.dart';
import '../features/messaging/presentation/inbox_screen.dart';
import '../features/mentorship/presentation/mentorship_screen.dart';
import '../features/mentorship/presentation/mentor_profile_screen.dart';
import '../features/pages/presentation/about_us_screen.dart';
import '../features/pages/presentation/privacy_policy_screen.dart';
import '../features/project_gig_management/presentation/project_gig_management_screen.dart';
import '../features/agency/presentation/agency_dashboard_screen.dart';
import '../features/networking/presentation/networking_screen.dart';
import '../features/groups/presentation/groups_directory_screen.dart';
import '../features/groups/presentation/group_profile_screen.dart';
import '../features/groups/presentation/group_management_screen.dart';
import '../features/pipeline/presentation/freelancer_pipeline_screen.dart';
import '../features/services/presentation/service_operations_screen.dart';
import '../features/finance/presentation/finance_screen.dart';
import '../features/pages/presentation/pages_screen.dart';
import '../features/support/presentation/support_screen.dart';
import '../features/connections/presentation/connections_screen.dart';
import '../features/work_management/presentation/work_management_screen.dart';
import '../features/integrations/presentation/company_integrations_screen.dart';
import '../features/user_dashboard/presentation/user_dashboard_screen.dart';
import '../features/blog/presentation/blog_list_screen.dart';
import '../features/blog/presentation/blog_detail_screen.dart';
import '../features/cv/presentation/cv_workspace_screen.dart';
import '../features/security/presentation/security_operations_screen.dart';
import '../features/company_analytics/presentation/company_analytics_screen.dart';
import '../features/company_ats/presentation/company_ats_screen.dart';
import '../features/creation_studio/presentation/creation_studio_screen.dart';
import '../features/app_boot/splash_screen.dart';
import '../features/calendar/presentation/calendar_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

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

const _userDashboardRoles = <String>{
  'user',
  'freelancer',
  'agency',
  'company',
  'headhunter',
};

const _securityRoles = <String>{
  'security',
  'trust',
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

  bool canAccessAgencyDashboard() {
    final session = sessionState.session;
    if (session == null) {
      return false;
    }
    return session.memberships
        .map((role) => role.toLowerCase())
        .contains('agency');
  }

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignUpScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/register/company', builder: (context, state) => const CompanyRegisterScreen()),
      GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
      GoRoute(path: '/calendar', builder: (context, state) => const CalendarScreen()),
      GoRoute(path: '/explorer', builder: (context, state) => const ExplorerScreen()),
      GoRoute(path: '/jobs', builder: (context, state) => const JobsScreen()),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) => JobDetailScreen(jobId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(path: '/gigs', builder: (context, state) => const GigsScreen()),
      GoRoute(path: '/gigs/purchase', builder: (context, state) => const GigPurchaseScreen()),
      GoRoute(path: '/projects', builder: (context, state) => const ProjectsScreen()),
      GoRoute(path: '/projects/new', builder: (context, state) => const ProjectPostScreen()),
      GoRoute(
        path: '/projects/:id/auto-match',
        builder: (context, state) => ProjectAutoMatchScreen(
          projectId: int.tryParse(state.pathParameters['id'] ?? ''),
        ),
      ),
      GoRoute(path: '/creation-studio', builder: (context, state) => const CreationStudioScreen()),
      GoRoute(path: '/blog', builder: (context, state) => const BlogListScreen()),
      GoRoute(
        path: '/blog/:slug',
        builder: (context, state) => BlogDetailScreen(slug: state.pathParameters['slug'] ?? ''),
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
      GoRoute(path: '/support', builder: (context, state) => const SupportScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/about', builder: (context, state) => const AboutUsScreen()),
      GoRoute(path: '/privacy', builder: (context, state) => const PrivacyPolicyScreen()),
      GoRoute(path: '/inbox', builder: (context, state) => const InboxScreen()),
      GoRoute(
        path: '/mentors/:id',
        builder: (context, state) => MentorProfileScreen(mentorId: state.pathParameters['id'] ?? 'mentor-aurora'),
      ),
      GoRoute(path: '/finance', builder: (context, state) => const FinanceScreen()),
      GoRoute(path: '/connections', builder: (context, state) => const ConnectionsScreen()),
      GoRoute(path: '/operations', builder: (context, state) => const ServiceOperationsScreen()),
      GoRoute(
        path: '/security/operations',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          final session = sessionState.session;
          if (session == null ||
              !session.memberships
                  .map((role) => role.toLowerCase())
                  .any(_securityRoles.contains)) {
            return '/home?notice=security_access_required';
          }
          return null;
        },
        builder: (context, state) => const SecurityOperationsScreen(),
      ),
      GoRoute(
        path: '/dashboard/company/integrations',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return '/home?notice=company_only';
          }
          return null;
        },
        builder: (context, state) => const CompanyIntegrationsScreen(),
      ),
      GoRoute(
        path: '/dashboard/company/ats',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return '/home?notice=company_only';
          }
          return null;
        },
        builder: (context, state) => const CompanyAtsScreen(),
      ),
      GoRoute(
        path: '/dashboard/company/analytics',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return '/home?notice=company_only';
          }
          return null;
        },
        builder: (context, state) => const CompanyAnalyticsScreen(),
      ),
      GoRoute(
        path: '/dashboard/freelancer/pipeline',
        builder: (context, state) => const FreelancerPipelineScreen(),
      ),
      GoRoute(
        path: '/dashboard/freelancer/work-management',
        builder: (context, state) => WorkManagementScreen(
          projectId: int.tryParse(state.uri.queryParameters['projectId'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/dashboard/user',
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return '/login?redirect=$target';
          }
          if (!session.memberships.any(_userDashboardRoles.contains)) {
            return '/home?notice=user_dashboard_locked';
          }
          return null;
        },
        builder: (context, state) => const UserDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/user/cv-workspace',
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return '/login?redirect=$target';
          }
          if (!session.memberships.any(_userDashboardRoles.contains)) {
            return '/home?notice=user_dashboard_locked';
          }
          return null;
        },
        builder: (context, state) => const CvWorkspaceScreen(),
      ),
      GoRoute(path: '/dashboard/mentor', builder: (context, state) => const MentorshipScreen()),
      GoRoute(
        path: '/dashboard/agency',
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return '/login?from=$redirectTo';
          }
          if (!canAccessAgencyDashboard()) {
            return '/home?notice=agency_access_required';
          }
          return null;
        },
        builder: (context, state) => const AgencyDashboardScreen(),
      ),
      GoRoute(path: '/networking', builder: (context, state) => const NetworkingScreen()),
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
