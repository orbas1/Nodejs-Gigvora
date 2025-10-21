import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/pipeline/data/models/freelancer_pipeline_dashboard.dart';
import 'package:gigvora_mobile/features/pipeline/data/pipeline_repository.dart';

import '../../../helpers/in_memory_offline_cache.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FreelancerPipelineRepository', () {
    late InMemoryOfflineCache cache;
    late FreelancerPipelineRepository repository;

    setUp(() {
      cache = InMemoryOfflineCache();
      repository = FreelancerPipelineRepository(cache);
    });

    test('fetchDashboard returns seeded data and caches the response', () async {
      final result = await repository.fetchDashboard();

      expect(result.data.deals, isNotEmpty);
      expect(result.fromCache, isFalse);

      final cached = await repository.fetchDashboard();
      expect(cached.fromCache, isTrue);
      expect(cached.data.deals, isNotEmpty);
    });

    test('persistDashboard overwrites cached data', () async {
      final result = await repository.fetchDashboard();
      final dashboard = result.data;
      final clearedDashboard = dashboard.copyWith(deals: const <PipelineDeal>[]);

      await repository.persistDashboard(clearedDashboard);

      final cached = await repository.fetchDashboard();
      expect(cached.data.deals, isEmpty);
    });
  });
}
