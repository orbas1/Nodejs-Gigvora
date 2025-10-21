import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/finance/data/finance_repository.dart';
import 'package:gigvora_mobile/features/finance/data/models/finance_overview.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  group('FinanceRepository', () {
    test('returns remote overview and seeds cache', () async {
      final cache = InMemoryOfflineCache();
      final client = TestApiClient(
        onGet: (path) async {
          expect(path, '/finance/control-tower/overview');
          return {
            'summary': {
              'currency': 'USD',
              'inEscrow': 1200,
              'pendingRelease': 300,
              'disputeHold': 50,
              'releasedThisWeek': 900,
              'netCashFlow7d': 100,
              'forecast30d': 2000,
            },
            'accounts': const [],
            'releaseQueue': const [],
            'disputeQueue': const [],
            'complianceTasks': const [],
            'cashflow': const [],
          };
        },
      );
      final repository = FinanceRepository(client, cache);

      final result = await repository.fetchOverview();

      expect(result.data.summary.inEscrow, 1200);
      expect(result.fromCache, isFalse);

      final cached = cache.read<FinanceOverview>(
        'finance:control_tower:overview',
        (raw) => FinanceOverview.fromJson(Map<String, dynamic>.from(raw as Map)),
      );
      expect(cached, isNotNull);
    });

    test('uses cached value when network fails', () async {
      final cache = InMemoryOfflineCache();
      final overview = FinanceOverview.empty();
      await cache.write('finance:control_tower:overview', overview.toJson());

      final repository = FinanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('timeout')),
        cache,
      );

      final result = await repository.fetchOverview(forceRefresh: true);

      expect(result.data.isEmpty, isTrue);
      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
    });

    test('falls back to sample data when nothing cached', () async {
      final cache = InMemoryOfflineCache();
      final repository = FinanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('offline')),
        cache,
      );

      final result = await repository.fetchOverview(forceRefresh: true);

      expect(result.data.accounts, isNotEmpty);
      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
    });
  });
}
