import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../../analytics/utils/formatters.dart';
import '../application/notification_preferences_controller.dart';
import '../application/push_notification_controller.dart';
import '../domain/push_permission_copy.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushNotificationControllerProvider);
    final controller = ref.read(pushNotificationControllerProvider.notifier);
    final preferencesState = ref.watch(notificationPreferencesControllerProvider);
    final preferencesController = ref.read(notificationPreferencesControllerProvider.notifier);
    final theme = Theme.of(context);

    final statusCopy = PushPermissionMessaging.resolveStatus(state);
    final preferences = preferencesState.data;
    final updatingQuietHours = preferencesState.metadata['updatingQuietHours'] == true;
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
                _StatusMessage(copy: statusCopy),
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
          if (preferencesState.hasError)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: _StatusMessage(
                copy: PermissionCopy(
                  headline: 'Preferences unavailable',
                  message: '${preferencesState.error}',
                  severity: PermissionSeverity.warning,
                ),
              ),
            ),
          if (preferences != null)
            Padding(
              padding: const EdgeInsets.only(top: 24),
              child: _QuietHoursCard(
                snapshot: preferences,
                updating: updatingQuietHours,
                onUpdate: (start, end) => preferencesController.updateQuietHours(start, end),
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

class _NotificationTimeline extends ConsumerWidget {
  const _NotificationTimeline();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushNotificationControllerProvider);
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final notifications = _buildDemoNotifications()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return ListView(
      padding: const EdgeInsets.only(bottom: 48),
      children: [
        if (state.lastUpdated != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'Permission status updated ${formatRelativeTime(state.lastUpdated!)}',
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ),
        if (notifications.isEmpty)
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
          )
        else
          ...notifications.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _NotificationCard(entry: entry),
              )),
      ],
    );
  }
}

class _StatusMessage extends StatelessWidget {
  const _StatusMessage({required this.copy});

  final PermissionCopy copy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (Color background, Color foreground, IconData icon) = switch (copy.severity) {
      PermissionSeverity.success => (
          theme.colorScheme.primary.withOpacity(0.12),
          theme.colorScheme.primary,
          Icons.check_circle_outline,
        ),
      PermissionSeverity.warning => (
          theme.colorScheme.errorContainer.withOpacity(0.5),
          theme.colorScheme.error,
          Icons.warning_amber_outlined,
        ),
      PermissionSeverity.danger => (
          theme.colorScheme.errorContainer,
          theme.colorScheme.error,
          Icons.error_outline,
        ),
      PermissionSeverity.info => (
          theme.colorScheme.secondaryContainer.withOpacity(0.6),
          theme.colorScheme.onSecondaryContainer,
          Icons.info_outline,
        ),
      PermissionSeverity.neutral => (
          theme.colorScheme.surfaceVariant,
          theme.colorScheme.onSurfaceVariant,
          Icons.info_outline,
        ),
    };

    return Container(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  copy.headline,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: foreground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  copy.message,
                  style: theme.textTheme.bodySmall?.copyWith(color: foreground.withOpacity(0.85)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuietHoursCard extends StatelessWidget {
  const _QuietHoursCard({
    required this.snapshot,
    required this.onUpdate,
    this.updating = false,
  });

  final NotificationPreferenceSnapshot snapshot;
  final Future<void> Function(TimeOfDay? start, TimeOfDay? end) onUpdate;
  final bool updating;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final startTime = _parseTime(snapshot.quietHoursStart);
    final endTime = _parseTime(snapshot.quietHoursEnd);
    final quietHoursEnabled = startTime != null && endTime != null;

    String describeQuietHours() {
      if (!quietHoursEnabled) {
        return 'Quiet hours are disabled. Alerts will arrive at any time.';
      }
      final startLabel = _formatDisplayTime(context, startTime);
      final endLabel = _formatDisplayTime(context, endTime);
      return 'Quiet hours active from $startLabel to $endLabel in your local timezone.';
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.schedule_outlined),
              const SizedBox(width: 12),
              Text('Quiet hours', style: theme.textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            describeQuietHours(),
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: updating ? null : () => _pickQuietHours(context, startTime, endTime),
                icon: updating
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.edit_outlined),
                label: Text(updating ? 'Saving…' : 'Adjust quiet hours'),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: updating || !quietHoursEnabled
                    ? null
                    : () async {
                        await onUpdate(null, null);
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Quiet hours disabled.')),
                        );
                      },
                child: const Text('Disable'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _pickQuietHours(
    BuildContext context,
    TimeOfDay? initialStart,
    TimeOfDay? initialEnd,
  ) async {
    final start = await showTimePicker(
      context: context,
      initialTime: initialStart ?? const TimeOfDay(hour: 22, minute: 0),
    );
    if (start == null) return;
    final end = await showTimePicker(
      context: context,
      initialTime: initialEnd ?? const TimeOfDay(hour: 7, minute: 0),
    );
    if (end == null) return;
    await onUpdate(start, end);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Quiet hours updated to ${_formatDisplayTime(context, start)} – ${_formatDisplayTime(context, end)}'),
        ),
      );
    }
  }

  TimeOfDay? _parseTime(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    final parts = value.split(':');
    if (parts.length != 2) {
      return null;
    }
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) {
      return null;
    }
    return TimeOfDay(hour: hour.clamp(0, 23), minute: minute.clamp(0, 59));
  }

  String _formatDisplayTime(BuildContext context, TimeOfDay time) {
    final localizations = MaterialLocalizations.of(context);
    return localizations.formatTimeOfDay(time, alwaysUse24HourFormat: false);
  }
}

class _NotificationEntry {
  const _NotificationEntry({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.timestamp,
    this.actionLabel,
    this.actionRoute,
    this.isUnread = true,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final DateTime timestamp;
  final String? actionLabel;
  final String? actionRoute;
  final bool isUnread;
}

List<_NotificationEntry> _buildDemoNotifications() {
  final now = DateTime.now();
  return [
    _NotificationEntry(
      id: 'notif-mentorship-request',
      type: 'Mentorship',
      title: 'Nova Steele requested a design systems deep dive',
      body: 'Prep your availability for next Tuesday — the session syncs to your mentorship dashboard once confirmed.',
      timestamp: now.subtract(const Duration(minutes: 6)),
      actionLabel: 'Review request',
      actionRoute: '/dashboard/mentor',
      isUnread: true,
    ),
    _NotificationEntry(
      id: 'notif-project-invite',
      type: 'Launchpad',
      title: 'Horizon Labs invited you to lead an Experience Sprint',
      body: 'Kick-off is slated for Monday with a cross-functional squad. Confirm scoping to unlock the onboarding workspace.',
      timestamp: now.subtract(const Duration(minutes: 22)),
      actionLabel: 'Open launchpad',
      actionRoute: '/launchpad',
      isUnread: true,
    ),
    _NotificationEntry(
      id: 'notif-network',
      type: 'Network',
      title: 'Amir Rahman shared a new product strategy recap with you',
      body: 'Keep the momentum going — the async doc captures key outcomes from yesterday’s stakeholder sync.',
      timestamp: now.subtract(const Duration(hours: 1, minutes: 5)),
      actionLabel: 'Open inbox',
      actionRoute: '/inbox',
      isUnread: false,
    ),
  ];
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.entry});

  final _NotificationEntry entry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isUnread = entry.isUnread;
    final background = isUnread ? colorScheme.primary.withOpacity(0.08) : colorScheme.surface;
    final borderColor = isUnread ? colorScheme.primary.withOpacity(0.3) : colorScheme.outlineVariant.withOpacity(0.5);

    void handleTap() {
      if (entry.actionRoute != null) {
        GoRouter.of(context).go(entry.actionRoute!);
      }
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: entry.actionRoute != null ? handleTap : null,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      entry.type.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isUnread)
                    Container(
                      height: 10,
                      width: 10,
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                entry.title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                entry.body,
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formatRelativeTime(entry.timestamp),
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  if (entry.actionLabel != null)
                    OutlinedButton(
                      onPressed: entry.actionRoute != null ? handleTap : null,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: colorScheme.primary,
                        side: BorderSide(color: colorScheme.primary.withOpacity(0.4)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        textStyle: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      child: Text(entry.actionLabel!),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
