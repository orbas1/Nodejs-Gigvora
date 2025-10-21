import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/networking/application/networking_controller.dart';
import 'package:gigvora_mobile/features/networking/data/networking_repository.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('NetworkingController', () {
    late InMemoryOfflineCache cache;
    late TestAnalyticsService analytics;
    late NetworkingRepository repository;
    late NetworkingController controller;
    late int sessionRequests;
    late int cardRequests;

    setUp(() {
      cache = InMemoryOfflineCache();
      analytics = TestAnalyticsService();
      sessionRequests = 0;
      cardRequests = 0;

      repository = NetworkingRepository(
        TestApiClient(
          onGet: (path) async {
            if (path == '/networking/sessions') {
              sessionRequests += 1;
              return {
                'sessions': [
                  {
                    'id': 501,
                    'companyId': 200,
                    'status': 'scheduled',
                    'name': 'Product leadership roundtable',
                    'startAt': DateTime(2024, 9, 22, 15).toIso8601String(),
                    'durationMinutes': 45,
                    'rotationMinutes': 8,
                    'attendeeLimit': 120,
                    'attendeesRegistered': 98,
                    'attendeesWaitlisted': 14,
                    'attendeesCheckedIn': 74,
                    'analytics': {
                      'messagesSent': 328,
                      'connectionsSaved': 192,
                      'profilesShared': 214,
                      'satisfactionAverage': 4.7,
                    },
                  },
                ],
                'meta': {
                  'permittedWorkspaceIds': [200, 201],
                  'selectedWorkspaceId': sessionRequests > 1 ? 201 : 200,
                },
              };
            }

            if (path == '/networking/business-cards') {
              cardRequests += 1;
              return [
                {
                  'id': 9001,
                  'ownerId': 41,
                  'name': 'Lena Fields',
                  'headline': 'Designing equitable future of work experiences.',
                  'roles': const ['Product', 'Community'],
                  'updatedAt': DateTime(2024, 9, 12, 10, 45).toIso8601String(),
                },
              ];
            }

            throw UnsupportedError('Unexpected GET path: $path');
          },
        ),
        cache,
      );

      controller = NetworkingController(
        repository,
        analytics,
        lookbackDays: 90,
        initialWorkspace: 200,
      );
    });

    tearDown(() {
      controller.dispose();
    });

    test('load resolves overview and tracks the initial view', () async {
      await controller.load(forceRefresh: true);

      expect(controller.state.loading, isFalse);
      expect(controller.state.data?.overview.sessions.list, isNotEmpty);
      expect(controller.state.metadata['selectedWorkspaceId'], equals(200));
      expect(
        analytics.events.any((event) => event.name == 'mobile_networking_overview_loaded'),
        isTrue,
      );
    });

    test('selectWorkspace refreshes data and persists metadata', () async {
      await controller.load(forceRefresh: true);
      final initialRequests = sessionRequests;

      await controller.selectWorkspace(201);

      expect(controller.state.metadata['selectedWorkspaceId'], equals(201));
      expect(sessionRequests, greaterThan(initialRequests));
      expect(
        analytics.events.any((event) => event.name == 'mobile_networking_workspace_switched'),
        isTrue,
      );
    });

    test('refresh triggers a network call even when cached', () async {
      await controller.load(forceRefresh: true);
      final initialRequests = sessionRequests;

      await controller.refresh();

      expect(sessionRequests, greaterThan(initialRequests));
      expect(
        analytics.events.map((event) => event.name),
        contains('mobile_networking_overview_refresh'),
      );
    });
  });
}
