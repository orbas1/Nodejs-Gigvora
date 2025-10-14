import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../application/group_directory_controller.dart';
import '../data/models/group_models.dart';

class GroupsDirectoryScreen extends ConsumerStatefulWidget {
  const GroupsDirectoryScreen({super.key});

  @override
  ConsumerState<GroupsDirectoryScreen> createState() => _GroupsDirectoryScreenState();
}

class _GroupsDirectoryScreenState extends ConsumerState<GroupsDirectoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _updatingQuery = false;

  static const _focusSegments = [
    _FocusSegment(id: 'all', label: 'All communities'),
    _FocusSegment(id: 'future of work', label: 'Future of work'),
    _FocusSegment(id: 'experience launchpad', label: 'Launchpad alumni'),
    _FocusSegment(id: 'sustainability', label: 'Impact & volunteering'),
  ];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_handleSearchChanged);
    ref.listen<GroupDirectoryState>(groupsControllerProvider, (previous, next) {
      if (_updatingQuery) {
        return;
      }
      if (_searchController.text != next.query) {
        _updatingQuery = true;
        _searchController
          ..text = next.query
          ..selection = TextSelection.fromPosition(
            TextPosition(offset: next.query.length),
          );
        _updatingQuery = false;
      }
    });
  }

  @override
  void dispose() {
    _searchController.removeListener(_handleSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _handleSearchChanged() {
    if (_updatingQuery) {
      return;
    }
    ref.read(groupsControllerProvider.notifier).updateQuery(_searchController.text);
  }

  @override
  Widget build(BuildContext context) {
    final tokensAsync = ref.watch(designTokensProvider);
    final tokens = tokensAsync.maybeWhen(data: (value) => value, orElse: () => null);
    final state = ref.watch(groupsControllerProvider);
    final controller = ref.read(groupsControllerProvider.notifier);
    final directory = state.directory;
    final groups = directory.data?.items ?? const <GroupSummary>[];
    final theme = Theme.of(context);
    final spacingLg = (tokens?.spacing['lg'] ?? 20).toDouble();
    final spacingMd = (tokens?.spacing['md'] ?? 16).toDouble();

    return GigvoraScaffold(
      title: 'Community groups',
      subtitle: 'Curated circles accelerating collaboration across Gigvora.',
      actions: [
        IconButton(
          tooltip: 'Refresh groups',
          onPressed: directory.loading ? null : () => controller.loadDirectory(forceRefresh: true),
          icon: directory.loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.feedback != null)
            _FeedbackBanner(
              message: state.feedback!,
              margin: EdgeInsets.only(bottom: spacingMd),
            ),
          if (state.accessRestricted)
            Padding(
              padding: EdgeInsets.only(bottom: spacingMd),
              child: _AccessRestrictionNotice(tokens: tokens),
            ),
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              labelText: 'Search groups, topics, or hosts',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(tokens?.radius['lg']?.toDouble() ?? 24)),
            ),
          ),
          SizedBox(height: spacingMd),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.only(bottom: spacingMd / 2),
            child: Row(
              children: [
                for (final segment in _focusSegments)
                  Padding(
                    padding: EdgeInsets.only(right: spacingMd / 2),
                    child: ChoiceChip(
                      label: Text(segment.label),
                      selected: state.focus == segment.id,
                      onSelected: (_) => controller.updateFocus(segment.id),
                    ),
                  ),
                Padding(
                  padding: EdgeInsets.only(right: spacingMd / 2),
                  child: FilterChip(
                    label: const Text('Include quiet groups'),
                    selected: state.includeEmpty,
                    onSelected: controller.toggleIncludeEmpty,
                  ),
                ),
              ],
            ),
          ),
          if (directory.fromCache)
            Padding(
              padding: EdgeInsets.only(bottom: spacingMd / 2),
              child: _StatusBanner(
                icon: Icons.offline_bolt,
                background: theme.colorScheme.secondaryContainer,
                foreground: theme.colorScheme.onSecondaryContainer,
                message: 'Showing cached groups while we reconnect.',
              ),
            ),
          if (directory.hasError && !directory.loading)
            Padding(
              padding: EdgeInsets.only(bottom: spacingMd / 2),
              child: _StatusBanner(
                icon: Icons.error_outline,
                background: theme.colorScheme.errorContainer,
                foreground: theme.colorScheme.onErrorContainer,
                message: _describeError(directory.error),
              ),
            ),
          if (directory.lastUpdated != null)
            Padding(
              padding: EdgeInsets.only(bottom: spacingMd / 2),
              child: Text(
                'Last updated ${_formatRelative(directory.lastUpdated!)}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => controller.loadDirectory(forceRefresh: true),
              child: Builder(
                builder: (context) {
                  if (groups.isEmpty && directory.loading) {
                    return _DirectorySkeleton(spacing: spacingMd);
                  }

                  if (groups.isEmpty) {
                    return _EmptyDirectoryState(
                      onBrowse: state.accessRestricted ? null : () => controller.loadDirectory(forceRefresh: true),
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.only(bottom: spacingLg),
                    itemCount: groups.length,
                    separatorBuilder: (_, __) => SizedBox(height: spacingMd),
                    itemBuilder: (context, index) {
                      final group = groups[index];
                      final pending = state.pendingGroupSlug == group.slug;
                      return _GroupSummaryCard(
                        group: group,
                        pending: pending,
                        onJoin: () => controller.joinGroup(group),
                        onLeave: () => controller.leaveGroup(group),
                        onOpen: () => context.push('/groups/${group.slug}'),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupSummaryCard extends StatelessWidget {
  const _GroupSummaryCard({
    required this.group,
    required this.pending,
    required this.onJoin,
    required this.onLeave,
    required this.onOpen,
  });

  final GroupSummary group;
  final bool pending;
  final VoidCallback onJoin;
  final VoidCallback onLeave;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isMember = group.membership.isMember;
    final accent = _parseColor(group.accentColor);
    final upcomingEvent = group.upcomingEvents.isNotEmpty ? group.upcomingEvents.first : null;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        gradient: LinearGradient(
          colors: [
            accent.withOpacity(0.07),
            theme.colorScheme.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withOpacity(0.12),
            offset: const Offset(0, 16),
            blurRadius: 32,
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 32,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: accent.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      group.focusAreas.isNotEmpty ? group.focusAreas.first : 'Community',
                      style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurface),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                '${_formatNumber(group.stats.memberCount)} members',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(group.name, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(
            group.summary,
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          if (group.focusAreas.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: group.focusAreas
                  .map(
                    (area) => Chip(
                      label: Text(area),
                      backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.65),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 20),
          _GroupStatRow(group: group, accent: accent),
          if (upcomingEvent != null) ...[
            const SizedBox(height: 20),
            _UpcomingEventCard(event: upcomingEvent, accent: accent),
          ],
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: isMember ? onOpen : (group.inviteOnly || pending) ? null : onJoin,
                style: FilledButton.styleFrom(
                  backgroundColor: isMember ? accent : theme.colorScheme.primary,
                ),
                child: pending
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(isMember
                        ? 'Open workspace'
                        : group.inviteOnly
                            ? 'Invite only'
                            : 'Join community'),
              ),
              if (isMember)
                OutlinedButton(
                  onPressed: pending ? null : onLeave,
                  child: pending
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Leave group'),
                )
              else
                OutlinedButton(
                  onPressed: onOpen,
                  child: const Text('Learn more'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _GroupStatRow extends StatelessWidget {
  const _GroupStatRow({required this.group, required this.accent});

  final GroupSummary group;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 480;
        final children = [
          _StatTile(
            title: 'Weekly active',
            value: _formatNumber(group.stats.weeklyActiveMembers),
            subtitle: 'Members collaborating',
            accent: accent,
          ),
          _StatTile(
            title: 'Signal strength',
            value: group.insights.signalStrength,
            subtitle: 'Live discussion energy',
            accent: theme.colorScheme.primary,
          ),
          _StatTile(
            title: 'Opportunities',
            value: _formatNumber(group.stats.opportunitiesSharedThisWeek),
            subtitle: 'Shared this week',
            accent: theme.colorScheme.secondary,
          ),
        ];
        if (isWide) {
          return Row(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                Expanded(child: children[i]),
                if (i != children.length - 1) const SizedBox(width: 16),
              ],
            ],
          );
        }
        return Column(
          children: [
            for (var i = 0; i < children.length; i++) ...[
              children[i],
              if (i != children.length - 1) const SizedBox(height: 12),
            ],
          ],
        );
      },
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.accent,
  });

  final String title;
  final String value;
  final String subtitle;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(color: accent, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _UpcomingEventCard extends StatelessWidget {
  const _UpcomingEventCard({required this.event, required this.accent});

  final GroupEvent event;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: accent.withOpacity(0.08),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.event, color: accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(
                  event.startAt != null ? _formatDateTime(event.startAt!) : 'Schedule to be announced',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
                if (event.host?.name != null)
                  Text(
                    event.host!.name,
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
              ],
            ),
          ),
          if (event.registrationRequired)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: accent.withOpacity(0.18),
              ),
              child: Text(
                'Registration',
                style: theme.textTheme.labelSmall?.copyWith(color: accent, fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.background,
    required this.foreground,
    required this.message,
  });

  final IconData icon;
  final Color background;
  final Color foreground;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: foreground),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedbackBanner extends StatelessWidget {
  const _FeedbackBanner({required this.message, this.margin});

  final GroupFeedbackMessage message;
  final EdgeInsets? margin;

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
      margin: margin,
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(20),
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

class _AccessRestrictionNotice extends StatelessWidget {
  const _AccessRestrictionNotice({required this.tokens});

  final dynamic tokens;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(tokens?.radius['lg']?.toDouble() ?? 24),
        border: Border.all(color: theme.colorScheme.error.withOpacity(0.3)),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield, color: theme.colorScheme.onErrorContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Community access requires a verified membership.',
                  style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.onErrorContainer),
                ),
                const SizedBox(height: 4),
                Text(
                  'Switch to a freelancer, agency, company, mentor, or headhunter workspace to unlock community groups.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onErrorContainer),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DirectorySkeleton extends StatelessWidget {
  const _DirectorySkeleton({required this.spacing});

  final double spacing;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 3,
      padding: EdgeInsets.only(bottom: spacing),
      separatorBuilder: (_, __) => SizedBox(height: spacing),
      itemBuilder: (context, index) {
        return ShimmerWidget(height: 260);
      },
    );
  }
}

class ShimmerWidget extends StatelessWidget {
  const ShimmerWidget({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
        borderRadius: BorderRadius.circular(28),
      ),
    );
  }
}

class _EmptyDirectoryState extends StatelessWidget {
  const _EmptyDirectoryState({this.onBrowse});

  final VoidCallback? onBrowse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 48),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            color: theme.colorScheme.surfaceVariant,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('No groups match your filters yet.', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                'Adjust your focus filters or refresh to explore the full community directory.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: onBrowse,
                child: const Text('Refresh directory'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FocusSegment {
  const _FocusSegment({required this.id, required this.label});

  final String id;
  final String label;
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

String _formatRelative(DateTime value) {
  final now = DateTime.now();
  final difference = now.difference(value);
  if (difference.inMinutes < 1) {
    return 'just now';
  }
  if (difference.inMinutes < 60) {
    return '${difference.inMinutes} min ago';
  }
  if (difference.inHours < 24) {
    return '${difference.inHours} hr ago';
  }
  return '${difference.inDays} days ago';
}

String _describeError(Object? error) {
  if (error is ApiException) {
    return error.message;
  }
  return error?.toString() ?? 'Unable to load groups.';
}
