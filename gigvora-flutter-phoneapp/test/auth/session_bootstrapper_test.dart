import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/auth/application/session_bootstrapper.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/data/auth_repository.dart';
import 'package:gigvora_mobile/features/auth/domain/auth_token_store.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/runtime_health/data/runtime_health_repository.dart';
import 'package:gigvora_mobile/features/runtime_health/domain/runtime_health_snapshot.dart';

class _MemoryTokenDriver extends AuthTokenStoreDriver {
  String? accessToken;
  String? refreshToken;

  @override
  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
  }

  @override
  Future<void> persist({required String accessToken, required String refreshToken}) async {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  @override
  Future<String?> readAccessToken() async => accessToken;

  @override
  Future<String?> readRefreshToken() async => refreshToken;
}

class _FakeRuntimeHealthRepository implements RuntimeHealthRepository {
  _FakeRuntimeHealthRepository(this.snapshot, {this.throwOnFetch = false});

  final RuntimeHealthSnapshot snapshot;
  final bool throwOnFetch;
  int calls = 0;

  @override
  Future<RuntimeHealthSnapshot> fetch({bool authenticated = true}) async {
    calls++;
    if (throwOnFetch) {
      throw Exception('unavailable');
    }
    return snapshot;
  }
}

class _NullApiClient implements ApiClient {
  @override
  Future<dynamic> delete(String path, {Object? body, Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
    throw UnimplementedError();
  }

  @override
  Future<dynamic> get(String path, {Map<String, dynamic>? query, Map<String, String>? headers, Duration timeout = const Duration(seconds: 12)}) {
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

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository() : super(_NullApiClient());

  AuthenticatedSession? session;
  bool throwOnRefresh = false;
  int refreshCalls = 0;

  @override
  Future<AuthenticatedSession> refreshSession(String refreshToken) async {
    refreshCalls++;
    if (throwOnRefresh || session == null) {
      throw Exception('session expired');
    }
    return session!;
  }
}

void main() {
  group('sessionBootstrapProvider', () {
    late _MemoryTokenDriver driver;
    late RuntimeHealthSnapshot healthySnapshot;

    setUp(() {
      driver = _MemoryTokenDriver();
      AuthTokenStore.useDriver(driver);
      healthySnapshot = RuntimeHealthSnapshot(
        status: 'ok',
        httpStatus: 200,
        timestamp: DateTime.now(),
        dependencies: const <String, dynamic>{},
        supportContact: 'ops@gigvora.com',
      );
    });

    tearDown(() {
      AuthTokenStore.resetDriver();
    });

    test('returns unauthenticated when no refresh token is available', () async {
      final container = ProviderContainer(
        overrides: [
          runtimeHealthRepositoryProvider.overrideWithValue(_FakeRuntimeHealthRepository(healthySnapshot)),
          authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
        ],
      );
      addTearDown(container.dispose);

      final result = await container.read(sessionBootstrapProvider.future);

      expect(result.authenticated, isFalse);
      expect(result.backendHealthy, isTrue);
      expect(result.session, isNull);
      expect(driver.accessToken, isNull);
      expect(container.read(sessionControllerProvider).isAuthenticated, isFalse);
    });

    test('refreshes session and persists tokens when refresh token is stored', () async {
      driver.refreshToken = 'refresh-token';
      final fakeAuthRepository = _FakeAuthRepository();
      final session = UserSession(
        id: 1,
        name: 'Lena Fields',
        title: 'Product Designer',
        email: 'lena@gigvora.com',
        location: 'Berlin',
        memberships: const <String>['agency', 'user'],
        activeMembership: 'agency',
        dashboards: const <String, RoleDashboard>{},
      );
      fakeAuthRepository.session = AuthenticatedSession(
        userSession: session,
        accessToken: 'access-token',
        refreshToken: 'refresh-token-updated',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
      );

      final container = ProviderContainer(
        overrides: [
          runtimeHealthRepositoryProvider.overrideWithValue(_FakeRuntimeHealthRepository(healthySnapshot)),
          authRepositoryProvider.overrideWithValue(fakeAuthRepository),
        ],
      );
      addTearDown(container.dispose);

      final result = await container.read(sessionBootstrapProvider.future);

      expect(result.authenticated, isTrue);
      expect(result.session?.activeMembership, 'agency');
      expect(driver.accessToken, 'access-token');
      expect(driver.refreshToken, 'refresh-token-updated');
      expect(container.read(sessionControllerProvider).session?.name, 'Lena Fields');
      expect(fakeAuthRepository.refreshCalls, 1);
    });

    test('clears tokens when refresh fails', () async {
      driver.refreshToken = 'expired-token';
      final fakeAuthRepository = _FakeAuthRepository()..throwOnRefresh = true;

      final container = ProviderContainer(
        overrides: [
          runtimeHealthRepositoryProvider.overrideWithValue(_FakeRuntimeHealthRepository(healthySnapshot)),
          authRepositoryProvider.overrideWithValue(fakeAuthRepository),
        ],
      );
      addTearDown(container.dispose);

      final result = await container.read(sessionBootstrapProvider.future);

      expect(result.authenticated, isFalse);
      expect(driver.accessToken, isNull);
      expect(driver.refreshToken, isNull);
      expect(container.read(sessionControllerProvider).session, isNull);
    });
  });
}
