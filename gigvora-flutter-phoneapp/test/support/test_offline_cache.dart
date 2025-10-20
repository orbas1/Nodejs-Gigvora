import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'test_app_config.dart';

class InMemoryOfflineCache extends OfflineCache {
  InMemoryOfflineCache() : this._internal(createTestConfig());

  InMemoryOfflineCache._internal(AppConfig config)
      : _entries = <String, _CacheRecord>{},
        _config = config,
        super(config: config);

  final Map<String, _CacheRecord> _entries;
  final AppConfig _config;

  @override
  Future<void> init() async {}

  @override
  CacheEntry<T>? read<T>(String key, T Function(dynamic raw) parser) {
    final record = _entries[key];
    if (record == null) {
      return null;
    }
    if (record.expiresAt != null && DateTime.now().isAfter(record.expiresAt!)) {
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
    final now = DateTime.now();
    Duration? resolvedTtl;
    if (ttl == null) {
      resolvedTtl = _config.defaultCacheTtl;
    } else if (ttl == Duration.zero) {
      resolvedTtl = null;
    } else {
      resolvedTtl = ttl;
    }
    _entries[key] = _CacheRecord(
      value: value,
      storedAt: now,
      expiresAt: resolvedTtl == null ? null : now.add(resolvedTtl),
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
