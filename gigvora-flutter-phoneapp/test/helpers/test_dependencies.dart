import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'in_memory_offline_cache.dart';

final AppConfig testAppConfig = AppConfig(
  environment: AppEnvironment.development,
  apiBaseUrl: Uri.parse('https://example.com/api'),
  graphQlEndpoint: Uri.parse('https://example.com/graphql'),
  graphQlSubscriptionEndpoint: Uri.parse('wss://example.com/graphql'),
  realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
  defaultCacheTtl: const Duration(minutes: 5),
  enableNetworkLogging: false,
  analyticsFlushThreshold: 5,
  offlineCacheNamespace: 'gigvora_test',
  featureFlags: const <String, dynamic>{},
  featureFlagRefreshInterval: const Duration(minutes: 5),
);

class TestApiClient extends ApiClient {
  TestApiClient()
      : super(
          httpClient: _NoopHttpClient(),
          config: testAppConfig,
        );
}

class _NoopHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network access is disabled in test doubles.');
  }
}

class RecordingAnalyticsService extends AnalyticsService {
  RecordingAnalyticsService()
      : events = <AnalyticsEvent>[],
        super(
          apiClient: TestApiClient(),
          cache: InMemoryOfflineCache(),
          config: testAppConfig,
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
  const AnalyticsEvent({
    required this.name,
    required this.context,
    required this.metadata,
  });

  final String name;
  final Map<String, dynamic> context;
  final Map<String, dynamic> metadata;
}
