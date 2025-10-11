import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/main.dart';

void main() {
  GoRouter buildRouter() {
    final router = GoRouter(
      initialLocation: '/feed',
      routes: [
        GoRoute(
          path: '/feed',
          builder: (context, state) => const Scaffold(
            body: Center(child: Text('Feed Screen')),
          ),
        ),
      ],
    );
    addTearDown(router.dispose);
    return router;
  }

  testWidgets('renders feed screen once theme resolves', (tester) async {
    final router = buildRouter();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeProvider.overrideWith(
            (ref) async => ThemeData(colorSchemeSeed: Colors.blue),
          ),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
        ],
        child: const GigvoraApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Feed Screen'), findsOneWidget);
  });

  testWidgets('shows loading indicator until theme future completes', (tester) async {
    final router = buildRouter();
    final themeCompleter = Completer<ThemeData>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeProvider.overrideWith((ref) => themeCompleter.future),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
        ],
        child: const GigvoraApp(),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    themeCompleter.complete(ThemeData(colorSchemeSeed: Colors.blue));
    await tester.pumpAndSettle();

    expect(find.text('Feed Screen'), findsOneWidget);
  });
}
