import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/launchpad_screen.dart';

void main() {
  group('LaunchpadScreen', () {
    testWidgets('shows safeguarded messaging when unauthenticated', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: LaunchpadScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byKey(LaunchpadScreen.gateCardKey), findsOneWidget);
      expect(find.textContaining('Launchpad workspace is safeguarded'), findsOneWidget);
      expect(find.byKey(LaunchpadScreen.cohortListKey), findsNothing);
    });

    testWidgets('renders cohort list when role is permitted', (tester) async {
      final sessionController = SessionController();
      sessionController.login(
        UserSession.demo().copyWith(
          memberships: const ['mentor', 'user'],
          activeMembership: 'mentor',
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionControllerProvider.overrideWith((ref) => sessionController),
          ],
          child: const MaterialApp(home: LaunchpadScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byKey(LaunchpadScreen.cohortListKey), findsOneWidget);
      expect(find.byKey(LaunchpadScreen.gateCardKey), findsNothing);
    });
  });
}
