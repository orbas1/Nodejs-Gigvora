import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';

class PushNotificationState {
  const PushNotificationState({
    required this.status,
    this.isRequesting = false,
    this.isRegistering = false,
    this.isRegistered = false,
    this.isSupported = true,
    this.error,
    this.lastUpdated,
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
  }) {
    return PushNotificationState(
      status: status ?? this.status,
      isRequesting: isRequesting ?? this.isRequesting,
      isRegistering: isRegistering ?? this.isRegistering,
      isRegistered: isRegistered ?? this.isRegistered,
      isSupported: isSupported ?? this.isSupported,
      error: resetError ? null : (error ?? this.error),
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

class PushNotificationController extends StateNotifier<PushNotificationState> {
  PushNotificationController(this._service) : super(PushNotificationState.initial()) {
    unawaited(_bootstrap());
  }

  final PushNotificationService _service;

  Future<void> _bootstrap() async {
    try {
      final status = await _service.getStatus();
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
}

final pushNotificationControllerProvider =
    StateNotifierProvider<PushNotificationController, PushNotificationState>((ref) {
  final service = ref.watch(pushNotificationServiceProvider);
  return PushNotificationController(service);
});
