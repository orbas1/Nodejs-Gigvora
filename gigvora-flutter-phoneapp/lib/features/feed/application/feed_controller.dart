import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/feed_repository.dart';
import '../data/models/feed_post.dart';

class FeedController extends StateNotifier<ResourceState<List<FeedPost>>> {
  FeedController(
    this._repository,
    this._analytics,
    this._realtimeGateway,
    this._featureFlags,
  ) : super(
          ResourceState<List<FeedPost>>.loading(
            null,
            const {
              'realtimeEnabled': false,
              'realtimeConnected': false,
              'localPostCount': 0,
            },
          ),
        ) {
    _initialise();
  }

  final FeedRepository _repository;
  final AnalyticsService _analytics;
  final RealtimeGateway _realtimeGateway;
  final FeatureFlagService _featureFlags;
  bool _viewRecorded = false;
  bool _realtimeEnabled = false;
  List<FeedPost> _remotePosts = const <FeedPost>[];
  final List<FeedPost> _localPosts = <FeedPost>[];
  StreamSubscription<RealtimeMessage>? _realtimeSubscription;
  StreamSubscription<RealtimeConnectionState>? _statusSubscription;
  StreamSubscription<Map<String, dynamic>>? _flagSubscription;

  Future<void> _initialise() async {
    await _featureFlags.bootstrap();
    _flagSubscription = _featureFlags.stream.listen((_) {
      final enabled = _featureFlags.isEnabled('mobile_feed_realtime', defaultValue: true);
      if (enabled != _realtimeEnabled) {
        _realtimeEnabled = enabled;
        _updateMetadata(realtimeEnabled: enabled);
        if (enabled) {
          unawaited(_setupRealtime());
        } else {
          unawaited(_teardownRealtime());
        }
      }
    });

    await load();
    await _setupRealtime();
  }

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchFeed(forceRefresh: forceRefresh);
      _remotePosts = List<FeedPost>.from(result.data ?? const <FeedPost>[]);
      final metadata = {
        ...state.metadata,
        'realtimeEnabled': _realtimeEnabled,
        'localPostCount': _localPosts.length,
      };
      _emitState(
        loading: false,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        metadata: metadata,
        error: result.error,
        updateError: true,
      );

      if (!_viewRecorded && _remotePosts.isNotEmpty) {
        await _analytics.track(
          'mobile_feed_viewed',
          context: {
            'postCount': _remotePosts.length,
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
      _emitState(loading: false, error: error, updateError: true);
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

  Future<void> createLocalPost({
    required String content,
    required FeedPostType type,
    String? link,
  }) async {
    final trimmedContent = content.trim();
    if (trimmedContent.isEmpty) {
      return;
    }

    final post = FeedPost(
      id: 'local-${DateTime.now().millisecondsSinceEpoch}',
      content: trimmedContent,
      createdAt: DateTime.now(),
      author: const FeedAuthor(
        name: 'You',
        headline: 'Shared via Gigvora',
      ),
      type: type,
      link: (link ?? '').trim().isEmpty ? null : link?.trim(),
      summary: trimmedContent,
      publishedAt: DateTime.now(),
      reactionCount: 0,
      commentCount: 0,
      viewerHasReacted: false,
      isLocal: true,
    );

    _localPosts.insert(0, post);
    if (_localPosts.length > 5) {
      _localPosts.removeRange(5, _localPosts.length);
    }

    _emitState(
      lastUpdated: DateTime.now(),
      metadata: {
        ...state.metadata,
        'localPostCount': _localPosts.length,
        'lastComposerType': type.analyticsValue,
      },
    );

    await _analytics.track(
      'mobile_feed_post_created',
      context: {
        'type': type.analyticsValue,
        'hasLink': post.link != null,
      },
      metadata: const {'source': 'mobile_app'},
    );
  }

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

  Future<void> recordExplorerShortcut() {
    return _analytics.track(
      'mobile_feed_explorer_opened',
      metadata: const {'source': 'mobile_app'},
    );
  }

  Future<void> _setupRealtime() async {
    await _teardownRealtime();
    final enabled = _featureFlags.isEnabled('mobile_feed_realtime', defaultValue: true);
    _realtimeEnabled = enabled;
    _updateMetadata(realtimeEnabled: enabled);

    if (!enabled) {
      return;
    }

    try {
      await _realtimeGateway.ensureConnected();
      await _analytics.track(
        'mobile_feed_realtime_enabled',
        context: const {
          'module': 'feed.posts',
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      await _analytics.track(
        'mobile_feed_realtime_failed',
        context: {
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
      _updateMetadata(realtimeConnected: false);
      return;
    }

    _statusSubscription = _realtimeGateway.statusStream.listen((status) {
      _updateMetadata(realtimeConnected: status == RealtimeConnectionState.connected);
    });

    _realtimeSubscription = _realtimeGateway
        .streamFor('feed.posts', parameters: const {'scope': 'mobile'})
        .listen(
      (message) async {
        final payload = message.payload;
        if (payload == null) {
          return;
        }

        final rawPost = payload['post'] ?? payload['data'] ?? payload;
        if (rawPost is! Map) {
          return;
        }
        final post = FeedPost.fromJson(Map<String, dynamic>.from(rawPost as Map));

        final current = List<FeedPost>.from(_remotePosts);
        final existingIndex = current.indexWhere((item) => item.id == post.id);
        if (existingIndex >= 0) {
          current[existingIndex] = post;
        } else {
          current.insert(0, post);
        }
        _remotePosts = current;

        _emitState(
          fromCache: false,
          lastUpdated: DateTime.now(),
          metadata: {
            ...state.metadata,
            'realtimeEnabled': true,
            'realtimeConnected': true,
            'realtimeEvent': message.event,
            'realtimeReceivedAt': message.receivedAt.toIso8601String(),
            'localPostCount': _localPosts.length,
          },
        );

        await _analytics.track(
          'mobile_feed_realtime_post',
          context: {
            'postId': post.id,
            'event': message.event,
            'receivedAt': message.receivedAt.toIso8601String(),
          },
          metadata: const {'source': 'mobile_app'},
        );
      },
      onError: (error, stackTrace) async {
        _updateMetadata(realtimeConnected: false);
        await _analytics.track(
          'mobile_feed_realtime_error',
          context: {
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        );
      },
    );
  }

  Future<void> _teardownRealtime() async {
    await _statusSubscription?.cancel();
    _statusSubscription = null;
    await _realtimeSubscription?.cancel();
    _realtimeSubscription = null;
    if (_realtimeEnabled) {
      unawaited(_realtimeGateway.unsubscribe('feed.posts'));
    }
    _updateMetadata(realtimeConnected: false);
  }

  void _updateMetadata({bool? realtimeEnabled, bool? realtimeConnected}) {
    final metadata = Map<String, dynamic>.from(state.metadata);
    if (realtimeEnabled != null) {
      metadata['realtimeEnabled'] = realtimeEnabled;
    }
    if (realtimeConnected != null) {
      metadata['realtimeConnected'] = realtimeConnected;
    }
    metadata['localPostCount'] = _localPosts.length;
    _emitState(metadata: metadata);
  }

  @override
  void dispose() {
    _flagSubscription?.cancel();
    unawaited(_teardownRealtime());
    super.dispose();
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
  final realtime = ref.watch(realtimeGatewayProvider);
  final featureFlags = ref.watch(featureFlagServiceProvider);
  return FeedController(repository, analytics, realtime, featureFlags);
});

extension on FeedController {
  List<FeedPost> get _combinedPosts => <FeedPost>[...this._localPosts, ...this._remotePosts];

  void _emitState({
    bool? loading,
    Object? error,
    bool updateError = false,
    bool? fromCache,
    DateTime? lastUpdated,
    Map<String, dynamic>? metadata,
  }) {
    final mergedMetadata = metadata ?? state.metadata;
    var next = state.copyWith(
      data: _combinedPosts,
      loading: loading,
      fromCache: fromCache,
      lastUpdated: lastUpdated,
      metadata: mergedMetadata,
    );
    if (updateError || error != null) {
      next = next.copyWith(error: error);
    }
    state = next;
  }
}
