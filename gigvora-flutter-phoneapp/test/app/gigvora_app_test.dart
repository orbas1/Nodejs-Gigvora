import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:go_router/go_router.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/main.dart';
import 'package:gigvora_mobile/theme/app_theme_controller.dart';

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

    final loader = GigvoraThemeLoader();
    final tokens = await loader.loadBlue();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeStateProvider.overrideWith(
            (ref) async => AppThemeState(
              lightTheme: ThemeData(colorSchemeSeed: Colors.blue),
              darkTheme: ThemeData(colorSchemeSeed: Colors.blue),
              tokens: tokens.tokens,
              mode: ThemeMode.light,
            ),
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
    final loader = GigvoraThemeLoader();
    final tokens = await loader.loadBlue();
    final themeCompleter = Completer<AppThemeState>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeStateProvider.overrideWith((ref) => themeCompleter.future),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
        ],
        child: const GigvoraApp(),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final themeData = ThemeData(colorSchemeSeed: Colors.blue);
    themeCompleter.complete(
      AppThemeState(
        lightTheme: themeData,
        darkTheme: themeData,
        tokens: tokens.tokens,
        mode: ThemeMode.light,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Feed Screen'), findsOneWidget);
  });
}
