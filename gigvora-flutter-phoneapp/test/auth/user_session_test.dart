import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/auth/domain/session.dart';

void main() {
  group('UserSession', () {
    test('normalises memberships and preserves active membership', () {
      final session = UserSession(
        id: 10,
        userId: 10,
        memberId: 20,
        accountId: 30,
        name: 'Casey',
        title: 'Lead',
        email: 'casey@example.com',
        location: 'Remote',
        avatarSeed: 'Casey',
        profileId: 'profile-casey',
        memberships: const [' company ', '', 'user'],
        activeMembership: 'company',
        dashboards: const {},
      );

      expect(session.memberships, equals(const ['company', 'user']));
      expect(session.activeMembership, equals('company'));
      expect(session.actorId, equals(10));
      expect(session.roleLabel('freelancer'), equals('Freelancer'));
    });

    test('falls back to first membership when active membership missing', () {
      final session = UserSession(
        name: 'Jordan',
        title: 'Contributor',
        email: 'jordan@example.com',
        location: 'Remote',
        memberships: const ['freelancer', 'agency'],
        activeMembership: 'admin',
        dashboards: const {},
      );

      expect(session.activeMembership, equals('freelancer'));
      expect(session.actorId, isNull);
    });

    test('copyWith preserves invariants and updates tokens', () {
      final base = UserSession(
        id: 44,
        userId: 44,
        name: 'Rowan',
        title: 'Manager',
        email: 'rowan@example.com',
        location: 'London',
        memberships: const ['company', 'agency'],
        activeMembership: 'company',
        dashboards: const {},
        accessToken: 'token-1',
        refreshToken: 'refresh-1',
      );

      final updated = base.copyWith(
        memberships: const ['agency', 'freelancer'],
        activeMembership: 'freelancer',
        accessToken: 'token-2',
      );

      expect(updated.memberships, equals(const ['agency', 'freelancer']));
      expect(updated.activeMembership, equals('freelancer'));
      expect(updated.accessToken, equals('token-2'));
      expect(updated.refreshToken, equals('refresh-1'));
    });

    test('demo session exposes dashboards for agency access', () {
      final demo = UserSession.demo();
      expect(demo.dashboardFor('agency'), isNotNull);
      expect(demo.memberships, contains('agency'));
      expect(demo.activeMembership, isNotEmpty);
    });
  });

  group('SessionState', () {
    test('reports authentication status', () {
      const unauthenticated = SessionState.unauthenticated();
      expect(unauthenticated.isAuthenticated, isFalse);
      expect(unauthenticated.actorId, isNull);

      final demo = UserSession.demo();
      final authenticated = SessionState.authenticated(demo);
      expect(authenticated.isAuthenticated, isTrue);
      expect(authenticated.actorId, equals(demo.actorId));
    });
  });
}
