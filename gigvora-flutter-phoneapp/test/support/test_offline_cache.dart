import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'test_app_config.dart';

/// Deterministic in-memory cache implementation tailored for repository tests.
///
/// The production cache relies on Hive, but unit tests run in a pure Dart
/// context. This drop-in replacement mimics the essential semantics, including
/// TTL handling, while allowing tests to inject a custom time source for
/// time-sensitive scenarios.
class InMemoryOfflineCache extends OfflineCache {
  InMemoryOfflineCache({AppConfig? config, DateTime Function()? clock})
      : this._internal(
          config ?? createTestConfig(),
          clock ?? DateTime.now,
        );

  InMemoryOfflineCache._internal(AppConfig config, DateTime Function() clock)
      : _entries = <String, _CacheRecord>{},
        _config = config,
        _clock = clock,
        super(config: config);

  final Map<String, _CacheRecord> _entries;
  final AppConfig _config;
  final DateTime Function() _clock;

  @override
  Future<void> init() async {}

  @override
  CacheEntry<T>? read<T>(String key, T Function(dynamic raw) parser) {
    final record = _entries[key];
    if (record == null) {
      return null;
    }
    if (record.expiresAt != null && _clock().isAfter(record.expiresAt!)) {
      _entries.remove(key);
      return null;
    }
    return CacheEntry<T>(
      value: parser(record.value),
      storedAt: record.storedAt,
      expiresAt: record.expiresAt,
    );
  }

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) async {
    final now = _clock();
    Duration? resolvedTtl;
    if (ttl == null) {
      resolvedTtl = _config.defaultCacheTtl;
    } else if (ttl == Duration.zero) {
      resolvedTtl = null;
    } else {
      resolvedTtl = ttl.isNegative ? Duration.zero : ttl;
    }
    final expiresAt = resolvedTtl == null
        ? null
        : (resolvedTtl == Duration.zero ? now : now.add(resolvedTtl));
    _entries[key] = _CacheRecord(
      value: value,
      storedAt: now,
      expiresAt: expiresAt,
    );
  }

  /// Exposes the underlying payload for assertions in unit tests.
  CacheEntry<dynamic>? debugPeek(String key) {
    final record = _entries[key];
    if (record == null) {
      return null;
    }
    return CacheEntry<dynamic>(
      value: record.value,
      storedAt: record.storedAt,
      expiresAt: record.expiresAt,
    );
  }

  @override
  Future<void> remove(String key) async {
    _entries.remove(key);
  }

  @override
  Future<void> clear() async {
    _entries.clear();
  }

  @override
  Future<void> dispose() async {
    _entries.clear();
  }
}

class _CacheRecord {
  _CacheRecord({required this.value, required this.storedAt, this.expiresAt});

  final dynamic value;
  final DateTime storedAt;
  final DateTime? expiresAt;
}
