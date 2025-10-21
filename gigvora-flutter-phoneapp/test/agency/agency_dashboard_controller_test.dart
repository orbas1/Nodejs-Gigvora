import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_mobile/features/agency/application/agency_dashboard_controller.dart';
import 'package:gigvora_mobile/features/agency/data/agency_dashboard_repository.dart';
import 'package:gigvora_mobile/features/agency/domain/agency_dashboard.dart';

class _FakeRepository implements AgencyDashboardRepository {
  _FakeRepository(this.snapshot);

  AgencyDashboardSnapshot snapshot;
  int refreshes = 0;

  @override
  Future<AgencyDashboardSnapshot> fetchDashboard({bool forceRefresh = false}) async {
    refreshes++;
    if (forceRefresh) {
      snapshot = snapshot.copyWith(generatedAt: DateTime.now());
    }
    return snapshot;
  }
}

void main() {
  group('AgencyDashboardController', () {
    test('loads snapshot and supports refresh', () async {
      final repository = _FakeRepository(
        AgencyDashboardSnapshot(
          generatedAt: DateTime.now(),
          lookbackWindowDays: 90,
          metrics: const <AgencyMetricCard>[],
          alerts: const <AgencyAlert>[],
          squads: const <AgencySquadSnapshot>[],
          bench: const <AgencyBenchMember>[],
          pipeline: const <AgencyPipelineItem>[],
          recommendedActions: const <String>[],
          hr: const AgencyHrSnapshot(
            headcount: 0,
            contractors: 0,
            complianceOutstanding: 0,
            benchHours: 0,
            benchHealthLabel: 'Balanced',
            utilizationRate: 0,
            alerts: <AgencyHrAlert>[],
            policies: <AgencyHrPolicy>[],
            roleCoverage: <AgencyHrRoleCoverage>[],
            staffing: AgencyStaffingSummary(
              totalCapacityHours: 0,
              committedHours: 0,
              benchMembers: 0,
              benchRate: 0,
              summary: 'Healthy',
              recommendedAction: null,
            ),
            onboarding: <AgencyHrOnboardingCandidate>[],
            delegation: AgencyDelegationSummary(assignments: <AgencyDelegationAssignment>[], status: 'Ready'),
            milestones: AgencyMilestoneSummary(
              completed: 0,
              atRisk: 0,
              upcoming: 0,
              summary: 'Stable',
              highlights: <String>[],
            ),
            paymentSplits: AgencyPaymentSplitSummary(activeSplits: 0, pendingApproval: 0, completedThisMonth: 0, highlights: <String>[]),
          ),
        ),
      );

      final container = ProviderContainer(overrides: [
        agencyDashboardRepositoryProvider.overrideWithValue(repository),
      ]);
      addTearDown(container.dispose);

      final controller = container.read(agencyDashboardControllerProvider.notifier);
      final state = await container.read(agencyDashboardControllerProvider.future);

      expect(state, isA<AgencyDashboardSnapshot>());
      expect(repository.refreshes, 1);

      await controller.refresh(forceRefresh: true);
      final refreshed = container.read(agencyDashboardControllerProvider);
      expect(refreshed.hasError, isFalse);
      expect(refreshed.value!.generatedAt.isAfter(state.generatedAt), isTrue);
      expect(repository.refreshes, 2);
    });
  });
}
