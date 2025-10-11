import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  return ServiceLocator.read<AppConfig>();
});

final offlineCacheProvider = Provider<OfflineCache>((ref) {
  return ServiceLocator.read<OfflineCache>();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ServiceLocator.read<ApiClient>();
});

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return ServiceLocator.read<AnalyticsService>();
});

final analyticsBootstrapProvider = FutureProvider<void>((ref) async {
  final analytics = ref.watch(analyticsServiceProvider);
  await analytics.flushQueue();
});

final designTokenLoaderProvider = Provider<GigvoraThemeLoader>((ref) {
  return GigvoraThemeLoader();
});

final designTokensProvider = FutureProvider<DesignTokens>((ref) async {
  final loader = ref.watch(designTokenLoaderProvider);
  final theme = await loader.loadBlue();
  return theme.tokens;
});

final appThemeProvider = FutureProvider<ThemeData>((ref) async {
  final loader = ref.watch(designTokenLoaderProvider);
  return loader.loadBlueThemeData();
});

