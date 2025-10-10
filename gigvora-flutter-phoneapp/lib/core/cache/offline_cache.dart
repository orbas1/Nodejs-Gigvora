import 'package:hive_flutter/hive_flutter.dart';

import '../config/app_config.dart';

class CacheEntry<T> {
  CacheEntry({required this.value, required this.storedAt, this.expiresAt});

  final T value;
  final DateTime storedAt;
  final DateTime? expiresAt;

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
}

class OfflineCache {
  OfflineCache._();

  static final OfflineCache instance = OfflineCache._();
  static const _boxName = 'offline_cache';

  Box<dynamic>? _box;
  bool _initialised = false;

  Future<void> init() async {
    if (!_initialised) {
      await Hive.initFlutter();
      _initialised = true;
    }

    if (Hive.isBoxOpen(_boxName)) {
      _box = Hive.box<dynamic>(_boxName);
    } else {
      _box = await Hive.openBox<dynamic>(_boxName);
    }
  }

  Future<void> write(String key, dynamic value, {Duration? ttl}) async {
    final box = _box ?? (throw StateError('OfflineCache not initialized'));
    final now = DateTime.now();
    final expiry = ttl == null
        ? now.add(AppConfig.defaultCacheTtl)
        : ttl == Duration.zero
            ? null
            : now.add(ttl);

    await box.put(key, {
      'payload': value,
      'storedAt': now.toIso8601String(),
      'expiresAt': expiry?.toIso8601String(),
    });
  }

  CacheEntry<T>? read<T>(String key, T Function(dynamic raw) parser) {
    final box = _box ?? (throw StateError('OfflineCache not initialized'));
    final raw = box.get(key);
    if (raw == null) return null;

    DateTime? expiresAt;
    if (raw['expiresAt'] is String) {
      expiresAt = DateTime.tryParse(raw['expiresAt'] as String);
    }
    if (expiresAt != null && DateTime.now().isAfter(expiresAt)) {
      box.delete(key);
      return null;
    }

    final storedAt = DateTime.tryParse(raw['storedAt'] as String? ?? '');
    if (storedAt == null) {
      box.delete(key);
      return null;
    }

    final payload = parser(raw['payload']);
    return CacheEntry<T>(value: payload, storedAt: storedAt, expiresAt: expiresAt);
  }

  Future<void> remove(String key) async {
    final box = _box ?? (throw StateError('OfflineCache not initialized'));
    await box.delete(key);
  }
}
