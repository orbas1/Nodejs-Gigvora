import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../domain/notification_schedule.dart';

class NotificationScheduleRepository {
  NotificationScheduleRepository(this._cache);

  final OfflineCache _cache;

  static const _cacheKey = 'notifications:schedule';
  static const _cacheTtl = Duration(days: 90);

  Future<NotificationSchedule> load() async {
    final cached = _cache.read<NotificationSchedule>(_cacheKey, (raw) {
      if (raw is Map<String, dynamic>) {
        return NotificationSchedule.fromJson(raw);
      }
      if (raw is Map) {
        return NotificationSchedule.fromJson(Map<String, dynamic>.from(raw as Map));
      }
      return const NotificationSchedule();
    });

    if (cached != null) {
      return cached.value;
    }

    const fallback = NotificationSchedule();
    unawaited(_cache.write(_cacheKey, fallback.toJson(), ttl: _cacheTtl));
    return fallback;
  }

  Future<NotificationSchedule> save(NotificationSchedule schedule) async {
    await _cache.write(_cacheKey, schedule.toJson(), ttl: _cacheTtl);
    return schedule;
  }
}

final notificationScheduleRepositoryProvider = Provider<NotificationScheduleRepository>((ref) {
  final cache = ref.watch(offlineCacheProvider);
  return NotificationScheduleRepository(cache);
});
