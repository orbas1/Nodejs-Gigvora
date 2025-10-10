import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/analytics/analytics_service.dart';
import '../../../core/providers.dart';
import '../../../core/state/resource_state.dart';
import '../data/feed_repository.dart';
import '../data/models/feed_post.dart';

class FeedController extends StateNotifier<ResourceState<List<FeedPost>>> {
  FeedController(this._repository, this._analytics)
      : super(ResourceState<List<FeedPost>>.loading()) {
    load();
  }

  final FeedRepository _repository;
  final AnalyticsService _analytics;
  bool _viewRecorded = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchFeed(forceRefresh: forceRefresh);
      state = ResourceState<List<FeedPost>>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewRecorded && result.data.isNotEmpty) {
        await _analytics.track(
          'mobile_feed_viewed',
          context: {
            'postCount': result.data.length,
            'fromCache': result.fromCache,
            'lastUpdated': result.lastUpdated?.toIso8601String(),
          },
          metadata: const {'source': 'mobile_app'},
        );
        _viewRecorded = true;
      }

      if (result.error != null) {
        await _analytics.track(
          'mobile_feed_sync_partial',
          context: {
            'reason': '${result.error}',
            'fallbackFromCache': result.fromCache,
          },
          metadata: const {'source': 'mobile_app'},
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      await _analytics.track(
        'mobile_feed_sync_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> recordReaction(FeedPost post, String action) {
    return _analytics.track(
      'mobile_feed_reaction',
      context: {
        'postId': post.id,
        'action': action,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordCommentIntent(FeedPost post) {
    return _analytics.track(
      'mobile_feed_comment',
      context: {
        'postId': post.id,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> recordShareIntent(FeedPost post) {
    return _analytics.track(
      'mobile_feed_share',
      context: {
        'postId': post.id,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }
}

final feedRepositoryProvider = Provider<FeedRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return FeedRepository(apiClient, cache);
});

final feedControllerProvider =
    StateNotifierProvider<FeedController, ResourceState<List<FeedPost>>>((ref) {
  final repository = ref.watch(feedRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return FeedController(repository, analytics);
});
