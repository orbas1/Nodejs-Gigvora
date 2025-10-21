import 'dart:collection';

import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:gigvora_mobile/features/groups/data/group_repository.dart';
import 'package:gigvora_mobile/features/groups/data/models/group_models.dart';
import 'package:http/http.dart' as http;

import '../../../helpers/in_memory_offline_cache.dart';

typedef _RequestHandler = Future<dynamic> Function(Map<String, dynamic>? query, Object? body);

class FakeGroupApiClient extends ApiClient {
  FakeGroupApiClient()
      : _handlers = <_RequestKey, Queue<_RequestHandler>>{},
        super(
          httpClient: _StubHttpClient(),
          config: const AppConfig(
            environment: AppEnvironment.development,
            apiBaseUrl: Uri.parse('https://example.com/api'),
            graphQlEndpoint: Uri.parse('https://example.com/graphql'),
            graphQlSubscriptionEndpoint: Uri.parse('wss://example.com/graphql'),
            realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
            defaultCacheTtl: Duration(minutes: 5),
            enableNetworkLogging: false,
            analyticsFlushThreshold: 10,
            offlineCacheNamespace: 'gigvora_test_cache',
            featureFlags: <String, dynamic>{},
            featureFlagRefreshInterval: Duration(minutes: 5),
          ),
        );

  final Map<_RequestKey, Queue<_RequestHandler>> _handlers;

  void queueValue(String method, String path, dynamic value) {
    queueHandler(method, path, (_, __) async => value);
  }

  void queueError(String method, String path, Object error) {
    queueHandler(method, path, (_, __) async {
      throw error;
    });
  }

  void queueHandler(
    String method,
    String path,
    Future<dynamic> Function(Map<String, dynamic>? query, Object? body) handler,
  ) {
    final key = _RequestKey(method.toUpperCase(), path);
    final queue = _handlers.putIfAbsent(key, () => Queue<_RequestHandler>());
    queue.add(handler);
  }

  @override
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _dispatch('GET', path, query, null);
  }

  @override
  Future<dynamic> post(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _dispatch('POST', path, query, body);
  }

  @override
  Future<dynamic> put(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _dispatch('PUT', path, query, body);
  }

  @override
  Future<dynamic> patch(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _dispatch('PATCH', path, query, body);
  }

  @override
  Future<dynamic> delete(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Map<String, String>? headers,
    Duration timeout = const Duration(seconds: 12),
  }) {
    return _dispatch('DELETE', path, query, body);
  }

  Future<dynamic> _dispatch(
    String method,
    String path,
    Map<String, dynamic>? query,
    Object? body,
  ) {
    final key = _RequestKey(method.toUpperCase(), path);
    final queue = _handlers[key];
    if (queue == null || queue.isEmpty) {
      throw StateError('No handler registered for $method $path');
    }
    final handler = queue.removeFirst();
    return Future.sync(() => handler(query, body));
  }
}

class _StubHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError('Network requests are not supported in FakeGroupApiClient');
  }
}

class _RequestKey {
  const _RequestKey(this.method, this.path);

  final String method;
  final String path;

  @override
  bool operator ==(Object other) {
    return other is _RequestKey && other.method == method && other.path == path;
  }

  @override
  int get hashCode => Object.hash(method, path);
}

void main() {
  late FakeGroupApiClient apiClient;
  late InMemoryOfflineCache cache;
  late GroupRepository repository;

  setUp(() {
    apiClient = FakeGroupApiClient();
    cache = InMemoryOfflineCache();
    repository = GroupRepository(apiClient, cache);
  });

  test('fetchDirectory returns data and caches the response', () async {
    apiClient.queueValue('GET', '/groups/directory', _directoryResponse());

    final result = await repository.fetchDirectory(actorId: 42);

    expect(result.data.items, hasLength(1));
    expect(result.fromCache, isFalse);

    final cacheEntry = cache.read<GroupDirectory>(
      'groups:directory:42:all::false',
      (raw) => GroupDirectory.fromJson(Map<String, dynamic>.from(raw as Map)),
    );
    expect(cacheEntry, isNotNull);
    expect(cacheEntry!.value.items.first.slug, 'design-guild');
  });

  test('fetchDirectory falls back to cache when the API errors', () async {
    apiClient.queueValue('GET', '/groups/directory', _directoryResponse());
    await repository.fetchDirectory(actorId: 7);

    apiClient.queueError('GET', '/groups/directory', const ApiException(message: 'offline', statusCode: 503));
    final result = await repository.fetchDirectory(actorId: 7);

    expect(result.fromCache, isTrue);
    expect(result.data.items, hasLength(1));
    expect(result.error, isA<ApiException>());
  });

  test('joinGroup updates membership cache and invalidates directory cache', () async {
    apiClient.queueValue('GET', '/groups/directory', _directoryResponse());
    await repository.fetchDirectory(actorId: 1);

    final directoryCacheBefore = cache.read<GroupDirectory>(
      'groups:directory:1:all::false',
      (raw) => GroupDirectory.fromJson(Map<String, dynamic>.from(raw as Map)),
    );
    expect(directoryCacheBefore, isNotNull);

    apiClient.queueValue('POST', '/groups/design-guild/join', _profileResponse());
    final profile = await repository.joinGroup('design-guild', actorId: 1);

    expect(profile.slug, 'design-guild');

    final directoryCacheAfter = cache.read<GroupDirectory>(
      'groups:directory:1:all::false',
      (raw) => GroupDirectory.fromJson(Map<String, dynamic>.from(raw as Map)),
    );
    expect(directoryCacheAfter, isNull);

    final profileCache = cache.read<GroupProfile>(
      'groups:profile:1:design-guild',
      (raw) => GroupProfile.fromJson(Map<String, dynamic>.from(raw as Map)),
    );
    expect(profileCache, isNotNull);
    expect(profileCache!.value.membership.status, 'member');
  });

  test('fetchManagedGroups caches the response and can recover from API errors', () async {
    apiClient.queueValue('GET', '/groups/managed', _managedGroupsResponse());
    final initial = await repository.fetchManagedGroups();

    expect(initial.data, hasLength(1));
    expect(initial.fromCache, isFalse);

    final cached = await repository.fetchManagedGroups();
    expect(cached.fromCache, isTrue);
    expect(cached.data, hasLength(1));

    apiClient.queueError('GET', '/groups/managed', const ApiException(message: 'timeout', statusCode: 504));
    final fallback = await repository.fetchManagedGroups(forceRefresh: true);

    expect(fallback.data, hasLength(1));
    expect(fallback.fromCache, isTrue);
    expect(fallback.error, isA<ApiException>());
  });
}

Map<String, dynamic> _directoryResponse() {
  return {
    'items': [_communityGroupJson()],
    'pagination': {'total': 1, 'limit': 12, 'offset': 0},
    'metadata': {
      'featured': ['design-guild'],
      'generatedAt': '2024-01-01T00:00:00Z',
    },
  };
}

Map<String, dynamic> _profileResponse() {
  final json = _communityGroupJson();
  return {
    ...json,
    'membershipBreakdown': [
      {'role': 'member', 'count': 12},
      {'role': 'moderator', 'count': 2},
    ],
    'access': {
      'joinPolicy': 'moderated',
      'allowedUserTypes': ['freelancer', 'agency'],
      'invitationRequired': false,
    },
  };
}

Map<String, dynamic> _communityGroupJson() {
  return {
    'id': 100,
    'slug': 'design-guild',
    'name': 'Design Guild',
    'summary': 'Where creatives collaborate',
    'description': 'A curated community for design leaders.',
    'accentColor': '#2563EB',
    'focusAreas': ['design', 'ux'],
    'joinPolicy': 'moderated',
    'allowedUserTypes': ['freelancer', 'agency'],
    'membership': {
      'status': 'member',
      'role': 'member',
      'joinedAt': '2024-01-01T12:00:00Z',
      'preferences': {
        'notifications': {
          'digest': true,
          'newThread': true,
          'upcomingEvent': true,
        },
      },
    },
    'stats': {
      'memberCount': 42,
      'weeklyActiveMembers': 28,
      'opportunitiesSharedThisWeek': 5,
      'retentionRate': 0.92,
      'engagementScore': 0.88,
    },
    'insights': {
      'signalStrength': 'growing',
      'trendingTopics': ['AI design', 'UX research'],
    },
    'upcomingEvents': [
      {
        'id': 'event-1',
        'title': 'Weekly design critique',
        'startAt': '2024-01-05T16:00:00Z',
        'timezone': 'UTC',
        'format': 'virtual',
        'host': {'name': 'Alex Design'},
        'registrationRequired': true,
      }
    ],
    'leadership': [
      {'name': 'Alex Design', 'title': 'Head of Design', 'role': 'moderator', 'avatarSeed': 'alex'},
    ],
    'resources': [
      {'id': 'res-1', 'title': 'Design Playbook', 'type': 'document', 'url': 'https://example.com/playbook.pdf'},
    ],
    'guidelines': ['Respect each other', 'Share actionable feedback'],
    'timeline': [
      {
        'label': 'Launched',
        'occursAt': '2023-06-01T09:00:00Z',
        'description': 'Community launched with founding members.',
      }
    ],
    'metadata': {
      'region': 'global',
    },
  };
}

Map<String, dynamic> _managedGroupsResponse() {
  return {
    'data': [
      {
        'id': 55,
        'name': 'Design Guild',
        'slug': 'design-guild',
        'visibility': 'private',
        'memberPolicy': 'request',
        'avatarColor': '#2563EB',
        'description': 'Community for verified design leads.',
        'bannerImageUrl': 'https://example.com/banner.png',
        'metrics': {
          'totalMembers': 50,
          'activeMembers': 45,
          'pendingMembers': 3,
          'suspendedMembers': 2,
          'acceptanceRate': 86,
          'lastMemberJoinedAt': '2024-01-03T10:00:00Z',
        },
        'members': [
          {
            'id': 1,
            'userId': 501,
            'role': 'owner',
            'status': 'active',
            'joinedAt': '2023-12-11T11:00:00Z',
            'notes': 'Founder',
            'member': {
              'id': 501,
              'name': 'Jamie Founder',
              'email': 'jamie@example.com',
              'userType': 'admin',
            },
          },
        ],
      },
    ],
  };
}
