import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/calendar_repository.dart';
import '../data/models/calendar_event.dart';

class CalendarController extends StateNotifier<ResourceState<List<CalendarEvent>>> {
  CalendarController(this._repository, this._analytics)
      : _rangeStart = _firstDayOfMonth(DateTime.now()),
        _rangeEnd = _lastDayOfMonth(DateTime.now()),
        _timeZone = 'UTC',
        super(ResourceState<List<CalendarEvent>>.loading()) {
    _loadActiveRange();
  }

  final CalendarRepository _repository;
  final AnalyticsService _analytics;
  DateTime _rangeStart;
  DateTime _rangeEnd;
  String _timeZone;

  String get timeZone => _timeZone;
  DateTime get rangeStart => _rangeStart;
  DateTime get rangeEnd => _rangeEnd;

  Future<void> load({bool forceRefresh = false}) async {
    await _loadActiveRange(forceRefresh: forceRefresh);
  }

  Future<void> _loadActiveRange({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchEvents(
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
        forceRefresh: forceRefresh,
      );
      state = ResourceState<List<CalendarEvent>>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );
      if (result.error != null) {
        await _analytics.track(
          'mobile_calendar_partial',
          context: {
            'reason': '${result.error}',
            'count': result.data.length,
          },
          metadata: const {'source': 'mobile_app'},
        );
      } else {
        await _analytics.track(
          'mobile_calendar_loaded',
          context: {'count': result.data.length, 'fromCache': result.fromCache},
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_calendar_failed',
        context: {'reason': '$error'},
        metadata: const {'source': 'mobile_app'},
      );
      rethrow;
    }
  }

  Future<void> refresh() async {
    await _loadActiveRange(forceRefresh: true);
  }

  Future<void> focusMonth(DateTime date) async {
    final start = _firstDayOfMonth(date);
    final end = _lastDayOfMonth(date);
    final sameWindow = _rangeStart.isAtSameMomentAs(start) && _rangeEnd.isAtSameMomentAs(end);
    if (sameWindow) {
      return;
    }
    _rangeStart = start;
    _rangeEnd = end;
    await _loadActiveRange();
  }

  Future<void> setTimeZone(String timeZone) async {
    if (_timeZone == timeZone) {
      return;
    }
    _timeZone = timeZone;
    await _analytics.track(
      'mobile_calendar_timezone_changed',
      context: {'timeZone': timeZone},
      metadata: const {'source': 'mobile_app'},
    );
    await _loadActiveRange(forceRefresh: true);
  }

  Future<void> create(CalendarEvent draft) async {
    final events = List<CalendarEvent>.from(state.data ?? const <CalendarEvent>[]);
    final optimistic = draft.id.isEmpty ? draft.copyWith(id: DateTime.now().microsecondsSinceEpoch.toString()) : draft;
    events.add(optimistic);
    state = state.copyWith(data: events, loading: false, error: null);
    await _repository.persistCache(
      events,
      start: _rangeStart,
      end: _rangeEnd,
      timeZone: _timeZone,
    );

    try {
      final persisted = await _repository.create(draft);
      final updated = events
          .map((event) => event.id == optimistic.id ? persisted : event)
          .toList(growable: false);
      state = state.copyWith(data: updated);
      await _repository.persistCache(
        updated,
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
      );
      await _analytics.track(
        'mobile_calendar_event_created',
        context: {'eventId': persisted.id, 'title': persisted.title},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      final rollback = events.where((event) => event.id != optimistic.id).toList(growable: false);
      state = state.copyWith(data: rollback, error: error);
      await _repository.persistCache(
        rollback,
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
      );
      rethrow;
    }
  }

  Future<void> update(CalendarEvent event) async {
    final events = List<CalendarEvent>.from(state.data ?? const <CalendarEvent>[]);
    final index = events.indexWhere((element) => element.id == event.id);
    if (index == -1) {
      throw ArgumentError('Event not found: ${event.id}');
    }
    final previous = events[index];
    events[index] = event;
    state = state.copyWith(data: events, error: null);
    await _repository.persistCache(
      events,
      start: _rangeStart,
      end: _rangeEnd,
      timeZone: _timeZone,
    );

    try {
      final persisted = await _repository.update(event);
      events[index] = persisted;
      state = state.copyWith(data: List<CalendarEvent>.from(events));
      await _repository.persistCache(
        events,
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
      );
      await _analytics.track(
        'mobile_calendar_event_updated',
        context: {'eventId': persisted.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      events[index] = previous;
      state = state.copyWith(data: List<CalendarEvent>.from(events), error: error);
      await _repository.persistCache(
        events,
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
      );
      rethrow;
    }
  }

  Future<void> delete(CalendarEvent event) async {
    final events = List<CalendarEvent>.from(state.data ?? const <CalendarEvent>[]);
    events.removeWhere((element) => element.id == event.id);
    state = state.copyWith(data: events, error: null);
    await _repository.persistCache(
      events,
      start: _rangeStart,
      end: _rangeEnd,
      timeZone: _timeZone,
    );

    try {
      await _repository.delete(event.id);
      await _analytics.track(
        'mobile_calendar_event_deleted',
        context: {'eventId': event.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      events.add(event);
      state = state.copyWith(data: events, error: error);
      await _repository.persistCache(
        events,
        start: _rangeStart,
        end: _rangeEnd,
        timeZone: _timeZone,
      );
      rethrow;
    }
  }

  Future<void> toggleCompletion(CalendarEvent event, {required bool completed}) {
    return update(event.copyWith(completed: completed));
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
    StateNotifierProvider<CalendarController, ResourceState<List<CalendarEvent>>>((ref) {
  final repository = ref.watch(calendarRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return CalendarController(repository, analytics);
});
