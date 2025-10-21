import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/marketplace/data/discovery_repository.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity.dart';
import 'package:gigvora_mobile/features/marketplace/data/models/opportunity_detail.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../helpers/recording_api_client.dart';

class _RecordingCache extends InMemoryOfflineCache {
  bool cleared = false;

  @override
  Future<void> clear() async {
    cleared = true;
    return super.clear();
  }
}

void main() {
  group('DiscoveryRepository', () {
    late RecordingApiClient apiClient;
    late _RecordingCache cache;
    late DiscoveryRepository repository;
    bool throwListingsError = false;

    setUp(() {
      throwListingsError = false;
      apiClient = RecordingApiClient(onGet: (path, query, headers, body) {
        if (path == '/discovery/gigs') {
          if (throwListingsError) {
            throw ApiException(503, 'edge cache unavailable');
          }
          return {
            'items': [
              {
                'id': 'gig-1',
                'title': 'Growth experiments lead',
                'description': 'Coordinate experimentation backlog across squads.',
                'updatedAt': '2024-01-04T12:00:00Z',
                'taxonomyLabels': ['Growth'],
                'taxonomySlugs': ['growth'],
              },
            ],
            'page': 1,
            'pageSize': 20,
            'total': 1,
            'totalPages': 1,
            'facets': {
              'locations': {'Remote': 1},
            },
          };
        }
        if (path == '/discovery/gigs/gig-1') {
          return {
            'id': 'gig-1',
            'title': 'Growth experiments lead',
            'description': 'Coordinate experimentation backlog across squads.',
            'summary': 'Lead experimentation rituals with precision.',
            'skills': ['Experiment design'],
            'tags': ['Growth'],
            'reviews': [
              {
                'reviewer': 'Alex',
                'rating': 4.8,
                'comment': 'Transformed our activation metrics.',
                'createdAt': '2024-01-01T10:00:00Z',
              }
            ],
            'poster': {'name': 'Aurora Labs', 'avatarUrl': 'https://example.com/avatar.png'},
            'isRemote': true,
            'budget': '£4,200',
            'duration': '6 weeks',
          };
        }
        if (path == '/discovery/snapshot') {
          if (throwListingsError) {
            throw ApiException(504, 'snapshot unavailable');
          }
          return {
            'gigs': {
              'items': [
                {
                  'id': 'gig-1',
                  'title': 'Growth experiments lead',
                  'description': 'Coordinate experimentation backlog across squads.',
                  'updatedAt': '2024-01-04T12:00:00Z',
                },
              ],
            },
          };
        }
        if (path == '/search') {
          if (throwListingsError) {
            throw ApiException(500, 'search offline');
          }
          return {
            'gigs': [
              {
                'id': 'gig-1',
                'title': 'Growth experiments lead',
                'type': 'gig',
              }
            ],
          };
        }
        throw UnimplementedError('Unhandled GET $path');
      }, onPost: (path, query, headers, body) {
        if (path == '/discovery/gigs') {
          return {
            'id': 'gig-2',
            'title': (body as Map<String, dynamic>)['title'],
            'description': (body as Map<String, dynamic>)['description'],
          };
        }
        throw UnimplementedError('Unhandled POST $path');
      }, onPatch: (path, query, headers, body) {
        return {
          'id': 'gig-1',
          'title': 'Updated title',
          'description': 'Updated description',
        };
      }, onDelete: (path, query, headers, body) {
        return {'status': 'ok'};
      });
      cache = _RecordingCache();
      repository = DiscoveryRepository(apiClient, cache);
    });

    test('fetchOpportunities hits API then serves cached responses', () async {
      final result = await repository.fetchOpportunities(
        OpportunityCategory.gig,
        query: ' growth  ',
        filters: {
          'locations': [' Remote ', ''],
        },
        headers: {'Authorization': ' Bearer token '},
        includeFacets: true,
      );

      expect(result.fromCache, isFalse);
      expect(result.data.items, hasLength(1));
      expect(result.data.items.first.title, contains('Growth experiments lead'));
      expect(result.data.facets?['locations'], containsPair('Remote', 1));

      final recorded = apiClient.requests.last;
      expect(recorded.headers, equals({'Authorization': 'Bearer token'}));
      expect(recorded.query?['q'], 'growth');

      final cached = await repository.fetchOpportunities(
        OpportunityCategory.gig,
        query: 'growth',
      );

      expect(cached.fromCache, isTrue);
      expect(cached.data.items.first.title, equals(result.data.items.first.title));

      throwListingsError = true;
      final fallback = await repository.fetchOpportunities(
        OpportunityCategory.gig,
        query: 'growth',
      );
      expect(fallback.fromCache, isTrue);
      expect(fallback.error, isA<ApiException>());
    });

    test('fetchOpportunityDetail maps nested structures correctly', () async {
      final detail = await repository.fetchOpportunityDetail(
        OpportunityCategory.gig,
        'gig-1',
      );

      expect(detail.id, 'gig-1');
      expect(detail.skills, contains('Experiment design'));
      expect(detail.posterName, 'Aurora Labs');
      expect(detail.reviews.first.reviewer, 'Alex');
    });

    test('create, update, and delete opportunity invalidate caches', () async {
      await cache.write('test', 'value');
      expect(cache.read('test', (value) => value), isNotNull);

      final created = await repository.createOpportunity(
        OpportunityCategory.gig,
        const OpportunityDraft(title: 'New gig', description: 'Deliver value'),
      );
      expect(created.title, 'New gig');
      expect(cache.cleared, isTrue);

      cache.cleared = false;
      final updated = await repository.updateOpportunity(
        OpportunityCategory.gig,
        'gig-1',
        const OpportunityDraft(title: 'Revised gig', description: 'Updated scope'),
      );
      expect(updated.title, 'Updated title');
      expect(cache.cleared, isTrue);

      cache.cleared = false;
      await repository.deleteOpportunity(OpportunityCategory.gig, 'gig-1');
      expect(cache.cleared, isTrue);
    });

    test('fetchSnapshot caches results and falls back to cache on error', () async {
      final result = await repository.fetchSnapshot(limit: 4);
      expect(result.fromCache, isFalse);
      expect(result.data.itemsFor(OpportunityCategory.gig), isNotEmpty);

      throwListingsError = true;
      final cached = await repository.fetchSnapshot(limit: 4);
      expect(cached.fromCache, isTrue);
      expect(cached.data.itemsFor(OpportunityCategory.gig).first.id, equals('gig-1'));
    });

    test('searchGlobal caches non-empty queries and returns cached data when offline', () async {
      final first = await repository.searchGlobal('Growth lead');
      expect(first.fromCache, isFalse);
      expect(first.data.resultsFor(OpportunityCategory.gig), isNotEmpty);

      throwListingsError = true;
      final cached = await repository.searchGlobal('Growth lead');
      expect(cached.fromCache, isTrue);
      expect(cached.data.resultsFor(OpportunityCategory.gig).first.title, 'Growth experiments lead');
    });
  });
}
