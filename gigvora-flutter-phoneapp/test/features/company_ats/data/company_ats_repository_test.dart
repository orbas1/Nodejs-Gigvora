import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/company_ats/data/company_ats_repository.dart';
import 'package:gigvora_mobile/features/company_ats/data/company_ats_sample.dart';
import 'package:gigvora_mobile/features/company_ats/data/models/company_ats_dashboard.dart';

import '../../../support/test_offline_cache.dart';

class FlakyAtsCache extends InMemoryOfflineCache {
  FlakyAtsCache() : shouldThrow = false;

  bool shouldThrow;

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) {
    if (shouldThrow) {
      throw StateError('ATS cache write failure');
    }
    return super.write(key, value, ttl: ttl);
  }
}

void main() {
  group('CompanyAtsRepository', () {
    test('fetchDashboard caches and returns sample data', () async {
      final cache = InMemoryOfflineCache();
      final repository = CompanyAtsRepository(cache);

      final result = await repository.fetchDashboard(forceRefresh: true);

      expect(result.data.metrics, isNotEmpty);
      expect(result.fromCache, isFalse);

      final cached = cache.read<CompanyAtsDashboard>(
        'company:ats:dashboard',
        (raw) => CompanyAtsDashboard.fromJson(Map<String, dynamic>.from(raw as Map)),
      );
      expect(cached, isNotNull);
      expect(cached!.value.metrics.length, result.data.metrics.length);
    });

    test('fetchDashboard falls back to cached snapshot when cache write fails', () async {
      final cache = FlakyAtsCache();
      final repository = CompanyAtsRepository(cache);

      final snapshot = CompanyAtsDashboard.fromJson(companyAtsSample);
      await cache.write('company:ats:dashboard', snapshot.toJson());

      cache.shouldThrow = true;
      final result = await repository.fetchDashboard(forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.metrics.first.label, snapshot.metrics.first.label);
    });

    test('persistDashboard writes ATS dashboard to cache', () async {
      final cache = InMemoryOfflineCache();
      final repository = CompanyAtsRepository(cache);
      final dashboard = CompanyAtsDashboard.fromJson(companyAtsSample);

      await repository.persistDashboard(dashboard);

      final cached = cache.read<CompanyAtsDashboard>(
        'company:ats:dashboard',
        (raw) => CompanyAtsDashboard.fromJson(Map<String, dynamic>.from(raw as Map)),
      );

      expect(cached, isNotNull);
      expect(cached!.value.campaigns.first.channel, dashboard.campaigns.first.channel);
    });
  });
}
