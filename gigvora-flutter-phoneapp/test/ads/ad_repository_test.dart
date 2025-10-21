import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/ads/data/ad_repository.dart';
import 'package:gigvora_mobile/features/ads/data/models/ad_placement.dart';

class _FakeApiClient implements ApiClient {
  _FakeApiClient({this.onGet});

  Future<dynamic> Function(String path, {Map<String, dynamic>? query, Map<String, String>? headers})? onGet;

  @override
  Future<dynamic> get(String path, {Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    if (onGet != null) {
      return Future<dynamic>.value(onGet!(path, query: query, headers: headers));
    }
    return Future<dynamic>.value(<String, dynamic>{});
  }

  @override
  Future<dynamic> delete(String path, {Object? body, Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    throw UnimplementedError();
  }

  @override
  Future<dynamic> patch(String path, {Object? body, Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    throw UnimplementedError();
  }

  @override
  Future<dynamic> post(String path, {Object? body, Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    throw UnimplementedError();
  }

  @override
  Future<dynamic> put(String path, {Object? body, Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    throw UnimplementedError();
  }
}

class _FakeOfflineCache implements OfflineCache {
  final Map<String, Map<String, dynamic>> _store = <String, Map<String, dynamic>>{};
  DateTime _now = DateTime.now();

  void advance(Duration delta) {
    _now = _now.add(delta);
  }

  @override
  Future<void> write(String key, dynamic value, {Duration? ttl}) async {
    final expiresAt = ttl == null
        ? _now.add(const Duration(minutes: 5))
        : ttl == Duration.zero
            ? null
            : _now.add(ttl);
    _store[key] = <String, dynamic>{
      'payload': value,
      'storedAt': _now.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }

  @override
  CacheEntry<T>? read<T>(String key, T Function(dynamic raw) parser) {
    final entry = _store[key];
    if (entry == null) {
      return null;
    }
    final expiresAt = entry['expiresAt'] as String?;
    if (expiresAt != null && DateTime.parse(expiresAt).isBefore(_now)) {
      _store.remove(key);
      return null;
    }
    final storedAt = DateTime.parse(entry['storedAt'] as String);
    return CacheEntry<T>(value: parser(entry['payload']), storedAt: storedAt, expiresAt: expiresAt != null ? DateTime.parse(expiresAt) : null);
  }

  @override
  Future<void> remove(String key) async {
    _store.remove(key);
  }

  @override
  Future<void> clear() async {
    _store.clear();
  }

  @override
  Future<void> dispose() async {}

  @override
  Future<void> init() async {}
}

void main() {
  group('AdRepository', () {
    late _FakeApiClient apiClient;
    late _FakeOfflineCache cache;
    late AdRepository repository;

    setUp(() {
      apiClient = _FakeApiClient();
      cache = _FakeOfflineCache();
      repository = AdRepository(apiClient, cache);
    });

    test('caches responses and serves cached placements', () async {
      apiClient.onGet = (String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
        return <String, dynamic>{
          'placements': <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 1,
              'surface': 'home',
              'position': 'hero',
              'status': 'active',
              'isActive': true,
              'isUpcoming': false,
              'coupons': const <Map<String, dynamic>>[],
              'creative': <String, dynamic>{
                'id': 10,
                'name': 'Hero',
                'headline': 'Scale faster',
                'subheadline': 'Automation ready',
                'callToAction': 'View brief',
                'ctaUrl': 'https://gigvora.com',
              },
            },
          ],
        };
      };

      final result = await repository.fetchPlacements(surface: 'home');
      expect(result.data, hasLength(1));
      expect(result.fromCache, isFalse);

      final cached = await repository.fetchPlacements(surface: 'home');
      expect(cached.fromCache, isTrue);
      expect(cached.data.first.surface, 'home');
    });

    test('returns cached placements when network fails', () async {
      int callCount = 0;
      apiClient.onGet = (String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
        callCount++;
        if (callCount == 1) {
          return <String, dynamic>{
            'placements': <Map<String, dynamic>>[
              <String, dynamic>{
                'id': 2,
                'surface': 'home',
                'position': 'inline',
                'status': 'active',
                'isActive': true,
                'isUpcoming': false,
                'coupons': const <Map<String, dynamic>>[],
                'creative': const <String, dynamic>{'id': 1, 'name': 'Inline'},
              },
            ],
          };
        }
        throw ApiException(500, 'Server error');
      };

      final first = await repository.fetchPlacements(surface: 'home');
      expect(first.data, isNotEmpty);
      expect(first.fromCache, isFalse);

      final second = await repository.fetchPlacements(surface: 'home');
      expect(second.fromCache, isTrue);
      expect(second.error, isA<ApiException>());
      expect(second.data, isNotEmpty);
    });

    test('normalises surface queries before requesting placements', () async {
      Map<String, dynamic>? lastQuery;
      apiClient.onGet = (String path, {Map<String, dynamic>? query, Map<String, String>? headers}) async {
        lastQuery = query;
        return <String, dynamic>{'placements': const <Map<String, dynamic>>[]};
      };

      await repository.fetchPlacements(surface: '  home  ');
      expect(lastQuery?['surface'], equals('home'));

      await repository.fetchPlacements(surface: '');
      expect(lastQuery?['surface'], equals('global_dashboard'));

      final placements = await repository.fetchPlacements(surface: '  stage  ', forceRefresh: true);
      expect(placements.data, isEmpty);
      expect(lastQuery?['surface'], equals('stage'));
    });
  });
}
