import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/push_notification_controller.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushNotificationControllerProvider);
    final controller = ref.read(pushNotificationControllerProvider.notifier);
    final theme = Theme.of(context);

    final statusMessage = _buildStatusMessage(context, state);
    final isBusy = state.isRequesting || state.isRegistering;
    final canRequest = state.isSupported && state.status != PushPermissionStatus.granted;

    return GigvoraScaffold(
      title: 'Notifications',
      subtitle: 'Stay in sync with your network',
      actions: [
        IconButton(
          tooltip: 'Refresh status',
          onPressed: () => controller.refreshStatus(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        Icons.notifications_active_outlined,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Enable push alerts',
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Receive instant invites, follows, comments, and activity updates even when the app is closed.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (statusMessage != null) ...[
                  const SizedBox(height: 12),
                  statusMessage,
                ],
                if (state.hasError)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      'Something went wrong while enabling push alerts.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    ElevatedButton(
                      onPressed: canRequest && !isBusy ? () => controller.requestPermission() : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        textStyle: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      child: isBusy
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(canRequest ? 'Enable push alerts' : 'Enabled'),
                    ),
                    if (state.status == PushPermissionStatus.denied) ...[
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: () => controller.openSettings(),
                        child: const Text('Open settings'),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _NotificationTimeline(),
          ),
        ],
      ),
    );
  }
}

Widget? _buildStatusMessage(BuildContext context, PushNotificationState state) {
  final textTheme = Theme.of(context).textTheme;
  final colorScheme = Theme.of(context).colorScheme;

  if (state.isRequesting) {
    return Text(
      'Requesting permission…',
      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
    );
  }

  if (state.isRegistering) {
    return Text(
      'Registering this device for alerts…',
      style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
    );
  }

  if (!state.isSupported) {
    return Text(
      'Push notifications are not supported on this device.',
      style: textTheme.bodySmall?.copyWith(color: colorScheme.tertiary, fontWeight: FontWeight.w600),
    );
  }

  return switch (state.status) {
    PushPermissionStatus.granted => Text(
        'Push alerts enabled for this device.',
        style: textTheme.bodySmall?.copyWith(color: const Color(0xFF047857), fontWeight: FontWeight.w600),
      ),
    PushPermissionStatus.provisional => Text(
        'Time-sensitive alerts enabled. Promote to full alerts in system settings for rich updates.',
        style: textTheme.bodySmall?.copyWith(color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
      ),
    PushPermissionStatus.denied => Text(
        'Notifications are disabled. Enable them in system settings to receive real-time alerts.',
        style: textTheme.bodySmall?.copyWith(color: colorScheme.error, fontWeight: FontWeight.w600),
      ),
    PushPermissionStatus.unknown => Text(
        'Push alerts are ready when you are. Enable them to stay connected in real-time.',
        style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
      ),
    PushPermissionStatus.notSupported => Text(
        'Push notifications are not supported on this device.',
        style: textTheme.bodySmall?.copyWith(color: colorScheme.tertiary, fontWeight: FontWeight.w600),
      ),
  };
}

class _NotificationTimeline extends ConsumerWidget {
  const _NotificationTimeline();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushNotificationControllerProvider);
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      children: [
        if (state.lastUpdated != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'Permission status updated ${formatRelativeTime(state.lastUpdated!)}',
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ),
        Container(
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colorScheme.outlineVariant.withOpacity(0.5)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.inbox_outlined,
                size: 40,
                color: colorScheme.onSurfaceVariant.withOpacity(0.6),
              ),
              const SizedBox(height: 12),
              Text(
                'You’re all caught up. New activity will land here first.',
                style: textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
