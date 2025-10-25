import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/application/session_controller.dart';
import 'app_routes.dart';
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
import 'route_analytics_observer.dart';

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
    initialLocation: AppRoute.splash.path,
    observers: (context, state) => [ref.watch(routeAnalyticsObserverProvider)],
    routes: [
      GoRoute(
        path: AppRoute.splash.path,
        name: AppRoute.splash.name,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoute.home.path,
        name: AppRoute.home.name,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoute.signup.path,
        name: AppRoute.signup.name,
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoute.register.path,
        name: AppRoute.register.name,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoute.registerCompany.path,
        name: AppRoute.registerCompany.name,
        builder: (context, state) => const CompanyRegisterScreen(),
      ),
      GoRoute(
        path: AppRoute.feed.path,
        name: AppRoute.feed.name,
        builder: (context, state) => const FeedScreen(),
      ),
      GoRoute(
        path: AppRoute.calendar.path,
        name: AppRoute.calendar.name,
        builder: (context, state) => const CalendarScreen(),
      ),
      GoRoute(
        path: AppRoute.explorer.path,
        name: AppRoute.explorer.name,
        builder: (context, state) => const ExplorerScreen(),
      ),
      GoRoute(
        path: AppRoute.jobs.path,
        name: AppRoute.jobs.name,
        builder: (context, state) => const JobsScreen(),
      ),
      GoRoute(
        path: AppRoute.jobDetail.path,
        name: AppRoute.jobDetail.name,
        builder: (context, state) =>
            JobDetailScreen(jobId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: AppRoute.gigs.path,
        name: AppRoute.gigs.name,
        builder: (context, state) => const GigsScreen(),
      ),
      GoRoute(
        path: AppRoute.gigPurchase.path,
        name: AppRoute.gigPurchase.name,
        builder: (context, state) => const GigPurchaseScreen(),
      ),
      GoRoute(
        path: AppRoute.projects.path,
        name: AppRoute.projects.name,
        builder: (context, state) => const ProjectsScreen(),
      ),
      GoRoute(
        path: AppRoute.projectNew.path,
        name: AppRoute.projectNew.name,
        builder: (context, state) => const ProjectPostScreen(),
      ),
      GoRoute(
        path: AppRoute.projectAutoMatch.path,
        name: AppRoute.projectAutoMatch.name,
        builder: (context, state) => ProjectAutoMatchScreen(
          projectId: int.tryParse(state.pathParameters['id'] ?? ''),
        ),
      ),
      GoRoute(
        path: AppRoute.creationStudio.path,
        name: AppRoute.creationStudio.name,
        builder: (context, state) => const CreationStudioScreen(),
      ),
      GoRoute(
        path: AppRoute.blogList.path,
        name: AppRoute.blogList.name,
        builder: (context, state) => const BlogListScreen(),
      ),
      GoRoute(
        path: AppRoute.blogDetail.path,
        name: AppRoute.blogDetail.name,
        builder: (context, state) =>
            BlogDetailScreen(slug: state.pathParameters['slug'] ?? ''),
      ),
      GoRoute(
        path: AppRoute.launchpad.path,
        name: AppRoute.launchpad.name,
        builder: (context, state) => const LaunchpadScreen(),
      ),
      GoRoute(
        path: AppRoute.volunteering.path,
        name: AppRoute.volunteering.name,
        builder: (context, state) => const VolunteeringScreen(),
      ),
      GoRoute(
        path: AppRoute.notifications.path,
        name: AppRoute.notifications.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          if (!canAccessNotifications()) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'notifications_locked'});
          }
          return null;
        },
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: AppRoute.pages.path,
        name: AppRoute.pages.name,
        builder: (context, state) => const PagesScreen(),
      ),
      GoRoute(
        path: AppRoute.support.path,
        name: AppRoute.support.name,
        builder: (context, state) => const SupportScreen(),
      ),
      GoRoute(
        path: AppRoute.settings.path,
        name: AppRoute.settings.name,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: AppRoute.about.path,
        name: AppRoute.about.name,
        builder: (context, state) => const AboutUsScreen(),
      ),
      GoRoute(
        path: AppRoute.privacy.path,
        name: AppRoute.privacy.name,
        builder: (context, state) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: AppRoute.inbox.path,
        name: AppRoute.inbox.name,
        builder: (context, state) => const InboxScreen(),
      ),
      GoRoute(
        path: AppRoute.mentorProfile.path,
        name: AppRoute.mentorProfile.name,
        builder: (context, state) => MentorProfileScreen(
            mentorId: state.pathParameters['id'] ?? 'mentor-aurora'),
      ),
      GoRoute(
        path: AppRoute.finance.path,
        name: AppRoute.finance.name,
        builder: (context, state) => const FinanceScreen(),
      ),
      GoRoute(
        path: AppRoute.connections.path,
        name: AppRoute.connections.name,
        builder: (context, state) => const ConnectionsScreen(),
      ),
      GoRoute(
        path: AppRoute.serviceOperations.path,
        name: AppRoute.serviceOperations.name,
        builder: (context, state) => const ServiceOperationsScreen(),
      ),
      GoRoute(
        path: AppRoute.securityOperations.path,
        name: AppRoute.securityOperations.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          final session = sessionState.session;
          if (session == null ||
              !session.memberships
                  .map((role) => role.toLowerCase())
                  .any(_securityRoles.contains)) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'security_access_required'});
          }
          return null;
        },
        builder: (context, state) => const SecurityOperationsScreen(),
      ),
      GoRoute(
        path: AppRoute.companyIntegrations.path,
        name: AppRoute.companyIntegrations.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'company_only'});
          }
          return null;
        },
        builder: (context, state) => const CompanyIntegrationsScreen(),
      ),
      GoRoute(
        path: AppRoute.companyAts.path,
        name: AppRoute.companyAts.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'company_only'});
          }
          return null;
        },
        builder: (context, state) => const CompanyAtsScreen(),
      ),
      GoRoute(
        path: AppRoute.companyAnalytics.path,
        name: AppRoute.companyAnalytics.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          final session = sessionState.session;
          if (session == null || !session.memberships.contains('company')) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'company_only'});
          }
          return null;
        },
        builder: (context, state) => const CompanyAnalyticsScreen(),
      ),
      GoRoute(
        path: AppRoute.freelancerPipeline.path,
        name: AppRoute.freelancerPipeline.name,
        builder: (context, state) => const FreelancerPipelineScreen(),
      ),
      GoRoute(
        path: AppRoute.freelancerWorkManagement.path,
        name: AppRoute.freelancerWorkManagement.name,
        builder: (context, state) => WorkManagementScreen(
          projectId: int.tryParse(state.uri.queryParameters['projectId'] ?? ''),
        ),
      ),
      GoRoute(
        path: AppRoute.userDashboard.path,
        name: AppRoute.userDashboard.name,
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'redirect': target});
          }
          if (!session.memberships.any(_userDashboardRoles.contains)) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'user_dashboard_locked'});
          }
          return null;
        },
        builder: (context, state) => const UserDashboardScreen(),
      ),
      GoRoute(
        path: AppRoute.cvWorkspace.path,
        name: AppRoute.cvWorkspace.name,
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'redirect': target});
          }
          if (!session.memberships.any(_userDashboardRoles.contains)) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'user_dashboard_locked'});
          }
          return null;
        },
        builder: (context, state) => const CvWorkspaceScreen(),
      ),
      GoRoute(
        path: AppRoute.mentorDashboard.path,
        name: AppRoute.mentorDashboard.name,
        builder: (context, state) => const MentorshipScreen(),
      ),
      GoRoute(
        path: AppRoute.agencyDashboard.path,
        name: AppRoute.agencyDashboard.name,
        redirect: (context, state) {
          if (!sessionState.isAuthenticated) {
            final redirectTo = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'from': redirectTo});
          }
          if (!canAccessAgencyDashboard()) {
            return AppRoute.home
                .location(queryParameters: {'notice': 'agency_access_required'});
          }
          return null;
        },
        builder: (context, state) => const AgencyDashboardScreen(),
      ),
      GoRoute(
        path: AppRoute.networking.path,
        name: AppRoute.networking.name,
        builder: (context, state) => const NetworkingScreen(),
      ),
      GoRoute(
        path: AppRoute.groupsDirectory.path,
        name: AppRoute.groupsDirectory.name,
        builder: (context, state) => const GroupsDirectoryScreen(),
      ),
      GoRoute(
        path: AppRoute.groupProfile.path,
        name: AppRoute.groupProfile.name,
        builder: (context, state) => GroupProfileScreen(
          groupId: state.pathParameters['groupId'] ?? state.uri.pathSegments.last,
        ),
      ),
      GoRoute(
        path: AppRoute.profile.path,
        name: AppRoute.profile.name,
        builder: (context, state) =>
            ProfileScreen(profileId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: AppRoute.projectGigManagement.path,
        name: AppRoute.projectGigManagement.name,
        builder: (context, state) => ProjectGigManagementScreen(
          userId: state.uri.queryParameters['userId'] != null
              ? int.tryParse(state.uri.queryParameters['userId']!)
              : null,
          initialSection: sectionFromQuery(state.uri.queryParameters['section']),
        ),
      ),
      GoRoute(
        path: AppRoute.adminLogin.path,
        name: AppRoute.adminLogin.name,
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: AppRoute.groupManagement.path,
        name: AppRoute.groupManagement.name,
        redirect: (context, state) {
          final session = sessionState.session;
          if (session == null) {
            final target = Uri.encodeComponent(state.uri.toString());
            return AppRoute.login
                .location(queryParameters: {'redirect': target});
          }
          if (!session.memberships.contains('admin')) {
            return AppRoute.home.path;
          }
          return null;
        },
        builder: (context, state) => const GroupManagementScreen(),
      ),
      GoRoute(
        path: AppRoute.adsDashboard.path,
        name: AppRoute.adsDashboard.name,
        builder: (context, state) => const AdsDashboardScreen(),
      ),
    ],
  );
});
