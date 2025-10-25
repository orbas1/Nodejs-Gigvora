import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

abstract class AuthTokenStoreDriver {
  const AuthTokenStoreDriver();

  Future<void> persist({
    required String accessToken,
    required String refreshToken,
  });

  Future<String?> readAccessToken();

  Future<String?> readRefreshToken();

  Future<void> clear();
}

class _OfflineCacheAuthTokenStoreDriver extends AuthTokenStoreDriver {
  const _OfflineCacheAuthTokenStoreDriver();

  OfflineCache get _cache => ServiceLocator.read<OfflineCache>();

  @override
  Future<void> persist({
    required String accessToken,
    required String refreshToken,
  }) async {
    try {
      await _cache.write(_accessTokenKey, accessToken, ttl: const Duration(minutes: 55));
      await _cache.write(_refreshTokenKey, refreshToken, ttl: const Duration(days: 7));
    } catch (error) {
      debugPrint('Auth token persistence failed (${error.runtimeType}).');
    }
  }

  @override
  Future<String?> readAccessToken() async {
    try {
      final entry = _cache.read<String?>(_accessTokenKey, (raw) => raw as String?);
      return entry?.value;
    } catch (error) {
      debugPrint('Auth token read failed (${error.runtimeType}).');
      return null;
    }
  }

  @override
  Future<String?> readRefreshToken() async {
    try {
      final entry = _cache.read<String?>(_refreshTokenKey, (raw) => raw as String?);
      return entry?.value;
    } catch (error) {
      debugPrint('Refresh token read failed (${error.runtimeType}).');
      return null;
    }
  }

  @override
  Future<void> clear() async {
    try {
      await _cache.remove(_accessTokenKey);
      await _cache.remove(_refreshTokenKey);
    } catch (error) {
      debugPrint('Clearing auth tokens failed (${error.runtimeType}).');
    }
  }
}

class AuthTokenStore {
  AuthTokenStore._();

  static const _accessTokenKey = 'auth.accessToken';
  static const _refreshTokenKey = 'auth.refreshToken';

  static AuthTokenStoreDriver _driver = const _OfflineCacheAuthTokenStoreDriver();

  @visibleForTesting
  static void useDriver(AuthTokenStoreDriver driver) {
    _driver = driver;
  }

  @visibleForTesting
  static void resetDriver() {
    _driver = const _OfflineCacheAuthTokenStoreDriver();
  }

  static Future<void> persist({
    required String accessToken,
    required String refreshToken,
  }) {
    final sanitizedAccess = accessToken.trim();
    final sanitizedRefresh = refreshToken.trim();
    if (sanitizedAccess.isEmpty || sanitizedRefresh.isEmpty) {
      return _driver.clear();
    }
    return _driver.persist(accessToken: sanitizedAccess, refreshToken: sanitizedRefresh);
  }

  static Future<String?> readAccessToken() {
    return _driver.readAccessToken();
  }

  static Future<String?> readRefreshToken() {
    return _driver.readRefreshToken();
  }

  static Future<void> clear() {
    return _driver.clear();
  }

  static Future<void> attachToken(ApiRequestContext context) async {
    final token = await _driver.readAccessToken();
    if (token != null && token.isNotEmpty && !context.headers.containsKey('Authorization')) {
      context.headers['Authorization'] = 'Bearer $token';
    }
  }
}
