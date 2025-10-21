import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/application/opportunity_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/discovery_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/test_dependencies.dart';

void main() {
  group('OpportunityController', () {
    late RecordingAnalyticsService analytics;
    late _FakeDiscoveryRepository repository;
    ProviderContainer createContainer() {
      analytics = RecordingAnalyticsService();
      repository = _FakeDiscoveryRepository();
      final container = ProviderContainer(
        overrides: [
          discoveryRepositoryProvider.overrideWithValue(repository),
          analyticsServiceProvider.overrideWithValue(analytics),
          membershipHeadersProvider.overrideWithValue(
            const {'X-Gigvora-Memberships': 'freelancer'},
          ),
        ],
      );
      addTearDown(container.dispose);
      return container;
    }

    test('load attaches membership headers and records listing analytics', () async {
      final container = createContainer();
      final initialCall = repository.waitForNextCall();
      final controller = container.read(
        opportunityControllerProvider(OpportunityCategory.job).notifier,
      );
      await initialCall;

      final state = container.read(opportunityControllerProvider(OpportunityCategory.job));
      expect(state.data, isNotNull);
      expect(state.loading, isFalse);
      expect(repository.lastHeaders, equals(const {'X-Gigvora-Memberships': 'freelancer'}));

      final listingEvents =
          analytics.events.where((event) => event.name == 'mobile_opportunity_listing_viewed').toList();
      expect(listingEvents, hasLength(1));
      expect(listingEvents.first.context['resultCount'], repository.page.items.length);
      expect(controller.filters, isEmpty);
    });

    test('updateQuery refreshes listings and records view analytics again', () async {
      final container = createContainer();
      final initialCall = repository.waitForNextCall();
      container.read(opportunityControllerProvider(OpportunityCategory.job).notifier);
      await initialCall;

      analytics.events.clear();
      final refreshCall = repository.waitForNextCall();
      container.read(opportunityControllerProvider(OpportunityCategory.job).notifier).updateQuery('  strategy  ');
      await refreshCall;

      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(repository.lastQuery, equals('strategy'));
      final viewEvents =
          analytics.events.where((event) => event.name == 'mobile_opportunity_listing_viewed').toList();
      expect(viewEvents, hasLength(1));
      expect(viewEvents.first.context['query'], equals('strategy'));
    });

    test('setFilters sanitises values and emits analytics context', () async {
      final container = createContainer();
      final initialCall = repository.waitForNextCall();
      final controller = container.read(
        opportunityControllerProvider(OpportunityCategory.job).notifier,
      );
      await initialCall;

      analytics.events.clear();
      final refreshCall = repository.waitForNextCall();
      controller.setFilters({
        'employmentTypes': [' Full-time ', ''],
        'isRemote': null,
        'track': '  ',
      });
      await refreshCall;
      await Future<void>.delayed(const Duration(milliseconds: 1));

      final filters = repository.lastFilters;
      expect(filters, isNotNull);
      final employmentTypes = filters?['employmentTypes'];
      expect(employmentTypes, isA<List>());
      expect(List<String>.from(employmentTypes as List), equals(['Full-time']));
      expect(filters!.containsKey('track'), isFalse);

      final filterEvents =
          analytics.events.where((event) => event.name == 'mobile_opportunity_filters_updated').toList();
      expect(filterEvents, hasLength(1));
      expect(filterEvents.first.context['filters'], isA<Map<String, dynamic>>());
    });

    test('updateSort normalises sort value and tracks analytics', () async {
      final container = createContainer();
      final initialCall = repository.waitForNextCall();
      final controller = container.read(
        opportunityControllerProvider(OpportunityCategory.job).notifier,
      );
      await initialCall;

      analytics.events.clear();
      final refreshCall = repository.waitForNextCall();
      await controller.updateSort(' newest ');
      await refreshCall;
      await Future<void>.delayed(const Duration(milliseconds: 1));

      expect(repository.lastSort, equals('newest'));
      final sortEvents =
          analytics.events.where((event) => event.name == 'mobile_opportunity_sort_updated').toList();
      expect(sortEvents, hasLength(1));
      expect(sortEvents.first.context['sort'], equals('newest'));
    });

    test('loadDetail returns repository detail and fires analytics event', () async {
      final container = createContainer();
      final initialCall = repository.waitForNextCall();
      final controller = container.read(
        opportunityControllerProvider(OpportunityCategory.job).notifier,
      );
      await initialCall;

      analytics.events.clear();
      final detail = await controller.loadDetail('opp-1');
      expect(detail.id, equals('opp-1'));
      await Future<void>.delayed(const Duration(milliseconds: 1));

      final detailEvents =
          analytics.events.where((event) => event.name == 'mobile_opportunity_detail_viewed').toList();
      expect(detailEvents, hasLength(1));
      expect(detailEvents.first.context['id'], equals('opp-1'));
      expect(repository.detailRequests, contains('opp-1'));
    });
  });
}

class _FakeDiscoveryRepository extends DiscoveryRepository {
  _FakeDiscoveryRepository()
      : page = OpportunityPage(
          category: OpportunityCategory.job,
          items: <OpportunitySummary>[
            OpportunitySummary(
              id: 'opp-1',
              category: OpportunityCategory.job,
              title: 'Head of Strategy',
              description: 'Lead experimentation programs across launch partners.',
              updatedAt: DateTime.now(),
              location: 'Remote across EU',
              employmentType: 'Full-time',
              budget: '£120k',
              duration: 'Full-time',
              status: 'Open',
              track: 'Strategy',
              organization: 'Aurora Labs',
              isRemote: true,
              taxonomyLabels: const ['Strategy'],
              taxonomySlugs: const ['strategy'],
              taxonomies: const <OpportunityTaxonomyTag>[],
            ),
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
          facets: const {
            'employmentTypes': {'Full-time': 1},
          },
        ),
        detail = OpportunityDetail(
          id: 'opp-1',
          category: OpportunityCategory.job,
          title: 'Head of Strategy',
          description: 'Drive growth frameworks across markets.',
          summary: 'Collaborate with the executive pod to ship playbooks.',
          location: 'Remote',
          organization: 'Aurora Labs',
          isRemote: true,
          skills: const ['Leadership', 'Go-to-market'],
          tags: const ['Strategy'],
          media: const <OpportunityMediaAsset>[],
          reviews: const <OpportunityReview>[],
          rating: 4.8,
          reviewCount: 12,
          posterName: 'Alex Gómez',
          posterAvatarUrl: 'https://example.com/avatar.png',
          ctaUrl: 'https://example.com/apply',
          budget: '£120k',
          duration: 'Permanent',
          employmentType: 'Full-time',
          status: 'Open',
          videoUrl: null,
          publishedAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
        super(TestApiClient(), InMemoryOfflineCache());

  final OpportunityPage page;
  final OpportunityDetail detail;
  RepositoryResult<OpportunityPage>? nextResult;
  Object? fetchError;
  Map<String, dynamic>? lastFilters;
  String? lastSort;
  String? lastQuery;
  bool? lastIncludeFacets;
  Map<String, String>? lastHeaders;
  final List<String> detailRequests = <String>[];
  Completer<void>? _callCompleter;

  Future<void> waitForNextCall() {
    final completer = Completer<void>();
    _callCompleter = completer;
    return completer.future;
  }

  @override
  Future<RepositoryResult<OpportunityPage>> fetchOpportunities(
    OpportunityCategory category, {
    String? query,
    bool forceRefresh = false,
    int page = 1,
    int pageSize = 20,
    Map<String, dynamic>? filters,
    String? sort,
    bool includeFacets = false,
    Map<String, String>? headers,
  }) async {
    lastQuery = query;
    lastFilters = filters;
    lastSort = sort;
    lastIncludeFacets = includeFacets;
    lastHeaders = headers == null ? null : Map<String, String>.from(headers);
    _callCompleter?..complete();
    _callCompleter = null;
    if (fetchError != null) {
      throw fetchError!;
    }
    final result = nextResult ??
        RepositoryResult<OpportunityPage>(
          data: this.page,
          fromCache: false,
          lastUpdated: DateTime.now(),
        );
    nextResult = null;
    return result;
  }

  @override
  Future<OpportunityDetail> fetchOpportunityDetail(
    OpportunityCategory category,
    String id, {
    Map<String, String>? headers,
  }) async {
    detailRequests.add(id);
    lastHeaders = headers == null ? null : Map<String, String>.from(headers);
    return detail;
  }

  @override
  Future<OpportunityDetail> createOpportunity(
    OpportunityCategory category,
    OpportunityDraft draft, {
    Map<String, String>? headers,
  }) async {
    return detail;
  }

  @override
  Future<OpportunityDetail> updateOpportunity(
    OpportunityCategory category,
    String id,
    OpportunityDraft draft, {
    Map<String, String>? headers,
  }) async {
    return detail;
  }

  @override
  Future<void> deleteOpportunity(
    OpportunityCategory category,
    String id, {
    Map<String, String>? headers,
  }) async {}
}
