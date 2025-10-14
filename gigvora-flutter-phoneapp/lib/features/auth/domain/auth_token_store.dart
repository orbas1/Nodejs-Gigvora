import 'package:flutter/foundation.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

class AuthTokenStore {
  AuthTokenStore._();

  static const _accessTokenKey = 'auth.accessToken';
  static const _refreshTokenKey = 'auth.refreshToken';

  static OfflineCache get _cache => ServiceLocator.read<OfflineCache>();

  static Future<void> persist({
    required String accessToken,
    required String refreshToken,
  }) async {
    try {
      await _cache.write(_accessTokenKey, accessToken, ttl: const Duration(minutes: 55));
      await _cache.write(_refreshTokenKey, refreshToken, ttl: const Duration(days: 7));
    } catch (error, stackTrace) {
      debugPrint('Failed to persist auth tokens: $error');
      debugPrint('$stackTrace');
    }
  }

  static Future<String?> readAccessToken() async {
    try {
      final entry = _cache.read<String?>(_accessTokenKey, (raw) => raw as String?);
      return entry?.value;
    } catch (error, stackTrace) {
      debugPrint('Failed to read access token: $error');
      debugPrint('$stackTrace');
      return null;
    }
  }

  static Future<String?> readRefreshToken() async {
    try {
      final entry = _cache.read<String?>(_refreshTokenKey, (raw) => raw as String?);
      return entry?.value;
    } catch (error, stackTrace) {
      debugPrint('Failed to read refresh token: $error');
      debugPrint('$stackTrace');
      return null;
    }
  }

  static Future<void> clear() async {
    try {
      await _cache.remove(_accessTokenKey);
      await _cache.remove(_refreshTokenKey);
    } catch (error, stackTrace) {
      debugPrint('Failed to clear auth tokens: $error');
      debugPrint('$stackTrace');
    }
  }

  static Future<void> attachToken(ApiRequestContext context) async {
    final token = await readAccessToken();
    if (token != null && token.isNotEmpty) {
      context.headers['Authorization'] = 'Bearer $token';
    }
  }
}
