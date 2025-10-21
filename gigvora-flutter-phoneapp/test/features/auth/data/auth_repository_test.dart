import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/auth/data/auth_repository.dart';

import '../../../support/test_api_client.dart';

void main() {
  group('AuthRepository', () {
    test('login returns authenticated session when backend sends session payload', () async {
      final sessionPayload = <String, dynamic>{
        'session': {
          'accessToken': 'access-token',
          'refreshToken': 'refresh-token',
          'expiresAt': DateTime(2025, 1, 10).toIso8601String(),
          'user': {
            'name': 'Avi Singh',
            'email': 'avi@gigvora.com',
            'title': 'Product Strategist',
            'memberships': ['company', 'agency'],
            'primaryDashboard': 'company',
            'twoFactorEnabled': true,
            'connections': 42,
            'followers': 19,
            'companies': ['Atlas Labs'],
            'agencies': ['Orbit Partners'],
          },
        },
      };

      final client = TestApiClient(
        onPost: (path, body) async {
          expect(path, '/auth/login');
          expect(body, {'email': 'avi@gigvora.com', 'password': 'securePass123'});
          return sessionPayload;
        },
      );

      final repository = AuthRepository(client);
      final result = await repository.login('avi@gigvora.com', 'securePass123');

      expect(result.requiresTwoFactor, isFalse);
      expect(result.session, isNotNull);
      expect(result.session!.accessToken, 'access-token');
      expect(result.session!.refreshToken, 'refresh-token');
      expect(result.session!.userSession.memberships, containsAll(['company', 'agency']));
      expect(result.session!.userSession.activeMembership, 'company');
    });

    test('login returns two-factor challenge when backend requires verification', () async {
      final client = TestApiClient(
        onPost: (path, body) async {
          expect(path, '/auth/login');
          return {
            'requiresTwoFactor': true,
            'challenge': {
              'tokenId': 'challenge-123',
              'maskedDestination': '•••• 1234',
              'expiresAt': DateTime(2025, 1, 10, 10).toIso8601String(),
            },
          };
        },
      );

      final repository = AuthRepository(client);
      final result = await repository.login('user@gigvora.com', 'password');

      expect(result.requiresTwoFactor, isTrue);
      expect(result.challenge, isNotNull);
      expect(result.challenge!.tokenId, 'challenge-123');
      expect(result.session, isNull);
    });

    test('verifyTwoFactor exchanges code for a persistent session', () async {
      late Map<String, dynamic>? capturedBody;
      final client = TestApiClient(
        onPost: (path, body) async {
          capturedBody = body as Map<String, dynamic>?;
          if (path == '/auth/verify-2fa') {
            return {
              'session': {
                'accessToken': 'verified-access',
                'refreshToken': 'verified-refresh',
                'user': {
                  'email': 'user@gigvora.com',
                  'memberships': ['user'],
                },
              },
            };
          }
          throw StateError('Unexpected path $path');
        },
      );

      final repository = AuthRepository(client);
      final session = await repository.verifyTwoFactor(
        email: 'user@gigvora.com',
        code: '123456',
        tokenId: 'challenge-123',
      );

      expect(capturedBody, {
        'email': 'user@gigvora.com',
        'code': '123456',
        'tokenId': 'challenge-123',
      });
      expect(session.accessToken, 'verified-access');
      expect(session.userSession.email, 'user@gigvora.com');
    });

    test('resendTwoFactor requests a new challenge token', () async {
      late Map<String, dynamic>? capturedBody;
      final client = TestApiClient(
        onPost: (path, body) async {
          if (path == '/auth/two-factor/resend') {
            capturedBody = body as Map<String, dynamic>?;
            return {
              'tokenId': 'challenge-456',
              'maskedDestination': '***6789',
            };
          }
          throw StateError('Unexpected path $path');
        },
      );

      final repository = AuthRepository(client);
      final challenge = await repository.resendTwoFactor('challenge-123');

      expect(capturedBody, {'tokenId': 'challenge-123'});
      expect(challenge.tokenId, 'challenge-456');
      expect(challenge.maskedDestination, '***6789');
    });

    test('register endpoints send expected payloads for each account type', () async {
      final recorded = <String, Map<String, dynamic>>{};
      final client = TestApiClient(
        onPost: (path, body) async {
          recorded[path] = Map<String, dynamic>.from(body as Map);
          return <String, dynamic>{};
        },
      );

      final repository = AuthRepository(client);

      await repository.registerUser(
        firstName: 'Lena',
        lastName: 'Diaz',
        email: 'lena@gigvora.com',
        password: 'strongPass!',
        address: 'Lisbon, Portugal',
        age: 28,
        twoFactorEnabled: true,
        userType: 'freelancer',
      );

      await repository.registerCompanyAccount(
        companyName: 'Atlas Labs',
        firstName: 'Kai',
        lastName: 'Morgan',
        email: 'kai@atlaslabs.com',
        password: 'Complex#2024',
        website: 'https://atlaslabs.com',
        focusArea: 'Product design',
        location: 'Remote',
        twoFactorEnabled: false,
      );

      await repository.registerAgencyAccount(
        agencyName: 'Orbit Collective',
        firstName: 'Zara',
        lastName: 'Cheng',
        email: 'hello@orbitcollective.com',
        password: 'Secure123!',
        website: 'https://orbitcollective.com',
        focusArea: 'Growth marketing',
        location: 'Berlin, Germany',
        twoFactorEnabled: true,
      );

      expect(recorded['/auth/register'], {
        'firstName': 'Lena',
        'lastName': 'Diaz',
        'email': 'lena@gigvora.com',
        'password': 'strongPass!',
        'address': 'Lisbon, Portugal',
        'age': 28,
        'twoFactorEnabled': true,
        'userType': 'freelancer',
      });

      expect(recorded['/auth/register/company'], {
        'companyName': 'Atlas Labs',
        'firstName': 'Kai',
        'lastName': 'Morgan',
        'email': 'kai@atlaslabs.com',
        'password': 'Complex#2024',
        'website': 'https://atlaslabs.com',
        'focusArea': 'Product design',
        'location': 'Remote',
        'twoFactorEnabled': false,
      });

      expect(recorded['/auth/register/agency'], {
        'agencyName': 'Orbit Collective',
        'firstName': 'Zara',
        'lastName': 'Cheng',
        'email': 'hello@orbitcollective.com',
        'password': 'Secure123!',
        'website': 'https://orbitcollective.com',
        'focusArea': 'Growth marketing',
        'location': 'Berlin, Germany',
        'twoFactorEnabled': true,
      });
    });

    test('password reset flow hits expected endpoints', () async {
      final calls = <String, Map<String, dynamic>>{};
      final client = TestApiClient(
        onPost: (path, body) async {
          calls[path] = Map<String, dynamic>.from(body as Map);
          return <String, dynamic>{};
        },
      );

      final repository = AuthRepository(client);

      await repository.requestPasswordReset('reset@gigvora.com');
      await repository.confirmPasswordReset(token: 'token-123', password: 'NewSecurePass!');

      expect(calls['/auth/password/forgot'], {'email': 'reset@gigvora.com'});
      expect(calls['/auth/password/reset'], {'token': 'token-123', 'password': 'NewSecurePass!'});
    });
  });
}
