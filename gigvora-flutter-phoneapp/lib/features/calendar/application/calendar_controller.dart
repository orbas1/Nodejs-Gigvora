import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../data/calendar_repository.dart';
import '../data/models/calendar_event.dart';
import '../data/models/calendar_focus_session.dart';
import '../data/models/calendar_overview.dart';
import '../data/models/calendar_settings.dart';

class CalendarController extends StateNotifier<ResourceState<CalendarOverview>> {
  CalendarController(this._repository, this._analytics, this._userId)
      : _rangeStart = _firstDayOfMonth(DateTime.now()),
        _rangeEnd = _lastDayOfMonth(DateTime.now()),
        super(
          _userId == null
              ? ResourceState<CalendarOverview>.error(
                  StateError('User not authenticated'),
                  data: CalendarOverview.empty(),
                )
              : ResourceState<CalendarOverview>.loading(CalendarOverview.empty()),
        ) {
    if (_userId != null) {
      _loadActiveRange();
    }
  }

  final CalendarRepository _repository;
  final AnalyticsService _analytics;
  final int? _userId;
  DateTime _rangeStart;
  DateTime _rangeEnd;

  bool get isAuthenticated => _userId != null;

  CalendarOverview? get overview => state.data;

  List<CalendarEvent> get events => overview?.events ?? const <CalendarEvent>[];

  List<CalendarFocusSession> get focusSessions =>
      overview?.focusSessions ?? const <CalendarFocusSession>[];

  CalendarSettings get settings => overview?.settings ?? CalendarSettings.fromJson(null);

  String get timeZone => settings.timezone;

  DateTime get rangeStart => _rangeStart;

  DateTime get rangeEnd => _rangeEnd;

  Future<void> load({bool forceRefresh = false}) => _loadActiveRange(forceRefresh: forceRefresh);

  Future<void> refresh() => _loadActiveRange(forceRefresh: true);

  Future<void> focusMonth(DateTime date) async {
    final start = _firstDayOfMonth(date);
    final end = _lastDayOfMonth(date);
    if (_rangeStart.isAtSameMomentAs(start) && _rangeEnd.isAtSameMomentAs(end)) {
      return;
    }
    _rangeStart = start;
    _rangeEnd = end;
    await _loadActiveRange();
  }

  Future<void> updateTimeZone(String timezone) async {
    if (_userId == null) {
      state = ResourceState<CalendarOverview>.error(
        StateError('User not authenticated'),
        data: state.data,
      );
      return;
    }
    final current = overview ?? CalendarOverview.empty();
    final pending = current.copyWith(settings: current.settings.copyWith(timezone: timezone));
    state = state.copyWith(data: pending, error: null);
    try {
      final persisted = await _repository.updateSettings(userId: _userId!, settings: pending.settings);
      final updated = pending.copyWith(settings: persisted);
      state = state.copyWith(data: updated, error: null);
      await _repository.persistOverview(
        updated,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      await _analytics.track(
        'mobile_calendar_timezone_updated',
        context: {'timezone': timezone},
        metadata: const {'source': 'mobile_app'},
      );
      await _loadActiveRange(forceRefresh: true);
    } catch (error) {
      state = state.copyWith(error: error, data: current);
      rethrow;
    }
  }

  Future<void> create(CalendarEvent event) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    final current = overview ?? CalendarOverview.empty();
    try {
      final persisted = await _repository.createEvent(userId: _userId!, event: event);
      final updatedEvents = _sortEvents(<CalendarEvent>[...current.events, persisted]);
      final updatedStats =
          _rebuildStats(events: updatedEvents, focusSessions: current.focusSessions);
      final updated = current.copyWith(events: updatedEvents, stats: updatedStats);
      state = state.copyWith(data: updated, error: null);
      await _repository.persistOverview(
        updated,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      await _analytics.track(
        'mobile_calendar_event_created',
        context: {'eventId': persisted.id, 'title': persisted.title},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(error: error);
      rethrow;
    }
  }

  Future<void> update(CalendarEvent event) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    final current = overview ?? CalendarOverview.empty();
    if (event.id == null) {
      throw ArgumentError('Cannot update an event without an identifier.');
    }
    try {
      final persisted = await _repository.updateEvent(userId: _userId!, event: event);
      final events = List<CalendarEvent>.from(current.events);
      final index = events.indexWhere((element) => element.id == persisted.id);
      if (index == -1) {
        events.add(persisted);
      } else {
        events[index] = persisted;
      }
      final updatedEvents = _sortEvents(events);
      final updatedStats =
          _rebuildStats(events: updatedEvents, focusSessions: current.focusSessions);
      final updated = current.copyWith(events: updatedEvents, stats: updatedStats);
      state = state.copyWith(data: updated, error: null);
      await _repository.persistOverview(
        updated,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      await _analytics.track(
        'mobile_calendar_event_updated',
        context: {'eventId': persisted.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(error: error);
      rethrow;
    }
  }

  Future<void> delete(CalendarEvent event) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    if (event.id == null) {
      throw ArgumentError('Cannot delete an event without an identifier.');
    }
    final current = overview ?? CalendarOverview.empty();
    final events = List<CalendarEvent>.from(current.events)
      ..removeWhere((element) => element.id == event.id);
    final optimisticEvents = _sortEvents(events);
    final optimisticStats =
        _rebuildStats(events: optimisticEvents, focusSessions: current.focusSessions);
    final optimistic = current.copyWith(events: optimisticEvents, stats: optimisticStats);
    state = state.copyWith(data: optimistic, error: null);
    await _repository.persistOverview(
      optimistic,
      userId: _userId!,
      start: _rangeStart,
      end: _rangeEnd,
    );

    try {
      await _repository.deleteEvent(userId: _userId!, eventId: event.id!);
      await _analytics.track(
        'mobile_calendar_event_deleted',
        context: {'eventId': event.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      final rollback = current.copyWith(events: current.events, stats: current.stats);
      state = state.copyWith(data: rollback, error: error);
      await _repository.persistOverview(
        rollback,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      rethrow;
    }
  }

  Future<void> createFocusSession(CalendarFocusSession session) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    final current = overview ?? CalendarOverview.empty();
    try {
      final persisted = await _repository.createFocusSession(
        userId: _userId!,
        session: session,
      );
      final updatedSessions = _sortFocusSessions(<CalendarFocusSession>[...current.focusSessions, persisted]);
      final updatedStats =
          _rebuildStats(events: current.events, focusSessions: updatedSessions);
      final updated = current.copyWith(focusSessions: updatedSessions, stats: updatedStats);
      state = state.copyWith(data: updated, error: null);
      await _repository.persistOverview(
        updated,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      await _analytics.track(
        'mobile_focus_session_logged',
        context: {'focusType': persisted.focusType, 'sessionId': persisted.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(error: error);
      rethrow;
    }
  }

  Future<void> updateFocusSession(CalendarFocusSession session) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    if (session.id == null) {
      throw ArgumentError('Cannot update a focus session without an identifier.');
    }
    final current = overview ?? CalendarOverview.empty();
    try {
      final persisted = await _repository.updateFocusSession(
        userId: _userId!,
        session: session,
      );
      final sessions = List<CalendarFocusSession>.from(current.focusSessions);
      final index = sessions.indexWhere((element) => element.id == persisted.id);
      if (index == -1) {
        sessions.add(persisted);
      } else {
        sessions[index] = persisted;
      }
      final updatedSessions = _sortFocusSessions(sessions);
      final updatedStats =
          _rebuildStats(events: current.events, focusSessions: updatedSessions);
      final updated = current.copyWith(focusSessions: updatedSessions, stats: updatedStats);
      state = state.copyWith(data: updated, error: null);
      await _repository.persistOverview(
        updated,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      await _analytics.track(
        'mobile_focus_session_updated',
        context: {'focusType': persisted.focusType, 'sessionId': persisted.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(error: error);
      rethrow;
    }
  }

  Future<void> deleteFocusSession(CalendarFocusSession session) async {
    if (_userId == null) {
      throw StateError('User not authenticated');
    }
    if (session.id == null) {
      throw ArgumentError('Cannot delete a focus session without an identifier.');
    }
    final current = overview ?? CalendarOverview.empty();
    final sessions = List<CalendarFocusSession>.from(current.focusSessions)
      ..removeWhere((element) => element.id == session.id);
    final optimisticSessions = _sortFocusSessions(sessions);
    final optimisticStats =
        _rebuildStats(events: current.events, focusSessions: optimisticSessions);
    final optimistic = current.copyWith(focusSessions: optimisticSessions, stats: optimisticStats);
    state = state.copyWith(data: optimistic, error: null);
    await _repository.persistOverview(
      optimistic,
      userId: _userId!,
      start: _rangeStart,
      end: _rangeEnd,
    );

    try {
      await _repository.deleteFocusSession(
        userId: _userId!,
        focusSessionId: session.id!,
      );
      await _analytics.track(
        'mobile_focus_session_deleted',
        context: {'sessionId': session.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      final rollback = current.copyWith(
        focusSessions: current.focusSessions,
        stats: current.stats,
      );
      state = state.copyWith(data: rollback, error: error);
      await _repository.persistOverview(
        rollback,
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
      );
      rethrow;
    }
  }

  Future<void> toggleFocusSessionCompletion(
    CalendarFocusSession session,
    bool completed,
  ) async {
    DateTime? resolvedEnd = session.endedAt;
    int? resolvedDuration = session.durationMinutes;
    if (completed) {
      resolvedEnd = resolvedEnd ?? DateTime.now();
      final diff = resolvedEnd.difference(session.startedAt).inMinutes;
      if (resolvedDuration == null && diff > 0) {
        resolvedDuration = diff;
      }
    } else {
      resolvedEnd = null;
    }
    await updateFocusSession(
      session.copyWith(
        completed: completed,
        endedAt: resolvedEnd,
        durationMinutes: resolvedDuration,
      ),
    );
  }

  Future<void> _loadActiveRange({bool forceRefresh = false}) async {
    if (_userId == null) {
      state = ResourceState<CalendarOverview>.error(
        StateError('User not authenticated'),
        data: state.data,
      );
      return;
    }
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(
        userId: _userId!,
        start: _rangeStart,
        end: _rangeEnd,
        forceRefresh: forceRefresh,
      );
      state = ResourceState<CalendarOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      if (result.hasError) {
        await _analytics.track(
          'mobile_calendar_partial',
          context: {
            'reason': '${result.error}',
            'count': result.data.events.length,
          },
          metadata: const {'source': 'mobile_app'},
        );
      } else {
        await _analytics.track(
          'mobile_calendar_loaded',
          context: {
            'count': result.data.events.length,
            'fromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = ResourceState<CalendarOverview>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
      );
      await _analytics.track(
        'mobile_calendar_failed',
        context: {'reason': '$error'},
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    }
  }

  List<CalendarEvent> _sortEvents(List<CalendarEvent> events) {
    final sorted = List<CalendarEvent>.from(events);
    sorted.sort(
      (a, b) => a.startsAt.compareTo(b.startsAt),
    );
    return sorted;
  }

  List<CalendarFocusSession> _sortFocusSessions(List<CalendarFocusSession> sessions) {
    final sorted = List<CalendarFocusSession>.from(sessions);
    sorted.sort((a, b) => b.startedAt.compareTo(a.startedAt));
    return sorted;
  }

  CalendarOverviewStats _rebuildStats({
    required List<CalendarEvent> events,
    required List<CalendarFocusSession> focusSessions,
  }) {
    final now = DateTime.now();
    final upcoming = events
        .where((event) => !event.startsAt.isBefore(now))
        .toList(growable: false)
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    final byType = <String, int>{};
    for (final event in events) {
      byType[event.eventType] = (byType[event.eventType] ?? 0) + 1;
    }
    final openFocusSessions = focusSessions.where((session) => !session.completed).toList(growable: false)
      ..sort((a, b) => b.startedAt.compareTo(a.startedAt));

    return CalendarOverviewStats(
      totalEvents: events.length,
      upcomingEvents: upcoming.length,
      eventsByType: byType,
      nextEvent: upcoming.isEmpty ? null : upcoming.first,
      openFocusSessions: openFocusSessions.take(5).toList(growable: false),
    );
  }
}

DateTime _firstDayOfMonth(DateTime date) {
  return DateTime(date.year, date.month, 1);
}

DateTime _lastDayOfMonth(DateTime date) {
  final firstDayNextMonth = DateTime(date.year, date.month + 1, 1);
  return firstDayNextMonth.subtract(const Duration(milliseconds: 1));
}

final calendarRepositoryProvider = Provider<CalendarRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return CalendarRepository(apiClient, cache);
});

final calendarControllerProvider =
    StateNotifierProvider<CalendarController, ResourceState<CalendarOverview>>((ref) {
  final repository = ref.watch(calendarRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final sessionState = ref.watch(sessionControllerProvider);
  final userId = sessionState.session?.id;
  return CalendarController(repository, analytics, userId);
});
