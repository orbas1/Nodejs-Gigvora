import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:go_router/go_router.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/core/shared_preferences_provider.dart';
import 'package:gigvora_mobile/main.dart';
import 'package:gigvora_mobile/theme/app_theme_controller.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('GigvoraApp boots with mocked services', (tester) async {
    SharedPreferences.setMockInitialValues(const <String, Object?>{});
    final preferences = await SharedPreferences.getInstance();
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

    final themeCompleter = Completer<AppThemeState>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeStateProvider.overrideWith((ref) => themeCompleter.future),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
          sharedPreferencesProvider.overrideWithValue(preferences),
        ],
        child: const GigvoraApp(),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    final loader = GigvoraThemeLoader();
    final theme = await loader.loadBlue();
    final themeData = ThemeData(colorSchemeSeed: Colors.blue);
    themeCompleter.complete(
      AppThemeState(
        lightTheme: themeData,
        darkTheme: themeData,
        tokens: theme.tokens,
        mode: ThemeMode.light,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Feed Screen'), findsOneWidget);
  });
}
