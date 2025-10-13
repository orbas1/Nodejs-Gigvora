import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'core/providers.dart';
import 'router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ServiceLocator.configure();

  try {
    final loader = GigvoraThemeLoader();
    final theme = await loader.loadBlue();
    final themeData = theme.toThemeData();
    final tokens = theme.tokens;

    runApp(
      ProviderScope(
        overrides: [
          appThemeProvider.overrideWithValue(AsyncValue.data(themeData)),
          designTokensProvider.overrideWithValue(AsyncValue.data(tokens)),
        ],
        child: const GigvoraApp(),
      ),
    );
  } catch (error, stackTrace) {
    debugPrint('Failed to bootstrap theme: $error');
    debugPrint('$stackTrace');
    runApp(
      ProviderScope(
        overrides: [
          appThemeProvider.overrideWithValue(AsyncValue.error(error, stackTrace)),
          designTokensProvider.overrideWithValue(AsyncValue.error(error, stackTrace)),
        ],
        child: const GigvoraApp(),
      ),
    );
  }
}

class GigvoraApp extends ConsumerWidget {
  const GigvoraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(appThemeProvider);
    final router = ref.watch(appRouterProvider);
    ref.watch(featureFlagsBootstrapProvider);
    ref.watch(pushNotificationBootstrapProvider);

    ref.listen<AsyncValue<void>>(analyticsBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Analytics bootstrap failed: $error');
      });
    });

    ref.listen<AsyncValue<void>>(featureFlagsBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Feature flag bootstrap failed: $error');
      });
    });

    ref.listen<AsyncValue<void>>(pushNotificationBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Push notification bootstrap failed: $error');
      });
    });

    return theme.when(
      data: (themeData) => MaterialApp.router(
        title: 'Gigvora',
        theme: themeData,
        routerConfig: router,
      ),
      loading: () => MaterialApp(
        title: 'Gigvora',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
          useMaterial3: true,
        ),
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      ),
      error: (error, stackTrace) => MaterialApp(
        title: 'Gigvora',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF991B1B)),
          useMaterial3: true,
        ),
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Color(0xFF991B1B)),
                  const SizedBox(height: 16),
                  const Text(
                    'Unable to load theme assets',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '$error',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
