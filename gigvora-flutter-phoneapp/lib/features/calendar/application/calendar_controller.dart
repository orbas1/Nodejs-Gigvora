import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/calendar_repository.dart';
import '../data/models/calendar_event.dart';

class CalendarController extends StateNotifier<ResourceState<List<CalendarEvent>>> {
  CalendarController(this._repository, this._analytics)
      : super(ResourceState<List<CalendarEvent>>.loading()) {
    load();
  }

  final CalendarRepository _repository;
  final AnalyticsService _analytics;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchEvents(forceRefresh: forceRefresh);
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
    await load(forceRefresh: true);
  }

  Future<void> create(CalendarEvent draft) async {
    final events = List<CalendarEvent>.from(state.data ?? const <CalendarEvent>[]);
    final optimistic = draft.id.isEmpty ? draft.copyWith(id: DateTime.now().microsecondsSinceEpoch.toString()) : draft;
    events.add(optimistic);
    state = state.copyWith(data: events, loading: false, error: null);
    await _repository.persistCache(events);

    try {
      final persisted = await _repository.create(draft);
      final updated = events
          .map((event) => event.id == optimistic.id ? persisted : event)
          .toList(growable: false);
      state = state.copyWith(data: updated);
      await _repository.persistCache(updated);
      await _analytics.track(
        'mobile_calendar_event_created',
        context: {'eventId': persisted.id, 'title': persisted.title},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      final rollback = events.where((event) => event.id != optimistic.id).toList(growable: false);
      state = state.copyWith(data: rollback, error: error);
      await _repository.persistCache(rollback);
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
    await _repository.persistCache(events);

    try {
      final persisted = await _repository.update(event);
      events[index] = persisted;
      state = state.copyWith(data: List<CalendarEvent>.from(events));
      await _repository.persistCache(events);
      await _analytics.track(
        'mobile_calendar_event_updated',
        context: {'eventId': persisted.id},
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      events[index] = previous;
      state = state.copyWith(data: List<CalendarEvent>.from(events), error: error);
      await _repository.persistCache(events);
      rethrow;
    }
  }

  Future<void> delete(CalendarEvent event) async {
    final events = List<CalendarEvent>.from(state.data ?? const <CalendarEvent>[]);
    events.removeWhere((element) => element.id == event.id);
    state = state.copyWith(data: events, error: null);
    await _repository.persistCache(events);

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
      await _repository.persistCache(events);
      rethrow;
    }
  }

  Future<void> toggleCompletion(CalendarEvent event, {required bool completed}) {
    return update(event.copyWith(completed: completed));
  }
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
