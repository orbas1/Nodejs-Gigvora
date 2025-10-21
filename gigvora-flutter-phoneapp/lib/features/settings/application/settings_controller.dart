import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/account_settings.dart';
import '../data/settings_repository.dart';

class SettingsController extends StateNotifier<ResourceState<AccountSettings>> {
  SettingsController(this._repository, this._analytics)
      : super(ResourceState<AccountSettings>.loading()) {
    unawaited(_initialise());
  }

  final SettingsRepository _repository;
  final AnalyticsService _analytics;

  Future<void> _initialise() async {
    try {
      await load();
    } catch (error, stackTrace) {
      debugPrint('Settings bootstrap failed: $error');
      debugPrint('$stackTrace');
    }
  }

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchSettings(forceRefresh: forceRefresh);
      state = ResourceState<AccountSettings>(
        data: result.data,
        loading: false,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
        error: result.error,
      );
    } catch (error, stackTrace) {
      state = ResourceState<AccountSettings>.error(
        error,
        data: state.data,
        fromCache: state.fromCache,
        lastUpdated: state.lastUpdated,
      );
      debugPrint('Unable to load settings: $error');
      debugPrint('$stackTrace');
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> updateNotifications(NotificationPreferences preferences) async {
    final current = state.data ?? AccountSettings.demo();
    final optimistic = current.copyWith(
      notifications: preferences,
      updatedAt: DateTime.now(),
    );
    state = state.copyWith(data: optimistic, loading: true, error: null);
    try {
      final persisted = await _repository.updateNotifications(preferences);
      state = state.copyWith(
        data: persisted,
        loading: false,
        lastUpdated: DateTime.now(),
      );
      unawaited(_analytics.track('mobile_settings_updated', context: {
        'section': 'notifications',
        'delivery': preferences.weeklyReportDay,
      }));
    } catch (error) {
      state = state.copyWith(
        data: current,
        loading: false,
        error: error,
      );
    }
  }

  Future<void> updatePrivacy(PrivacyPreferences preferences) async {
    final current = state.data ?? AccountSettings.demo();
    final optimistic = current.copyWith(
      privacy: preferences,
      updatedAt: DateTime.now(),
    );
    state = state.copyWith(data: optimistic, loading: true, error: null);
    try {
      final persisted = await _repository.updatePrivacy(preferences);
      state = state.copyWith(
        data: persisted,
        loading: false,
        lastUpdated: DateTime.now(),
      );
      unawaited(_analytics.track('mobile_settings_updated', context: {
        'section': 'privacy',
        'discoverable': preferences.profileDiscoverable,
      }));
    } catch (error) {
      state = state.copyWith(
        data: current,
        loading: false,
        error: error,
      );
    }
  }

  Future<void> updateSecurity(SecurityPreferences preferences) async {
    final current = state.data ?? AccountSettings.demo();
    final optimistic = current.copyWith(
      security: preferences,
      updatedAt: DateTime.now(),
    );
    state = state.copyWith(data: optimistic, loading: true, error: null);
    try {
      final persisted = await _repository.updateSecurity(preferences);
      state = state.copyWith(
        data: persisted,
        loading: false,
        lastUpdated: DateTime.now(),
      );
      unawaited(_analytics.track('mobile_settings_updated', context: {
        'section': 'security',
        'twoFactor': preferences.twoFactorEnabled,
      }));
    } catch (error) {
      state = state.copyWith(
        data: current,
        loading: false,
        error: error,
      );
    }
  }

  Future<void> updateWorkspace(WorkspacePreferences preferences) async {
    final current = state.data ?? AccountSettings.demo();
    final optimistic = current.copyWith(
      workspace: preferences,
      updatedAt: DateTime.now(),
    );
    state = state.copyWith(data: optimistic, loading: true, error: null);
    try {
      final persisted = await _repository.updateWorkspace(preferences);
      state = state.copyWith(
        data: persisted,
        loading: false,
        lastUpdated: DateTime.now(),
      );
      unawaited(_analytics.track('mobile_settings_updated', context: {
        'section': 'workspace',
        'timezone': preferences.timezone,
      }));
    } catch (error) {
      state = state.copyWith(
        data: current,
        loading: false,
        error: error,
      );
    }
  }
}

final settingsControllerProvider =
    StateNotifierProvider<SettingsController, ResourceState<AccountSettings>>((ref) {
  final repository = ref.watch(settingsRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return SettingsController(repository, analytics);
});
