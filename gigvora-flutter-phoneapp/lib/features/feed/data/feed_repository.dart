import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'models/feed_comment.dart';
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

  Future<FeedPost> createPost({
    required String content,
    required FeedPostType type,
    String? link,
  }) async {
    final payload = <String, dynamic>{
      'content': content.trim(),
      'type': type.name,
      if (link != null && link.trim().isNotEmpty) 'link': link.trim(),
    };
    final response = await _apiClient.post('/feed', body: payload);
    if (response is Map<String, dynamic>) {
      await _cache.remove(_cacheKey);
      return FeedPost.fromJson(response);
    }
    throw StateError('Invalid feed post response');
  }

  Future<FeedPost> updatePost(
    String id, {
    required String content,
    required FeedPostType type,
    String? link,
  }) async {
    final payload = <String, dynamic>{
      'content': content.trim(),
      'type': type.name,
      if (link != null && link.trim().isNotEmpty) 'link': link.trim(),
    };
    final response = await _apiClient.put('/feed/$id', body: payload);
    if (response is Map<String, dynamic>) {
      await _cache.remove(_cacheKey);
      return FeedPost.fromJson(response);
    }
    throw StateError('Invalid feed post response');
  }

  Future<void> deletePost(String id) async {
    await _apiClient.delete('/feed/$id');
    await _cache.remove(_cacheKey);
  }

  Future<FeedReactionResult> toggleReaction({
    required String postId,
    required String reaction,
    required bool active,
  }) async {
    final response = await _apiClient.post(
      '/feed/$postId/reactions',
      body: {
        'reaction': reaction,
        'active': active,
      },
    );

    if (response is Map<String, dynamic>) {
      return FeedReactionResult.fromJson(postId, response);
    }

    throw StateError('Invalid feed reaction response');
  }

  Future<FeedComment> createComment({
    required String postId,
    required String message,
  }) async {
    final response = await _apiClient.post(
      '/feed/$postId/comments',
      body: {
        'message': message,
      },
    );

    if (response is Map<String, dynamic>) {
      return FeedComment.fromJson(response);
    }

    throw StateError('Invalid feed comment response');
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
