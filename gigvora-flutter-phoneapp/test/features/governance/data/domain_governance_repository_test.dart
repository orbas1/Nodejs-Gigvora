import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/governance/data/domain_governance_repository.dart';
import 'package:gigvora_mobile/features/governance/domain/domain_governance_models.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  group('DomainGovernanceRepository', () {
    test('returns summaries from network and caches them', () async {
      final cache = InMemoryOfflineCache();
      final repository = DomainGovernanceRepository(
        TestApiClient(onGet: (path) async {
          expect(path, '/domains/governance');
          return {
            'generatedAt': '2024-04-01T10:00:00Z',
            'contexts': [
              {
                'contextName': 'payments',
                'displayName': 'Payments',
                'piiModelCount': 2,
                'piiFieldCount': 8,
                'reviewStatus': 'approved',
              },
            ],
          };
        }),
        cache,
      );

      final response = await repository.fetchSummaries();

      expect(response.contexts.first.contextName, 'payments');

      final cachedRepository = DomainGovernanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('should not fetch')),
        cache,
      );

      final cachedResponse = await cachedRepository.fetchSummaries();

      expect(cachedResponse.contexts.first.contextName, 'payments');
    });

    test('falls back to cached summaries on failure', () async {
      final cache = InMemoryOfflineCache();
      final cachedResponse = DomainGovernanceSummaryResponse(
        contexts: [
          DomainGovernanceSummary(
            contextName: 'auth',
            displayName: 'Identity',
            description: null,
            dataClassification: null,
            ownerTeam: null,
            dataSteward: null,
            piiModelCount: 1,
            piiFieldCount: 4,
            reviewStatus: 'in_progress',
            reviewedAt: null,
            nextReviewDueAt: null,
            automationCoverage: null,
            remediationItems: null,
          ),
        ],
        generatedAt: DateTime.utc(2024, 4, 1),
      );
      await cache.write('governance:domains:summaries', cachedResponse.toJson());

      final repository = DomainGovernanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('offline')),
        cache,
      );

      final response = await repository.fetchSummaries(forceRefresh: true);

      expect(response.contexts.single.contextName, 'auth');
    });

    test('throws descriptive exception when nothing cached', () async {
      final repository = DomainGovernanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('offline')),
        InMemoryOfflineCache(),
      );

      expect(
        () => repository.fetchSummaries(forceRefresh: true),
        throwsA(isA<DomainGovernanceException>()),
      );
    });

    test('returns cached detail when network fails', () async {
      final cache = InMemoryOfflineCache();
      const contextName = 'payments';
      final detail = DomainGovernanceDetail(
        context: GovernanceContext(name: 'payments', displayName: 'Payments'),
        models: const <GovernanceModel>[],
        ownerTeam: 'Finance',
        dataSteward: 'Ops',
        dataClassification: 'restricted',
        businessCriticality: null,
        defaultRetention: null,
        dataResidency: null,
        regulatoryFrameworks: const <String>[],
        qualityChecks: const <Map<String, dynamic>>[],
        piiModelCount: 0,
        piiFieldCount: 0,
        review: null,
      );
      await cache.write('governance:domains:detail:$contextName', detail.toJson());

      final repository = DomainGovernanceRepository(
        TestApiClient(onGet: (_) async => throw Exception('offline')),
        cache,
      );

      final result = await repository.fetchDetail(contextName, forceRefresh: true);

      expect(result.ownerTeam, 'Finance');
    });
  });
}
