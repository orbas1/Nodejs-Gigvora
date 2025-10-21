import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../helpers/in_memory_offline_cache.dart';
import '../../helpers/recording_api_client.dart';
import '../../helpers/test_dependencies.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AnalyticsService', () {
    test('sends events immediately when transport succeeds', () async {
      final cache = InMemoryOfflineCache();
      final client = RecordingApiClient(onPost: (path, _, __, body) async {
        expect(path, '/analytics/events');
        expect(body, isA<Map<String, dynamic>>());
        return {'ok': true};
      });
      final service = AnalyticsService(apiClient: client, cache: cache, config: testAppConfig);

      final result = await service.track('mobile_viewed', context: {'screen': 'dashboard'});
      expect(result, isTrue);
      expect(client.requests, hasLength(1));

      await service.flushQueue();
      expect(client.requests, hasLength(1));
    });

    test('queues events when network fails and flushes later', () async {
      final cache = InMemoryOfflineCache();
      var shouldFail = true;
      final client = RecordingApiClient(onPost: (path, _, __, body) {
        if (shouldFail) {
          throw Exception('Network error');
        }
        return {'ok': true};
      });
      final service = AnalyticsService(apiClient: client, cache: cache, config: testAppConfig);

      final success = await service.track('mobile_failed', context: {'screen': 'dashboard'});
      expect(success, isFalse);

      final queueEntry = cache.read<List<Map<String, dynamic>>>(
        '${testAppConfig.offlineCacheNamespace}:analytics:event_queue',
        (raw) => raw is List
            ? raw.whereType<Map>().map((value) => Map<String, dynamic>.from(value)).toList()
            : <Map<String, dynamic>>[],
      );
      expect(queueEntry, isNotNull);
      expect(queueEntry!.value, hasLength(1));

      shouldFail = false;
      await service.flushQueue();

      expect(client.requests.length, greaterThan(0));
      final flushedQueue = cache.read<List<Map<String, dynamic>>>(
        '${testAppConfig.offlineCacheNamespace}:analytics:event_queue',
        (raw) => <Map<String, dynamic>>[],
      );
      expect(flushedQueue, isNull);
    });

    test('ignores empty event names', () async {
      final cache = InMemoryOfflineCache();
      final client = RecordingApiClient(onPost: (path, _, __, body) async => {'ok': true});
      final service = AnalyticsService(apiClient: client, cache: cache, config: testAppConfig);

      final result = await service.track('');
      expect(result, isFalse);
      expect(client.requests, isEmpty);
    });
  });
}
