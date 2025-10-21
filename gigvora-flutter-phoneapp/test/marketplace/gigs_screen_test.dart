import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/marketplace/presentation/gigs_screen.dart';

Future<void> _pumpGigsScreen(
  WidgetTester tester,
  SessionState state,
) async {
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (context, _) => const GigsScreen()),
      GoRoute(path: '/home', builder: (context, _) => const SizedBox()),
      GoRoute(path: '/login', builder: (context, _) => const SizedBox()),
      GoRoute(path: '/signup', builder: (context, _) => const SizedBox()),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sessionControllerProvider.overrideWith((ref) {
          final controller = SessionController();
          controller.state = state;
          return controller;
        }),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
}

void main() {
  group('GigsScreen', () {
    testWidgets('prompts unauthenticated users to sign in', (tester) async {
      await _pumpGigsScreen(tester, const SessionState.unauthenticated());

      expect(find.textContaining('Freelancer workspace required'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
    });

    testWidgets('asks authenticated users without freelancer access to request it', (tester) async {
      final session = UserSession.demo().copyWith(
        memberships: ['user', 'company'],
        activeMembership: 'user',
      );
      await _pumpGigsScreen(tester, SessionState.authenticated(session));

      expect(find.textContaining('Only verified freelancer workspaces'), findsOneWidget);
      expect(find.text('Request freelancer access'), findsOneWidget);
    });

    testWidgets('shows opportunity list for freelancer members', (tester) async {
      final session = UserSession.demo().copyWith(
        memberships: ['user', 'freelancer'],
        activeMembership: 'freelancer',
      );
      await _pumpGigsScreen(tester, SessionState.authenticated(session));

      expect(find.text('Short-term engagements and micro-projects'), findsOneWidget);
      expect(find.text('Pitch this gig'), findsOneWidget);
    });
  });
}
