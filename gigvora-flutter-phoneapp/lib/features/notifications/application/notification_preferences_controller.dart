import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../auth/application/session_controller.dart';
import '../../core/providers.dart';
import '../data/notification_preferences_repository.dart';

class NotificationPreferencesController
    extends StateNotifier<ResourceState<NotificationPreferenceSnapshot>> {
  NotificationPreferencesController(this._repository, this._analytics, this._ref)
      : super(ResourceState<NotificationPreferenceSnapshot>.loading(null, const {
          'updatingQuietHours': false,
        })) {
    load();
  }

  final NotificationPreferencesRepository _repository;
  final AnalyticsService _analytics;
  final Ref _ref;
  bool _initialised = false;

  Future<void> load({bool forceRefresh = false}) async {
    final userId = _resolveUserId();
    if (userId == null) {
      state = ResourceState<NotificationPreferenceSnapshot>.error(
        StateError('An active session is required to manage notifications.'),
        metadata: state.metadata,
      );
      return;
    }
    if (_initialised && !forceRefresh) {
      return;
    }
    _initialised = true;
    state = state.copyWith(loading: true, error: null);
    try {
      final preferences = await _repository.fetchPreferences(userId: userId);
      state = ResourceState<NotificationPreferenceSnapshot>(
        data: preferences,
        loading: false,
        error: null,
        fromCache: false,
        metadata: state.metadata,
      );
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
    }
  }

  Future<void> updateQuietHours(TimeOfDay? start, TimeOfDay? end) async {
    final userId = _requireUserId();
    final metadata = Map<String, dynamic>.from(state.metadata);
    metadata['updatingQuietHours'] = true;
    state = state.copyWith(metadata: metadata);
    try {
      final patch = <String, dynamic>{
        'quietHoursStart': start != null ? _formatTime(start) : null,
        'quietHoursEnd': end != null ? _formatTime(end) : null,
      };
      final preferences = await _repository.updatePreferences(userId: userId, patch: patch);
      state = ResourceState<NotificationPreferenceSnapshot>(
        data: preferences,
        loading: false,
        error: null,
        fromCache: false,
        metadata: {...metadata, 'updatingQuietHours': false},
      );
      await _analytics.track(
        'mobile_notifications_quiet_hours_updated',
        context: {
          'start': preferences.quietHoursStart ?? 'none',
          'end': preferences.quietHoursEnd ?? 'none',
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = state.copyWith(
        error: error,
        metadata: {...metadata, 'updatingQuietHours': false},
      );
    }
  }

  int? _resolveUserId() {
    final session = _ref.read(sessionControllerProvider);
    return session.actorId;
  }

  int _requireUserId() {
    final userId = _resolveUserId();
    if (userId == null) {
      throw StateError('An authenticated session is required to update notifications.');
    }
    return userId;
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

final notificationPreferencesControllerProvider = StateNotifierProvider<
    NotificationPreferencesController, ResourceState<NotificationPreferenceSnapshot>>>((ref) {
  final repository = ref.watch(notificationPreferencesRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final controller = NotificationPreferencesController(repository, analytics, ref);
  ref.onDispose(controller.dispose);
  return controller;
});
