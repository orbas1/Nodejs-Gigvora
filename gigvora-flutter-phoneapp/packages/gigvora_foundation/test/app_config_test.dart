import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

void main() {
  group('AppConfig', () {
    final baseConfig = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUrl: Uri.parse('https://api.dev.gigvora.com/api'),
      graphQlEndpoint: Uri.parse('https://api.dev.gigvora.com/graphql'),
      graphQlSubscriptionEndpoint: Uri.parse('wss://api.dev.gigvora.com/graphql'),
      realtimeEndpoint: Uri.parse('wss://ws.dev.gigvora.com'),
      defaultCacheTtl: const Duration(minutes: 5),
      enableNetworkLogging: true,
      analyticsFlushThreshold: 25,
      offlineCacheNamespace: 'gigvora_dev_cache',
      featureFlags: const {'feature': true},
      featureFlagRefreshInterval: const Duration(minutes: 5),
    );

    test('exposes environment helpers', () {
      expect(baseConfig.isDevelopment, isTrue);
      expect(baseConfig.isStaging, isFalse);
      expect(baseConfig.isProduction, isFalse);

      final staging = baseConfig.copyWith(environment: AppEnvironment.staging);
      expect(staging.isStaging, isTrue);
    });

    test('copyWith overrides selected fields while preserving defaults', () {
      final copy = baseConfig.copyWith(
        apiBaseUrl: Uri.parse('https://api.prod.gigvora.com/api'),
        offlineCacheNamespace: 'gigvora_prod_cache',
        analyticsFlushThreshold: 40,
      );

      expect(copy.apiBaseUrl.toString(), 'https://api.prod.gigvora.com/api');
      expect(copy.offlineCacheNamespace, 'gigvora_prod_cache');
      expect(copy.analyticsFlushThreshold, 40);
      expect(copy.graphQlEndpoint, baseConfig.graphQlEndpoint);
      expect(copy.featureFlags, baseConfig.featureFlags);
    });
  });
}
