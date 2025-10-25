import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_design_system/gigvora_design_system.dart';

import '../core/shared_preferences_provider.dart';

const _themeModePreferenceKey = 'app_theme_mode';

class AppThemeState {
  const AppThemeState({
    required this.lightTheme,
    required this.darkTheme,
    required this.tokens,
    required this.mode,
  });

  final ThemeData lightTheme;
  final ThemeData darkTheme;
  final DesignTokens tokens;
  final ThemeMode mode;

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

  AppThemeState copyWith({ThemeMode? mode}) {
    return AppThemeState(
      lightTheme: lightTheme,
      darkTheme: darkTheme,
      tokens: tokens,
      mode: mode ?? this.mode,
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

    return AppThemeState(
      lightTheme: gigvoraTheme.toThemeData(brightness: Brightness.light),
      darkTheme: gigvoraTheme.toThemeData(brightness: Brightness.dark),
      tokens: gigvoraTheme.tokens,
      mode: mode,
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final current = await future;
    state = AsyncValue.data(current.copyWith(mode: mode));
    final preferences = ref.read(sharedPreferencesProvider);
    await preferences.setString(_themeModePreferenceKey, mode.name);
  }

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

final appThemeControllerProvider =
    AsyncNotifierProvider<AppThemeController, AppThemeState>(AppThemeController.new);
