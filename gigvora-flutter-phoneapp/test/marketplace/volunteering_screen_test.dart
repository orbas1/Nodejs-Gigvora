import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/volunteering_screen.dart';

void main() {
  group('VolunteeringScreen', () {
    testWidgets('prompts for access when membership is missing', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: VolunteeringScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byKey(VolunteeringScreen.gateCardKey), findsOneWidget);
      expect(find.byKey(VolunteeringScreen.volunteerListKey), findsNothing);
      expect(find.byKey(VolunteeringScreen.requestAccessKey), findsOneWidget);
    });

    testWidgets('renders volunteer opportunities when allowed', (tester) async {
      final sessionController = SessionController();
      sessionController.login(
        UserSession.demo().copyWith(
          memberships: const ['volunteer', 'user'],
          activeMembership: 'volunteer',
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionControllerProvider.overrideWith((ref) => sessionController),
          ],
          child: const MaterialApp(home: VolunteeringScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byKey(VolunteeringScreen.volunteerListKey), findsOneWidget);
      expect(find.byKey(VolunteeringScreen.gateCardKey), findsNothing);
    });
  });
}
