import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:go_router/go_router.dart';

import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/features/app_boot/data/app_boot_providers.dart';
import 'package:gigvora_mobile/features/app_boot/data/models/app_boot_snapshot.dart';
import 'package:gigvora_mobile/features/app_boot/data/models/user_display_preferences.dart';
import 'package:gigvora_mobile/main.dart';
import 'package:gigvora_mobile/router/app_routes.dart';
import 'package:gigvora_mobile/router/route_analytics_observer.dart';
import 'package:gigvora_mobile/theme/app_theme_controller.dart';

void main() {
  class _TestRouteAnalyticsObserver extends RouteAnalyticsObserver {
    _TestRouteAnalyticsObserver() : super((_) => throw UnimplementedError());

    @override
    void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {}

    @override
    void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {}

    @override
    void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {}
  }

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
    final palette = AppThemePalette.fromTokens(tokens.tokens);
    const bootSnapshot = AppBootSnapshot(
      routes: [],
      deepLinkSegments: [],
      preferences: UserDisplayPreferences(
        userId: null,
        themeMode: ThemeMode.light,
        locale: 'en',
        startRouteId: AppRoute.home.routeId,
        lastVisitedRouteId: null,
        tokensVersion: '1.0.0-test',
        metadata: <String, dynamic>{},
        deepLinkSegments: <String>[],
        createdAt: null,
        updatedAt: null,
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeStateProvider.overrideWith(
            (ref) async => AppThemeState(
              lightTheme: ThemeData(colorSchemeSeed: Colors.blue),
              darkTheme: ThemeData(colorSchemeSeed: Colors.blue),
              tokens: tokens.tokens,
              mode: ThemeMode.light,
              palette: palette,
              tokensVersion: tokens.tokens.version,
            ),
          ),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
          appBootSnapshotProvider.overrideWith((ref) async => bootSnapshot),
          routeAnalyticsObserverProvider.overrideWithValue(_TestRouteAnalyticsObserver()),
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
    final palette = AppThemePalette.fromTokens(tokens.tokens);
    final themeCompleter = Completer<AppThemeState>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appThemeStateProvider.overrideWith((ref) => themeCompleter.future),
          appRouterProvider.overrideWithValue(router),
          analyticsBootstrapProvider.overrideWith((ref) async {}),
          featureFlagsBootstrapProvider.overrideWith((ref) async {}),
          appBootSnapshotProvider.overrideWith((ref) async => const AppBootSnapshot(
                routes: [],
                deepLinkSegments: [],
                preferences: UserDisplayPreferences(
                  userId: null,
                  themeMode: ThemeMode.light,
                  locale: 'en',
                  startRouteId: AppRoute.home.routeId,
                  lastVisitedRouteId: null,
                  tokensVersion: '1.0.0-test',
                  metadata: <String, dynamic>{},
                  deepLinkSegments: <String>[],
                  createdAt: null,
                  updatedAt: null,
                ),
              )),
          routeAnalyticsObserverProvider.overrideWithValue(_TestRouteAnalyticsObserver()),
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
        palette: palette,
        tokensVersion: tokens.tokens.version,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Feed Screen'), findsOneWidget);
  });
}
