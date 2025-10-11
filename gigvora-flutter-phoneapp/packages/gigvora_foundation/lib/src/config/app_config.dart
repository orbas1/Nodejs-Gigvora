import 'dart:convert';

import 'package:flutter/foundation.dart';

enum AppEnvironment { development, staging, production }

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.defaultCacheTtl,
    required this.enableNetworkLogging,
    required this.analyticsFlushThreshold,
    required this.offlineCacheNamespace,
    required this.featureFlags,
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

    final enableLogging = switch (networkLoggingSetting.toLowerCase()) {
      'true' || 'yes' || '1' => true,
      'false' || 'no' || '0' => false,
      _ => env != AppEnvironment.production,
    };

    return AppConfig(
      environment: env,
      apiBaseUrl: Uri.parse(baseUrl),
      defaultCacheTtl: Duration(seconds: cacheTtlSeconds),
      enableNetworkLogging: enableLogging,
      analyticsFlushThreshold: _clampThreshold(analyticsFlushThreshold),
      offlineCacheNamespace: offlineCacheNamespace,
      featureFlags: flags,
    );
  }

  final AppEnvironment environment;
  final Uri apiBaseUrl;
  final Duration defaultCacheTtl;
  final bool enableNetworkLogging;
  final int analyticsFlushThreshold;
  final String offlineCacheNamespace;
  final Map<String, dynamic> featureFlags;

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
  }) {
    return AppConfig(
      environment: environment ?? this.environment,
      apiBaseUrl: apiBaseUrl ?? this.apiBaseUrl,
      defaultCacheTtl: defaultCacheTtl ?? this.defaultCacheTtl,
      enableNetworkLogging: enableNetworkLogging ?? this.enableNetworkLogging,
      analyticsFlushThreshold:
          analyticsFlushThreshold ?? this.analyticsFlushThreshold,
      offlineCacheNamespace: offlineCacheNamespace ?? this.offlineCacheNamespace,
      featureFlags: featureFlags ?? this.featureFlags,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'environment': describeEnum(environment),
      'apiBaseUrl': apiBaseUrl.toString(),
      'defaultCacheTtlSeconds': defaultCacheTtl.inSeconds,
      'enableNetworkLogging': enableNetworkLogging,
      'analyticsFlushThreshold': analyticsFlushThreshold,
      'offlineCacheNamespace': offlineCacheNamespace,
      'featureFlags': featureFlags,
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
