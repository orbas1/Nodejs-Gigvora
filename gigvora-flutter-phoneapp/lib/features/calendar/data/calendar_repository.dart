import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/calendar_event.dart';
import 'models/calendar_focus_session.dart';
import 'models/calendar_overview.dart';
import 'models/calendar_settings.dart';

class CalendarRepository {
  CalendarRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheNamespace = 'calendar:overview';
  static const _defaultTtl = Duration(minutes: 15);

  _CalendarCacheContext? _lastCacheContext;

  Future<RepositoryResult<CalendarOverview>> fetchOverview({
    required int userId,
    required DateTime start,
    required DateTime end,
    bool forceRefresh = false,
  }) async {
    final cacheContext = _CalendarCacheContext(
      _cacheNamespace,
      userId,
      start,
      end,
    );
    _lastCacheContext = cacheContext;

    final cached = _cache.read<CalendarOverview>(cacheContext.key, (raw) {
      if (raw is Map<String, dynamic>) {
        return CalendarOverview.fromJson(raw);
      }
      if (raw is Map) {
        return CalendarOverview.fromJson(Map<String, dynamic>.from(raw as Map));
      }
      return CalendarOverview.empty();
    });

    if (!forceRefresh && cached != null) {
      return RepositoryResult<CalendarOverview>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get(
        '/users/$userId/calendar/overview',
        query: {
          'from': start.toUtc().toIso8601String(),
          'to': end.toUtc().toIso8601String(),
          'limit': '200',
        },
      );
      if (response is! Map<String, dynamic>) {
        throw Exception('Unexpected calendar overview payload.');
      }
      final overview = CalendarOverview.fromJson(response);
      await _cache.write(cacheContext.key, overview.toJson(), ttl: _defaultTtl);
      return RepositoryResult<CalendarOverview>(
        data: overview,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<CalendarOverview>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  Future<CalendarEvent> createEvent({
    required int userId,
    required CalendarEvent event,
  }) async {
    final response = await _apiClient.post(
      '/users/$userId/calendar/events',
      body: event.toPayload(),
    );
    if (response is Map<String, dynamic>) {
      return CalendarEvent.fromJson(response);
    }
    throw Exception('Unable to create calendar event.');
  }

  Future<CalendarEvent> updateEvent({
    required int userId,
    required CalendarEvent event,
  }) async {
    if (event.id == null) {
      throw ArgumentError('Cannot update an event without an identifier.');
    }
    final response = await _apiClient.put(
      '/users/$userId/calendar/events/${event.id}',
      body: event.toPayload(),
    );
    if (response is Map<String, dynamic>) {
      return CalendarEvent.fromJson(response);
    }
    throw Exception('Unable to update calendar event.');
  }

  Future<void> deleteEvent({
    required int userId,
    required int eventId,
  }) async {
    await _apiClient.delete('/users/$userId/calendar/events/$eventId');
  }

  Future<CalendarSettings> updateSettings({
    required int userId,
    required CalendarSettings settings,
  }) async {
    final response = await _apiClient.put(
      '/users/$userId/calendar/settings',
      body: settings.toJson(),
    );
    if (response is Map<String, dynamic>) {
      return CalendarSettings.fromJson(response);
    }
    throw Exception('Unable to update calendar settings.');
  }

  Future<List<CalendarFocusSession>> listFocusSessions({
    required int userId,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      '/users/$userId/calendar/focus-sessions',
      query: {'limit': '$limit'},
    );
    if (response is Map<String, dynamic> && response['items'] is List) {
      final sessions = <CalendarFocusSession>[];
      for (final entry in response['items'] as List<dynamic>) {
        if (entry is Map<String, dynamic>) {
          sessions.add(CalendarFocusSession.fromJson(entry));
        }
      }
      return sessions;
    }
    throw Exception('Unable to load focus sessions.');
  }

  Future<CalendarFocusSession> createFocusSession({
    required int userId,
    required CalendarFocusSession session,
  }) async {
    final response = await _apiClient.post(
      '/users/$userId/calendar/focus-sessions',
      body: session.toPayload(),
    );
    if (response is Map<String, dynamic>) {
      return CalendarFocusSession.fromJson(response);
    }
    throw Exception('Unable to create focus session.');
  }

  Future<CalendarFocusSession> updateFocusSession({
    required int userId,
    required CalendarFocusSession session,
  }) async {
    if (session.id == null) {
      throw ArgumentError('Cannot update a focus session without an identifier.');
    }
    final response = await _apiClient.put(
      '/users/$userId/calendar/focus-sessions/${session.id}',
      body: session.toPayload(),
    );
    if (response is Map<String, dynamic>) {
      return CalendarFocusSession.fromJson(response);
    }
    throw Exception('Unable to update focus session.');
  }

  Future<void> deleteFocusSession({
    required int userId,
    required int focusSessionId,
  }) async {
    await _apiClient.delete('/users/$userId/calendar/focus-sessions/$focusSessionId');
  }

  Future<void> persistOverview(
    CalendarOverview overview, {
    int? userId,
    DateTime? start,
    DateTime? end,
  }) async {
    final context = userId != null && start != null && end != null
        ? _CalendarCacheContext(_cacheNamespace, userId, start, end)
        : _lastCacheContext;
    if (context == null) {
      return;
    }
    _lastCacheContext = context;
    await _cache.write(context.key, overview.toJson(), ttl: _defaultTtl);
  }
}

class _CalendarCacheContext {
  _CalendarCacheContext(
    this.namespace,
    this.userId,
    this.start,
    this.end,
  ) : key =
            '$namespace:$userId:${start.toIso8601String()}-${end.toIso8601String()}';

  final String namespace;
  final int userId;
  final DateTime start;
  final DateTime end;
  final String key;
}
