import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:uuid/uuid.dart';

import 'models/calendar_event.dart';

class CalendarRepository {
  CalendarRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'calendar:events';
  static const _uuid = Uuid();

  Future<RepositoryResult<List<CalendarEvent>>> fetchEvents({
    bool forceRefresh = false,
  }) async {
    final cached = _cache.read<List<CalendarEvent>>(_cacheKey, (raw) {
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
      final response = await _apiClient.get('/calendar/events');
      if (response is! List) {
        throw Exception('Unexpected calendar payload.');
      }
      final events = response
          .whereType<Map<String, dynamic>>()
          .map(CalendarEvent.fromJson)
          .toList(growable: false);
      await _cache.write(
        _cacheKey,
        events.map((event) => event.toJson()).toList(growable: false),
        ttl: const Duration(minutes: 10),
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

  Future<void> persistCache(List<CalendarEvent> events) {
    return _cache.write(
      _cacheKey,
      events.map((event) => event.toJson()).toList(growable: false),
      ttl: const Duration(minutes: 10),
    );
  }
}
