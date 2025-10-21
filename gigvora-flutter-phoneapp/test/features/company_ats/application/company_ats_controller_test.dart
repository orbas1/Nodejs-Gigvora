import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/company_ats/application/company_ats_controller.dart';
import 'package:gigvora_mobile/features/company_ats/data/company_ats_repository.dart';
import 'package:gigvora_mobile/features/company_ats/data/company_ats_sample.dart';
import 'package:gigvora_mobile/features/company_ats/data/models/company_ats_dashboard.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_offline_cache.dart';

class StubCompanyAtsRepository extends CompanyAtsRepository {
  StubCompanyAtsRepository({CompanyAtsDashboard? dashboard})
      : _dashboard = dashboard ?? CompanyAtsDashboard.fromJson(companyAtsSample),
        super(InMemoryOfflineCache());

  CompanyAtsDashboard _dashboard;
  bool shouldReturnError = false;
  bool shouldThrow = false;
  int persistCalls = 0;

  @override
  Future<RepositoryResult<CompanyAtsDashboard>> fetchDashboard({bool forceRefresh = false}) async {
    if (shouldThrow) {
      throw Exception('network failed');
    }
    if (shouldReturnError) {
      return RepositoryResult<CompanyAtsDashboard>(
        data: _dashboard,
        fromCache: true,
        error: Exception('offline'),
        lastUpdated: DateTime.now().subtract(const Duration(minutes: 10)),
      );
    }
    return RepositoryResult<CompanyAtsDashboard>(
      data: _dashboard,
      fromCache: forceRefresh,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<void> persistDashboard(CompanyAtsDashboard dashboard) async {
    persistCalls += 1;
    _dashboard = dashboard;
  }
}

void main() {
  group('CompanyAtsController', () {
    test('load syncs dashboard and logs analytics', () async {
      final repository = StubCompanyAtsRepository();
      final analytics = TestAnalyticsService();

      final controller = CompanyAtsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.data, isNotNull);
      expect(controller.state.data!.metrics, isNotEmpty);
      expect(repository.persistCalls, greaterThanOrEqualTo(1));
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_ats_viewed'),
      );
    });

    test('partial sync records analytics when repository returns cached data with error', () async {
      final repository = StubCompanyAtsRepository()..shouldReturnError = true;
      final analytics = TestAnalyticsService();

      final controller = CompanyAtsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_ats_partial'),
      );
    });

    test('failure path logs analytics and keeps error in state', () async {
      final repository = StubCompanyAtsRepository()..shouldThrow = true;
      final analytics = TestAnalyticsService();

      final controller = CompanyAtsController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.error, isNotNull);
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_company_ats_failed'),
      );
    });
  });
}
