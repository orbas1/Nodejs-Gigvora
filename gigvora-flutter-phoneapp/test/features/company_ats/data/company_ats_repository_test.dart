import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/company_ats/data/company_ats_repository.dart';
import 'package:gigvora_mobile/features/company_ats/data/models/company_ats_dashboard.dart';

import '../../../helpers/in_memory_offline_cache.dart';

void main() {
  late InMemoryOfflineCache cache;
  late CompanyAtsRepository repository;

  setUp(() {
    cache = InMemoryOfflineCache();
    repository = CompanyAtsRepository(cache);
  });

  test('returns sample dashboard data on first load and caches it', () async {
    final result = await repository.fetchDashboard();

    expect(result.data, isA<CompanyAtsDashboard>());
    expect(result.fromCache, isFalse);
    expect(result.error, isNull);

    final cached = cache.read<CompanyAtsDashboard>('company:ats:dashboard', (raw) {
      if (raw is Map<String, dynamic>) {
        return CompanyAtsDashboard.fromJson(raw);
      }
      if (raw is Map) {
        return CompanyAtsDashboard.fromJson(Map<String, dynamic>.from(raw as Map));
      }
      throw StateError('Unexpected cache payload');
    });

    expect(cached, isNotNull);
    expect(cached!.value.metrics, isNotEmpty);
  });

  test('falls back to cached dashboard when persistence fails', () async {
    final cache = _ThrowingCache();
    final repository = CompanyAtsRepository(cache);

    // Seed cache with initial data.
    final initial = await repository.fetchDashboard();
    expect(initial.fromCache, isFalse);

    cache.throwOnWrite = true;
    final result = await repository.fetchDashboard(forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.data.metrics, isNotEmpty);
    expect(result.error, isNotNull);
  });
}

class _ThrowingCache extends InMemoryOfflineCache {
  bool throwOnWrite = false;

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) {
    if (throwOnWrite) {
      throw StateError('Simulated cache write failure');
    }
    return super.write(key, value, ttl: ttl);
  }
}
