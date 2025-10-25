import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/push_notification_controller.dart';
import '../domain/push_permission_messaging.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pushNotificationControllerProvider);
    final controller = ref.read(pushNotificationControllerProvider.notifier);
    final theme = Theme.of(context);

    final permissionMessaging = const PushPermissionMessaging();
    final permissionMessage = permissionMessaging.describe(state);
    final statusMessage = _buildStatusMessage(context, permissionMessage);
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
          _NotificationSchedulingCard(state: state, controller: controller),
          const SizedBox(height: 24),
          Expanded(
            child: _NotificationTimeline(),
          ),
        ],
      ),
    );
  }
}

Widget _buildStatusMessage(BuildContext context, PushPermissionMessage message) {
  final textTheme = Theme.of(context).textTheme;
  final colorScheme = Theme.of(context).colorScheme;
  final toneColor = switch (message.tone) {
    PushPermissionTone.success => const Color(0xFF047857),
    PushPermissionTone.warning => colorScheme.tertiary,
    PushPermissionTone.danger => colorScheme.error,
    PushPermissionTone.unsupported => colorScheme.tertiary,
    PushPermissionTone.progress => colorScheme.onSurfaceVariant,
    PushPermissionTone.info => colorScheme.onSurfaceVariant,
  };

  final children = <Widget>[
    Text(
      message.message,
      style: textTheme.bodySmall?.copyWith(color: toneColor, fontWeight: FontWeight.w600),
    ),
  ];

  if (message.hasQuietHours && message.quietHoursStart != null && message.quietHoursEnd != null) {
    final formatter = MaterialLocalizations.of(context);
    children.add(
      Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          'Quiet hours ${formatter.formatTimeOfDay(message.quietHoursStart!)} — ${formatter.formatTimeOfDay(message.quietHoursEnd!)}',
          style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
      ),
    );
  }

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: children,
  );
}

class _NotificationSchedulingCard extends StatelessWidget {
  const _NotificationSchedulingCard({required this.state, required this.controller});

  final PushNotificationState state;
  final PushNotificationController controller;

  Future<void> _pickTime(
    BuildContext context,
    TimeOfDay initial,
    Future<void> Function(TimeOfDay time) onSelected,
  ) async {
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked != null) {
      await onSelected(picked);
    }
  }

  String _formatTime(BuildContext context, TimeOfDay time) {
    return MaterialLocalizations.of(context).formatTimeOfDay(time);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final schedule = state.schedule;
    final saving = state.isSavingSchedule;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Scheduling preferences', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Control quiet hours and daily digests so alerts arrive when they’re most helpful.',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: schedule.quietHoursEnabled,
            onChanged: saving ? null : (value) => controller.toggleQuietHours(value),
            title: const Text('Quiet hours'),
            subtitle: Text(
              schedule.quietHoursEnabled
                  ? 'Mute alerts overnight.'
                  : 'Deliver alerts at any time. Enable quiet hours to mute overnight notifications.',
            ),
          ),
          if (schedule.quietHoursEnabled)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 16),
              child: Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  OutlinedButton.icon(
                    onPressed: saving
                        ? null
                        : () => _pickTime(context, schedule.quietHoursStart, controller.updateQuietHoursStart),
                    icon: const Icon(Icons.nightlight_round),
                    label: Text('Start ${_formatTime(context, schedule.quietHoursStart)}'),
                  ),
                  OutlinedButton.icon(
                    onPressed: saving
                        ? null
                        : () => _pickTime(context, schedule.quietHoursEnd, controller.updateQuietHoursEnd),
                    icon: const Icon(Icons.wb_twilight),
                    label: Text('End ${_formatTime(context, schedule.quietHoursEnd)}'),
                  ),
                ],
              ),
            ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: schedule.digestEnabled,
            onChanged: saving ? null : (value) => controller.toggleDigest(value),
            title: const Text('Daily digest'),
            subtitle: Text(
              schedule.digestEnabled
                  ? 'Daily summary at ${_formatTime(context, schedule.digestTime)}.'
                  : 'Send a daily digest with highlights and mentions.',
            ),
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: saving || !schedule.digestEnabled
                  ? null
                  : () => _pickTime(context, schedule.digestTime, controller.updateDigestTime),
              icon: const Icon(Icons.schedule_outlined),
              label: Text('Digest time ${_formatTime(context, schedule.digestTime)}'),
            ),
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
