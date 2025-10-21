import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/agency/data/agency_dashboard_repository.dart';

void main() {
  group('AgencyDashboardRepository', () {
    test('returns cached snapshot within TTL', () async {
      final repository = AgencyDashboardRepository();
      final first = await repository.fetchDashboard();
      final second = await repository.fetchDashboard();

      expect(first.fromCache, isFalse);
      expect(second.fromCache, isTrue);
      expect(second.generatedAt, equals(first.generatedAt));
    });

    test('forceRefresh bypasses cache', () async {
      final repository = AgencyDashboardRepository();
      final first = await repository.fetchDashboard();
      final refreshed = await repository.fetchDashboard(forceRefresh: true);

      expect(refreshed.fromCache, isFalse);
      expect(refreshed.generatedAt.isAfter(first.generatedAt), isTrue);
      expect(refreshed.generatedAt.difference(first.generatedAt).inMilliseconds, isNot(0));
    });
  });
}
