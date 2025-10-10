import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'analytics/analytics_service.dart';
import 'cache/offline_cache.dart';
import 'network/api_client.dart';

final offlineCacheProvider = Provider<OfflineCache>((ref) {
  return OfflineCache.instance;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final client = createApiClient();
  ref.onDispose(client.dispose);
  return client;
});

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return AnalyticsService(apiClient, cache);
});

final analyticsBootstrapProvider = FutureProvider<void>((ref) async {
  final analytics = ref.watch(analyticsServiceProvider);
  await analytics.flushQueue();
});
