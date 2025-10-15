import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/auth/application/session_bootstrapper.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/data/auth_repository.dart';
import 'package:gigvora_mobile/features/auth/domain/auth_token_store.dart';
import 'package:gigvora_mobile/features/runtime_health/data/runtime_health_repository.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';

import '../../../support/test_api_client.dart';

class InMemoryAuthTokenStoreDriver extends AuthTokenStoreDriver {
  String? accessToken;
  String? refreshToken;

  @override
  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
  }

  @override
  Future<void> persist({
    required String accessToken,
    required String refreshToken,
  }) async {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  @override
  Future<String?> readAccessToken() async => accessToken;

  @override
  Future<String?> readRefreshToken() async => refreshToken;
}

class TestSessionController extends SessionController {
  TestSessionController();

  @override
  void login(UserSession session) {
    lastSession = session;
    super.login(session);
  }

  UserSession? lastSession;
}

void main() {
  late InMemoryAuthTokenStoreDriver tokenDriver;

  setUp(() {
    tokenDriver = InMemoryAuthTokenStoreDriver();
    AuthTokenStore.useDriver(tokenDriver);
  });

  tearDown(() {
    AuthTokenStore.resetDriver();
  });

  RuntimeHealthRepository buildRuntimeRepository({required Future<dynamic> Function(String path) onGet}) {
    return RuntimeHealthRepository(TestApiClient(onGet: onGet));
  }

  AuthRepository buildAuthRepository({required Future<dynamic> Function(String path, Object? body) onPost}) {
    return AuthRepository(TestApiClient(onPost: onPost));
  }

  ProviderContainer buildContainer({
    required RuntimeHealthRepository runtimeRepository,
    required AuthRepository authRepository,
    required TestSessionController controller,
  }) {
    final container = ProviderContainer(
      overrides: [
        runtimeHealthRepositoryProvider.overrideWithValue(runtimeRepository),
        authRepositoryProvider.overrideWithValue(authRepository),
        sessionControllerProvider.overrideWith((ref) => controller),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  test('returns unauthenticated when no refresh token is stored and backend is healthy', () async {
    final runtimeRepository = buildRuntimeRepository(
      onGet: (path) async {
        expect(path, '/health/ready');
        return {
          'status': 'ok',
          'httpStatus': 200,
          'timestamp': DateTime.now().toIso8601String(),
          'dependencies': {
            'database': {'status': 'ok'},
          },
        };
      },
    );

    final authRepository = buildAuthRepository(
      onPost: (path, body) async {
        fail('Refresh token flow should not be invoked when there is no stored token');
      },
    );

    final controller = TestSessionController();
    final container = buildContainer(
      runtimeRepository: runtimeRepository,
      authRepository: authRepository,
      controller: controller,
    );

    final result = await container.read(sessionBootstrapProvider.future);

    expect(result.backendHealthy, isTrue);
    expect(result.authenticated, isFalse);
    expect(result.message, isNull);
    expect(controller.lastSession, isNull);
  });

  test('surfaces maintenance messaging when health polling fails', () async {
    final runtimeRepository = buildRuntimeRepository(
      onGet: (path) async {
        throw Exception('runtime endpoint offline');
      },
    );

    final authRepository = buildAuthRepository(
      onPost: (path, body) async {
        fail('Refresh token flow should not run without a stored token');
      },
    );

    final controller = TestSessionController();
    final container = buildContainer(
      runtimeRepository: runtimeRepository,
      authRepository: authRepository,
      controller: controller,
    );

    final result = await container.read(sessionBootstrapProvider.future);

    expect(result.backendHealthy, isFalse);
    expect(result.authenticated, isFalse);
    expect(result.message, 'Platform maintenance detected. Live data will resume once systems recover.');
  });

  test('refreshes the session when a valid refresh token is present', () async {
    tokenDriver.refreshToken = 'refresh-token';
    final runtimeRepository = buildRuntimeRepository(
      onGet: (path) async {
        return {
          'status': 'ready',
          'httpStatus': 200,
          'timestamp': DateTime.now().toIso8601String(),
          'dependencies': {
            'database': {'status': 'ok'},
          },
        };
      },
    );

    final expiry = DateTime.now().add(const Duration(minutes: 45));
    final authRepository = buildAuthRepository(
      onPost: (path, body) async {
        expect(path, '/auth/refresh');
        expect(body, {'refreshToken': 'refresh-token'});
        return {
          'session': {
            'accessToken': 'access-123',
            'refreshToken': 'refresh-456',
            'expiresAt': expiry.toIso8601String(),
            'user': {
              'name': 'Asha Gupta',
              'title': 'Product Manager',
              'email': 'asha@gigvora.com',
              'location': 'Remote',
              'userType': 'member',
              'memberships': ['member', 'admin'],
              'primaryDashboard': 'member',
              'companies': ['Gigvora'],
              'agencies': <String>[],
              'connections': 12,
              'followers': 3,
              'twoFactorEnabled': true,
            },
          },
        };
      },
    );

    final controller = TestSessionController();
    final container = buildContainer(
      runtimeRepository: runtimeRepository,
      authRepository: authRepository,
      controller: controller,
    );

    final result = await container.read(sessionBootstrapProvider.future);

    expect(result.backendHealthy, isTrue);
    expect(result.authenticated, isTrue);
    expect(result.session, isNotNull);
    expect(result.session!.email, 'asha@gigvora.com');
    expect(tokenDriver.accessToken, 'access-123');
    expect(tokenDriver.refreshToken, 'refresh-456');
    expect(controller.lastSession?.email, 'asha@gigvora.com');
    final sessionState = container.read(sessionControllerProvider);
    expect(sessionState.session?.email, 'asha@gigvora.com');
  });

  test('clears stored tokens and prompts login when refresh fails', () async {
    tokenDriver.refreshToken = 'stale-token';
    final runtimeRepository = buildRuntimeRepository(
      onGet: (path) async {
        return {
          'status': 'maintenance',
          'httpStatus': 503,
          'timestamp': DateTime.now().toIso8601String(),
          'dependencies': const <String, dynamic>{},
        };
      },
    );

    final authRepository = buildAuthRepository(
      onPost: (path, body) async {
        expect(path, '/auth/refresh');
        throw ApiException(401, 'Refresh token expired');
      },
    );

    final controller = TestSessionController();
    final container = buildContainer(
      runtimeRepository: runtimeRepository,
      authRepository: authRepository,
      controller: controller,
    );

    final result = await container.read(sessionBootstrapProvider.future);

    expect(result.backendHealthy, isFalse);
    expect(result.authenticated, isFalse);
    expect(result.message, 'Secure session expired. Please sign in again.');
    expect(tokenDriver.accessToken, isNull);
    expect(tokenDriver.refreshToken, isNull);
    expect(controller.lastSession, isNull);
    final sessionState = container.read(sessionControllerProvider);
    expect(sessionState.session, isNull);
  });
}
