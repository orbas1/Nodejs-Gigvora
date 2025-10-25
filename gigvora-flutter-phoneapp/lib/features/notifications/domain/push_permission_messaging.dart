import 'package:flutter/material.dart';

import '../application/push_notification_controller.dart';
import 'notification_schedule.dart';

enum PushPermissionTone { info, success, warning, danger, unsupported, progress }

class PushPermissionMessage {
  const PushPermissionMessage({
    required this.message,
    required this.tone,
    this.quietHoursRange,
  });

  final String message;
  final PushPermissionTone tone;
  final _QuietHoursRange? quietHoursRange;
}

class PushPermissionMessaging {
  const PushPermissionMessaging();

  PushPermissionMessage describe(PushNotificationState state) {
    if (state.hasError) {
      return const PushPermissionMessage(
        message: 'We could not update your notification settings. Try again or check your connection.',
        tone: PushPermissionTone.danger,
      );
    }

    if (state.isRequesting) {
      return const PushPermissionMessage(
        message: 'Requesting permission…',
        tone: PushPermissionTone.progress,
      );
    }

    if (state.isRegistering) {
      return const PushPermissionMessage(
        message: 'Registering this device for alerts…',
        tone: PushPermissionTone.progress,
      );
    }

    if (!state.isSupported || state.status == PushPermissionStatus.notSupported) {
      return const PushPermissionMessage(
        message: 'Push notifications are not available on this device.',
        tone: PushPermissionTone.unsupported,
      );
    }

    switch (state.status) {
      case PushPermissionStatus.granted:
        final schedule = state.schedule;
        return PushPermissionMessage(
          message: schedule.quietHoursEnabled
              ? 'Push alerts are enabled. Quiet hours are active during the window below.'
              : 'Push alerts are enabled. Enable quiet hours when you need downtime.',
          tone: PushPermissionTone.success,
          quietHoursRange: schedule.quietHoursEnabled
              ? _QuietHoursRange(schedule.quietHoursStart, schedule.quietHoursEnd)
              : null,
        );
      case PushPermissionStatus.provisional:
        return const PushPermissionMessage(
          message: 'Time-sensitive alerts are enabled. Promote to full alerts in system settings for complete notifications.',
          tone: PushPermissionTone.warning,
        );
      case PushPermissionStatus.denied:
        return const PushPermissionMessage(
          message: 'Notifications are turned off. Enable them in system settings to receive real-time updates.',
          tone: PushPermissionTone.danger,
        );
      case PushPermissionStatus.unknown:
        return const PushPermissionMessage(
          message: 'Push alerts are ready whenever you are. Enable them to stay connected in real time.',
          tone: PushPermissionTone.info,
        );
      case PushPermissionStatus.notSupported:
        return const PushPermissionMessage(
          message: 'Push notifications are not available on this device.',
          tone: PushPermissionTone.unsupported,
        );
    }
  }
}

class _QuietHoursRange {
  const _QuietHoursRange(this.start, this.end);

  final TimeOfDay start;
  final TimeOfDay end;
}

extension PushPermissionMessageQuietHours on PushPermissionMessage {
  bool get hasQuietHours => quietHoursRange != null;

  TimeOfDay? get quietHoursStart => quietHoursRange?.start;

  TimeOfDay? get quietHoursEnd => quietHoursRange?.end;
}
