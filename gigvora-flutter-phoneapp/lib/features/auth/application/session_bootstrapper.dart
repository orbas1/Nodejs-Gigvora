import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../runtime_health/data/runtime_health_repository.dart';
import '../../runtime_health/domain/runtime_health_snapshot.dart';
import '../data/auth_repository.dart';
import '../domain/auth_token_store.dart';
import '../domain/session.dart';
import 'session_controller.dart';

class SessionBootstrapResult {
  const SessionBootstrapResult({
    required this.backendHealthy,
    required this.authenticated,
    this.session,
    this.message,
  });

  final bool backendHealthy;
  final bool authenticated;
  final UserSession? session;
  final String? message;
}

final sessionBootstrapProvider = FutureProvider<SessionBootstrapResult>((ref) async {
  final runtimeRepository = ref.read(runtimeHealthRepositoryProvider);
  final authRepository = ref.read(authRepositoryProvider);
  final sessionController = ref.read(sessionControllerProvider.notifier);

  RuntimeHealthSnapshot healthSnapshot;
  try {
    healthSnapshot = await runtimeRepository.fetch(authenticated: false);
  } catch (_) {
    healthSnapshot = const RuntimeHealthSnapshot(
      status: 'unknown',
      httpStatus: 503,
      timestamp: DateTime.now(),
      dependencies: <String, dynamic>{},
    );
  }

  final refreshToken = await AuthTokenStore.readRefreshToken();
  if (refreshToken == null || refreshToken.isEmpty) {
    return SessionBootstrapResult(
      backendHealthy: healthSnapshot.healthy,
      authenticated: false,
      message: healthSnapshot.healthy
          ? null
          : 'Platform maintenance detected. Live data will resume once systems recover.',
    );
  }

  try {
    final session = await authRepository.refreshSession(refreshToken);
    await AuthTokenStore.persist(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    sessionController.login(session.userSession);
    return SessionBootstrapResult(
      backendHealthy: healthSnapshot.healthy,
      authenticated: true,
      session: session.userSession,
    );
  } catch (error) {
    await AuthTokenStore.clear();
    return SessionBootstrapResult(
      backendHealthy: healthSnapshot.healthy,
      authenticated: false,
      message: 'Secure session expired. Please sign in again.',
    );
  }
});
