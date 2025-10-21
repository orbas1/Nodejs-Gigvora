import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/opportunity_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/job_application_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/job_detail_screen.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/test_dependencies.dart';
import '../support/test_design_tokens.dart';
import 'stub_discovery_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('JobDetailScreen', () {
    const jobId = 'job-123';

    late RecordingAnalyticsService analytics;
    late StubDiscoveryRepository discoveryRepository;
    late JobApplicationRepository jobRepository;

    OpportunityDetail buildDetail() {
      return OpportunityDetail(
        id: jobId,
        category: OpportunityCategory.job,
        title: 'Head of Strategy',
        description: 'Drive experimentation programmes for strategic partners.',
        summary: 'Collaborate with product and go-to-market leaders to launch new ventures.',
        location: 'Remote across EU',
        organization: 'Aurora Labs',
        isRemote: true,
        skills: const ['Leadership', 'Experimentation', 'Growth'],
        tags: const ['Strategy', 'Growth'],
        media: const <OpportunityMediaAsset>[],
        reviews: const <OpportunityReview>[],
        rating: 4.8,
        reviewCount: 18,
        posterName: 'Alex Gómez',
        posterAvatarUrl: 'https://example.com/avatar.png',
        ctaUrl: 'https://example.com/apply',
        budget: '£120k – £140k',
        duration: 'Permanent',
        employmentType: 'Full-time',
        status: 'Open',
        videoUrl: null,
        publishedAt: DateTime.utc(2024, 5, 10),
      );
    }

    OpportunityPage buildPage() {
      final summary = OpportunitySummary(
        id: jobId,
        category: OpportunityCategory.job,
        title: 'Head of Strategy',
        description: 'Drive experimentation programmes for strategic partners.',
        updatedAt: DateTime.now(),
        location: 'Remote across EU',
        employmentType: 'Full-time',
        budget: '£120k – £140k',
        duration: 'Permanent',
        status: 'Open',
        organization: 'Aurora Labs',
        isRemote: true,
        taxonomyLabels: const ['Strategy'],
        taxonomySlugs: const ['strategy'],
        taxonomies: const <OpportunityTaxonomyTag>[],
      );
      return OpportunityPage(
        category: OpportunityCategory.job,
        items: <OpportunitySummary>[summary],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        facets: const {
          'employmentType': {'Full-time': 1},
        },
      );
    }

    Future<void> pumpScreen(WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            discoveryRepositoryProvider.overrideWithValue(discoveryRepository),
            jobApplicationRepositoryProvider.overrideWithValue(jobRepository),
            analyticsServiceProvider.overrideWithValue(analytics),
            membershipHeadersProvider.overrideWithValue(
              const {'X-Gigvora-Memberships': 'freelancer'},
            ),
            designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          ],
          child: const MaterialApp(
            home: JobDetailScreen(jobId: jobId),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 20));
      // Allow controllers to finish initial asynchronous work.
      await tester.pumpAndSettle(const Duration(milliseconds: 20));
    }

    setUp(() {
      analytics = RecordingAnalyticsService();
      discoveryRepository = StubDiscoveryRepository(
        page: buildPage(),
        detail: buildDetail(),
      );
      jobRepository = JobApplicationRepository(InMemoryOfflineCache());
    });

    testWidgets('renders job detail and seeded applications', (tester) async {
      await pumpScreen(tester);

      expect(find.text('Head of Strategy'), findsOneWidget);
      expect(find.textContaining('Aurora Labs'), findsOneWidget);
      expect(find.text('Applications'), findsWidgets);
      expect(find.text('Maya Singh'), findsOneWidget);

      final detailEvents =
          analytics.events.where((event) => event.name == 'job_profile_viewed').toList();
      expect(detailEvents, isNotEmpty);
      expect(detailEvents.first.context['jobId'], equals(jobId));
      expect(discoveryRepository.detailRequests, contains(jobId));
    });

    testWidgets('shows error view when detail load fails and recovers after retry', (tester) async {
      discoveryRepository.detailError = Exception('Timed out');
      await pumpScreen(tester);

      expect(find.textContaining("We couldn't load this job"), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      discoveryRepository.detailError = null;
      analytics.events.clear();

      await tester.tap(find.text('Retry'));
      await tester.pump();
      await tester.pumpAndSettle(const Duration(milliseconds: 20));

      expect(find.text('Head of Strategy'), findsOneWidget);
      expect(
        analytics.events.where((event) => event.name == 'job_profile_viewed'),
        isNotEmpty,
      );
    });

    testWidgets('refresh indicator reloads detail and applications', (tester) async {
      await pumpScreen(tester);
      analytics.events.clear();

      final refresh = tester.widget<RefreshIndicator>(find.byType(RefreshIndicator));
      await refresh.onRefresh?.call();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 20));

      expect(discoveryRepository.detailRequests.length, greaterThanOrEqualTo(2));
      final refreshEvents =
          analytics.events.where((event) => event.name == 'job_applications_refreshed').toList();
      expect(refreshEvents, isNotEmpty);
      expect(refreshEvents.first.context['jobId'], equals(jobId));
    });

    testWidgets('share button records analytics and shows confirmation snackbar', (tester) async {
      await pumpScreen(tester);
      analytics.events.clear();

      final shareButton = find.widgetWithIcon(OutlinedButton, Icons.share_outlined);
      expect(shareButton, findsOneWidget);

      await tester.tap(shareButton);
      await tester.pump(const Duration(milliseconds: 100));

      final shareEvents =
          analytics.events.where((event) => event.name == 'job_share_clicked').toList();
      expect(shareEvents, hasLength(1));
      expect(shareEvents.first.context['jobId'], equals(jobId));
      expect(find.textContaining('Share link copied'), findsOneWidget);
    });
  });
}
