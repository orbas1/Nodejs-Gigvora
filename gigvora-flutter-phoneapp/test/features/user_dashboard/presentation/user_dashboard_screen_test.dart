import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:riverpod/riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:gigvora_mobile/core/localization/gigvora_localizations.dart';
import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/user_dashboard/application/user_dashboard_controller.dart';
import 'package:gigvora_mobile/features/user_dashboard/domain/user_dashboard.dart';
import 'package:gigvora_mobile/features/user_dashboard/presentation/user_dashboard_screen.dart';

import '../../../support/test_design_tokens.dart';

UserDashboardSnapshot buildSnapshot() {
  return UserDashboardSnapshot(
    generatedAt: DateTime.utc(2024, 5, 20, 10),
    fromCache: false,
    summary: const UserDashboardSummary(
      totalApplications: 12,
      activeApplications: 5,
      interviewsScheduled: 3,
      documentsUploaded: 18,
      offersNegotiating: 2,
      connections: 142,
    ),
    pipeline: const UserPipelineAutomation(
      boardName: 'Automation workbench',
      completionRate: 0.82,
      stages: [
        UserPipelineStage(name: 'Applied', count: 10, serviceLevelHealth: 0.9),
      ],
      reminders: [
        UserPipelineReminder(
          label: 'Send thank you note',
          dueAt: DateTime.utc(2024, 5, 20, 14),
          priority: ReminderPriority.medium,
        ),
      ],
      guardrails: ['Two-step verification'],
      nextAudit: null,
    ),
    upcomingInterviews: const [
      UserInterviewSchedule(
        role: 'Product Designer',
        company: 'Atlas Studios',
        scheduledAt: DateTime.utc(2024, 5, 21, 15),
        stage: 'Panel',
        panel: 'Hiring Manager',
        location: 'Video conference',
      ),
    ],
    documentStudio: const DocumentStudioDigest(
      totalAssets: 20,
      templates: 8,
      portfolioProjects: 6,
      vendorDeliverables: 4,
      lastUpdatedBy: 'Test User',
      highlights: ['Resume refreshed'],
    ),
    nextActions: const [],
    focusDigest: const FocusDigest(
      nextFocusBlock: null,
      focusArea: 'Interview readiness',
      minutesReserved: 90,
      highlights: ['Practice session queued'],
    ),
    complianceAlerts: const ['No SLA breaches'],
    affiliateProgram: const AffiliateProgramDigest(
      enabled: true,
      currency: 'USD',
      lifetimeEarnings: 4200,
      pendingPayouts: 620,
      conversionRate: 24,
      nextPayoutAt: DateTime.utc(2024, 6, 1),
      referralWindowDays: 90,
      twoFactorRequired: true,
      kycRequired: true,
      requiredDocuments: ['W-8BEN'],
      tiers: [AffiliateTierDigest(name: 'Starter', rate: 8, minValue: 0, maxValue: 999)],
      links: [
        AffiliateLinkDigest(
          label: 'Career Accelerator cohort',
          code: 'GV-CAREER',
          estimatedCommission: 180,
          totalRevenue: 1400,
          conversions: 3,
        ),
      ],
    ),
  );
}

class _ImmediateDashboardController extends UserDashboardController {
  _ImmediateDashboardController(this.snapshot);

  final UserDashboardSnapshot snapshot;

  @override
  Future<UserDashboardSnapshot> build() async => snapshot;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shows login prompt when no session is active', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionControllerProvider.overrideWithValue(SessionController()),
          designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const MaterialApp(
          localizationsDelegates: [
            GigvoraLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
          ],
          supportedLocales: GigvoraLocalizations.supportedLocales,
          home: UserDashboardScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.textContaining('Sign in to access personalised insights'), findsOneWidget);
  });

  testWidgets('denies access when memberships lack required roles', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final controller = SessionController();
    controller.login(
      UserSession.demo().copyWith(
        memberships: ['mentor'],
        activeMembership: 'mentor',
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionControllerProvider.overrideWithValue(controller),
          designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const MaterialApp(
          localizationsDelegates: [
            GigvoraLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
          ],
          supportedLocales: GigvoraLocalizations.supportedLocales,
          home: UserDashboardScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.textContaining("You don't have an eligible membership"), findsOneWidget);
  });

  testWidgets('renders dashboard content when access is granted', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final controller = SessionController();
    controller.login(
      UserSession.demo().copyWith(
        memberships: ['freelancer', 'user'],
        activeMembership: 'freelancer',
      ),
    );

    final snapshot = buildSnapshot();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionControllerProvider.overrideWithValue(controller),
          userDashboardControllerProvider.overrideWith(() => _ImmediateDashboardController(snapshot)),
          designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const MaterialApp(
          localizationsDelegates: [
            GigvoraLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
          ],
          supportedLocales: GigvoraLocalizations.supportedLocales,
          home: UserDashboardScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('User & Job Seeker Command Center'), findsOneWidget);
    expect(find.text('Career pipeline automation'), findsOneWidget);
    expect(find.textContaining('Total applications'), findsOneWidget);
    expect(find.textContaining('Affiliate & referrals'), findsOneWidget);
  });
}
