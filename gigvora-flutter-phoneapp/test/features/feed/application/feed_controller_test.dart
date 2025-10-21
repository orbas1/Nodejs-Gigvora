import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/feed/application/feed_controller.dart';
import 'package:gigvora_mobile/features/feed/data/feed_repository.dart';
import 'package:gigvora_mobile/features/feed/data/models/feed_post.dart';

import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';
import '../../../support/test_app_config.dart';
import '../../../support/test_offline_cache.dart';

void main() {
  late FakeFeedRepository repository;
  late TestAnalyticsService analytics;
  late TestRealtimeGateway realtime;
  late TestFeatureFlagService featureFlags;
  late ProviderContainer container;

  setUp(() {
    repository = FakeFeedRepository();
    analytics = TestAnalyticsService();
    realtime = TestRealtimeGateway();
    featureFlags = TestFeatureFlagService(initialFlags: const {'mobile_feed_realtime': true});

    container = ProviderContainer(
      overrides: [
        feedRepositoryProvider.overrideWithValue(repository),
        analyticsServiceProvider.overrideWithValue(analytics),
        realtimeGatewayProvider.overrideWithValue(realtime),
        featureFlagServiceProvider.overrideWithValue(featureFlags),
      ],
    );
    addTearDown(container.dispose);
  });

  test('initialises feed, records analytics, and enables realtime', () async {
    await Future<void>.delayed(const Duration(milliseconds: 20));

    final state = container.read(feedControllerProvider);
    expect(state.data, isNotEmpty);
    expect(state.metadata['realtimeEnabled'], isTrue);
    expect(state.metadata['realtimeConnected'], isTrue);
    expect(
      analytics.events.map((event) => event.name),
      containsAll(<String>['mobile_feed_viewed', 'mobile_feed_realtime_enabled']),
    );
  });

  test('createLocalPost prepends local post and tracks analytics', () async {
    final controller = container.read(feedControllerProvider.notifier);
    await Future<void>.delayed(const Duration(milliseconds: 20));

    await controller.createLocalPost(content: 'Launching studio', type: FeedPostType.update);

    final state = container.read(feedControllerProvider);
    expect(state.data.first.isLocal, isTrue);
    expect(state.metadata['localPostCount'], greaterThan(0));
    expect(
      analytics.events.map((event) => event.name),
      contains('mobile_feed_post_created'),
    );
  });

  test('processes realtime post events and updates metadata', () async {
    await Future<void>.delayed(const Duration(milliseconds: 20));

    realtime.emit(
      RealtimeMessage(
        topic: 'feed.posts',
        event: 'post.created',
        receivedAt: DateTime.now(),
        payload: {
          'post': {
            'id': 'remote-99',
            'content': 'Realtime announcement',
            'createdAt': DateTime.now().toIso8601String(),
            'author': {'name': 'Ops Team'},
          },
        },
      ),
    );

    await Future<void>.delayed(const Duration(milliseconds: 20));

    final state = container.read(feedControllerProvider);
    expect(state.data.first.id, 'remote-99');
    expect(state.metadata['realtimeEvent'], 'post.created');
  });
}

class FakeFeedRepository extends FeedRepository {
  FakeFeedRepository()
      : posts = [
          FeedPost(
            id: 'remote-1',
            content: 'Welcome to the new feed experience',
            createdAt: DateTime(2024, 3, 1, 10),
            author: const FeedAuthor(name: 'Platform Team'),
            type: FeedPostType.update,
          ),
        ],
        super(_NoopApiClient(), InMemoryOfflineCache());

  final List<FeedPost> posts;

  @override
  Future<RepositoryResult<List<FeedPost>>> fetchFeed({bool forceRefresh = false}) async {
    return RepositoryResult<List<FeedPost>>(
      data: List<FeedPost>.from(posts),
      fromCache: false,
      lastUpdated: DateTime(2024, 3, 1, 10),
    );
  }
}

class TestRealtimeGateway extends RealtimeGateway {
  TestRealtimeGateway()
      : _messages = StreamController<RealtimeMessage>.broadcast(),
        _status = StreamController<RealtimeConnectionState>.broadcast(),
        _currentStatus = RealtimeConnectionState.disconnected,
        super(config: createTestConfig());

  final StreamController<RealtimeMessage> _messages;
  final StreamController<RealtimeConnectionState> _status;
  RealtimeConnectionState _currentStatus;

  @override
  Stream<RealtimeMessage> streamFor(String topic, {Map<String, dynamic>? parameters}) {
    return _messages.stream;
  }

  @override
  Stream<RealtimeConnectionState> get statusStream => _status.stream;

  @override
  RealtimeConnectionState get status => _currentStatus;

  @override
  Future<void> ensureConnected() async {
    emitStatus(RealtimeConnectionState.connected);
  }

  void emit(RealtimeMessage message) {
    _messages.add(message);
  }

  void emitStatus(RealtimeConnectionState state) {
    _currentStatus = state;
    _status.add(state);
  }

  @override
  Future<void> unsubscribe(String topic) async {}

  @override
  Future<void> dispose() async {
    await _messages.close();
    await _status.close();
  }
}

class TestFeatureFlagService extends FeatureFlagService {
  TestFeatureFlagService({Map<String, dynamic>? initialFlags})
      : _flags = Map<String, dynamic>.from(initialFlags ?? const <String, dynamic>{}),
        _controller = StreamController<Map<String, dynamic>>.broadcast(),
        super(apiClient: TestApiClient(), cache: InMemoryOfflineCache(), config: createTestConfig());

  Map<String, dynamic> _flags;
  final StreamController<Map<String, dynamic>> _controller;

  @override
  Stream<Map<String, dynamic>> get stream => _controller.stream;

  @override
  Future<Map<String, dynamic>> bootstrap({bool forceRefresh = false}) async {
    _controller.add(Map<String, dynamic>.from(_flags));
    return Map<String, dynamic>.from(_flags);
  }

  @override
  bool isEnabled(String flag, {bool defaultValue = false}) {
    final value = _flags[flag];
    if (value is bool) {
      return value;
    }
    if (value is String) {
      return value.toLowerCase() == 'true';
    }
    return defaultValue;
  }

  void emit(Map<String, dynamic> flags) {
    _flags = Map<String, dynamic>.from(flags);
    _controller.add(_flags);
  }

  @override
  Future<void> dispose() async {
    await _controller.close();
  }
}

class _NoopApiClient extends ApiClient {
  _NoopApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: createTestConfig(),
        );
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError();
  }
}
