import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/explorer/application/explorer_controller.dart';
import 'package:gigvora_mobile/features/explorer/data/discovery_models.dart';
import 'package:gigvora_mobile/features/marketplace/application/opportunity_controller.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late FakeDiscoveryRepository repository;
  late TestAnalyticsService analytics;
  late ProviderContainer container;

  setUp(() {
    repository = FakeDiscoveryRepository();
    analytics = TestAnalyticsService();
    container = ProviderContainer(
      overrides: [
        discoveryRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
      ],
    );
    addTearDown(container.dispose);
  });

  test('loads snapshot on init and exposes data', () async {
    await Future<void>.delayed(const Duration(milliseconds: 10));

    final state = container.read(explorerControllerProvider);
    expect(repository.snapshotCalls, equals(1));
    expect(state.snapshot.data, equals(repository.snapshot));
    expect(state.snapshot.loading, isFalse);
  });

  test('performs search when query changes and records analytics', () async {
    final controller = container.read(explorerControllerProvider.notifier);

    controller.updateQuery('Design lead roles');
    await Future<void>.delayed(const Duration(milliseconds: 400));

    final state = container.read(explorerControllerProvider);
    expect(repository.searchCalls, equals(1));
    expect(state.search.data, equals(repository.searchResult));
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_search_performed'),
    );
  });

  test('captures errors when search fails', () async {
    repository.shouldThrowOnSearch = true;
    final controller = container.read(explorerControllerProvider.notifier);

    controller.updateQuery('operations');
    await Future<void>.delayed(const Duration(milliseconds: 400));

    final state = container.read(explorerControllerProvider);
    expect(state.search.error, isNotNull);
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_search_failed'),
    );
  });
}

class FakeDiscoveryRepository extends DiscoveryRepository {
  FakeDiscoveryRepository()
      : snapshot = DiscoverySnapshot(buckets: {
          OpportunityCategory.job: [
            OpportunitySummary(
              id: 'job-1',
              category: OpportunityCategory.job,
              title: 'Lead Designer',
              description: 'Shape core experiences.',
              updatedAt: DateTime(2024, 1, 1),
              organization: 'Gigvora',
            ),
          ],
        }),
        searchResult = GlobalSearchResult(
          opportunities: {
            OpportunityCategory.job: [
              OpportunitySummary(
                id: 'job-2',
                category: OpportunityCategory.job,
                title: 'Design Director',
                description: 'Scale design systems.',
                updatedAt: DateTime(2024, 2, 1),
                organization: 'Atlas Co',
              ),
            ],
          },
          people: const [
            SearchPerson(
              id: 'person-1',
              firstName: 'Yara',
              lastName: 'Singh',
              email: 'yara@example.com',
              userType: 'talent',
            ),
          ],
        ),
        super(_NoopApiClient(), InMemoryOfflineCache());

  final DiscoverySnapshot snapshot;
  final GlobalSearchResult searchResult;
  int snapshotCalls = 0;
  int searchCalls = 0;
  bool shouldThrowOnSearch = false;

  @override
  Future<RepositoryResult<DiscoverySnapshot>> fetchSnapshot({int limit = 8, bool forceRefresh = false}) async {
    snapshotCalls += 1;
    return RepositoryResult<DiscoverySnapshot>(
      data: snapshot,
      fromCache: false,
      lastUpdated: DateTime(2024, 1, 1),
    );
  }

  @override
  Future<RepositoryResult<GlobalSearchResult>> searchGlobal(String query, {int limit = 12, bool forceRefresh = false}) async {
    searchCalls += 1;
    if (shouldThrowOnSearch) {
      throw Exception('search failed');
    }
    return RepositoryResult<GlobalSearchResult>(
      data: searchResult,
      fromCache: false,
      lastUpdated: DateTime(2024, 3, 1),
    );
  }
}

class _NoopApiClient extends ApiClient {
  _NoopApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: AppConfig(
            environment: AppEnvironment.development,
            apiBaseUrl: Uri.parse('https://example.com/api'),
            graphQlEndpoint: Uri.parse('https://example.com/graphql'),
            realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
            defaultCacheTtl: const Duration(minutes: 5),
            enableNetworkLogging: false,
            analyticsFlushThreshold: 1,
            offlineCacheNamespace: 'gigvora_test',
            featureFlags: const <String, dynamic>{},
            featureFlagRefreshInterval: const Duration(minutes: 5),
          ),
        );
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError();
  }
}
