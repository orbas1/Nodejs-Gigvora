import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:http/http.dart' as http;
import 'package:riverpod/riverpod.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/connections/application/connections_controller.dart';
import 'package:gigvora_mobile/features/connections/data/connections_repository.dart';
import 'package:gigvora_mobile/features/connections/domain/connection_network.dart';

import '../../../support/test_offline_cache.dart';

void main() {
  test('exposes authentication error when session is missing', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final state = container.read(connectionsControllerProvider);

    expect(state.error, isA<StateError>());
    expect(state.data, isNull);
  });

  test('loads network data when user is authenticated', () async {
    final container = ProviderContainer(
      overrides: [
        sessionControllerProvider.overrideWith((ref) {
          final controller = SessionController();
          controller.login(UserSession.demo());
          return controller;
        }),
        connectionsControllerProvider.overrideWith((ref) {
          final repository = _FakeConnectionsRepository();
          return ConnectionsController(repository, 2);
        }),
      ],
    );
    addTearDown(container.dispose);

    final controller = container.read(connectionsControllerProvider.notifier);
    await controller.refresh();

    final state = container.read(connectionsControllerProvider);
    expect(state.loading, isFalse);
    expect(state.data?.summary.total, equals(3));
    expect(state.error, isNull);
  });
}

class _FakeConnectionsRepository extends ConnectionsRepository {
  _FakeConnectionsRepository()
      : network = ConnectionNetwork(
          summary: const ConnectionSummary(firstDegree: 1, secondDegree: 1, thirdDegree: 1, total: 3),
          policies: const [ConnectionPolicy(actorRole: 'user', allowedRoles: ['talent'], matrix: <String, List<String>>{})],
          nodes: const <ConnectionNode>[],
        ),
        super(_NoopApiClient(), InMemoryOfflineCache());

  final ConnectionNetwork network;

  @override
  Future<RepositoryResult<ConnectionNetwork>> fetchNetwork({required int userId, bool forceRefresh = false}) async {
    return RepositoryResult<ConnectionNetwork>(
      data: network,
      fromCache: false,
      lastUpdated: DateTime(2024, 1, 1),
    );
  }
}

class _NoopApiClient extends ApiClient {
  _NoopApiClient()
      : super(
          httpClient: _DummyHttpClient(),
          config: AppConfig(
            environment: AppEnvironment.development,
            apiBaseUrl: Uri.parse('https://example.com/api'),
            graphQlEndpoint: Uri.parse('https://example.com/graphql'),
            realtimeEndpoint: Uri.parse('wss://example.com/realtime'),
            defaultCacheTtl: const Duration(minutes: 5),
            enableNetworkLogging: false,
            analyticsFlushThreshold: 1,
            offlineCacheNamespace: 'gigvora_test',
            featureFlags: const <String, dynamic>{},
            featureFlagRefreshInterval: const Duration(minutes: 5),
          ),
        );
}

class _DummyHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw UnimplementedError();
  }
}
