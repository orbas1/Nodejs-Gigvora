import 'dart:convert';

import 'package:flutter/foundation.dart';

enum AppEnvironment { development, staging, production }

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.graphQlEndpoint,
    this.graphQlSubscriptionEndpoint,
    required this.realtimeEndpoint,
    required this.defaultCacheTtl,
    required this.enableNetworkLogging,
    required this.analyticsFlushThreshold,
    required this.offlineCacheNamespace,
    required this.featureFlags,
    required this.featureFlagRefreshInterval,
  });

  factory AppConfig.fromEnvironment() {
    final envName = const String.fromEnvironment(
      'GIGVORA_ENV',
      defaultValue: 'development',
    );
    final env = _parseEnvironment(envName);
    final baseUrl = const String.fromEnvironment(
      'GIGVORA_API_URL',
      defaultValue: 'http://localhost:4000/api',
    );
    final apiBase = Uri.parse(baseUrl);
    final cacheTtlSeconds = int.tryParse(
          const String.fromEnvironment(
            'GIGVORA_CACHE_TTL_SECONDS',
            defaultValue: '300',
          ),
        ) ??
        300;
    final networkLoggingSetting = const String.fromEnvironment(
      'GIGVORA_NETWORK_LOGGING',
      defaultValue: 'auto',
    );
    final analyticsFlushThreshold = int.tryParse(
          const String.fromEnvironment(
            'GIGVORA_ANALYTICS_FLUSH_THRESHOLD',
            defaultValue: '20',
          ),
        ) ??
        20;
    final offlineCacheNamespace = const String.fromEnvironment(
      'GIGVORA_CACHE_NAMESPACE',
      defaultValue: 'gigvora_offline_cache',
    );
    final flagsJson = const String.fromEnvironment('GIGVORA_FEATURE_FLAGS');
    final flags = _parseFlags(flagsJson);
    final graphQlUrl = const String.fromEnvironment('GIGVORA_GRAPHQL_URL');
    final graphQlEndpoint = graphQlUrl.isNotEmpty
        ? Uri.parse(graphQlUrl)
        : _deriveGraphQlEndpoint(apiBase);
    final graphQlWsUrl = const String.fromEnvironment('GIGVORA_GRAPHQL_WS_URL');
    final graphQlSubscriptionEndpoint = graphQlWsUrl.isNotEmpty
        ? Uri.parse(graphQlWsUrl)
        : _deriveGraphQlWebSocketEndpoint(graphQlEndpoint);
    final realtimeUrl = const String.fromEnvironment(
      'GIGVORA_REALTIME_URL',
      defaultValue: '',
    );
    final realtimeEndpoint = realtimeUrl.isNotEmpty
        ? Uri.parse(realtimeUrl)
        : _deriveRealtimeEndpoint(apiBase);
    final featureFlagRefreshSeconds = int.tryParse(
          const String.fromEnvironment(
            'GIGVORA_FEATURE_FLAG_REFRESH_SECONDS',
            defaultValue: '300',
          ),
        ) ??
        300;

    final enableLogging = switch (networkLoggingSetting.toLowerCase()) {
      'true' || 'yes' || '1' => true,
      'false' || 'no' || '0' => false,
      _ => env != AppEnvironment.production,
    };

    return AppConfig(
      environment: env,
      apiBaseUrl: apiBase,
      graphQlEndpoint: graphQlEndpoint,
      graphQlSubscriptionEndpoint: graphQlSubscriptionEndpoint,
      realtimeEndpoint: realtimeEndpoint,
      defaultCacheTtl: Duration(seconds: cacheTtlSeconds),
      enableNetworkLogging: enableLogging,
      analyticsFlushThreshold: _clampThreshold(analyticsFlushThreshold),
      offlineCacheNamespace: offlineCacheNamespace,
      featureFlags: flags,
      featureFlagRefreshInterval: Duration(seconds: featureFlagRefreshSeconds.clamp(60, 3600)),
    );
  }

  final AppEnvironment environment;
  final Uri apiBaseUrl;
  final Uri graphQlEndpoint;
  final Uri? graphQlSubscriptionEndpoint;
  final Uri realtimeEndpoint;
  final Duration defaultCacheTtl;
  final bool enableNetworkLogging;
  final int analyticsFlushThreshold;
  final String offlineCacheNamespace;
  final Map<String, dynamic> featureFlags;
  final Duration featureFlagRefreshInterval;

  bool get isProduction => environment == AppEnvironment.production;
  bool get isStaging => environment == AppEnvironment.staging;
  bool get isDevelopment => environment == AppEnvironment.development;

  AppConfig copyWith({
    AppEnvironment? environment,
    Uri? apiBaseUrl,
    Duration? defaultCacheTtl,
    bool? enableNetworkLogging,
    int? analyticsFlushThreshold,
    String? offlineCacheNamespace,
    Map<String, dynamic>? featureFlags,
    Uri? graphQlEndpoint,
    Uri? graphQlSubscriptionEndpoint,
    Uri? realtimeEndpoint,
    Duration? featureFlagRefreshInterval,
  }) {
    return AppConfig(
      environment: environment ?? this.environment,
      apiBaseUrl: apiBaseUrl ?? this.apiBaseUrl,
      graphQlEndpoint: graphQlEndpoint ?? this.graphQlEndpoint,
      graphQlSubscriptionEndpoint:
          graphQlSubscriptionEndpoint ?? this.graphQlSubscriptionEndpoint,
      realtimeEndpoint: realtimeEndpoint ?? this.realtimeEndpoint,
      defaultCacheTtl: defaultCacheTtl ?? this.defaultCacheTtl,
      enableNetworkLogging: enableNetworkLogging ?? this.enableNetworkLogging,
      analyticsFlushThreshold:
          analyticsFlushThreshold ?? this.analyticsFlushThreshold,
      offlineCacheNamespace: offlineCacheNamespace ?? this.offlineCacheNamespace,
      featureFlags: featureFlags ?? this.featureFlags,
      featureFlagRefreshInterval:
          featureFlagRefreshInterval ?? this.featureFlagRefreshInterval,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'environment': describeEnum(environment),
      'apiBaseUrl': apiBaseUrl.toString(),
      'graphQlEndpoint': graphQlEndpoint.toString(),
      'graphQlSubscriptionEndpoint':
          graphQlSubscriptionEndpoint?.toString(),
      'realtimeEndpoint': realtimeEndpoint.toString(),
      'defaultCacheTtlSeconds': defaultCacheTtl.inSeconds,
      'enableNetworkLogging': enableNetworkLogging,
      'analyticsFlushThreshold': analyticsFlushThreshold,
      'offlineCacheNamespace': offlineCacheNamespace,
      'featureFlags': featureFlags,
      'featureFlagRefreshIntervalSeconds':
          featureFlagRefreshInterval.inSeconds,
    };
  }

  static Map<String, dynamic> _parseFlags(String json) {
    if (json.isEmpty) {
      return const <String, dynamic>{};
    }
    try {
      final parsed = jsonDecode(json);
      if (parsed is Map<String, dynamic>) {
        return parsed;
      }
    } catch (_) {
      // ignore malformed env content and return empty map
    }
    return const <String, dynamic>{};
  }

  static AppEnvironment _parseEnvironment(String value) {
    final normalized = value.toLowerCase().trim();
    return switch (normalized) {
      'prod' || 'production' => AppEnvironment.production,
      'stage' || 'staging' => AppEnvironment.staging,
      _ => AppEnvironment.development,
    };
  }
}

int _clampThreshold(int value) {
  if (value < 1) {
    return 1;
  }
  if (value > 500) {
    return 500;
  }
  return value;
}

Uri _deriveGraphQlEndpoint(Uri apiBase) {
  final segments = _normaliseSegments(apiBase.pathSegments);
  if (segments.isNotEmpty && segments.last == 'api') {
    segments[segments.length - 1] = 'graphql';
  } else if (segments.isEmpty) {
    segments.add('graphql');
  } else {
    segments.add('graphql');
  }
  final path = segments.isEmpty ? '/' : '/${segments.join('/')}';
  return apiBase.replace(
    scheme: apiBase.scheme,
    host: apiBase.host,
    port: apiBase.hasPort ? apiBase.port : null,
    path: path,
  );
}

Uri _deriveGraphQlWebSocketEndpoint(Uri graphQlEndpoint) {
  final scheme = graphQlEndpoint.scheme == 'https' ? 'wss' : 'ws';
  return graphQlEndpoint.replace(scheme: scheme);
}

Uri _deriveRealtimeEndpoint(Uri apiBase) {
  final scheme = apiBase.scheme == 'https' ? 'wss' : 'ws';
  final segments = _normaliseSegments(apiBase.pathSegments);
  if (segments.isNotEmpty && segments.last == 'api') {
    segments[segments.length - 1] = 'realtime';
  } else {
    segments.add('realtime');
  }
  final path = segments.isEmpty ? '/' : '/${segments.join('/')}';
  return apiBase.replace(
    scheme: scheme,
    host: apiBase.host,
    port: apiBase.hasPort ? apiBase.port : null,
    path: path,
  );
}

List<String> _normaliseSegments(List<String> segments) {
  return segments.where((segment) => segment.trim().isNotEmpty).map((segment) {
    if (segment.startsWith('/')) {
      return segment.replaceAll('/', '');
    }
    return segment;
  }).toList(growable: true);
}
