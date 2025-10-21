import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/mentorship/application/mentorship_controller.dart';
import 'package:gigvora_mobile/features/mentorship/data/mentorship_repository.dart';
import 'package:gigvora_mobile/features/mentorship/data/models/mentor_dashboard.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';
import '../support/test_api_client.dart';

class _StubMentorshipRepository extends MentorshipRepository {
  _StubMentorshipRepository(this.dashboard)
      : super(TestApiClient(onGet: (_) async => {}), InMemoryOfflineCache());

  MentorDashboard dashboard;
  List<MentorAvailabilitySlot>? savedAvailability;
  List<MentorPackage>? savedPackages;

  @override
  Future<RepositoryResult<MentorDashboard>> fetchDashboard({int lookbackDays = 30, bool forceRefresh = false}) async {
    return RepositoryResult(
      data: dashboard,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<void> saveAvailability(List<MentorAvailabilitySlot> slots) async {
    savedAvailability = slots;
  }

  @override
  Future<void> savePackages(List<MentorPackage> packages) async {
    savedPackages = packages;
  }
}

void main() {
  group('MentorshipController', () {
    late _StubMentorshipRepository repository;
    late TestAnalyticsService analytics;
    late MentorshipController controller;
    late MentorDashboard dashboard;

    setUp(() {
      dashboard = MentorDashboard(
        availability: [
          MentorAvailabilitySlot(
            id: 'slot-1',
            day: 'Monday',
            start: DateTime(2024, 1, 1, 9),
            end: DateTime(2024, 1, 1, 10),
            format: 'Virtual',
            capacity: 2,
          ),
        ],
        packages: [
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
        ],
        bookings: [
          MentorBooking(
            id: 'booking-1',
            mentee: 'Alex Chen',
            role: 'Head of Design',
            package: 'Spark session',
            focus: 'Product narrative',
            scheduledAt: DateTime(2024, 1, 2, 14),
            status: 'Confirmed',
            price: 280,
            currency: 'USD',
            paymentStatus: 'Paid',
            channel: 'App',
            segment: 'Product',
          ),
        ],
        conversion: const [MentorConversionStage(id: 'leads', label: 'Leads', value: 24, delta: 6)],
        feedback: const [MentorFeedback(id: 'fb-1', mentee: 'Jordan', highlight: 'Superb guidance', rating: 4.9)],
      );
      repository = _StubMentorshipRepository(dashboard);
      analytics = TestAnalyticsService();
      controller = MentorshipController(repository, analytics, lookbackDays: 14);
    });

    test('load populates dashboard data and records view analytics', () async {
      await controller.load(forceRefresh: true);

      final state = controller.state;
      expect(state.loading, isFalse);
      expect(state.data?.availability, isNotEmpty);
      expect(analytics.events.where((event) => event.name == 'mobile_mentor_dashboard_viewed'), isNotEmpty);
    });

    test('saveAvailability updates metadata and persists slots', () async {
      await controller.saveAvailability(dashboard.availability);

      final metadata = controller.state.metadata;
      expect(metadata['savingAvailability'], isFalse);
      expect(repository.savedAvailability, isNotNull);
      expect(analytics.events.last.name, equals('mobile_mentor_availability_saved'));
    });

    test('savePackages stores packages and triggers analytics', () async {
      await controller.savePackages(dashboard.packages);

      final metadata = controller.state.metadata;
      expect(metadata['savingPackages'], isFalse);
      expect(repository.savedPackages, isNotNull);
      expect(analytics.events.last.name, equals('mobile_mentor_packages_saved'));
    });
  });
}
