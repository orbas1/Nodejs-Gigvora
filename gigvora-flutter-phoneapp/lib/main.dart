import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/localization/gigvora_localizations.dart';
import 'core/localization/language_controller.dart';
import 'core/providers.dart';
import 'features/auth/application/session_bootstrapper.dart';
import 'features/auth/application/session_expiry_controller.dart';
import 'features/auth/domain/auth_token_store.dart';
import 'features/runtime_health/application/runtime_health_provider.dart';
import 'features/runtime_health/domain/runtime_health_snapshot.dart';
import 'router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ServiceLocator.configure(
    requestInterceptors: [AuthTokenStore.attachToken],
    authTokenResolver: AuthTokenStore.readAccessToken,
  );

  final sharedPreferences = await SharedPreferences.getInstance();

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
          sharedPreferencesProvider.overrideWithValue(sharedPreferences),
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
          sharedPreferencesProvider.overrideWithValue(sharedPreferences),
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
    final locale = ref.watch(languageControllerProvider);
    ref.watch(sessionBootstrapProvider);
    ref.watch(runtimeHealthStreamProvider);
    ref.watch(featureFlagsBootstrapProvider);
    ref.watch(pushNotificationBootstrapProvider);

    ref.listen<AsyncValue<void>>(analyticsBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Analytics bootstrap failed: $error');
      });
    });

    ref.listen<AsyncValue<SessionBootstrapResult>>(sessionBootstrapProvider, (_, next) {
      next.whenOrNull(
        data: (result) {
          if (result.message != null && result.message!.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              final messenger = ScaffoldMessenger.maybeOf(context);
              if (messenger != null) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(result.message!),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              } else {
                debugPrint(result.message);
              }
            });
          }
        },
        error: (error, stackTrace) {
          debugPrint('Session bootstrap failed: $error');
        },
      );
    });

    ref.listen<AsyncValue<RuntimeHealthSnapshot>>(runtimeHealthStreamProvider, (_, next) {
      next.whenOrNull(data: (snapshot) {
        if (!snapshot.healthy) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final messenger = ScaffoldMessenger.maybeOf(context);
            final message = snapshot.supportContact != null
                ? 'Platform maintenance window active. Contact ${snapshot.supportContact} for live updates.'
                : 'Platform maintenance window active. Some features may be temporarily unavailable.';
            if (messenger != null) {
              messenger.showSnackBar(
                SnackBar(
                  content: Text(message),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: const Color(0xFFB45309),
                ),
              );
            } else {
              debugPrint(message);
            }
          });
        } else if (snapshot.metricsStale) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final messenger = ScaffoldMessenger.maybeOf(context);
            const message =
                'Runtime monitoring telemetry is delayed. Operations has been alerted to investigate Prometheus scrapes.';
            if (messenger != null) {
              messenger.showSnackBar(
                SnackBar(
                  content: const Text(message),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: const Color(0xFF2563EB),
                ),
              );
            } else {
              debugPrint(message);
            }
          });
        }
      });
    });

    ref.listen<AsyncValue<void>>(featureFlagsBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Feature flag bootstrap failed: $error');
      });
    });

    ref.listen<SessionExpiryState>(sessionExpiryControllerProvider, (_, next) {
      if (!next.promptVisible) {
        return;
      }
      final messenger = ScaffoldMessenger.maybeOf(context);
      if (messenger != null) {
        final remaining = next.remaining ?? Duration.zero;
        final minutes = remaining.inMinutes.clamp(0, 59);
        final seconds = remaining.inSeconds % 60;
        final formatted = minutes > 0
            ? '${minutes}m ${seconds.toString().padLeft(2, '0')}s'
            : '${seconds}s';
        WidgetsBinding.instance.addPostFrameCallback((_) {
          messenger.showSnackBar(
            SnackBar(
              content: Text(
                'Your session will expire in $formatted. Refresh your credentials to stay signed in.',
              ),
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF7C3AED),
            ),
          );
          ref.read(sessionExpiryControllerProvider.notifier).acknowledgePrompt();
        });
      } else {
        ref.read(sessionExpiryControllerProvider.notifier).acknowledgePrompt();
      }
    });

    ref.listen<AsyncValue<void>>(pushNotificationBootstrapProvider, (_, next) {
      next.whenOrNull(error: (error, stackTrace) {
        debugPrint('Push notification bootstrap failed: $error');
      });
    });

    const localizationDelegates = <LocalizationsDelegate<dynamic>>[
      GigvoraLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ];

    return theme.when(
      data: (themeData) => MaterialApp.router(
        title: 'Gigvora',
        theme: themeData,
        locale: locale,
        supportedLocales: GigvoraLocalizations.supportedLocales,
        localizationsDelegates: localizationDelegates,
        routerConfig: router,
      ),
      loading: () => MaterialApp(
        title: 'Gigvora',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
          useMaterial3: true,
        ),
        locale: locale,
        supportedLocales: GigvoraLocalizations.supportedLocales,
        localizationsDelegates: localizationDelegates,
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
        locale: locale,
        supportedLocales: GigvoraLocalizations.supportedLocales,
        localizationsDelegates: localizationDelegates,
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
