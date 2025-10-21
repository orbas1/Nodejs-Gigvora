import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/networking/data/models/networking_overview.dart';
import 'package:gigvora_mobile/features/networking/data/networking_repository.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../support/test_api_client.dart';

void main() {
  final sessionPayload = {
    'id': 501,
    'companyId': 200,
    'status': 'scheduled',
    'name': 'Product leadership roundtable',
    'description': 'Bi-weekly growth and product networking.',
    'startAt': DateTime(2024, 9, 22, 15).toIso8601String(),
    'durationMinutes': 45,
    'rotationMinutes': 8,
    'attendeeLimit': 120,
    'attendeesRegistered': 98,
    'attendeesWaitlisted': 14,
    'attendeesCheckedIn': 74,
    'sponsor': 'Gigvora Labs',
    'host': {
      'id': 41,
      'name': 'Lena Fields',
      'title': 'Head of Community',
    },
    'analytics': {
      'messagesSent': 328,
      'connectionsSaved': 192,
      'profilesShared': 214,
      'satisfactionAverage': 4.7,
    },
  };

  final cardPayload = {
    'id': 9001,
    'ownerId': 41,
    'name': 'Lena Fields',
    'headline': 'Designing equitable future of work experiences.',
    'roles': const ['Product', 'Community'],
    'updatedAt': DateTime(2024, 9, 12, 10, 45).toIso8601String(),
  };

  group('NetworkingRepository', () {
    late InMemoryOfflineCache cache;
    late NetworkingRepository repository;
    late bool failSessions;
    late bool failCards;

    setUp(() {
      cache = InMemoryOfflineCache();
      failSessions = false;
      failCards = false;
      repository = NetworkingRepository(
        TestApiClient(
          onGet: (path) async {
            if (path == '/networking/sessions') {
              if (failSessions) {
                throw Exception('sessions endpoint unavailable');
              }
              return {
                'sessions': [sessionPayload],
                'meta': {
                  'permittedWorkspaceIds': [200, 201],
                  'selectedWorkspaceId': 201,
                },
              };
            }

            if (path == '/networking/business-cards') {
              if (failCards) {
                throw Exception('business cards endpoint unavailable');
              }
              return [cardPayload];
            }

            throw UnsupportedError('Unexpected GET path: $path');
          },
        ),
        cache,
      );
    });

    test('fetchOverview merges sessions and cards, caching the bundle', () async {
      final result = await repository.fetchOverview(companyId: 200);

      expect(result.fromCache, isFalse);
      expect(result.data.overview.sessions.list, hasLength(1));
      expect(result.data.overview.sessions.total, greaterThanOrEqualTo(1));
      expect(result.data.overview.digitalCards.created, equals(1));
      expect(result.data.selectedWorkspaceId, equals(200));

      final cachedResult = await repository.fetchOverview(companyId: 200);
      expect(cachedResult.fromCache, isTrue);
      expect(cachedResult.data.overview.sessions.list.first.id, equals(501));
    });

    test('falls back to the cached overview when the API fails', () async {
      await repository.fetchOverview(companyId: 200);

      failSessions = true;
      final result = await repository.fetchOverview(companyId: 200, forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.error, isNotNull);
      expect(result.data.overview.sessions.list, isNotEmpty);
    });
  });
}
