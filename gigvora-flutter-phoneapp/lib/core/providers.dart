import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/auth/application/session_controller.dart';

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

final localAuthenticationProvider = Provider<LocalAuthentication>((ref) {
  return LocalAuthentication();
});

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('SharedPreferences instance has not been provided');
});

final analyticsBootstrapProvider = FutureProvider<void>((ref) async {
  final analytics = ref.watch(analyticsServiceProvider);
  await analytics.flushQueue();
});

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return ServiceLocator.read<PushNotificationService>();
});

final pushNotificationBootstrapProvider = FutureProvider<void>((ref) async {
  final service = ref.watch(pushNotificationServiceProvider);
  await service.bootstrap();
});

final featureFlagServiceProvider = Provider<FeatureFlagService>((ref) {
  return ServiceLocator.read<FeatureFlagService>();
});

final featureFlagsBootstrapProvider = FutureProvider<void>((ref) async {
  final service = ref.watch(featureFlagServiceProvider);
  await service.bootstrap();
});

final featureFlagStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final service = ref.watch(featureFlagServiceProvider);
  return service.stream;
});

final graphQlGatewayProvider = Provider<GraphQLGateway>((ref) {
  return ServiceLocator.read<GraphQLGateway>();
});

final realtimeGatewayProvider = Provider<RealtimeGateway>((ref) {
  return ServiceLocator.read<RealtimeGateway>();
});

final realtimeStatusProvider = StreamProvider<RealtimeConnectionState>((ref) {
  final gateway = ref.watch(realtimeGatewayProvider);
  return gateway.statusStream;
});

final membershipHeadersProvider = Provider<Map<String, String>?>((ref) {
  final sessionState = ref.watch(sessionControllerProvider);
  final session = sessionState.session;
  if (session == null) {
    return null;
  }
  final memberships = session.memberships
      .map((role) => role.trim().toLowerCase())
      .where((role) => role.isNotEmpty)
      .toList(growable: false);
  if (memberships.isEmpty) {
    return null;
  }
  final headers = <String, String>{
    'X-Gigvora-Memberships': memberships.join(','),
  };
  if (session.activeMembership.trim().isNotEmpty) {
    headers['X-Gigvora-Active-Membership'] = session.activeMembership;
  }
  return headers;
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

