import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../application/group_directory_controller.dart';
import '../application/group_profile_controller.dart';
import '../data/models/group_models.dart';

class GroupProfileScreen extends ConsumerWidget {
  const GroupProfileScreen({required this.groupId, super.key});

  final String groupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(groupProfileControllerProvider(groupId));
    final controller = ref.read(groupProfileControllerProvider(groupId).notifier);
    final profile = state.resource.data;
    final theme = Theme.of(context);

    return GigvoraScaffold(
      title: profile?.name ?? 'Community profile',
      subtitle: profile?.summary ?? 'Discover the collective intelligence powering Gigvora.',
      actions: [
        IconButton(
          tooltip: 'Refresh',
          onPressed: state.resource.loading ? null : () => controller.refresh(),
          icon: state.resource.loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            if (state.feedback != null)
              _FeedbackBanner(message: state.feedback!),
            if (state.accessDenied)
              _AccessDeniedCard(
                message:
                    'Your current workspace does not have access to this community. Switch to a community-enabled role or request access from a community manager.',
              ),
            if (state.resource.loading && profile == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.resource.hasError && profile == null)
              _ErrorCard(error: state.resource.error, onRetry: controller.refresh),
            if (profile != null) ...[
              _ProfileHero(profile: profile, pending: state.pending, onJoin: controller.join, onLeave: controller.leave),
              const SizedBox(height: 20),
              _StatsSection(stats: profile.stats, insights: profile.insights),
              const SizedBox(height: 20),
              if (profile.membershipBreakdown.isNotEmpty)
                _MembershipBreakdownSection(entries: profile.membershipBreakdown),
              if (profile.membershipBreakdown.isNotEmpty) const SizedBox(height: 20),
              if (profile.upcomingEvents.isNotEmpty)
                _UpcomingEventsSection(events: profile.upcomingEvents),
              if (profile.upcomingEvents.isNotEmpty) const SizedBox(height: 20),
              if (profile.leadership.isNotEmpty)
                _LeadershipSection(leaders: profile.leadership),
              if (profile.leadership.isNotEmpty) const SizedBox(height: 20),
              if (profile.resources.isNotEmpty)
                _ResourceSection(resources: profile.resources),
              if (profile.resources.isNotEmpty) const SizedBox(height: 20),
              if (profile.guidelines.isNotEmpty)
                _GuidelineSection(guidelines: profile.guidelines),
              if (profile.guidelines.isNotEmpty) const SizedBox(height: 20),
              if (profile.timeline.isNotEmpty)
                _TimelineSection(entries: profile.timeline),
              if (profile.timeline.isNotEmpty) const SizedBox(height: 20),
              if (profile.membership.isMember)
                _NotificationPreferencesSection(
                  preferences: profile.membership.preferences.notifications,
                  pending: state.pending,
                  onChanged: controller.updateNotifications,
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.profile,
    required this.pending,
    required this.onJoin,
    required this.onLeave,
  });

  final GroupProfile profile;
  final bool pending;
  final VoidCallback onJoin;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = _parseColor(profile.accentColor);
    final isMember = profile.membership.isMember;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [accent.withOpacity(0.85), accent.withOpacity(0.45)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            profile.name,
            style: theme.textTheme.headlineSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Text(
            profile.description,
            style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white.withOpacity(0.9)),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: profile.focusAreas
                .map((area) => Chip(
                      label: Text(area),
                      backgroundColor: Colors.white.withOpacity(0.2),
                      labelStyle: const TextStyle(color: Colors.white),
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              FilledButton(
                onPressed: pending
                    ? null
                    : isMember
                        ? onLeave
                        : profile.joinPolicy == 'invite_only'
                            ? null
                            : onJoin,
                style: FilledButton.styleFrom(backgroundColor: Colors.white),
                child: pending
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(
                        isMember
                            ? 'Leave community'
                            : profile.joinPolicy == 'invite_only'
                                ? 'Invite only'
                                : 'Join community',
                        style: TextStyle(color: accent, fontWeight: FontWeight.w600),
                      ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withOpacity(0.6)),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sharing tools are coming soon.')),
                  );
                },
                child: const Text('Share profile'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  const _StatsSection({required this.stats, required this.insights});

  final GroupStats stats;
  final GroupInsights insights;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Performance pulse', style: theme.textTheme.titleMedium),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 480;
              final tiles = [
                _MetricTile(label: 'Total members', value: _formatNumber(stats.memberCount)),
                _MetricTile(label: 'Weekly active', value: _formatNumber(stats.weeklyActiveMembers)),
                _MetricTile(label: 'Opportunities shared', value: _formatNumber(stats.opportunitiesSharedThisWeek)),
                _MetricTile(label: 'Retention rate', value: '${(stats.retentionRate * 100).round()}%'),
              ];
              if (isWide) {
                return Row(
                  children: [
                    for (var i = 0; i < tiles.length; i++) ...[
                      Expanded(child: tiles[i]),
                      if (i != tiles.length - 1) const SizedBox(width: 16),
                    ],
                  ],
                );
              }
              return Column(
                children: [
                  for (var i = 0; i < tiles.length; i++) ...[
                    tiles[i],
                    if (i != tiles.length - 1) const SizedBox(height: 12),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: 20),
          if (insights.trendingTopics.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Trending topics', style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: insights.trendingTopics
                      .map(
                        (topic) => Chip(
                          label: Text(topic),
                          backgroundColor: theme.colorScheme.surfaceVariant,
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _MembershipBreakdownSection extends StatelessWidget {
  const _MembershipBreakdownSection({required this.entries});

  final List<GroupMembershipBreakdown> entries;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = entries.fold<int>(0, (sum, entry) => sum + entry.count);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Membership roles', style: theme.textTheme.titleMedium),
          const SizedBox(height: 16),
          for (final entry in entries) ...[
            _RoleProgressTile(entry: entry, total: total),
            if (entry != entries.last) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _RoleProgressTile extends StatelessWidget {
  const _RoleProgressTile({required this.entry, required this.total});

  final GroupMembershipBreakdown entry;
  final int total;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ratio = total == 0 ? 0.0 : entry.count / total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(entry.role.isEmpty ? 'Member' : entry.role, style: theme.textTheme.bodyMedium),
            const Spacer(),
            Text('${entry.count}', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: LinearProgressIndicator(value: ratio.clamp(0.0, 1.0)),
        ),
      ],
    );
  }
}

class _UpcomingEventsSection extends StatelessWidget {
  const _UpcomingEventsSection({required this.events});

  final List<GroupEvent> events;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Upcoming events', style: theme.textTheme.titleMedium),
          const SizedBox(height: 16),
          for (final event in events) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.event_available),
              title: Text(event.title),
              subtitle: Text(event.startAt != null ? _formatDateTime(event.startAt!) : 'Schedule to be announced'),
              trailing: event.registrationRequired
                  ? const Chip(label: Text('Registration'))
                  : const SizedBox.shrink(),
            ),
            if (event != events.last) const Divider(height: 20),
          ],
        ],
      ),
    );
  }
}

class _LeadershipSection extends StatelessWidget {
  const _LeadershipSection({required this.leaders});

  final List<GroupLeader> leaders;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Community leadership', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          for (final leader in leaders) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text(leader.name.isNotEmpty ? leader.name[0] : '?'),
              ),
              title: Text(leader.name),
              subtitle: Text([
                if (leader.role != null && leader.role!.isNotEmpty) leader.role,
                if (leader.title != null && leader.title!.isNotEmpty) leader.title,
              ].whereType<String>().join(' • ')),
            ),
            if (leader != leaders.last) const Divider(height: 16),
          ],
        ],
      ),
    );
  }
}

class _ResourceSection extends StatelessWidget {
  const _ResourceSection({required this.resources});

  final List<GroupResource> resources;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Featured resources', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          for (final resource in resources) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.link),
              title: Text(resource.title),
              subtitle: Text(resource.type),
              trailing: IconButton(
                icon: const Icon(Icons.copy_all),
                tooltip: 'Copy link',
                onPressed: () => Clipboard.setData(ClipboardData(text: resource.url)),
              ),
            ),
            if (resource != resources.last) const Divider(height: 16),
          ],
        ],
      ),
    );
  }
}

class _GuidelineSection extends StatelessWidget {
  const _GuidelineSection({required this.guidelines});

  final List<String> guidelines;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Community guidelines', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          for (final guideline in guidelines) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('• '),
                Expanded(
                  child: Text(guideline, style: theme.textTheme.bodyMedium),
                ),
              ],
            ),
            if (guideline != guidelines.last) const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _TimelineSection extends StatelessWidget {
  const _TimelineSection({required this.entries});

  final List<GroupTimelineEntry> entries;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Community timeline', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          for (final entry in entries) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.bolt, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.label, style: theme.textTheme.titleSmall),
                      if (entry.occursAt != null)
                        Text(
                          _formatDateTime(entry.occursAt!),
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      if (entry.description != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(entry.description!),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (entry != entries.last) const Divider(height: 24),
          ],
        ],
      ),
    );
  }
}

class _NotificationPreferencesSection extends StatelessWidget {
  const _NotificationPreferencesSection({
    required this.preferences,
    required this.pending,
    required this.onChanged,
  });

  final GroupNotificationPreferences preferences;
  final bool pending;
  final ValueChanged<GroupNotificationPreferences> onChanged;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.notifications_active),
              const SizedBox(width: 12),
              Text('Notification preferences', style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            title: const Text('Digest updates'),
            subtitle: const Text('Weekly summary of highlights'),
            value: preferences.digest,
            onChanged: pending ? null : (value) => onChanged(preferences.copyWith(digest: value)),
          ),
          SwitchListTile(
            title: const Text('New thread alerts'),
            subtitle: const Text('Immediate notification when conversations spark'),
            value: preferences.newThread,
            onChanged: pending ? null : (value) => onChanged(preferences.copyWith(newThread: value)),
          ),
          SwitchListTile(
            title: const Text('Upcoming event reminders'),
            subtitle: const Text('Receive reminders for community programming'),
            value: preferences.upcomingEvent,
            onChanged: pending ? null : (value) => onChanged(preferences.copyWith(upcomingEvent: value)),
          ),
        ],
      ),
    );
  }
}

class _FeedbackBanner extends StatelessWidget {
  const _FeedbackBanner({required this.message});

  final GroupFeedbackMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = switch (message.type) {
      GroupFeedbackType.success => (
          background: Colors.green.shade100,
          foreground: Colors.green.shade800,
          icon: Icons.check_circle_outline,
        ),
      GroupFeedbackType.neutral => (
          background: theme.colorScheme.surfaceVariant,
          foreground: theme.colorScheme.onSurface,
          icon: Icons.info_outline,
        ),
      GroupFeedbackType.error => (
          background: Colors.red.shade100,
          foreground: Colors.red.shade800,
          icon: Icons.error_outline,
        ),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(24),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(colors.icon, color: colors.foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message.message,
              style: theme.textTheme.bodyMedium?.copyWith(color: colors.foreground),
            ),
          ),
        ],
      ),
    );
  }
}

class _AccessDeniedCard extends StatelessWidget {
  const _AccessDeniedCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield, color: theme.colorScheme.onErrorContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.error, required this.onRetry});

  final Object? error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('We hit a snag', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(error?.toString() ?? 'Unable to load this community.'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onRetry,
            child: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

Color _parseColor(String value) {
  var hex = value.replaceAll('#', '').trim();
  if (hex.length == 3) {
    hex = hex.split('').map((char) => '$char$char').join();
  }
  if (hex.length == 6) {
    hex = 'ff$hex';
  }
  final parsed = int.tryParse(hex, radix: 16) ?? 0xff2563eb;
  return Color(parsed);
}

String _formatNumber(num value) {
  if (value >= 1000) {
    final condensed = (value / 1000).toStringAsFixed(1);
    return '${condensed.endsWith('.0') ? condensed.substring(0, condensed.length - 2) : condensed}k';
  }
  return value.toString();
}

String _formatDateTime(DateTime value) {
  final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  final month = months[value.month - 1];
  final weekday = weekdays[value.weekday - 1];
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$weekday, $month ${value.day} · $hour:$minute';
}
