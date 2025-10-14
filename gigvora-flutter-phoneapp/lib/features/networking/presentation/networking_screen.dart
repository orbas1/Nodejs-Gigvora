import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../application/networking_controller.dart';
import '../data/models/networking_overview.dart';

class NetworkingScreen extends ConsumerStatefulWidget {
  const NetworkingScreen({super.key});

  @override
  ConsumerState<NetworkingScreen> createState() => _NetworkingScreenState();
}

class _NetworkingScreenState extends ConsumerState<NetworkingScreen> {
  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: 'Networking mission control',
        subtitle: 'Sign in to manage speed networking sessions',
        body: _SignedOutNotice(),
      );
    }

    final session = sessionState.session!;
    final allowedRoles = _allowedNetworkingRoles(session);
    if (allowedRoles.isEmpty) {
      return GigvoraScaffold(
        title: 'Networking mission control',
        subtitle: 'Speed networking access control',
        body: _AccessDeniedNotice(session: session),
      );
    }

    final state = ref.watch(networkingControllerProvider);
    final controller = ref.read(networkingControllerProvider.notifier);
    final bundle = state.data;
    final overview = bundle?.overview;
    final permittedWorkspaceIds = bundle?.permittedWorkspaceIds ?? const <int>[];
    final selectedWorkspaceId = state.metadata['selectedWorkspaceId'] as int?;
    final selectedSessionId = state.metadata['selectedSessionId'] as int?;
    final sessions = overview?.sessions.list ?? const <NetworkingSession>[];
    final selectedSession = sessions.firstWhere(
      (session) => session.id == selectedSessionId,
      orElse: () => sessions.isNotEmpty ? sessions.first : null,
    );

    return GigvoraScaffold(
      title: 'Networking mission control',
      subtitle: 'Speed networking performance & operations',
      actions: [
        IconButton(
          tooltip: 'Refresh overview',
          onPressed: state.loading ? null : () => controller.refresh(),
          icon: state.loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.hasError && !state.loading)
              const _ErrorBanner(message: 'Unable to sync networking data. Pull to refresh to try again.'),
            if (state.lastUpdated != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  'Last updated ${formatRelativeTime(state.lastUpdated!)}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
              ),
            if (permittedWorkspaceIds.length > 1)
              _WorkspaceSwitcher(
                permittedWorkspaceIds: permittedWorkspaceIds,
                selectedWorkspaceId: selectedWorkspaceId,
                onChanged: controller.selectWorkspace,
              )
            else if (selectedWorkspaceId != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  'Workspace $selectedWorkspaceId',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            if (overview != null) ...[
              _OverviewHighlights(overview: overview),
              const SizedBox(height: 16),
              _SessionLibrary(
                sessions: sessions,
                selectedSessionId: selectedSessionId,
                onSelect: controller.selectSession,
              ),
              if (selectedSession != null) ...[
                const SizedBox(height: 16),
                _SessionDetailCard(session: selectedSession),
              ],
              const SizedBox(height: 16),
              _OperationalAnalytics(overview: overview),
              const SizedBox(height: 16),
              _DigitalCardAnalyticsCard(analytics: overview.digitalCards),
              const SizedBox(height: 16),
              _VideoTelemetryCard(analytics: overview.video),
              const SizedBox(height: 24),
            ] else if (state.loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: CircularProgressIndicator(),
                ),
              )
            else
              _EmptyState(onCreateTapped: () => controller.refresh()),
          ],
        ),
      ),
    );
  }

  List<String> _allowedNetworkingRoles(UserSession session) {
    const allowed = {'company', 'agency', 'admin'};
    return session.memberships.where(allowed.contains).toList(growable: false);
  }
}

class _SignedOutNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sign in with a company or agency workspace to orchestrate networking.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: () => Navigator.of(context).pushNamed('/login'),
          icon: const Icon(Icons.lock_open),
          label: const Text('Sign in'),
        ),
      ],
    );
  }
}

class _AccessDeniedNotice extends StatelessWidget {
  const _AccessDeniedNotice({required this.session});

  final UserSession session;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final allowedRoles = const ['company', 'agency'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 32),
        Icon(Icons.lock_outline, size: 56, color: colorScheme.primary),
        const SizedBox(height: 24),
        Text(
          'Networking hub is locked',
          style: Theme.of(context).textTheme.titleLarge,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Switch to a company or agency workspace with networking permissions to unlock speed networking.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: colorScheme.onSurfaceVariant),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: session.memberships
              .map(
                (membership) => Chip(
                  label: Text(session.roleLabel(membership)),
                  backgroundColor: allowedRoles.contains(membership)
                      ? colorScheme.primaryContainer
                      : colorScheme.surfaceVariant,
                  labelStyle: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: allowedRoles.contains(membership)
                          ? colorScheme.onPrimaryContainer
                          : colorScheme.onSurfaceVariant),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 24),
        TextButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.mail_outline),
          label: const Text('Contact success team'),
        ),
      ],
    );
  }
}

class _WorkspaceSwitcher extends StatelessWidget {
  const _WorkspaceSwitcher({
    required this.permittedWorkspaceIds,
    required this.selectedWorkspaceId,
    required this.onChanged,
  });

  final List<int> permittedWorkspaceIds;
  final int? selectedWorkspaceId;
  final ValueChanged<int?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Expanded(
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Workspace',
                border: OutlineInputBorder(),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int?>(
                  value: selectedWorkspaceId,
                  isExpanded: true,
                  onChanged: onChanged,
                  items: [
                    const DropdownMenuItem<int?>(
                      value: null,
                      child: Text('All permitted workspaces'),
                    ),
                    ...permittedWorkspaceIds.map(
                      (id) => DropdownMenuItem<int?>(
                        value: id,
                        child: Text('Workspace $id'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
class _OverviewHighlights extends StatelessWidget {
  const _OverviewHighlights({required this.overview});

  final NetworkingOverview overview;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final cards = [
      _HighlightStat(
        label: 'Active sessions',
        value: _formatNumber(overview.sessions.active),
        icon: Icons.flash_on,
        background: colorScheme.primaryContainer.withOpacity(0.6),
        foreground: colorScheme.onPrimaryContainer,
      ),
      _HighlightStat(
        label: 'Upcoming',
        value: _formatNumber(overview.sessions.upcoming),
        icon: Icons.calendar_today,
        background: colorScheme.secondaryContainer.withOpacity(0.6),
        foreground: colorScheme.onSecondaryContainer,
      ),
      _HighlightStat(
        label: 'Completed',
        value: _formatNumber(overview.sessions.completed),
        icon: Icons.check_circle_outline,
        background: colorScheme.tertiaryContainer.withOpacity(0.6),
        foreground: colorScheme.onTertiaryContainer,
      ),
      _HighlightStat(
        label: 'Average join limit',
        value: overview.sessions.averageJoinLimit != null
            ? _formatNumber(overview.sessions.averageJoinLimit)
            : '—',
        icon: Icons.people_outline,
        background: colorScheme.primary.withOpacity(0.12),
        foreground: colorScheme.primary,
      ),
      _HighlightStat(
        label: 'Revenue (90d)',
        value: _formatCurrency(overview.sessions.revenueCents),
        icon: Icons.payments_outlined,
        background: colorScheme.secondary.withOpacity(0.12),
        foreground: colorScheme.secondary,
      ),
      _HighlightStat(
        label: 'Satisfaction',
        value: overview.sessions.satisfactionAverage != null
            ? _formatPercent(overview.sessions.satisfactionAverage! * 20)
            : '—',
        icon: Icons.sentiment_satisfied_outlined,
        background: colorScheme.tertiary.withOpacity(0.12),
        foreground: colorScheme.tertiary,
      ),
    ];

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Network health overview',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: cards,
          ),
        ],
      ),
    );
  }
}

class _SessionLibrary extends StatelessWidget {
  const _SessionLibrary({
    required this.sessions,
    required this.selectedSessionId,
    required this.onSelect,
  });

  final List<NetworkingSession> sessions;
  final int? selectedSessionId;
  final ValueChanged<int?> onSelect;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sessions',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              if (sessions.isNotEmpty)
                Text(
                  '${sessions.length} total',
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (sessions.isEmpty)
            Text(
              'No sessions available. Create a session from the web dashboard to get started.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            Column(
              children: sessions
                  .map(
                    (session) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _SessionListTile(
                        session: session,
                        isSelected: session.id == selectedSessionId,
                        onTap: () => onSelect(session.id),
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _SessionListTile extends StatelessWidget {
  const _SessionListTile({
    required this.session,
    required this.isSelected,
    required this.onTap,
  });

  final NetworkingSession session;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final background = isSelected ? colorScheme.primaryContainer.withOpacity(0.4) : colorScheme.surfaceVariant;
    final metrics = session.metrics;
    final start = session.startTime;
    final end = session.endTime;
    final timeline = [
      if (start != null) 'Starts ${formatRelativeTime(start)}',
      if (end != null) 'Ends ${formatRelativeTime(end)}',
    ].join(' • ');

    return Material(
      color: background,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      session.title.isEmpty ? 'Untitled session' : session.title,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                  ),
                  _StatusChip(status: session.status),
                ],
              ),
              if (session.description?.isNotEmpty == true) ...[
                const SizedBox(height: 4),
                Text(
                  session.description!,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _MetricChip(label: 'Registered', value: _formatNumber(metrics.registered)),
                  _MetricChip(label: 'Check-ins', value: _formatNumber(metrics.checkedIn + metrics.completed)),
                  _MetricChip(label: 'Waitlist', value: _formatNumber(metrics.waitlisted)),
                  _MetricChip(
                    label: 'Satisfaction',
                    value: metrics.averageSatisfaction != null
                        ? _formatNumber(metrics.averageSatisfaction, fractionDigits: 1)
                        : '—',
                  ),
                ],
              ),
              if (timeline.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  timeline,
                  style: Theme.of(context)
                      .textTheme
                      .labelSmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
class _SessionDetailCard extends StatelessWidget {
  const _SessionDetailCard({required this.session});

  final NetworkingSession session;

  @override
  Widget build(BuildContext context) {
    final metrics = session.metrics;
    final colorScheme = Theme.of(context).colorScheme;
    final joinLimit = session.joinLimit != null ? _formatNumber(session.joinLimit) : 'Unlimited';
    final rotation = session.rotationDurationSeconds != null
        ? '${session.rotationDurationSeconds} sec rotations'
        : 'Rotation duration not set';

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            session.title.isEmpty ? 'Untitled session' : session.title,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            session.description?.isNotEmpty == true
                ? session.description!
                : 'Speed networking session with automated pair shuffling.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricChip(label: 'Join limit', value: joinLimit),
              _MetricChip(label: 'Rotation', value: rotation),
              _MetricChip(
                label: 'Access',
                value: session.accessType?.toUpperCase() ?? 'FREE',
              ),
              _MetricChip(label: 'Price', value: _formatCurrency(session.priceCents)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Attendee experience',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricChip(label: 'Profiles shared', value: _formatNumber(metrics.profileSharedCount)),
              _MetricChip(label: 'Connections saved', value: _formatNumber(metrics.connectionsSaved)),
              _MetricChip(label: 'Messages sent', value: _formatNumber(metrics.messagesSent)),
              _MetricChip(label: 'Follow-ups', value: _formatNumber(metrics.followUpsScheduled)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Penalty guardrails',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricChip(label: 'No-show threshold', value: '${metrics.penaltyRules.noShowThreshold} strikes'),
              _MetricChip(label: 'Cooldown', value: '${metrics.penaltyRules.cooldownDays} days'),
              _MetricChip(label: 'Active penalties', value: _formatNumber(metrics.penalties)),
              _MetricChip(label: 'Card shares', value: _formatNumber(metrics.cardShares)),
            ],
          ),
        ],
      ),
    );
  }
}

class _OperationalAnalytics extends StatelessWidget {
  const _OperationalAnalytics({required this.overview});

  final NetworkingOverview overview;

  @override
  Widget build(BuildContext context) {
    final scheduling = overview.scheduling;
    final monetization = overview.monetization;
    final penalties = overview.penalties;
    final experience = overview.attendeeExperience;
    final colorScheme = Theme.of(context).colorScheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Operational telemetry',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 16),
          _InsightSection(
            title: 'Scheduling',
            color: colorScheme.primary,
            stats: [
              _InsightData(label: 'Pre-registrations', value: _formatNumber(scheduling.preRegistrations)),
              _InsightData(label: 'Waitlist', value: _formatNumber(scheduling.waitlist)),
              _InsightData(label: 'Reminders sent', value: _formatNumber(scheduling.remindersSent)),
              _InsightData(label: 'Searches', value: _formatNumber(scheduling.searches)),
            ],
          ),
          const SizedBox(height: 16),
          _InsightSection(
            title: 'Monetisation',
            color: colorScheme.secondary,
            stats: [
              _InsightData(label: 'Paid sessions', value: _formatNumber(monetization.paid)),
              _InsightData(label: 'Free sessions', value: _formatNumber(monetization.free)),
              _InsightData(label: 'Revenue', value: _formatCurrency(monetization.revenueCents)),
              _InsightData(
                label: 'Average price',
                value: _formatCurrency(monetization.averagePriceCents),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InsightSection(
            title: 'Penalties',
            color: colorScheme.tertiary,
            stats: [
              _InsightData(
                label: 'No-show rate',
                value: penalties.noShowRate != null
                    ? _formatPercent(penalties.noShowRate!)
                    : '—',
              ),
              _InsightData(label: 'Active penalties', value: _formatNumber(penalties.activePenalties)),
              _InsightData(
                label: 'Restricted attendees',
                value: _formatNumber(penalties.restrictedParticipants),
              ),
              _InsightData(label: 'Cooldown', value: '${penalties.cooldownDays} days'),
            ],
          ),
          const SizedBox(height: 16),
          _InsightSection(
            title: 'Attendee experience',
            color: colorScheme.primary,
            stats: [
              _InsightData(label: 'Profiles shared', value: _formatNumber(experience.profilesShared)),
              _InsightData(label: 'Connections saved', value: _formatNumber(experience.connectionsSaved)),
              _InsightData(
                label: 'Messages / session',
                value: _formatNumber(experience.averageMessagesPerSession, fractionDigits: 1),
              ),
              _InsightData(label: 'Follow-ups', value: _formatNumber(experience.followUpsScheduled)),
            ],
          ),
        ],
      ),
    );
  }
}
class _DigitalCardAnalyticsCard extends StatelessWidget {
  const _DigitalCardAnalyticsCard({required this.analytics});

  final NetworkingDigitalCardAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Digital business cards',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricChip(label: 'Cards created', value: _formatNumber(analytics.created)),
              _MetricChip(label: 'Active templates', value: _formatNumber(analytics.templates)),
              _MetricChip(label: 'Shared in sessions', value: _formatNumber(analytics.sharedInSession)),
              _MetricChip(label: 'Updated this week', value: _formatNumber(analytics.updatedThisWeek)),
              _MetricChip(label: 'Available', value: _formatNumber(analytics.available)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Keep cards refreshed ahead of events to boost attendee matching quality.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _VideoTelemetryCard extends StatelessWidget {
  const _VideoTelemetryCard({required this.analytics});

  final NetworkingVideoAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Video telemetry',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricChip(
                label: 'Quality score',
                value: analytics.averageQualityScore != null
                    ? _formatNumber(analytics.averageQualityScore, fractionDigits: 2)
                    : '—',
              ),
              _MetricChip(
                label: 'Browser load share',
                value: analytics.browserLoadShare != null
                    ? _formatPercent(analytics.browserLoadShare!)
                    : '—',
              ),
              _MetricChip(label: 'Host announcements', value: _formatNumber(analytics.hostAnnouncements)),
              _MetricChip(
                label: 'Failover rate',
                value:
                    analytics.failoverRate != null ? _formatPercent(analytics.failoverRate!, fractionDigits: 2) : '—',
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Monitor quality and host engagement between rotations to protect attendee experience.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _InsightSection extends StatelessWidget {
  const _InsightSection({required this.title, required this.color, required this.stats});

  final String title;
  final Color color;
  final List<_InsightData> stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            color.withOpacity(0.08),
            color.withOpacity(0.02),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: stats
                .map((stat) => _MetricChip(label: stat.label, value: stat.value, emphasisColor: color))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _InsightData {
  const _InsightData({required this.label, required this.value});

  final String label;
  final String value;
}

class _HighlightStat extends StatelessWidget {
  const _HighlightStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.background,
    required this.foreground,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 140),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: foreground),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelMedium
                ?.copyWith(color: foreground.withOpacity(0.8)),
          ),
        ],
      ),
    );
  }
}
class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.label,
    required this.value,
    this.emphasisColor,
  });

  final String label;
  final String value;
  final Color? emphasisColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = emphasisColor ?? colorScheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: color.withOpacity(0.08),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600, color: color),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.replaceAll('_', ' ');
    final colorScheme = Theme.of(context).colorScheme;
    Color background = colorScheme.surfaceVariant;
    Color foreground = colorScheme.onSurfaceVariant;
    if (status == 'in_progress') {
      background = const Color(0xFFDCFCE7);
      foreground = const Color(0xFF166534);
    } else if (status == 'scheduled') {
      background = const Color(0xFFDBEAFE);
      foreground = const Color(0xFF1D4ED8);
    } else if (status == 'draft') {
      background = const Color(0xFFFEF9C3);
      foreground = const Color(0xFFA16207);
    } else if (status == 'cancelled') {
      background = const Color(0xFFFEE2E2);
      foreground = const Color(0xFFB91C1C);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        normalized.toUpperCase(),
        style: Theme.of(context)
            .textTheme
            .labelSmall
            ?.copyWith(color: foreground, fontWeight: FontWeight.w600, letterSpacing: 0.6),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: const Color(0xFFB91C1C)),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreateTapped});

  final VoidCallback onCreateTapped;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GigvoraCard(
      child: Column(
        children: [
          Icon(Icons.groups_outlined, size: 48, color: colorScheme.primary),
          const SizedBox(height: 16),
          Text(
            'No networking sessions yet',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Create a speed networking session from the web dashboard to populate analytics here.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onCreateTapped,
            icon: const Icon(Icons.refresh),
            label: const Text('Sync now'),
          ),
        ],
      ),
    );
  }
}

String _formatNumber(num? value, {int fractionDigits = 0}) {
  if (value == null) return '—';
  final isNegative = value < 0;
  final absValue = value.abs();
  final decimals = fractionDigits > 0 && (absValue - absValue.truncateToDouble()).abs() > 0
      ? fractionDigits
      : 0;
  final string = absValue.toStringAsFixed(decimals);
  final parts = string.split('.');
  final integer = parts.first;
  final buffer = StringBuffer();
  for (int index = 0; index < integer.length; index += 1) {
    final position = integer.length - index - 1;
    buffer.write(integer[position]);
    if ((index + 1) % 3 == 0 && position != 0) {
      buffer.write(',');
    }
  }
  final formattedInt = buffer.toString().split('').reversed.join();
  final decimalsPart = parts.length > 1 && parts[1].isNotEmpty ? '.${parts[1]}' : '';
  final prefix = isNegative ? '-' : '';
  return '$prefix$formattedInt$decimalsPart';
}

String _formatCurrency(int? cents) {
  if (cents == null) return '—';
  final amount = cents / 100;
  final decimals = amount.truncateToDouble() == amount ? 0 : 2;
  final formatted = _formatNumber(amount, fractionDigits: decimals);
  return '${String.fromCharCode(36)}$formatted';
}

String _formatPercent(num value, {int fractionDigits = 1}) {
  return '${value.toStringAsFixed(fractionDigits)}%';
}
