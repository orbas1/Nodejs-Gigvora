import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/mentorship/data/mentorship_repository.dart';
import 'package:gigvora_mobile/features/mentorship/data/models/mentor_dashboard.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_api_client.dart';

void main() {
  group('MentorshipRepository', () {
    late InMemoryOfflineCache cache;

    setUp(() {
      cache = InMemoryOfflineCache();
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('fetchDashboard hydrates and caches mentor insights', () async {
      var requestCount = 0;
      final repository = MentorshipRepository(
        TestApiClient(onGet: (path) async {
          requestCount += 1;
          expect(path, equals('/mentors/dashboard'));
          return _dashboardPayload;
        }),
        cache,
      );

      final result = await repository.fetchDashboard(forceRefresh: true);

      expect(result.data.availability, isNotEmpty);
      expect(result.data.packages.first.id, equals('spark-session'));
      expect(result.data.bookings.first.status, equals('Confirmed'));
      expect(result.fromCache, isFalse);
      expect(requestCount, equals(1));

      final cached = await repository.fetchDashboard();
      expect(cached.fromCache, isTrue);
      expect(cached.data.packages, isNotEmpty);
      expect(requestCount, equals(1));
    });

    test('saveAvailability posts normalized slot payloads', () async {
      Map<String, dynamic>? capturedBody;
      final repository = MentorshipRepository(
        TestApiClient(onPost: (path, body) async {
          expect(path, equals('/mentors/availability'));
          capturedBody = body as Map<String, dynamic>?;
          return <String, dynamic>{};
        }),
        cache,
      );

      final slots = [
        MentorAvailabilitySlot(
          id: 'slot-1',
          day: 'Monday',
          start: DateTime(2024, 1, 1, 9),
          end: DateTime(2024, 1, 1, 10),
          format: 'Virtual',
          capacity: 2,
        ),
      ];

      await repository.saveAvailability(slots);

      expect(capturedBody, isNotNull);
      expect(capturedBody!['slots'], isA<List>());
      expect(capturedBody!['slots'][0]['start'], equals('2024-01-01T09:00:00.000'));
      expect(capturedBody!['slots'][0]['capacity'], equals(2));
    });

    test('savePackages posts serialized package payloads', () async {
      Map<String, dynamic>? capturedBody;
      final repository = MentorshipRepository(
        TestApiClient(onPost: (path, body) async {
          expect(path, equals('/mentors/packages'));
          capturedBody = body as Map<String, dynamic>?;
          return <String, dynamic>{};
        }),
        cache,
      );

      final packages = [
        MentorPackage(
          id: 'spark-session',
          name: 'Spark session',
          description: '60 minute acceleration call',
          sessions: 1,
          price: 280,
          currency: 'USD',
          format: 'Virtual',
          outcome: 'Actionable roadmap',
        ),
      ];

      await repository.savePackages(packages);

      expect(capturedBody, isNotNull);
      expect(capturedBody!['packages'], isA<List>());
      expect(capturedBody!['packages'][0]['id'], equals('spark-session'));
      expect(capturedBody!['packages'][0]['sessions'], equals(1));
    });
  });
}

const _dashboardPayload = {
  'stats': {
    'activeMentees': 12,
    'activeMenteesChange': 3,
    'upcomingSessions': 5,
    'upcomingSessionsChange': 1,
    'avgRating': 4.8,
    'avgRatingChange': 0.2,
    'monthlyRevenue': 8400,
    'monthlyRevenueChange': 0.1,
  },
  'conversion': [
    {'id': 'leads', 'label': 'Leads', 'value': 24, 'delta': 6},
  ],
  'availability': [
    {
      'id': 'slot-1',
      'day': 'Monday',
      'start': '2024-01-01T09:00:00.000Z',
      'end': '2024-01-01T10:00:00.000Z',
      'format': 'Virtual',
      'capacity': 2,
    }
  ],
  'packages': [
    {
      'id': 'spark-session',
      'name': 'Spark session',
      'description': '60 minute acceleration call',
      'sessions': 1,
      'price': 280,
      'currency': 'USD',
      'format': 'Virtual',
      'outcome': 'Actionable roadmap',
    }
  ],
  'bookings': [
    {
      'id': 'booking-1',
      'mentee': 'Alex Chen',
      'role': 'Head of Design',
      'package': 'Spark session',
      'focus': 'Product narrative',
      'scheduledAt': '2024-01-02T14:00:00.000Z',
      'status': 'Confirmed',
      'price': 280,
      'currency': 'USD',
      'paymentStatus': 'Paid',
      'channel': 'App',
      'segment': 'Product',
    }
  ],
  'segments': [
    {
      'id': 'product',
      'title': 'Product teams',
      'description': 'Scale-ups shaping new launches',
    }
  ],
  'feedback': [
    {
      'id': 'fb-1',
      'mentee': 'Jordan Blake',
      'highlight': 'Brought clarity to our enablement plan.',
      'rating': 4.9,
    }
  ],
  'explorerPlacement': {
    'score': 92,
    'position': 'Top tier',
    'nextActions': ['Publish new case study', 'Enable async briefs'],
  },
};
