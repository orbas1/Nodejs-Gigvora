import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:uuid/uuid.dart';

import 'models/calendar_event.dart';

class CalendarRepository {
  CalendarRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheNamespace = 'calendar:events';
  static const _uuid = Uuid();
  static const _defaultTtl = Duration(minutes: 15);

  _CalendarCacheContext? _lastCacheContext;

  Future<RepositoryResult<List<CalendarEvent>>> fetchEvents({
    required DateTime start,
    required DateTime end,
    required String timeZone,
    bool forceRefresh = false,
  }) async {
    final cacheContext = _CalendarCacheContext(_cacheNamespace, start, end, timeZone);
    _lastCacheContext = cacheContext;

    final cached = _cache.read<List<CalendarEvent>>(cacheContext.key, (raw) {
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map((entry) => CalendarEvent.fromJson(Map<String, dynamic>.from(entry as Map)))
            .toList(growable: false);
      }
      return const <CalendarEvent>[];
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<CalendarEvent>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/calendar/events',
        query: {
          'start': start.toUtc().toIso8601String(),
          'end': end.toUtc().toIso8601String(),
          'timeZone': timeZone,
        },
      );
      if (response is! List) {
        throw Exception('Unexpected calendar payload.');
      }
      final events = response
          .whereType<Map<String, dynamic>>()
          .map(CalendarEvent.fromJson)
          .toList(growable: false);
      await _cache.write(
        cacheContext.key,
        events.map((event) => event.toJson()).toList(growable: false),
        ttl: _defaultTtl,
      );
      return RepositoryResult<List<CalendarEvent>>(
        data: events,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<CalendarEvent>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<CalendarEvent> create(CalendarEvent event) async {
    final payload = event.id.isEmpty ? event.copyWith(id: _uuid.v4()) : event;
    final response = await _apiClient.post('/calendar/events', body: payload.toJson());
    if (response is Map<String, dynamic>) {
      return CalendarEvent.fromJson(response);
    }
    return payload;
  }

  Future<CalendarEvent> update(CalendarEvent event) async {
    final response = await _apiClient.put('/calendar/events/${event.id}', body: event.toJson());
    if (response is Map<String, dynamic>) {
      return CalendarEvent.fromJson(response);
    }
    return event;
  }

  Future<void> delete(String eventId) async {
    await _apiClient.delete('/calendar/events/$eventId');
  }

  Future<void> persistCache(
    List<CalendarEvent> events, {
    DateTime? start,
    DateTime? end,
    String? timeZone,
  }) {
    final context = start != null && end != null && timeZone != null
        ? _CalendarCacheContext(_cacheNamespace, start, end, timeZone)
        : _lastCacheContext;
    if (context == null) {
      return Future.value();
    }
    _lastCacheContext = context;
    return _cache.write(
      context.key,
      events.map((event) => event.toJson()).toList(growable: false),
      ttl: _defaultTtl,
    );
  }
}

class _CalendarCacheContext {
  _CalendarCacheContext(this.namespace, this.start, this.end, this.timeZone)
      : key = '$namespace:${start.toIso8601String()}-${end.toIso8601String()}:$timeZone';

  final String namespace;
  final DateTime start;
  final DateTime end;
  final String timeZone;
  final String key;
}
