import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/auth/domain/auth_token_store.dart';

class _RecordingTokenDriver extends AuthTokenStoreDriver {
  String? accessToken;
  String? refreshToken;
  bool cleared = false;

  @override
  Future<void> clear() async {
    cleared = true;
    accessToken = null;
    refreshToken = null;
  }

  @override
  Future<void> persist({required String accessToken, required String refreshToken}) async {
    cleared = false;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  @override
  Future<String?> readAccessToken() async => accessToken;

  @override
  Future<String?> readRefreshToken() async => refreshToken;
}

void main() {
  group('AuthTokenStore', () {
    late _RecordingTokenDriver driver;

    setUp(() {
      driver = _RecordingTokenDriver();
      AuthTokenStore.useDriver(driver);
    });

    tearDown(() {
      AuthTokenStore.resetDriver();
    });

    test('persists trimmed tokens to the backing store', () async {
      await AuthTokenStore.persist(accessToken: '  access  ', refreshToken: ' refresh\n');

      expect(driver.accessToken, 'access');
      expect(driver.refreshToken, 'refresh');
      expect(driver.cleared, isFalse);
    });

    test('clears stored credentials when tokens are empty', () async {
      driver.accessToken = 'existing';
      driver.refreshToken = 'existing-refresh';

      await AuthTokenStore.persist(accessToken: '   ', refreshToken: '  ');

      expect(driver.cleared, isTrue);
      expect(driver.accessToken, isNull);
      expect(driver.refreshToken, isNull);
    });

    test('attachToken applies header only when absent', () async {
      driver.accessToken = 'token';
      final context = ApiRequestContext(
        method: 'GET',
        uri: Uri.parse('https://gigvora.com/ads'),
        headers: <String, String>{},
      );

      await AuthTokenStore.attachToken(context);
      expect(context.headers['Authorization'], 'Bearer token');

      context.headers['Authorization'] = 'Custom existing';
      driver.accessToken = 'new-token';
      await AuthTokenStore.attachToken(context);
      expect(context.headers['Authorization'], 'Custom existing');
    });
  });
}
