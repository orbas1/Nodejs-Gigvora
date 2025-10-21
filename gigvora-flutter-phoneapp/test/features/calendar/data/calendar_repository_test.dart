import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/calendar/data/calendar_repository.dart';
import 'package:gigvora_mobile/features/calendar/data/models/calendar_event.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

CalendarEvent createEvent({String id = 'event-1', bool completed = false}) {
  final start = DateTime(2024, 1, 10, 9, 0);
  return CalendarEvent(
    id: id,
    title: 'Leadership sync $id',
    start: start,
    end: start.add(const Duration(hours: 1)),
    description: 'Align on growth pipeline.',
    location: 'Virtual',
    attendees: const ['team@gigvora.com'],
    attachments: const ['https://cdn.example.com/brief.pdf'],
    completed: completed,
  );
}

void main() {
  group('CalendarRepository', () {
    test('fetchEvents returns remote events and caches them', () async {
      final cache = InMemoryOfflineCache();
      final events = [createEvent().toJson()];
      final client = TestApiClient(
        onGet: (path) async {
          expect(path, '/calendar/events');
          return events;
        },
      );

      final repository = CalendarRepository(client, cache);
      final result = await repository.fetchEvents(forceRefresh: true);

      expect(result.data, hasLength(1));
      expect(result.fromCache, isFalse);

      final cached = cache.read<List<Map<String, dynamic>>>(
        'calendar:events',
        (raw) => List<Map<String, dynamic>>.from((raw as List).whereType<Map>()),
      );
      expect(cached, isNotNull);
      expect(cached!.value, events);
    });

    test('fetchEvents falls back to cache when network fails', () async {
      final cache = InMemoryOfflineCache();
      final cachedEvent = createEvent(id: 'event-cached');
      await cache.write('calendar:events', [cachedEvent.toJson()]);

      final client = TestApiClient(
        onGet: (path) async {
          expect(path, '/calendar/events');
          throw Exception('network down');
        },
      );

      final repository = CalendarRepository(client, cache);
      final result = await repository.fetchEvents(forceRefresh: true);

      expect(result.data, hasLength(1));
      expect(result.data.first.id, 'event-cached');
      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
    });

    test('create, update, and delete proxy to backend', () async {
      final cache = InMemoryOfflineCache();
      String? lastCreatedTitle;
      String? lastUpdatedId;
      String? lastDeletedId;

      final client = TestApiClient(
        onPost: (path, body) async {
          expect(path, '/calendar/events');
          final payload = Map<String, dynamic>.from(body as Map);
          lastCreatedTitle = payload['title'] as String?;
          return {
            ...payload,
            'id': payload['id'] ?? 'event-created',
          };
        },
        onPut: (path, body) async {
          expect(path, '/calendar/events/event-created');
          final payload = Map<String, dynamic>.from(body as Map);
          lastUpdatedId = payload['id'] as String?;
          return payload;
        },
        onDelete: (path, body) async {
          expect(path, '/calendar/events/event-created');
          lastDeletedId = 'event-created';
          return <String, dynamic>{};
        },
      );

      final repository = CalendarRepository(client, cache);
      final draft = createEvent(id: '');

      final created = await repository.create(draft);
      expect(lastCreatedTitle, draft.title);
      expect(created.id, isNotEmpty);

      final updated = await repository.update(created.copyWith(title: 'Updated title'));
      expect(lastUpdatedId, created.id);
      expect(updated.title, 'Updated title');

      await repository.delete(created.id);
      expect(lastDeletedId, created.id);
    });

    test('persistCache stores serialised events', () async {
      final cache = InMemoryOfflineCache();
      final repository = CalendarRepository(TestApiClient(), cache);
      final event = createEvent();

      await repository.persistCache([event]);

      final cached = cache.read<List<Map<String, dynamic>>>(
        'calendar:events',
        (raw) => List<Map<String, dynamic>>.from((raw as List).whereType<Map>()),
      );

      expect(cached, isNotNull);
      expect(cached!.value.first['id'], event.id);
    });
  });
}
