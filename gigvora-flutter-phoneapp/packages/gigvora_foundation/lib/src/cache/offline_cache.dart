import 'dart:async';

import 'package:hive_flutter/hive_flutter.dart';

import '../config/app_config.dart';

class CacheEntry<T> {
  CacheEntry({
    required this.value,
    required this.storedAt,
    this.expiresAt,
  });

  final T value;
  final DateTime storedAt;
  final DateTime? expiresAt;

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
}

class OfflineCache {
  OfflineCache({
    required AppConfig config,
    HiveInterface? hive,
  })  : _config = config,
        _hive = hive ?? Hive,
        _boxName = '${config.offlineCacheNamespace}_${config.environment.name}';

  final AppConfig _config;
  final HiveInterface _hive;
  final String _boxName;

  Box<dynamic>? _box;
  bool _initialised = false;
  Future<void> init() async {
    if (_initialised) {
      return;
    }
    return Future.sync(() async {
      if (_initialised) return;
      // Hive is safe to call init multiple times; guard to avoid redundant work.
      await _hive.initFlutter();
      _box = await _hive.openBox<dynamic>(_boxName);
      _initialised = true;
    });
  }

  Future<void> write(
    String key,
    dynamic value, {
    Duration? ttl,
  }) async {
    final box = _ensureBox();
    final now = DateTime.now();
    Duration? resolvedTtl;
    if (ttl == null) {
      resolvedTtl = _config.defaultCacheTtl;
    } else if (ttl == Duration.zero) {
      resolvedTtl = null;
    } else {
      resolvedTtl = ttl;
    }

    await box.put(key, {
      'payload': value,
      'storedAt': now.toIso8601String(),
      'expiresAt': resolvedTtl == null
          ? null
          : now.add(resolvedTtl).toIso8601String(),
    });
  }

  CacheEntry<T>? read<T>(
    String key,
    T Function(dynamic raw) parser,
  ) {
    final box = _ensureBox();
    final raw = box.get(key);
    if (raw == null) return null;

    DateTime? expiresAt;
    if (raw['expiresAt'] is String) {
      expiresAt = DateTime.tryParse(raw['expiresAt'] as String);
    }
    if (expiresAt != null && DateTime.now().isAfter(expiresAt)) {
      unawaited(box.delete(key));
      return null;
    }

    final storedAt = DateTime.tryParse(raw['storedAt'] as String? ?? '');
    if (storedAt == null) {
      unawaited(box.delete(key));
      return null;
    }

    final payload = parser(raw['payload']);
    return CacheEntry<T>(value: payload, storedAt: storedAt, expiresAt: expiresAt);
  }

  Future<void> remove(String key) async {
    final box = _ensureBox();
    await box.delete(key);
  }

  Future<void> clear() async {
    final box = _ensureBox();
    await box.clear();
  }

  Future<void> dispose() async {
    if (!_initialised) return;
    final box = _box;
    _box = null;
    _initialised = false;
    if (box != null && box.isOpen) {
      await box.close();
    }
  }

  Box<dynamic> _ensureBox() {
    final box = _box;
    if (!_initialised || box == null) {
      throw StateError('OfflineCache has not been initialised. Call init() before use.');
    }
    return box;
  }
}
