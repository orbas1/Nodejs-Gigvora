import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

import '../../../core/providers.dart';
import '../data/auth_repository.dart';
import '../domain/auth_token_store.dart';
import 'session_controller.dart';

class BiometricAuthResult {
  const BiometricAuthResult._({required this.success, this.message});

  factory BiometricAuthResult.success(String? message) =>
      BiometricAuthResult._(success: true, message: message);

  factory BiometricAuthResult.failure(String? message) =>
      BiometricAuthResult._(success: false, message: message);

  final bool success;
  final String? message;
}

class BiometricAuthController {
  BiometricAuthController(this._ref, this._localAuthentication);

  final Ref _ref;
  final LocalAuthentication _localAuthentication;

  Future<bool> isAvailable() async {
    try {
      final supported = await _localAuthentication.isDeviceSupported();
      final canCheck = await _localAuthentication.canCheckBiometrics;
      final refreshToken = await AuthTokenStore.readRefreshToken();
      return supported && canCheck && refreshToken != null && refreshToken.isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  Future<BiometricAuthResult> unlockWithBiometrics() async {
    final analytics = _ref.read(analyticsServiceProvider);
    await analytics.track('mobile_auth_biometric_attempt', metadata: const {
      'actorType': 'anonymous',
      'source': 'mobile_app',
    });

    final refreshToken = await AuthTokenStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      return BiometricAuthResult.failure('No saved session available for biometric unlock.');
    }

    try {
      final success = await _localAuthentication.authenticate(
        localizedReason: 'Unlock your Gigvora session',
        options: const AuthenticationOptions(biometricOnly: true, stickyAuth: true),
      );
      if (!success) {
        await analytics.track('mobile_auth_biometric_cancelled', metadata: const {
          'actorType': 'anonymous',
          'source': 'mobile_app',
        });
        return BiometricAuthResult.failure('Biometric authentication was cancelled.');
      }
    } on PlatformException catch (error) {
      await analytics.track('mobile_auth_biometric_error', metadata: {
        'actorType': 'anonymous',
        'source': 'mobile_app',
        'errorCode': error.code,
      });
      return BiometricAuthResult.failure('Biometric authentication failed. (${error.code})');
    }

    final repository = _ref.read(authRepositoryProvider);
    try {
      final session = await repository.refreshSession(refreshToken);
      await AuthTokenStore.persist(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
      _ref.read(sessionControllerProvider.notifier).login(session.userSession);
      await analytics.track('mobile_auth_biometric_success', metadata: {
        'actorType': 'user',
        'userId': session.userSession.userId ?? session.userSession.id,
        'source': 'mobile_app',
      });
      return BiometricAuthResult.success('Welcome back, ${session.userSession.name}!');
    } catch (error) {
      await analytics.track('mobile_auth_biometric_refresh_failed', metadata: {
        'actorType': 'anonymous',
        'source': 'mobile_app',
        'error': '$error',
      });
      return BiometricAuthResult.failure('Session refresh failed. Sign in with your password.');
    }
  }
}

final biometricAuthControllerProvider = Provider<BiometricAuthController>((ref) {
  final localAuth = ref.watch(localAuthenticationProvider);
  return BiometricAuthController(ref, localAuth);
});
