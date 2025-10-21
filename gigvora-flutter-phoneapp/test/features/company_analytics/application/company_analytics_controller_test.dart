import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/company_analytics/application/company_analytics_controller.dart';
import 'package:gigvora_mobile/features/company_analytics/data/company_analytics_repository.dart';
import 'package:gigvora_mobile/features/company_analytics/data/models/company_analytics_dashboard.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_offline_cache.dart';

class StubCompanyAnalyticsRepository extends CompanyAnalyticsRepository {
  StubCompanyAnalyticsRepository({CompanyAnalyticsDashboard? dashboard})
      : _dashboard = dashboard ?? _buildDashboard(),
        super(InMemoryOfflineCache());

  CompanyAnalyticsDashboard _dashboard;
  bool shouldReturnError = false;
  bool shouldThrow = false;
  int persistCalls = 0;

  static CompanyAnalyticsDashboard _buildDashboard() {
    return CompanyAnalyticsDashboard(
      summary: const [AnalyticsMetric(label: 'Pipeline health', value: 'Strong')],
      forecast: const ForecastInsight(
        projectedHires: 18,
        backlog: 6,
        timeToFillDays: 32,
        atRiskProjects: 2,
      ),
      scenarios: const <ScenarioPlan>[],
      conversion: const ConversionSnapshot(
        applicationToInterview: 0.42,
        interviewToOffer: 0.36,
        offerToHire: 0.54,
        cycleTimeDays: 28,
        stages: <ConversionStage>[],
      ),
      workforce: const WorkforcePulse(
        attritionRisk: 0.08,
        mobilityOpportunities: 0.35,
        skillGapAlerts: 0.12,
        planAlignment: WorkforcePlanAlignment(
          headcountPlan: 120,
          headcountActual: 112,
          variance: -8,
          budgetPlan: 4.5,
          budgetActual: 4.1,
        ),
      ),
      alerting: const AnalyticsAlerting(
        openAlerts: 2,
        criticalAlerts: 1,
        dataFreshnessMinutes: 45,
      ),
    );
  }

  @override
  Future<RepositoryResult<CompanyAnalyticsDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    if (shouldThrow) {
      throw Exception('network failed');
    }
    if (shouldReturnError) {
      return RepositoryResult<CompanyAnalyticsDashboard>(
        data: _dashboard,
        fromCache: true,
        error: Exception('offline'),
        lastUpdated: DateTime.now().subtract(const Duration(minutes: 5)),
      );
    }
    return RepositoryResult<CompanyAnalyticsDashboard>(
      data: _dashboard,
      fromCache: forceRefresh,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<void> persistDashboard(CompanyAnalyticsDashboard dashboard) async {
    persistCalls += 1;
    _dashboard = dashboard;
  }
}

void main() {
  group('CompanyAnalyticsController', () {
    test('load syncs dashboard and logs analytics', () async {
      final repository = StubCompanyAnalyticsRepository();
      final analytics = TestAnalyticsService();

      final controller = CompanyAnalyticsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.data, isNotNull);
      expect(controller.state.data!.summary.first.value, 'Strong');
      expect(repository.persistCalls, greaterThanOrEqualTo(1));
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_analytics_viewed'),
      );
    });

    test('partial sync records analytics when repository returns cached data with error', () async {
      final repository = StubCompanyAnalyticsRepository()..shouldReturnError = true;
      final analytics = TestAnalyticsService();

      final controller = CompanyAnalyticsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_analytics_partial'),
      );
    });

    test('failure path logs analytics and keeps error in state', () async {
      final repository = StubCompanyAnalyticsRepository()..shouldThrow = true;
      final analytics = TestAnalyticsService();

      final controller = CompanyAnalyticsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_analytics_failed'),
      );
    });
  });
}
