import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/company_analytics/data/company_analytics_repository.dart';
import 'package:gigvora_mobile/features/company_analytics/data/models/company_analytics_dashboard.dart';

import '../../../support/test_offline_cache.dart';

class FlakyOfflineCache extends InMemoryOfflineCache {
  FlakyOfflineCache() : shouldThrow = false;

  bool shouldThrow;

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) {
    if (shouldThrow) {
      throw StateError('Simulated write failure');
    }
    return super.write(key, value, ttl: ttl);
  }
}

CompanyAnalyticsDashboard buildDashboard() {
  return CompanyAnalyticsDashboard(
    summary: const [
      AnalyticsMetric(label: 'Pipeline health', value: 'Strong'),
    ],
    forecast: const ForecastInsight(
      projectedHires: 18,
      backlog: 6,
      timeToFillDays: 32,
      atRiskProjects: 2,
    ),
    scenarios: const [
      ScenarioPlan(
        name: 'Product expansion',
        hiringPlan: 24,
        budgetImpact: 1.2,
        probability: 0.6,
        status: 'onTrack',
      ),
    ],
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
      signals: <String>['Design guild at capacity'],
      cohortHighlights: <String>['New grad fellowship performing above target'],
    ),
    alerting: const AnalyticsAlerting(
      openAlerts: 2,
      criticalAlerts: 1,
      dataFreshnessMinutes: 45,
      recent: <AlertEvent>[],
    ),
  );
}

void main() {
  group('CompanyAnalyticsRepository', () {
    test('fetchDashboard caches and returns sample data', () async {
      final cache = InMemoryOfflineCache();
      final repository = CompanyAnalyticsRepository(cache);

      final result = await repository.fetchDashboard(forceRefresh: true);

      expect(result.data.summary, isNotEmpty);
      expect(result.fromCache, isFalse);

      final cached = cache.read<CompanyAnalyticsDashboard>(
        'company:analytics:dashboard',
        (raw) => CompanyAnalyticsDashboard.fromJson(Map<String, dynamic>.from(raw as Map)),
      );
      expect(cached, isNotNull);
      expect(cached!.value.summary.first.label, result.data.summary.first.label);
    });

    test('fetchDashboard falls back to cached dashboard when cache write fails', () async {
      final cache = FlakyOfflineCache();
      final repository = CompanyAnalyticsRepository(cache);

      final snapshot = buildDashboard();
      await cache.write('company:analytics:dashboard', snapshot.toJson());

      cache.shouldThrow = true;
      final result = await repository.fetchDashboard(forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.summary.first.label, 'Pipeline health');
    });

    test('persistDashboard writes dashboard snapshot to cache', () async {
      final cache = InMemoryOfflineCache();
      final repository = CompanyAnalyticsRepository(cache);
      final dashboard = buildDashboard();

      await repository.persistDashboard(dashboard);

      final cached = cache.read<CompanyAnalyticsDashboard>(
        'company:analytics:dashboard',
        (raw) => CompanyAnalyticsDashboard.fromJson(Map<String, dynamic>.from(raw as Map)),
      );

      expect(cached, isNotNull);
      expect(cached!.value.summary.first.value, 'Strong');
      expect(cached.value.forecast.projectedHires, 18);
    });
  });
}
