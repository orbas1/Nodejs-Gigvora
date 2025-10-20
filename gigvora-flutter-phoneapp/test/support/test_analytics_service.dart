import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'test_app_config.dart';
import 'test_offline_cache.dart';
import 'test_api_client.dart';

class TestAnalyticsService extends AnalyticsService {
  TestAnalyticsService()
      : events = <AnalyticsEvent>[],
        super(
          apiClient: TestApiClient(),
          cache: InMemoryOfflineCache(),
          config: createTestConfig(),
        );

  final List<AnalyticsEvent> events;

  @override
  Future<bool> track(
    String eventName, {
    Map<String, dynamic>? context,
    Map<String, dynamic>? metadata,
  }) async {
    events.add(
      AnalyticsEvent(
        name: eventName,
        context: Map<String, dynamic>.from(context ?? const <String, dynamic>{}),
        metadata: Map<String, dynamic>.from(metadata ?? const <String, dynamic>{}),
      ),
    );
    return true;
  }
}

class AnalyticsEvent {
  AnalyticsEvent({required this.name, required this.context, required this.metadata});

  final String name;
  final Map<String, dynamic> context;
  final Map<String, dynamic> metadata;
}
