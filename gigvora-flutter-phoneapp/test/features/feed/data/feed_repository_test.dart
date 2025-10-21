import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;

import 'package:gigvora_mobile/features/feed/data/feed_repository.dart';
import 'package:gigvora_mobile/features/feed/data/models/feed_post.dart';

import '../../../support/test_app_config.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late _RecordingApiClient apiClient;
  late InMemoryOfflineCache cache;
  late FeedRepository repository;

  setUp(() {
    apiClient = _RecordingApiClient();
    cache = InMemoryOfflineCache();
    repository = FeedRepository(apiClient, cache);
  });

  test('fetches posts from API and caches payload', () async {
    apiClient.response = _postsResponse;

    final result = await repository.fetchFeed();
    expect(result.data, hasLength(2));
    expect(result.fromCache, isFalse);

    final cached = await repository.fetchFeed();
    expect(cached.fromCache, isTrue);
    expect(apiClient.requestCount, equals(1));
  });

  test('falls back to cached feed when API fails', () async {
    apiClient.response = _postsResponse;
    await repository.fetchFeed();

    apiClient.shouldThrow = true;
    final result = await repository.fetchFeed(forceRefresh: true);

    expect(result.fromCache, isTrue);
    expect(result.error, isNotNull);
    expect(result.data.first.author.name, 'Gigvora member');
  });

  test('createPost trims payload and invalidates cache', () async {
    apiClient.nextPostResponse = _singlePostResponse;
    await cache.write('feed:posts', _postsResponse);

    final created = await repository.createPost(content: '  Launch update  ', type: FeedPostType.update, link: '');

    expect(created.content, isNotEmpty);
    final cached = cache.read<List<FeedPost>>('feed:posts', (_) => throw StateError('should not be called'));
    expect(cached, isNull);
    final body = apiClient.lastPostBody as Map<String, dynamic>;
    expect(body['content'], 'Launch update');
  });
}

class _RecordingApiClient extends ApiClient {
  _RecordingApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: createTestConfig(),
        );

  dynamic response;
  dynamic nextPostResponse;
  bool shouldThrow = false;
  int requestCount = 0;
  Object? lastPostBody;

  @override
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    requestCount += 1;
    if (shouldThrow) {
      throw Exception('network unavailable');
    }
    return response;
  }

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    lastPostBody = body;
    return nextPostResponse ?? response;
  }
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('HTTP calls are not supported in tests');
  }
}

const _postsResponse = <Map<String, dynamic>>[
  {
    'id': '1',
    'content': 'Welcome to Gigvora',
    'createdAt': '2024-03-01T10:00:00Z',
    'author': {'name': 'Gigvora member'},
  },
  {
    'id': '2',
    'content': 'Product update',
    'createdAt': '2024-03-02T10:00:00Z',
    'author': {'firstName': 'Alex', 'lastName': 'Stone'},
  },
];

const _singlePostResponse = <String, dynamic>{
  'id': '3',
  'content': 'Launch update',
  'createdAt': '2024-03-03T10:00:00Z',
  'author': {'name': 'Gigvora member'},
};
