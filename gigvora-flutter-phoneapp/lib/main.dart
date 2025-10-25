import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uni_links/uni_links.dart';

import 'core/localization/gigvora_localizations.dart';
import 'core/localization/language_controller.dart';
import 'core/providers.dart';
import 'core/shared_preferences_provider.dart';
import 'features/auth/application/session_bootstrapper.dart';
import 'features/auth/domain/auth_token_store.dart';
import 'features/runtime_health/application/runtime_health_provider.dart';
import 'features/runtime_health/domain/runtime_health_snapshot.dart';
import 'router/app_router.dart';
import 'router/app_routes.dart';
import 'theme/app_theme_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ServiceLocator.configure(
    requestInterceptors: [AuthTokenStore.attachToken],
    authTokenResolver: AuthTokenStore.readAccessToken,
  );

  final sharedPreferences = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(sharedPreferences),
      ],
      child: const GigvoraApp(),
    ),
  );
}

class GigvoraApp extends ConsumerStatefulWidget {
  const GigvoraApp({super.key});

  @override
  ConsumerState<GigvoraApp> createState() => _GigvoraAppState();
}

class _GigvoraAppState extends ConsumerState<GigvoraApp> {
  StreamSubscription<Uri?>? _deepLinkSubscription;
  GoRouter? _router;

  @override
  void initState() {
    super.initState();
    _router = ref.read(appRouterProvider);
    ref.listen<GoRouter>(appRouterProvider, (_, next) {
      _router = next;
    });
    _initialiseDeepLinks();
  }

  @override
  void dispose() {
    _deepLinkSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initialiseDeepLinks() async {
    if (kIsWeb) {
      return;
    }

    try {
      final initialUri = await getInitialUri();
      if (initialUri != null) {
        _handleDeepLink(initialUri);
      }
    } on PlatformException catch (error) {
      debugPrint('Failed to obtain initial deep link: $error');
    } on FormatException catch (error) {
      debugPrint('Malformed initial deep link: $error');
    }

    _deepLinkSubscription = uriLinkStream.listen(
      (uri) {
        if (uri != null) {
          _handleDeepLink(uri);
        }
      },
      onError: (Object error) {
        debugPrint('Deep link stream error: $error');
      },
    );
  }

  void _handleDeepLink(Uri uri) {
    if (!mounted) {
      return;
    }
    final router = _router;
    if (router == null) {
      return;
    }
    final location = AppRouteRegistry.resolveDeepLink(uri);
    if (location == null || router.location == location) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      router.go(location);
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeState = ref.watch(appThemeStateProvider);
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

    return themeState.when(
      data: (theme) => MaterialApp.router(
        title: 'Gigvora',
        theme: theme.lightTheme,
        darkTheme: theme.darkTheme,
        themeMode: theme.mode,
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
