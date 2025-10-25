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
import 'routes.dart';

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
    routes: [
      GoRoute(name: AppRoute.splash.name, path: AppRoute.splash.path, builder: (context, state) => const SplashScreen()),
      GoRoute(name: AppRoute.home.name, path: AppRoute.home.path, builder: (context, state) => const HomeScreen()),
      GoRoute(name: AppRoute.signUp.name, path: AppRoute.signUp.path, builder: (context, state) => const SignUpScreen()),
      GoRoute(name: AppRoute.login.name, path: AppRoute.login.path, builder: (context, state) => const LoginScreen()),
      GoRoute(name: AppRoute.register.name, path: AppRoute.register.path, builder: (context, state) => const RegisterScreen()),
      GoRoute(name: AppRoute.registerCompany.name, path: AppRoute.registerCompany.path, builder: (context, state) => const CompanyRegisterScreen()),
      GoRoute(name: AppRoute.feed.name, path: AppRoute.feed.path, builder: (context, state) => const FeedScreen()),
      GoRoute(name: AppRoute.calendar.name, path: AppRoute.calendar.path, builder: (context, state) => const CalendarScreen()),
      GoRoute(name: AppRoute.explorer.name, path: AppRoute.explorer.path, builder: (context, state) => const ExplorerScreen()),
      GoRoute(name: AppRoute.jobs.name, path: AppRoute.jobs.path, builder: (context, state) => const JobsScreen()),
      GoRoute(
        name: AppRoute.jobDetail.name,
        path: AppRoute.jobDetail.path,
        builder: (context, state) => JobDetailScreen(jobId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(name: AppRoute.gigs.name, path: AppRoute.gigs.path, builder: (context, state) => const GigsScreen()),
      GoRoute(name: AppRoute.gigPurchase.name, path: AppRoute.gigPurchase.path, builder: (context, state) => const GigPurchaseScreen()),
      GoRoute(name: AppRoute.projects.name, path: AppRoute.projects.path, builder: (context, state) => const ProjectsScreen()),
      GoRoute(name: AppRoute.projectPost.name, path: AppRoute.projectPost.path, builder: (context, state) => const ProjectPostScreen()),
      GoRoute(
        name: AppRoute.projectAutoMatch.name,
        path: AppRoute.projectAutoMatch.path,
        builder: (context, state) => ProjectAutoMatchScreen(
          projectId: int.tryParse(state.pathParameters['id'] ?? ''),
        ),
      ),
      GoRoute(name: AppRoute.creationStudio.name, path: AppRoute.creationStudio.path, builder: (context, state) => const CreationStudioScreen()),
      GoRoute(name: AppRoute.blogList.name, path: AppRoute.blogList.path, builder: (context, state) => const BlogListScreen()),
      GoRoute(
        name: AppRoute.blogDetail.name,
        path: AppRoute.blogDetail.path,
        builder: (context, state) => BlogDetailScreen(slug: state.pathParameters['slug'] ?? ''),
      ),
      GoRoute(name: AppRoute.launchpad.name, path: AppRoute.launchpad.path, builder: (context, state) => const LaunchpadScreen()),
      GoRoute(name: AppRoute.volunteering.name, path: AppRoute.volunteering.path, builder: (context, state) => const VolunteeringScreen()),
      GoRoute(
        name: AppRoute.notifications.name,
        path: AppRoute.notifications.path,
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
      GoRoute(name: AppRoute.pages.name, path: AppRoute.pages.path, builder: (context, state) => const PagesScreen()),
      GoRoute(name: AppRoute.support.name, path: AppRoute.support.path, builder: (context, state) => const SupportScreen()),
      GoRoute(name: AppRoute.settings.name, path: AppRoute.settings.path, builder: (context, state) => const SettingsScreen()),
      GoRoute(name: AppRoute.about.name, path: AppRoute.about.path, builder: (context, state) => const AboutUsScreen()),
      GoRoute(name: AppRoute.privacy.name, path: AppRoute.privacy.path, builder: (context, state) => const PrivacyPolicyScreen()),
      GoRoute(name: AppRoute.inbox.name, path: AppRoute.inbox.path, builder: (context, state) => const InboxScreen()),
      GoRoute(
        name: AppRoute.mentorProfile.name,
        path: AppRoute.mentorProfile.path,
        builder: (context, state) => MentorProfileScreen(mentorId: state.pathParameters['id'] ?? 'mentor-aurora'),
      ),
      GoRoute(name: AppRoute.finance.name, path: AppRoute.finance.path, builder: (context, state) => const FinanceScreen()),
      GoRoute(name: AppRoute.connections.name, path: AppRoute.connections.path, builder: (context, state) => const ConnectionsScreen()),
      GoRoute(name: AppRoute.serviceOperations.name, path: AppRoute.serviceOperations.path, builder: (context, state) => const ServiceOperationsScreen()),
      GoRoute(
        name: AppRoute.securityOperations.name,
        path: AppRoute.securityOperations.path,
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
        name: AppRoute.companyIntegrations.name,
        path: AppRoute.companyIntegrations.path,
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
        name: AppRoute.companyAts.name,
        path: AppRoute.companyAts.path,
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
        name: AppRoute.companyAnalytics.name,
        path: AppRoute.companyAnalytics.path,
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
        name: AppRoute.freelancerPipeline.name,
        path: AppRoute.freelancerPipeline.path,
        builder: (context, state) => const FreelancerPipelineScreen(),
      ),
      GoRoute(
        name: AppRoute.freelancerWorkManagement.name,
        path: AppRoute.freelancerWorkManagement.path,
        builder: (context, state) => WorkManagementScreen(
          projectId: int.tryParse(state.uri.queryParameters['projectId'] ?? ''),
        ),
      ),
      GoRoute(
        name: AppRoute.userDashboard.name,
        path: AppRoute.userDashboard.path,
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
        name: AppRoute.userCvWorkspace.name,
        path: AppRoute.userCvWorkspace.path,
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
      GoRoute(name: AppRoute.mentorDashboard.name, path: AppRoute.mentorDashboard.path, builder: (context, state) => const MentorshipScreen()),
      GoRoute(
        name: AppRoute.agencyDashboard.name,
        path: AppRoute.agencyDashboard.path,
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
      GoRoute(name: AppRoute.networking.name, path: AppRoute.networking.path, builder: (context, state) => const NetworkingScreen()),
      GoRoute(name: AppRoute.groupsDirectory.name, path: AppRoute.groupsDirectory.path, builder: (context, state) => const GroupsDirectoryScreen()),
      GoRoute(
        name: AppRoute.groupProfile.name,
        path: AppRoute.groupProfile.path,
        builder: (context, state) => GroupProfileScreen(
          groupId: state.pathParameters['groupId'] ?? state.uri.pathSegments.last,
        ),
      ),
      GoRoute(
        name: AppRoute.profile.name,
        path: AppRoute.profile.path,
        builder: (context, state) => ProfileScreen(profileId: state.uri.queryParameters['id']),
      ),
      GoRoute(
        name: AppRoute.projectOperations.name,
        path: AppRoute.projectOperations.path,
        builder: (context, state) => ProjectGigManagementScreen(
          userId: state.uri.queryParameters['userId'] != null
              ? int.tryParse(state.uri.queryParameters['userId']!)
              : null,
          initialSection: sectionFromQuery(state.uri.queryParameters['section']),
        ),
      ),
      GoRoute(name: AppRoute.adminLogin.name, path: AppRoute.adminLogin.path, builder: (context, state) => const AdminLoginScreen()),
      GoRoute(
        name: AppRoute.groupsManage.name,
        path: AppRoute.groupsManage.path,
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
      GoRoute(name: AppRoute.adminAds.name, path: AppRoute.adminAds.path, builder: (context, state) => const AdsDashboardScreen()),
    ],
  );
});
