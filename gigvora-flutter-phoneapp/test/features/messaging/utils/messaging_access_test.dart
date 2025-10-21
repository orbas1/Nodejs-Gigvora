import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/messaging/utils/messaging_access.dart';

void main() {
  group('messaging access', () {
    test('denies access when session is null', () {
      expect(canAccessMessaging(null), isFalse);
      expect(messagingMembershipLabels(null), isEmpty);
    });

    test('allows messaging for supported memberships', () {
      final session = UserSession.demo();

      expect(canAccessMessaging(session), isTrue);
      expect(messagingMembershipLabels(session), isNotEmpty);
      expect(
        messagingAllowedRoleLabels(session),
        containsAll(messagingMembershipLabels(session)),
      );
    });

    test('excludes memberships without messaging permission', () {
      final session = UserSession.demo().copyWith(
        memberships: const ['volunteer'],
        activeMembership: 'volunteer',
      );

      expect(canAccessMessaging(session), isFalse);
      expect(messagingMembershipLabels(session), isEmpty);
      expect(messagingAllowedRoleLabels(session), isNotEmpty);
    });
  });
}
