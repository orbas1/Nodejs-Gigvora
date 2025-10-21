import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/company_ats/application/company_ats_controller.dart';
import 'package:gigvora_mobile/features/company_ats/data/models/company_ats_dashboard.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late FakeCompanyAtsRepository repository;
  late TestAnalyticsService analytics;
  late ProviderContainer container;

  setUp(() {
    repository = FakeCompanyAtsRepository();
    analytics = TestAnalyticsService();
    container = ProviderContainer(
      overrides: [
        companyAtsRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
  });

  test('loads dashboard data and records initial analytics event', () async {
    final controller = container.read(companyAtsControllerProvider.notifier);

    await controller.refresh();
    await Future<void>.delayed(const Duration(milliseconds: 10));

    final state = container.read(companyAtsControllerProvider);
    expect(state.data, repository.dashboard);
    expect(state.loading, isFalse);
    expect(state.error, isNull);
    expect(repository.forceRefreshCalls, equals(1));
    expect(analytics.events.map((event) => event.name), contains('mobile_company_ats_viewed'));
  });

  test('captures failure analytics and exposes error state', () async {
    repository.shouldThrow = true;
    final controller = container.read(companyAtsControllerProvider.notifier);

    await controller.refresh();

    final state = container.read(companyAtsControllerProvider);
    expect(state.loading, isFalse);
    expect(state.error, isNotNull);
    expect(
      analytics.events.map((event) => event.name),
      containsAll(<String>['mobile_company_ats_failed']),
    );
  });
}

class FakeCompanyAtsRepository extends CompanyAtsRepository {
  FakeCompanyAtsRepository()
      : dashboard = CompanyAtsDashboard(
          metrics: const [
            AtsMetric(label: 'Hires', value: '42'),
          ],
          readiness: const AtsReadiness(
            maturityScore: 0.78,
            tier: 'operational',
            status: 'on_track',
            scoreConfidence: 0.82,
            dataFreshnessHours: 2,
            measuredSignals: 12,
            expectedSignals: 14,
          ),
          stages: const <AtsStagePerformance>[],
          approvals: const AtsApprovalQueue(total: 2, overdue: 1, items: <AtsApprovalItem>[]),
          campaigns: const <AtsCampaignInsight>[],
          funnel: const <AtsFunnelStage>[],
          activity: const AtsActivitySummary(
            approvalsCompleted: 4,
            campaignsTracked: 2,
            interviewsScheduled: 6,
          ),
          interviewOperations: const AtsInterviewOperations(upcomingCount: 3),
          candidateExperience: const AtsCandidateExperience(),
          candidateCare: const AtsCandidateCare(),
        ),
        super(InMemoryOfflineCache());

  final CompanyAtsDashboard dashboard;
  bool shouldThrow = false;
  int forceRefreshCalls = 0;

  @override
  Future<RepositoryResult<CompanyAtsDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    if (forceRefresh) {
      forceRefreshCalls += 1;
    }
    if (shouldThrow) {
      throw Exception('network down');
    }
    return RepositoryResult<CompanyAtsDashboard>(
      data: dashboard,
      fromCache: false,
      lastUpdated: DateTime(2024, 1, 1),
    );
  }

  @override
  Future<void> persistDashboard(CompanyAtsDashboard dashboard) async {}
}
