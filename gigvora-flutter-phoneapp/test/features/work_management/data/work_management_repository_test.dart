import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/work_management/data/work_management_repository.dart';
import 'package:gigvora_mobile/features/work_management/data/work_management_sample.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../helpers/recording_api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('WorkManagementRepository', () {
    test('returns remote data and caches the payload', () async {
      final cache = InMemoryOfflineCache();
      final apiClient = RecordingApiClient(onGet: (path, _, __, ___) async {
        expect(path, '/projects/42/work-management');
        return workManagementSample;
      });
      final repository = WorkManagementRepository(apiClient, cache);

      final first = await repository.fetchOverview(42);
      expect(first.fromCache, isFalse);
      expect(first.data.project?.name, 'Enterprise rebrand rollout');
      expect(apiClient.requests, hasLength(1));

      final second = await repository.fetchOverview(42);
      expect(second.fromCache, isTrue);
      expect(second.data.project?.name, 'Enterprise rebrand rollout');
      expect(apiClient.requests, hasLength(1));
    });

    test('surfaces cached data with error details when refresh fails', () async {
      final cache = InMemoryOfflineCache();
      var callCount = 0;
      final apiClient = RecordingApiClient(onGet: (path, _, __, ___) {
        callCount += 1;
        if (callCount == 1) {
          return workManagementSample;
        }
        throw Exception('Network offline');
      });
      final repository = WorkManagementRepository(apiClient, cache);

      final first = await repository.fetchOverview(42);
      expect(first.fromCache, isFalse);

      final second = await repository.fetchOverview(42, forceRefresh: true);
      expect(second.fromCache, isTrue);
      expect(second.error, isNotNull);
      expect(second.data.project?.name, 'Enterprise rebrand rollout');
      expect(callCount, 2);
    });

    test('falls back to bundled sample data when no cache is available', () async {
      final cache = InMemoryOfflineCache();
      final apiClient = RecordingApiClient(onGet: (path, _, __, ___) {
        throw Exception('Gateway timeout');
      });
      final repository = WorkManagementRepository(apiClient, cache);

      final result = await repository.fetchOverview(42);
      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.project?.name, 'Enterprise rebrand rollout');

      final cached = cache.read<Map<String, dynamic>>(
        'work_management:project:42',
        (raw) => Map<String, dynamic>.from(raw as Map),
      );
      expect(cached, isNotNull);
    });
  });
}
