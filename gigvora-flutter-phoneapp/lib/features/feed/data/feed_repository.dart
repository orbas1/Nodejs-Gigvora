import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'models/feed_post.dart';

class FeedRepository {
  FeedRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _cacheKey = 'feed:posts';
  static const _cacheTtl = Duration(minutes: 2);

  Future<RepositoryResult<List<FeedPost>>> fetchFeed({bool forceRefresh = false}) async {
    final cached = _readCache();
    if (!forceRefresh && cached != null) {
      return RepositoryResult<List<FeedPost>>(
        data: cached.value,
        fromCache: true,
        lastUpdated: cached.storedAt,
      );
    }

    try {
      final response = await _apiClient.get('/feed') as List<dynamic>;
      final posts = response
          .whereType<Map<String, dynamic>>()
          .map((item) => FeedPost.fromJson(item))
          .toList(growable: false);
      await _cache.write(_cacheKey, response, ttl: _cacheTtl);
      return RepositoryResult<List<FeedPost>>(
        data: posts,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult<List<FeedPost>>(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }
      rethrow;
    }
  }

  CacheEntry<List<FeedPost>>? _readCache() {
    try {
      final entry = _cache.read<List<FeedPost>>(_cacheKey, (raw) {
        if (raw is List) {
          return raw
              .whereType<Map>()
              .map((item) => FeedPost.fromJson(Map<String, dynamic>.from(item)))
              .toList(growable: false);
        }
        return <FeedPost>[];
      });
      return entry;
    } catch (error) {
      debugPrint('Failed to parse cached feed: $error');
      return null;
    }
  }
}
