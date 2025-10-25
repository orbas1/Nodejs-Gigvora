import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:riverpod/riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:gigvora_mobile/core/localization/gigvora_localizations.dart';
import 'package:gigvora_mobile/core/providers.dart';
import 'package:gigvora_mobile/core/shared_preferences_provider.dart';
import 'package:gigvora_mobile/features/auth/application/session_controller.dart';
import 'package:gigvora_mobile/features/auth/domain/session.dart';
import 'package:gigvora_mobile/features/work_management/data/work_management_sample.dart';
import 'package:gigvora_mobile/features/work_management/presentation/work_management_screen.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../helpers/recording_api_client.dart';
import '../../../helpers/test_dependencies.dart';
import '../../../support/test_design_tokens.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpScreen(
    WidgetTester tester, {
    required SessionState sessionState,
    RecordingApiClient? apiClient,
  }) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final controller = SessionController();
    controller.state = sessionState;

    final client = apiClient ?? RecordingApiClient(onGet: (path, _, __, ___) async {
      if (path.endsWith('/work-management')) {
        return workManagementSample;
      }
      return {'ok': true};
    }, onPost: (path, _, __, body) async {
      return {'ok': true};
    }, onPatch: (path, _, __, body) async {
      return {'ok': true};
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionControllerProvider.overrideWithValue(controller),
          appConfigProvider.overrideWithValue(testAppConfig),
          designTokensProvider.overrideWith((ref) async => buildTestDesignTokens()),
          sharedPreferencesProvider.overrideWithValue(prefs),
          apiClientProvider.overrideWithValue(client),
          offlineCacheProvider.overrideWithValue(InMemoryOfflineCache()),
          analyticsServiceProvider.overrideWithValue(RecordingAnalyticsService()),
        ],
        child: MaterialApp(
          localizationsDelegates: const [
            GigvoraLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
          ],
          supportedLocales: GigvoraLocalizations.supportedLocales,
          home: const WorkManagementScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();
  }

  testWidgets('renders access restriction when user lacks permissions', (tester) async {
    await pumpScreen(
      tester,
      sessionState: SessionState.authenticated(
        UserSession.demo().copyWith(memberships: ['mentor'], activeMembership: 'mentor'),
      ),
    );

    expect(find.text('Task & sprint manager'), findsOneWidget);
    expect(find.textContaining('Task delegation requires a freelancer'), findsOneWidget);
  });

  testWidgets('displays work management overview when user can manage projects', (tester) async {
    await pumpScreen(
      tester,
      sessionState: SessionState.authenticated(
        UserSession.demo().copyWith(memberships: ['company', 'user'], activeMembership: 'company'),
      ),
    );

    expect(find.text('Enterprise rebrand rollout'), findsOneWidget);
    expect(find.textContaining('Task & sprint manager'), findsOneWidget);
    expect(find.textContaining('Launch sprints'), findsOneWidget);
    expect(find.textContaining('Total sprints'), findsWidgets);
  });
}
