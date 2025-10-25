import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../shared_preferences_provider.dart';
import 'gigvora_localizations.dart';

const _languageStorageKey = 'gigvora.preferredLanguage';

class LanguageController extends StateNotifier<Locale> {
  LanguageController(this._preferences) : super(_initialLocale(_preferences)) {
    _syncIntl(state);
  }

  final SharedPreferences _preferences;

  static Locale _initialLocale(SharedPreferences preferences) {
    final storedCode = preferences.getString(_languageStorageKey);
    final storedLocale = GigvoraLocalizations.supportedLocaleFromCode(storedCode);
    if (storedLocale != null) {
      return storedLocale;
    }
    final locales = WidgetsBinding.instance.platformDispatcher.locales;
    return GigvoraLocalizations.resolveLocales(locales);
  }

  Future<void> setLanguageCode(String code) async {
    final resolved = GigvoraLocalizations.supportedLocaleFromCode(code) ?? GigvoraLocalizations.defaultLocale;
    await _applyLocale(resolved);
  }

  Future<void> _applyLocale(Locale locale) async {
    if (state == locale) {
      return;
    }
    state = locale;
    _syncIntl(locale);
    await _preferences.setString(_languageStorageKey, locale.languageCode);
  }

  void _syncIntl(Locale locale) {
    Intl.defaultLocale = locale.languageCode;
  }
}

final languageControllerProvider = StateNotifierProvider<LanguageController, Locale>((ref) {
  final preferences = ref.watch(sharedPreferencesProvider);
  return LanguageController(preferences);
});
