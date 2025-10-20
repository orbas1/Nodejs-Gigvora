import 'package:gigvora_foundation/gigvora_foundation.dart';

AppConfig createTestConfig() {
  return AppConfig(
    environment: AppEnvironment.development,
    apiBaseUrl: Uri.parse('https://example.com/api'),
    graphQlEndpoint: Uri.parse('https://example.com/graphql'),
    graphQlSubscriptionEndpoint: Uri.parse('wss://example.com/graphql'),
    realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
    defaultCacheTtl: const Duration(minutes: 5),
    enableNetworkLogging: false,
    analyticsFlushThreshold: 1,
    offlineCacheNamespace: 'gigvora_test',
    featureFlags: const <String, dynamic>{},
    featureFlagRefreshInterval: const Duration(minutes: 5),
  );
}
