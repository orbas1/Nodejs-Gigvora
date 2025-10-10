import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/cache/offline_cache.dart';
import 'core/providers.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await OfflineCache.instance.init();
  runApp(const ProviderScope(child: GigvoraApp()));
}

class GigvoraApp extends ConsumerWidget {
  const GigvoraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(analyticsBootstrapProvider);
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Gigvora',
      theme: buildAppTheme(),
      routerConfig: router,
    );
  }
}
