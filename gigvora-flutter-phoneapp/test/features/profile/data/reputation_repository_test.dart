import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/profile/data/models/reputation.dart';
import 'package:gigvora_mobile/features/profile/data/reputation_repository.dart';

import '../../../support/test_api_client.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late InMemoryOfflineCache cache;
  late TestApiClient apiClient;
  late ReputationRepository repository;

  setUp(() {
    cache = InMemoryOfflineCache();
    apiClient = TestApiClient();
    repository = ReputationRepository(apiClient: apiClient, cache: cache);
  });

  test('fetchOverview caches responses and returns parsed metrics', () async {
    var callCount = 0;
    apiClient = TestApiClient(onGet: (path) async {
      callCount += 1;
      expect(path, '/reputation/freelancers/101');
      return createReputationPayload();
    });
    repository = ReputationRepository(apiClient: apiClient, cache: cache);

    final result = await repository.fetchOverview('101');

    expect(result.data, isA<ReputationOverview>());
    expect(result.data!.summary.totalReviews, 36);
    expect(result.fromCache, isFalse);
    expect(result.data!.promotedBadges, isNotEmpty);

    // second call served from cache
    final cached = await repository.fetchOverview('101');
    expect(cached.fromCache, isTrue);
    expect(callCount, 1);
  });

  test('returns cached snapshot with error context when API throws', () async {
    await cache.write('profile:reputation:303', createReputationPayload());
    apiClient = TestApiClient(onGet: (path) async {
      throw ApiException(503, 'Unavailable');
    });
    repository = ReputationRepository(apiClient: apiClient, cache: cache);

    final result = await repository.fetchOverview('303', forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.data!.summary.trustScore, 4.6);
    expect(result.error, isA<ApiException>());
  });

  test('throws when no cache exists and API fails', () async {
    apiClient = TestApiClient(onGet: (path) async {
      throw ApiException(500, 'Server error');
    });
    repository = ReputationRepository(apiClient: apiClient, cache: cache);

    expect(
      repository.fetchOverview('404'),
      throwsA(isA<ApiException>()),
    );
  });
}

Map<String, dynamic> createReputationPayload() {
  return {
    'summary': {
      'totalReviews': 36,
      'publishedReviews': 34,
      'trustScore': 4.6,
      'nps': 74,
    },
    'metrics': [
      {'key': 'response_rate', 'value': 0.98, 'label': 'Response rate'},
    ],
    'testimonials': {
      'featured': {
        'id': 'ref-10',
        'client': 'Ines',
        'comment': 'Incredible collaborator',
        'rating': 5,
        'publishedAt': '2024-03-12T12:00:00.000Z',
      },
      'recent': [
        {
          'id': 'ref-9',
          'client': 'Theo',
          'comment': 'Proactive and thorough',
          'rating': 4.5,
          'publishedAt': '2024-02-01T09:00:00.000Z',
        },
      ],
    },
    'successStories': {
      'featured': {
        'title': 'Scaling launchpad',
        'summary': 'Delivered within three weeks',
        'link': 'https://gigvora.com/story/launchpad',
      },
      'collection': const <Map<String, dynamic>>[],
    },
    'badges': {
      'promoted': [
        {'id': 'badge-1', 'name': 'Top Partner', 'description': 'Recognised across the network'},
      ],
      'collection': const <Map<String, dynamic>>[],
    },
    'reviewWidgets': const <Map<String, dynamic>>[],
    'automationPlaybooks': ['auto-chase'],
    'integrationTouchpoints': ['slack', 'hubspot'],
    'shareableLinks': [
      {'label': 'Public page', 'url': 'https://gigvora.com/freelancers/alex'},
    ],
  };
}
