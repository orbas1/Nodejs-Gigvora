import 'dart:async';

import 'package:collection/collection.dart';
import 'package:logging/logging.dart';

import '../cache/offline_cache.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';

class AnalyticsService {
  AnalyticsService({
    required ApiClient apiClient,
    required OfflineCache cache,
    required AppConfig config,
  })  : _apiClient = apiClient,
        _cache = cache,
        _logger = Logger('AnalyticsService'),
        _flushThreshold = config.analyticsFlushThreshold,
        _queueKey = '${config.offlineCacheNamespace}:analytics:event_queue';

  final ApiClient _apiClient;
  final OfflineCache _cache;
  final Logger _logger;
  final int _flushThreshold;
  final String _queueKey;

  static const _maxQueueLength = 500;

  Future<bool> track(
    String eventName, {
    Map<String, dynamic>? context,
    Map<String, dynamic>? metadata,
  }) async {
    if (eventName.isEmpty) {
      _logger.warning('Attempted to track event with empty name.');
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
      unawaited(_flushQueueInternal());
      return true;
    } catch (error, stackTrace) {
      _logger.warning('Failed to send analytics event. Queuing for retry.', error, stackTrace);
      await _enqueue(payload);
      return false;
    }
  }

  Future<void> flushQueue() async {
    await _flushQueueInternal(force: true);
  }

  Future<void> _flushQueueInternal({bool force = false}) async {
    final queue = await _readQueue();
    if (queue.isEmpty) {
      return;
    }

    if (!force && queue.length < _flushThreshold) {
      return;
    }

    final remaining = <Map<String, dynamic>>[];
    for (final event in queue) {
      try {
        await _apiClient.post('/analytics/events', body: event);
      } catch (error, stackTrace) {
        _logger.info('Retrying analytics event later', error, stackTrace);
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
    if (queue.length >= _flushThreshold) {
      unawaited(_flushQueueInternal());
    }
  }

  Future<List<Map<String, dynamic>>> _readQueue() async {
    final entry = _cache.read<List<Map<String, dynamic>>>(_queueKey, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map(
              (value) => value.map((key, dynamic v) => MapEntry('$key', v)),
            )
            .map(Map<String, dynamic>.from)
            .toList(growable: true);
      }
      return <Map<String, dynamic>>[];
    });

    if (entry == null) {
      return <Map<String, dynamic>>[];
    }

    return entry.value
        .whereNot((event) => event['eventName'] == null || '${event['eventName']}'.isEmpty)
        .toList(growable: true);
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
