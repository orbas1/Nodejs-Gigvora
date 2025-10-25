import '../../../theme/severity.dart';
import '../application/push_notification_controller.dart';

class PermissionCopy {
  const PermissionCopy({
    required this.headline,
    required this.message,
    this.severity = SeverityLevel.neutral,
  });

  final String headline;
  final String message;
  final SeverityLevel severity;
}

class PushPermissionMessaging {
  const PushPermissionMessaging._();

  static PermissionCopy resolveStatus(PushNotificationState state) {
    if (state.isRequesting) {
      return const PermissionCopy(
        headline: 'Requesting permission…',
        message: 'We\'re asking your device for push notification access.',
        severity: SeverityLevel.info,
      );
    }
    if (state.isRegistering) {
      return const PermissionCopy(
        headline: 'Registering this device…',
        message: 'Finalising secure registration so alerts arrive reliably.',
        severity: SeverityLevel.info,
      );
    }
    if (!state.isSupported) {
      return const PermissionCopy(
        headline: 'Push alerts unsupported',
        message: 'Notifications aren\'t available on this device.',
        severity: SeverityLevel.warning,
      );
    }
    switch (state.status) {
      case PushPermissionStatus.granted:
        return const PermissionCopy(
          headline: 'Push alerts enabled',
          message: 'You\'ll receive invites, mentions, and updates instantly.',
          severity: SeverityLevel.success,
        );
      case PushPermissionStatus.provisional:
        return const PermissionCopy(
          headline: 'Time-sensitive alerts active',
          message: 'Promote to full alerts in settings for richer engagement cues.',
          severity: SeverityLevel.info,
        );
      case PushPermissionStatus.denied:
        return const PermissionCopy(
          headline: 'Notifications are disabled',
          message: 'Enable alerts in system settings to stay connected in real-time.',
          severity: SeverityLevel.danger,
        );
      case PushPermissionStatus.unknown:
        return const PermissionCopy(
          headline: 'Push alerts ready when you are',
          message: 'Turn on notifications to receive network updates instantly.',
          severity: SeverityLevel.neutral,
        );
      case PushPermissionStatus.notSupported:
        return const PermissionCopy(
          headline: 'Push alerts unsupported',
          message: 'Notifications aren\'t available on this device.',
          severity: SeverityLevel.warning,
        );
    }
  }

  static PermissionCopy resolveEnablePrompt(PushPermissionStatus status) {
    switch (status) {
      case PushPermissionStatus.denied:
        return const PermissionCopy(
          headline: 'Enable push alerts',
          message: 'Push alerts were previously disabled. Re-enable them to receive reactions and comments instantly.',
          severity: SeverityLevel.warning,
        );
      case PushPermissionStatus.granted:
        return const PermissionCopy(
          headline: 'Push alerts active',
          message: 'Real-time reactions and comments are enabled.',
          severity: SeverityLevel.success,
        );
      case PushPermissionStatus.provisional:
        return const PermissionCopy(
          headline: 'Partial alerts enabled',
          message: 'Upgrade to full notifications for richer community signals.',
          severity: SeverityLevel.info,
        );
      case PushPermissionStatus.notSupported:
        return const PermissionCopy(
          headline: 'Push alerts unsupported',
          message: 'Notifications are unavailable on this device.',
          severity: SeverityLevel.warning,
        );
      case PushPermissionStatus.unknown:
      default:
        return const PermissionCopy(
          headline: 'Enable push alerts',
          message: 'Stay in the loop when your posts spark activity. Enable push alerts for real-time nudges.',
          severity: SeverityLevel.neutral,
        );
    }
  }
}
