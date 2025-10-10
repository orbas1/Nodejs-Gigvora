import 'dart:async';

import '../cache/offline_cache.dart';
import '../network/api_client.dart';

class AnalyticsService {
  AnalyticsService(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _queueKey = 'analytics:event_queue';
  static const _maxQueueLength = 100;

  Future<bool> track(
    String eventName, {
    Map<String, dynamic>? context,
    Map<String, dynamic>? metadata,
  }) async {
    if (eventName.isEmpty) {
      return false;
    }

    final payload = <String, dynamic>{
      'eventName': eventName,
      'actorType': metadata?['actorType'] ?? 'anonymous',
      'userId': metadata?['userId'],
      'entityType': metadata?['entityType'],
      'entityId': metadata?['entityId'],
      'source': metadata?['source'] ?? 'mobile_app',
      'context': context ?? const <String, dynamic>{},
      'occurredAt': DateTime.now().toUtc().toIso8601String(),
    };

    try {
      await _apiClient.post('/analytics/events', body: payload);
      unawaited(flushQueue());
      return true;
    } catch (_) {
      await _enqueue(payload);
      return false;
    }
  }

  Future<void> flushQueue() async {
    final queue = await _readQueue();
    if (queue.isEmpty) {
      return;
    }

    final remaining = <Map<String, dynamic>>[];
    for (final event in queue) {
      try {
        await _apiClient.post('/analytics/events', body: event);
      } catch (_) {
        remaining.add(event);
      }
    }

    await _persistQueue(remaining);
  }

  Future<void> _enqueue(Map<String, dynamic> payload) async {
    final queue = await _readQueue();
    queue.add(payload);
    if (queue.length > _maxQueueLength) {
      queue.removeRange(0, queue.length - _maxQueueLength);
    }
    await _persistQueue(queue);
  }

  Future<List<Map<String, dynamic>>> _readQueue() async {
    final entry = _cache.read<List<Map<String, dynamic>>>(_queueKey, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map((value) => value.map((key, dynamic v) => MapEntry('$key', v)))
            .map((value) => Map<String, dynamic>.from(value))
            .toList();
      }
      return <Map<String, dynamic>>[];
    });

    if (entry == null) {
      return <Map<String, dynamic>>[];
    }

    return entry.value;
  }

  Future<void> _persistQueue(List<Map<String, dynamic>> queue) async {
    if (queue.isEmpty) {
      await _cache.remove(_queueKey);
      return;
    }
    final serialisable = queue
        .map(
          (event) => event.map(
            (key, dynamic value) => MapEntry(
              key,
              value is DateTime ? value.toUtc().toIso8601String() : value,
            ),
          ),
        )
        .toList(growable: false);
    await _cache.write(_queueKey, serialisable, ttl: Duration.zero);
  }
}
