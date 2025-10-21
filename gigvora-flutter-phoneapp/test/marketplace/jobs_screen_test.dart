import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/opportunity_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/jobs_screen.dart';

import '../helpers/test_dependencies.dart';
import '../support/test_design_tokens.dart';
import 'stub_discovery_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('JobsScreen', () {
    late RecordingAnalyticsService analytics;
    late StubDiscoveryRepository repository;

    OpportunityDetail buildDetail() {
      return OpportunityDetail(
        id: 'job-1',
        category: OpportunityCategory.job,
        title: 'Head of Strategy',
        description: 'Lead experimentation programmes across the marketplace.',
        summary: 'Shape the long-term roadmap with cross-functional leaders.',
        location: 'Remote',
        organization: 'Aurora Labs',
        isRemote: true,
        skills: const ['Leadership', 'Operations'],
        tags: const ['Strategy'],
        media: const <OpportunityMediaAsset>[],
        reviews: const <OpportunityReview>[],
        rating: 4.9,
        reviewCount: 42,
        posterName: 'Priya Patel',
        posterAvatarUrl: 'https://example.com/avatar.png',
        ctaUrl: 'https://example.com/apply',
        budget: '£120k – £140k',
        duration: 'Permanent',
        employmentType: 'Full-time',
        status: 'Open',
        videoUrl: null,
        publishedAt: DateTime.utc(2024, 4, 20),
      );
    }

    OpportunityPage buildPage() {
      final now = DateTime.now();
      return OpportunityPage(
        category: OpportunityCategory.job,
        items: <OpportunitySummary>[
          OpportunitySummary(
            id: 'job-1',
            category: OpportunityCategory.job,
            title: 'Head of Strategy',
            description: 'Lead experimentation programmes across the marketplace.',
            updatedAt: now.subtract(const Duration(days: 3)),
            employmentType: 'Full-time',
            location: 'Remote',
            budget: '£120k – £140k',
            duration: 'Permanent',
            status: 'Open',
            organization: 'Aurora Labs',
            isRemote: true,
            taxonomyLabels: const ['Strategy'],
            taxonomySlugs: const ['strategy'],
            taxonomies: const <OpportunityTaxonomyTag>[],
          ),
          OpportunitySummary(
            id: 'job-2',
            category: OpportunityCategory.job,
            title: 'Product Design Lead',
            description: 'Drive design excellence across the network.',
            updatedAt: now.subtract(const Duration(days: 1)),
            employmentType: 'Contract',
            location: 'Hybrid in London',
            budget: '£90k – £110k',
            duration: '12 months',
            status: 'Open',
            organization: 'Orbit Studio',
            isRemote: false,
            taxonomyLabels: const ['Design'],
            taxonomySlugs: const ['design'],
            taxonomies: const <OpportunityTaxonomyTag>[],
          ),
          OpportunitySummary(
            id: 'job-3',
            category: OpportunityCategory.job,
            title: 'Operations Director',
            description: 'Scale partner operations and delivery.',
            updatedAt: now.subtract(const Duration(days: 5)),
            employmentType: 'Full-time',
            location: 'Hybrid in Berlin',
            budget: '€110k – €130k',
            duration: 'Permanent',
            status: 'Open',
            organization: 'Northwind Collective',
            isRemote: true,
            taxonomyLabels: const ['Operations'],
            taxonomySlugs: const ['operations'],
            taxonomies: const <OpportunityTaxonomyTag>[],
          ),
        ],
        page: 1,
        pageSize: 20,
        total: 12,
        totalPages: 1,
        facets: const {
          'isRemote': {'true': 7, 'false': 5},
          'updatedAtDate': {'7d': 5},
          'employmentType': {'Full-time': 8, 'Contract': 4},
        },
      );
    }

    Future<void> pumpScreen(WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            discoveryRepositoryProvider.overrideWithValue(repository),
            analyticsServiceProvider.overrideWithValue(analytics),
            membershipHeadersProvider.overrideWithValue(
              const {'X-Gigvora-Memberships': 'freelancer'},
            ),
            designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          ],
          child: const MaterialApp(home: JobsScreen()),
        ),
      );
      await tester.pump();
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
    }

    setUp(() {
      analytics = RecordingAnalyticsService();
      repository = StubDiscoveryRepository(
        page: buildPage(),
        detail: buildDetail(),
      );
    });

    testWidgets('renders marketplace metrics and opportunity list', (tester) async {
      await pumpScreen(tester);

      expect(find.text('Open opportunities'), findsOneWidget);
      expect(find.text('12'), findsWidgets);
      expect(find.text('Remote friendly'), findsOneWidget);
      expect(find.textContaining('58%'), findsOneWidget);
      expect(find.textContaining('7 remote-first listings.'), findsOneWidget);
      expect(find.text('Updated this week'), findsOneWidget);
      expect(find.text('5'), findsWidgets);
      expect(find.text('Full-time roles refreshed recently.'), findsOneWidget);
      expect(find.text('Search by title, location, or keywords'), findsOneWidget);
    });

    testWidgets('updating filters pushes selections to the controller', (tester) async {
      await pumpScreen(tester);

      final initialFilters = repository.lastFilters;
      expect(initialFilters, isNotNull);
      expect(initialFilters!['employmentTypes'], equals(['Full-time']));
      expect(initialFilters['updatedWithin'], equals('30d'));

      await tester.tap(find.widgetWithText(FilterChip, 'Contract'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(repository.lastFilters!['employmentTypes'], equals(['Full-time', 'Contract']));

      await tester.tap(find.widgetWithText(ChoiceChip, 'Remote only'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(repository.lastFilters!['isRemote'], isTrue);

      await tester.tap(find.text('Last 30 days'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Last 7 days').last);
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(repository.lastFilters!['updatedWithin'], equals('7d'));

      await tester.tap(find.text('Relevance'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Newest').last);
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(repository.lastSort, equals('newest'));
    });

    testWidgets('reset filters restores defaults and clears controller filters', (tester) async {
      await pumpScreen(tester);

      await tester.tap(find.widgetWithText(FilterChip, 'Contract'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      await tester.tap(find.widgetWithText(ChoiceChip, 'Remote only'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));

      await tester.tap(find.text('Reset filters'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));

      final fullTimeChip = tester.widget<FilterChip>(find.widgetWithText(FilterChip, 'Full-time'));
      final contractChip = tester.widget<FilterChip>(find.widgetWithText(FilterChip, 'Contract'));
      final anyChoice = tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'All work styles'));

      expect(fullTimeChip.selected, isTrue);
      expect(contractChip.selected, isFalse);
      expect(anyChoice.selected, isTrue);

      expect(repository.lastFilters, isNotNull);
      expect(repository.lastFilters!['employmentTypes'], equals(['Full-time']));
      expect(repository.lastFilters!['updatedWithin'], equals('30d'));
      expect(repository.lastFilters!.containsKey('isRemote'), isFalse);
    });

    testWidgets('navigating between tabs reveals contextual panels', (tester) async {
      await pumpScreen(tester);

      await tester.tap(find.text('Applications'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(find.text('Senior Flutter Engineer'), findsOneWidget);

      await tester.tap(find.text('Interviews'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(find.text('Technical interview'), findsOneWidget);

      await tester.tap(find.text('Manage jobs'));
      await tester.pumpAndSettle(const Duration(milliseconds: 50));
      expect(find.text('Product Marketing Manager'), findsOneWidget);
    });

    testWidgets('initial configuration requests facets for richer filters', (tester) async {
      await pumpScreen(tester);

      expect(repository.lastIncludeFacets, isTrue);
      expect(repository.loadCount, greaterThanOrEqualTo(1));
      expect(repository.lastHeaders, equals(const {'X-Gigvora-Memberships': 'freelancer'}));
    });
  });
}
