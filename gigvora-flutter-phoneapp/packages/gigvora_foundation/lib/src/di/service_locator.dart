import 'package:get_it/get_it.dart';
import 'package:http/http.dart' as http;

import '../analytics/analytics_service.dart';
import '../cache/offline_cache.dart';
import '../config/app_config.dart';
import '../config/feature_flag_service.dart';
import '../network/api_client.dart';
import '../network/graphql_gateway.dart';
import '../network/realtime_gateway.dart';

class ServiceLocator {
  ServiceLocator._();

  static final GetIt _getIt = GetIt.instance;
  static bool _configured = false;

  static bool get isConfigured => _configured;

  static Future<AppConfig> configure({
    AppConfig? config,
    List<ApiRequestInterceptor>? requestInterceptors,
    List<ApiResponseInterceptor>? responseInterceptors,
    AuthTokenResolver? authTokenResolver,
    Duration? realtimePingInterval,
    Duration? realtimeReconnectDelay,
  }) async {
    if (_configured) {
      await reset();
    }

    final resolvedConfig = config ?? AppConfig.fromEnvironment();
    _getIt.registerSingleton<AppConfig>(resolvedConfig);

    final offlineCache = OfflineCache(config: resolvedConfig);
    await offlineCache.init();
    _getIt.registerSingleton<OfflineCache>(offlineCache, dispose: (cache) => cache.dispose());

    final httpClient = http.Client();
    _getIt.registerSingleton<http.Client>(httpClient, dispose: (client) => client.close());

    final apiClient = ApiClient(
      httpClient: _getIt<http.Client>(),
      config: resolvedConfig,
      requestInterceptors: requestInterceptors,
      responseInterceptors: responseInterceptors,
    );
    _getIt.registerSingleton<ApiClient>(apiClient, dispose: (client) => client.dispose());

    final analytics = AnalyticsService(
      apiClient: apiClient,
      cache: offlineCache,
      config: resolvedConfig,
    );
    _getIt.registerSingleton<AnalyticsService>(analytics);

    final graphQlGateway = GraphQLGateway(
      config: resolvedConfig,
      cache: offlineCache,
      httpClient: _getIt<http.Client>(),
      authTokenResolver: authTokenResolver,
    );
    _getIt.registerSingleton<GraphQLGateway>(
      graphQlGateway,
      dispose: (client) => client.dispose(),
    );

    final featureFlagService = FeatureFlagService(
      apiClient: apiClient,
      cache: offlineCache,
      config: resolvedConfig,
    );
    _getIt.registerSingleton<FeatureFlagService>(
      featureFlagService,
      dispose: (service) => service.dispose(),
    );

    final realtimeGateway = RealtimeGateway(
      config: resolvedConfig,
      authTokenResolver: authTokenResolver,
      pingInterval: realtimePingInterval,
      reconnectBaseDelay: realtimeReconnectDelay,
    );
    _getIt.registerSingleton<RealtimeGateway>(
      realtimeGateway,
      dispose: (gateway) => gateway.dispose(),
    );

    _configured = true;
    return resolvedConfig;
  }

  static T read<T extends Object>() => _getIt<T>();

  static bool isRegistered<T extends Object>() => _getIt.isRegistered<T>();

  static Future<void> reset() async {
    final futures = <Future<void>>[];

    if (_getIt.isRegistered<RealtimeGateway>()) {
      final gateway = _getIt<RealtimeGateway>();
      futures.add(gateway.dispose());
      _getIt.unregister<RealtimeGateway>();
    }

    if (_getIt.isRegistered<FeatureFlagService>()) {
      final service = _getIt<FeatureFlagService>();
      futures.add(service.dispose());
      _getIt.unregister<FeatureFlagService>();
    }

    if (_getIt.isRegistered<GraphQLGateway>()) {
      final gateway = _getIt<GraphQLGateway>();
      futures.add(gateway.dispose());
      _getIt.unregister<GraphQLGateway>();
    }

    if (_getIt.isRegistered<AnalyticsService>()) {
      _getIt.unregister<AnalyticsService>();
    }

    if (_getIt.isRegistered<ApiClient>()) {
      final client = _getIt<ApiClient>();
      futures.add(Future.sync(client.dispose));
      _getIt.unregister<ApiClient>();
    }

    if (_getIt.isRegistered<http.Client>()) {
      final client = _getIt<http.Client>();
      futures.add(Future.sync(client.close));
      _getIt.unregister<http.Client>();
    }

    if (_getIt.isRegistered<OfflineCache>()) {
      final cache = _getIt<OfflineCache>();
      futures.add(cache.dispose());
      _getIt.unregister<OfflineCache>();
    }

    if (_getIt.isRegistered<AppConfig>()) {
      _getIt.unregister<AppConfig>();
    }

    await Future.wait(futures);
    _configured = false;
  }
}
