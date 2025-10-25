import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';

import '../core/shared_preferences_provider.dart';
import '../features/app_boot/data/app_boot_providers.dart';
import '../features/app_boot/data/app_boot_repository.dart';
import '../features/app_boot/data/models/user_display_preferences.dart';
import '../features/auth/application/session_controller.dart';

const _themeModePreferenceKey = 'app_theme_mode';

class AppThemePalette {
  const AppThemePalette({
    required this.primary,
    required this.onPrimary,
    required this.surface,
    required this.onSurface,
    required this.surfaceVariant,
    required this.onSurfaceVariant,
    required this.success,
    required this.warning,
    required this.error,
    required this.info,
  });

  factory AppThemePalette.fromTokens(DesignTokens tokens) {
    Color parse(String key) => _parseColor(tokens.colors[key]!);
    return AppThemePalette(
      primary: parse('primary'),
      onPrimary: parse('onPrimary'),
      surface: parse('surface'),
      onSurface: parse('onSurface'),
      surfaceVariant: parse('surfaceVariant'),
      onSurfaceVariant: parse('onSurfaceVariant'),
      success: parse('success'),
      warning: parse('warning'),
      error: parse('error'),
      info: parse('info'),
    );
  }

  final Color primary;
  final Color onPrimary;
  final Color surface;
  final Color onSurface;
  final Color surfaceVariant;
  final Color onSurfaceVariant;
  final Color success;
  final Color warning;
  final Color error;
  final Color info;
}

class AppThemeState {
  const AppThemeState({
    required this.lightTheme,
    required this.darkTheme,
    required this.tokens,
    required this.mode,
    required this.palette,
    required this.tokensVersion,
  });

  final ThemeData lightTheme;
  final ThemeData darkTheme;
  final DesignTokens tokens;
  final ThemeMode mode;
  final AppThemePalette palette;
  final String tokensVersion;

  ThemeData resolveActiveTheme({Brightness? platformBrightness}) {
    switch (mode) {
      case ThemeMode.light:
        return lightTheme;
      case ThemeMode.dark:
        return darkTheme;
      case ThemeMode.system:
        return platformBrightness == Brightness.dark ? darkTheme : lightTheme;
    }
  }

  AppThemeState copyWith({ThemeMode? mode, AppThemePalette? palette}) {
    return AppThemeState(
      lightTheme: lightTheme,
      darkTheme: darkTheme,
      tokens: tokens,
      mode: mode ?? this.mode,
      palette: palette ?? this.palette,
      tokensVersion: tokensVersion,
    );
  }
}

class AppThemeController extends AsyncNotifier<AppThemeState> {
  @override
  Future<AppThemeState> build() async {
    final preferences = ref.watch(sharedPreferencesProvider);
    final loader = GigvoraThemeLoader();
    final gigvoraTheme = await loader.loadBlue();
    final mode = _restoreMode(preferences.getString(_themeModePreferenceKey));
    final palette = AppThemePalette.fromTokens(gigvoraTheme.tokens);

    return AppThemeState(
      lightTheme: gigvoraTheme.toThemeData(brightness: Brightness.light),
      darkTheme: gigvoraTheme.toThemeData(brightness: Brightness.dark),
      tokens: gigvoraTheme.tokens,
      mode: mode,
      palette: palette,
      tokensVersion: gigvoraTheme.tokens.version,
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final current = await future;
    if (current.mode == mode) {
      return;
    }
    state = AsyncValue.data(current.copyWith(mode: mode));
    await _persistMode(mode);
    await _syncRemotePreferences(AppDisplayPreferencePatch(
      themeMode: mode,
      tokensVersion: current.tokensVersion,
    ));
  }

  Future<void> applyRemotePreferences(UserDisplayPreferences preferences) async {
    final current = await future;
    var updated = current;
    var changed = false;

    if (preferences.themeMode != current.mode) {
      updated = updated.copyWith(mode: preferences.themeMode);
      changed = true;
      await _persistMode(preferences.themeMode);
    }

    if (changed) {
      state = AsyncValue.data(updated);
    }

    if (_isAuthenticated) {
      final expectedVersion = current.tokensVersion;
      if (preferences.tokensVersion != expectedVersion) {
        unawaited(_syncRemotePreferences(AppDisplayPreferencePatch(
          tokensVersion: expectedVersion,
        )));
      }
    }
  }

  Future<void> _persistMode(ThemeMode mode) async {
    final preferences = ref.read(sharedPreferencesProvider);
    await preferences.setString(_themeModePreferenceKey, mode.name);
  }

  Future<void> _syncRemotePreferences(AppDisplayPreferencePatch patch) async {
    if (_isAuthenticated && !patch.isEmpty) {
      try {
        final repository = ref.read(appBootRepositoryProvider);
        await repository.updateDisplayPreferences(patch);
      } catch (error, stackTrace) {
        debugPrint('Failed to sync theme preferences: $error');
        FlutterError.reportError(
          FlutterErrorDetails(exception: error, stack: stackTrace, library: 'AppThemeController'),
        );
      }
    }
  }

  bool get _isAuthenticated => ref.read(sessionControllerProvider).isAuthenticated;

  ThemeMode _restoreMode(String? stored) {
    switch (stored) {
      case 'dark':
        return ThemeMode.dark;
      case 'system':
        return ThemeMode.system;
      case 'light':
      default:
        return ThemeMode.light;
    }
  }
}

Color _parseColor(String hex) {
  final value = hex.replaceFirst('#', '');
  final intValue = int.parse(value.length == 6 ? 'FF$value' : value, radix: 16);
  return Color(intValue);
}

final appThemeControllerProvider =
    AsyncNotifierProvider<AppThemeController, AppThemeState>(AppThemeController.new);
