import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

/// Lightweight in-memory implementation of [OfflineCache] for tests.
///
/// The production cache relies on Hive and Flutter bindings which are not
/// available in the unit-test environment inside the CI container. This helper
/// mirrors the behaviour that the repositories rely on (basic read/write with
/// optional TTL) so that data access logic can be exercised deterministically
/// in pure Dart tests.
class InMemoryOfflineCache extends OfflineCache {
  InMemoryOfflineCache()
      : _store = <String, _InMemoryEntry>{},
        super(
          config: AppConfig(
            environment: AppEnvironment.development,
            apiBaseUrl: Uri.parse('https://example.com/api'),
            graphQlEndpoint: Uri.parse('https://example.com/graphql'),
            graphQlSubscriptionEndpoint: Uri.parse('wss://example.com/graphql'),
            realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
            defaultCacheTtl: const Duration(minutes: 5),
            enableNetworkLogging: false,
            analyticsFlushThreshold: 10,
            offlineCacheNamespace: 'gigvora_test',
            featureFlags: const <String, dynamic>{},
            featureFlagRefreshInterval: const Duration(minutes: 5),
          ),
        );

  final Map<String, _InMemoryEntry> _store;

  /// No-op init because Hive is not required for the in-memory version.
  @override
  Future<void> init() async {}

  @override
  Future<void> write(
    String key,
    dynamic value, {
    Duration? ttl,
  }) async {
    final now = DateTime.now();
    Duration? resolvedTtl;
    if (ttl == null) {
      resolvedTtl = const Duration(minutes: 5);
    } else if (ttl == Duration.zero) {
      resolvedTtl = null;
    } else {
      resolvedTtl = ttl;
    }

    final expiresAt = resolvedTtl == null ? null : now.add(resolvedTtl);
    _store[key] = _InMemoryEntry(
      payload: value,
      storedAt: now,
      expiresAt: expiresAt,
    );
  }

  @override
  CacheEntry<T>? read<T>(
    String key,
    T Function(dynamic raw) parser,
  ) {
    final entry = _store[key];
    if (entry == null) {
      return null;
    }

    if (entry.expiresAt != null && DateTime.now().isAfter(entry.expiresAt!)) {
      _store.remove(key);
      return null;
    }

    return CacheEntry<T>(
      value: parser(entry.payload),
      storedAt: entry.storedAt,
      expiresAt: entry.expiresAt,
    );
  }

  @override
  Future<void> remove(String key) async {
    _store.remove(key);
  }

  @override
  Future<void> clear() async {
    _store.clear();
  }

  @override
  Future<void> dispose() async {
    _store.clear();
  }
}

class _InMemoryEntry {
  _InMemoryEntry({
    required this.payload,
    required this.storedAt,
    required this.expiresAt,
  });

  final dynamic payload;
  final DateTime storedAt;
  final DateTime? expiresAt;
}
