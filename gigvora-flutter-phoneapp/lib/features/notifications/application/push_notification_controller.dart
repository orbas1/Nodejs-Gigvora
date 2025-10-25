import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/notification_schedule_repository.dart';
import '../domain/notification_schedule.dart';

class PushNotificationState {
  const PushNotificationState({
    required this.status,
    this.isRequesting = false,
    this.isRegistering = false,
    this.isRegistered = false,
    this.isSupported = true,
    this.error,
    this.lastUpdated,
    this.schedule = const NotificationSchedule(),
    this.isSavingSchedule = false,
  });

  factory PushNotificationState.initial() {
    return const PushNotificationState(status: PushPermissionStatus.unknown);
  }

  final PushPermissionStatus status;
  final bool isRequesting;
  final bool isRegistering;
  final bool isRegistered;
  final bool isSupported;
  final Object? error;
  final DateTime? lastUpdated;
  final NotificationSchedule schedule;
  final bool isSavingSchedule;

  bool get hasError => error != null;

  PushNotificationState copyWith({
    PushPermissionStatus? status,
    bool? isRequesting,
    bool? isRegistering,
    bool? isRegistered,
    bool? isSupported,
    Object? error,
    bool resetError = false,
    DateTime? lastUpdated,
    NotificationSchedule? schedule,
    bool? isSavingSchedule,
  }) {
    return PushNotificationState(
      status: status ?? this.status,
      isRequesting: isRequesting ?? this.isRequesting,
      isRegistering: isRegistering ?? this.isRegistering,
      isRegistered: isRegistered ?? this.isRegistered,
      isSupported: isSupported ?? this.isSupported,
      error: resetError ? null : (error ?? this.error),
      lastUpdated: lastUpdated ?? this.lastUpdated,
      schedule: schedule ?? this.schedule,
      isSavingSchedule: isSavingSchedule ?? this.isSavingSchedule,
    );
  }
}

class PushNotificationController extends StateNotifier<PushNotificationState> {
  PushNotificationController(this._service, this._scheduleRepository)
      : super(PushNotificationState.initial()) {
    unawaited(_bootstrap());
  }

  final PushNotificationService _service;
  final NotificationScheduleRepository _scheduleRepository;

  Future<void> _bootstrap() async {
    try {
      final status = await _service.getStatus();
      final schedule = await _scheduleRepository.load();
      state = state.copyWith(
        status: status,
        isSupported: status != PushPermissionStatus.notSupported,
        resetError: true,
        lastUpdated: DateTime.now(),
        schedule: schedule,
      );
    } catch (error) {
      state = state.copyWith(
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }

  Future<void> refreshStatus() async {
    try {
      final status = await _service.getStatus(refresh: true);
      state = state.copyWith(
        status: status,
        isSupported: status != PushPermissionStatus.notSupported,
        resetError: true,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }

  Future<void> requestPermission() async {
    state = state.copyWith(isRequesting: true, resetError: true);
    try {
      final status = await _service.requestPermission();
      state = state.copyWith(
        status: status,
        isRequesting: false,
        isSupported: status != PushPermissionStatus.notSupported,
        lastUpdated: DateTime.now(),
      );

      if (status == PushPermissionStatus.granted || status == PushPermissionStatus.provisional) {
        await registerDevice(metadata: {'permissionStatus': status.name});
      }
    } on PushNotificationException catch (error) {
      state = state.copyWith(
        isRequesting: false,
        error: error,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        isRequesting: false,
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }

  Future<void> registerDevice({
    String? token,
    Map<String, dynamic>? metadata,
  }) async {
    state = state.copyWith(isRegistering: true, resetError: true);
    try {
      final registered = await _service.registerDevice(
        token: token,
        metadata: metadata,
      );
      state = state.copyWith(
        isRegistering: false,
        isRegistered: registered,
        lastUpdated: DateTime.now(),
      );
    } on PushNotificationException catch (error) {
      state = state.copyWith(
        isRegistering: false,
        error: error,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        isRegistering: false,
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }

  Future<void> openSettings() async {
    try {
      await _service.openSystemSettings();
    } on PushNotificationException catch (error) {
      state = state.copyWith(
        error: error,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }

  Future<void> toggleQuietHours(bool enabled) {
    return _updateSchedule((schedule) => schedule.copyWith(quietHoursEnabled: enabled));
  }

  Future<void> updateQuietHoursStart(TimeOfDay start) {
    return _updateSchedule((schedule) => schedule.copyWith(quietHoursStart: start));
  }

  Future<void> updateQuietHoursEnd(TimeOfDay end) {
    return _updateSchedule((schedule) => schedule.copyWith(quietHoursEnd: end));
  }

  Future<void> toggleDigest(bool enabled) {
    return _updateSchedule((schedule) => schedule.copyWith(digestEnabled: enabled));
  }

  Future<void> updateDigestTime(TimeOfDay time) {
    return _updateSchedule((schedule) => schedule.copyWith(digestTime: time));
  }

  Future<void> _updateSchedule(NotificationSchedule Function(NotificationSchedule) transform) async {
    state = state.copyWith(isSavingSchedule: true, resetError: true);
    try {
      final updated = transform(state.schedule);
      final persisted = await _scheduleRepository.save(updated);
      state = state.copyWith(
        schedule: persisted,
        isSavingSchedule: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      state = state.copyWith(
        isSavingSchedule: false,
        error: error,
        lastUpdated: DateTime.now(),
      );
    }
  }
}

final pushNotificationControllerProvider =
    StateNotifierProvider<PushNotificationController, PushNotificationState>((ref) {
  final service = ref.watch(pushNotificationServiceProvider);
  final scheduleRepository = ref.watch(notificationScheduleRepositoryProvider);
  return PushNotificationController(service, scheduleRepository);
});
