import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/calendar/application/calendar_controller.dart';
import 'package:gigvora_mobile/features/calendar/data/calendar_repository.dart';
import 'package:gigvora_mobile/features/calendar/data/models/calendar_event.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

class FakeCalendarRepository extends CalendarRepository {
  FakeCalendarRepository({List<CalendarEvent>? events})
      : _events = List<CalendarEvent>.from(events ?? const <CalendarEvent>[]),
        super(TestApiClient(), InMemoryOfflineCache());

  List<CalendarEvent> _events;
  int persistCalls = 0;

  @override
  Future<RepositoryResult<List<CalendarEvent>>> fetchEvents({bool forceRefresh = false}) async {
    return RepositoryResult<List<CalendarEvent>>(
      data: List<CalendarEvent>.from(_events),
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<CalendarEvent> create(CalendarEvent event) async {
    final newEvent = event.id.isEmpty
        ? event.copyWith(id: 'event-${_events.length + 1}')
        : event;
    _events = [..._events, newEvent];
    return newEvent;
  }

  @override
  Future<CalendarEvent> update(CalendarEvent event) async {
    final index = _events.indexWhere((item) => item.id == event.id);
    if (index < 0) {
      throw ArgumentError('Unknown event ${event.id}');
    }
    _events[index] = event;
    return event;
  }

  @override
  Future<void> delete(String eventId) async {
    _events = _events.where((event) => event.id != eventId).toList(growable: false);
  }

  @override
  Future<void> persistCache(List<CalendarEvent> events) async {
    persistCalls += 1;
    _events = List<CalendarEvent>.from(events);
  }
}

CalendarEvent buildEvent({String id = 'event-1', bool completed = false}) {
  final start = DateTime(2024, 2, 20, 14, 0);
  return CalendarEvent(
    id: id,
    title: 'Studio sync $id',
    start: start,
    end: start.add(const Duration(hours: 1)),
    attendees: const ['studio@gigvora.com'],
    attachments: const <String>[],
    completed: completed,
  );
}

void main() {
  group('CalendarController', () {
    test('load hydrates events and records analytics', () async {
      final repository = FakeCalendarRepository(events: [buildEvent()]);
      final analytics = TestAnalyticsService();

      final controller = CalendarController(repository, analytics);
      await controller.load(forceRefresh: true);

      expect(controller.state.loading, isFalse);
      expect(controller.state.data, hasLength(1));
      expect(controller.state.data!.first.title, 'Studio sync event-1');
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_calendar_loaded'),
      );
    });

    test('create and update keep state in sync with repository', () async {
      final repository = FakeCalendarRepository(events: [buildEvent(id: 'event-1')]);
      final analytics = TestAnalyticsService();
      final controller = CalendarController(repository, analytics);
      await controller.load(forceRefresh: true);

      final draft = buildEvent(id: '', completed: false).copyWith(title: 'Pitch workshop');
      await controller.create(draft);

      expect(controller.state.data, isNotNull);
      expect(controller.state.data!.length, 2);
      expect(analytics.events.map((event) => event.name), contains('mobile_calendar_event_created'));

      final created = controller.state.data!.firstWhere((event) => event.title == 'Pitch workshop');
      await controller.update(created.copyWith(title: 'Pitch workshop v2'));

      expect(
        controller.state.data!.any((event) => event.title == 'Pitch workshop v2'),
        isTrue,
      );
      expect(repository.persistCalls, greaterThanOrEqualTo(2));
      expect(analytics.events.map((event) => event.name), contains('mobile_calendar_event_updated'));
    });

    test('delete and toggleCompletion update controller state', () async {
      final repository = FakeCalendarRepository(events: [buildEvent(id: 'event-delete')]);
      final analytics = TestAnalyticsService();
      final controller = CalendarController(repository, analytics);
      await controller.load(forceRefresh: true);

      final event = controller.state.data!.first;
      await controller.toggleCompletion(event, completed: true);
      expect(controller.state.data!.first.completed, isTrue);

      await controller.delete(event);
      expect(controller.state.data, isEmpty);
      expect(repository.persistCalls, greaterThanOrEqualTo(2));
      expect(analytics.events.map((event) => event.name), contains('mobile_calendar_event_deleted'));
    });
  });
}
