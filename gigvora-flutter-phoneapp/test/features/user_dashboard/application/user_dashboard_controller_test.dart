import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/features/user_dashboard/application/user_dashboard_controller.dart';
import 'package:gigvora_mobile/features/user_dashboard/data/user_dashboard_repository.dart';
import 'package:gigvora_mobile/features/user_dashboard/domain/user_dashboard.dart';

UserDashboardSnapshot buildSnapshot({bool fromCache = false}) {
  final now = DateTime.utc(2024, 5, 20, 10, 0);
  return UserDashboardSnapshot(
    generatedAt: now,
    fromCache: fromCache,
    summary: const UserDashboardSummary(
      totalApplications: 12,
      activeApplications: 6,
      interviewsScheduled: 3,
      documentsUploaded: 18,
      offersNegotiating: 2,
      connections: 140,
    ),
    pipeline: UserPipelineAutomation(
      boardName: 'Test Board',
      completionRate: 0.84,
      stages: const [
        UserPipelineStage(name: 'Applied', count: 8, serviceLevelHealth: 0.8),
      ],
      reminders: const [
        UserPipelineReminder(
          label: 'Send follow up',
          dueAt: DateTime.utc(2024, 5, 20, 15),
          priority: ReminderPriority.medium,
        ),
      ],
      guardrails: const ['Two-factor required'],
      nextAudit: DateTime.utc(2024, 5, 24),
    ),
    upcomingInterviews: const [
      UserInterviewSchedule(
        role: 'Product Designer',
        company: 'Atlas Studios',
        scheduledAt: DateTime.utc(2024, 5, 21, 13),
        stage: 'Panel',
        panel: 'Hiring Manager',
        location: 'Video conference',
      ),
    ],
    documentStudio: const DocumentStudioDigest(
      totalAssets: 12,
      templates: 6,
      portfolioProjects: 4,
      vendorDeliverables: 2,
      lastUpdatedBy: 'Test User',
      highlights: ['Resume refreshed'],
    ),
    nextActions: const [
      UserDashboardAction(
        label: 'Approve nudges',
        description: 'Review auto follow-ups',
        icon: Icons.rule,
        accent: Color(0xFF2563EB),
      ),
    ],
    focusDigest: const FocusDigest(
      nextFocusBlock: null,
      focusArea: 'Interview prep',
      minutesReserved: 90,
      highlights: ['Rehearsal scheduled'],
    ),
    complianceAlerts: const ['No alerts'],
    affiliateProgram: const AffiliateProgramDigest(
      enabled: true,
      currency: 'USD',
      lifetimeEarnings: 4200,
      pendingPayouts: 600,
      conversionRate: 22,
      nextPayoutAt: DateTime.utc(2024, 6, 1),
      referralWindowDays: 90,
      twoFactorRequired: true,
      kycRequired: true,
      requiredDocuments: ['W-8BEN'],
      tiers: [
        AffiliateTierDigest(name: 'Starter', rate: 8, minValue: 0, maxValue: 999),
      ],
      links: [
        AffiliateLinkDigest(
          label: 'Career accelerator',
          code: 'GV-CAREER',
          estimatedCommission: 120,
          totalRevenue: 960,
          conversions: 4,
        ),
      ],
    ),
  );
}

class _RecordingRepository extends UserDashboardRepository {
  _RecordingRepository(this.snapshot);

  final UserDashboardSnapshot snapshot;
  int fetchCount = 0;
  bool? lastForceRefresh;

  @override
  Future<UserDashboardSnapshot> fetchDashboard({bool forceRefresh = false}) async {
    fetchCount += 1;
    lastForceRefresh = forceRefresh;
    return forceRefresh ? snapshot.copyWith(fromCache: false, generatedAt: DateTime.now()) : snapshot;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('loads snapshot through provider and exposes data', () async {
    final repository = _RecordingRepository(buildSnapshot());

    final container = ProviderContainer(
      overrides: [
        userDashboardRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    final snapshot = await container.read(userDashboardControllerProvider.future);
    expect(snapshot.summary.totalApplications, 12);
    expect(repository.fetchCount, 1);
  });

  test('refresh triggers repository with force refresh flag', () async {
    final repository = _RecordingRepository(buildSnapshot());
    final container = ProviderContainer(
      overrides: [
        userDashboardRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    await container.read(userDashboardControllerProvider.future);
    final controller = container.read(userDashboardControllerProvider.notifier);

    await controller.refresh(forceRefresh: true);

    expect(repository.fetchCount, 2);
    expect(repository.lastForceRefresh, isTrue);
    final state = container.read(userDashboardControllerProvider);
    expect(state.value?.fromCache, isFalse);
  });
}
