import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../../theme/widgets.dart';
import '../application/agency_dashboard_controller.dart';
import '../domain/agency_dashboard.dart';

class AgencyDashboardScreen extends ConsumerWidget {
  const AgencyDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;

    if (session == null) {
      return const _LoginRequiredView();
    }

    final memberships = session.memberships.map((role) => role.toLowerCase()).toSet();
    final hasAgencyAccess = memberships.contains('agency');

    if (!hasAgencyAccess) {
      return _AccessDeniedView(session: session, memberships: memberships);
    }

    final dashboardState = ref.watch(agencyDashboardControllerProvider);
    final controller = ref.read(agencyDashboardControllerProvider.notifier);

    return GigvoraScaffold(
      title: 'Agency command studio',
      subtitle: 'Operations, talent, and growth orchestration',
      actions: [
        IconButton(
          tooltip: 'Refresh dashboard',
          onPressed: dashboardState.isLoading ? null : () => controller.refresh(forceRefresh: true),
          icon: dashboardState.isLoading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: dashboardState.when(
        data: (snapshot) => _AgencyDashboardBody(
          snapshot: snapshot,
          onRefresh: () => controller.refresh(forceRefresh: true),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _DashboardError(
          message: "We couldn't sync the latest agency intelligence. Pull to refresh to try again.",
          onRetry: () => controller.refresh(forceRefresh: true),
        ),
      ),
    );
  }
}

class _LoginRequiredView extends StatelessWidget {
  const _LoginRequiredView();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraScaffold(
      title: 'Agency command studio',
      subtitle: 'Secure authentication required',
      body: Center(
        child: GigvoraCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sign in to access agency insights', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Text(
                'Log in on this device to unlock the full agency cockpit with talent, delivery, and finance controls.',
                style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.go('/login'),
                child: const Text('Go to login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccessDeniedView extends StatelessWidget {
  const _AccessDeniedView({required this.session, required this.memberships});

  final UserSession session;
  final Set<String> memberships;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final roleLabels = memberships
        .map((role) => UserSession.roleLabels[role] ?? role)
        .toList(growable: false)
      ..sort();
    final joinedRoles = roleLabels.join(', ');
    return GigvoraScaffold(
      title: 'Agency command studio',
      subtitle: 'Access restricted',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("You don't have the agency membership yet", style: theme.textTheme.titleMedium),
                const SizedBox(height: 12),
                Text(
                  'Switch to a role that is available on your account or contact your workspace admin to activate the agency '
                  'dashboard. Roles you currently have access to: $joinedRoles.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    FilledButton(
                      onPressed: () => context.go('/home'),
                      child: const Text('Back to home'),
                    ),
                    OutlinedButton(
                      onPressed: () => context.go('/settings'),
                      child: const Text('Manage account access'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardError extends StatelessWidget {
  const _DashboardError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Center(
      child: GigvoraCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Unable to load agency data',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                IconButton(
                  tooltip: 'Retry',
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _AgencyDashboardBody extends StatelessWidget {
  const _AgencyDashboardBody({required this.snapshot, required this.onRefresh});

  final AgencyDashboardSnapshot snapshot;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          _SyncBanner(snapshot: snapshot),
          const SizedBox(height: 20),
          _MetricGrid(metrics: snapshot.metrics),
          const SizedBox(height: 20),
          _AlertSection(alerts: snapshot.alerts),
          const SizedBox(height: 20),
          _SquadSection(squads: snapshot.squads),
          const SizedBox(height: 20),
          _PipelineSection(pipeline: snapshot.pipeline),
          const SizedBox(height: 20),
          _BenchSection(bench: snapshot.bench),
          const SizedBox(height: 20),
          _ActionSection(actions: snapshot.recommendedActions),
          const SizedBox(height: 32),
          Text(
            "You're viewing a ${snapshot.lookbackWindowDays}-day performance window. Cached snapshot: "
            '${snapshot.fromCache ? 'Yes' : 'No'}.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _SyncBanner extends StatelessWidget {
  const _SyncBanner({required this.snapshot});

  final AgencyDashboardSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final badgeColor = snapshot.fromCache ? const Color(0xFFF59E0B) : const Color(0xFF059669);
    final badgeBackground = snapshot.fromCache ? const Color(0xFFFDE68A) : const Color(0xFFD1FAE5);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: badgeBackground,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      snapshot.fromCache ? 'Cached snapshot' : 'Live sync',
                      style: theme.textTheme.labelMedium?.copyWith(color: badgeColor, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Last updated ${formatRelativeTime(snapshot.generatedAt)}',
                    style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
              Icon(Icons.shield_outlined, color: colorScheme.primary.withOpacity(0.7)),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Monitoring revenue velocity, delivery guardrails, and partnership health across the agency.',
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.metrics});

  final List<AgencyMetricCard> metrics;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: metrics
          .map(
            (metric) => SizedBox(
              width: 160,
              child: GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 32,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Color(metric.accentHex),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(metric.label, style: theme.textTheme.labelMedium),
                    const SizedBox(height: 8),
                    Text(metric.value, style: theme.textTheme.titleLarge),
                    if (metric.trend != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          metric.trend!,
                          style: theme.textTheme.bodySmall?.copyWith(color: Color(metric.accentHex)),
                        ),
                      ),
                    if (metric.caption != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          metric.caption!,
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _AlertSection extends StatelessWidget {
  const _AlertSection({required this.alerts});

  final List<AgencyAlert> alerts;

  Color _badgeColor(AgencyAlertSeverity severity) {
    switch (severity) {
      case AgencyAlertSeverity.high:
        return const Color(0xFFDC2626);
      case AgencyAlertSeverity.medium:
        return const Color(0xFFF97316);
      case AgencyAlertSeverity.low:
      default:
        return const Color(0xFF2563EB);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Operational alerts', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...alerts.map(
            (alert) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _badgeColor(alert.severity).withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _badgeColor(alert.severity).withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(alert.title, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(
                    alert.message,
                    style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SquadSection extends StatelessWidget {
  const _SquadSection({required this.squads});

  final List<AgencySquadSnapshot> squads;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Collaboration rooms', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: squads
                .map(
                  (squad) => SizedBox(
                    width: 200,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: colorScheme.surfaceVariant.withOpacity(0.35),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(squad.name, style: theme.textTheme.titleSmall),
                          const SizedBox(height: 6),
                          Text(
                            squad.focus,
                            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: squad.healthScore,
                            backgroundColor: colorScheme.surface,
                            color: colorScheme.primary,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${(squad.healthScore * 100).toStringAsFixed(0)}% · ${squad.healthLabel}',
                            style: theme.textTheme.bodySmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${squad.activeEngagements} engagements live',
                            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
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

class _PipelineSection extends StatelessWidget {
  const _PipelineSection({required this.pipeline});

  final List<AgencyPipelineItem> pipeline;

  String _formatCurrency(int value) {
    const symbolCode = 36;
    final currency = String.fromCharCode(symbolCode);
    if (value >= 1000000) {
      return '$currency${(value / 1000000).toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      return '$currency${(value / 1000).toStringAsFixed(0)}K';
    }
    return '$currency${value.toString()}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Partner pipeline', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Column(
            children: pipeline
                .map(
                  (item) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(item.client, style: theme.textTheme.bodyLarge),
                    subtitle: Text(
                      '${item.stage} • Next action ${formatRelativeTime(item.nextAction)}',
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                    trailing: Text(
                      _formatCurrency(item.value),
                      style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.primary),
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

class _BenchSection extends StatelessWidget {
  const _BenchSection({required this.bench});

  final List<AgencyBenchMember> bench;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bench availability', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Column(
            children: bench
                .map(
                  (member) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: colorScheme.primary.withOpacity(0.15),
                      child: Text(member.name.substring(0, 1)),
                    ),
                    title: Text(member.name, style: theme.textTheme.bodyLarge),
                    subtitle: Text(
                      member.discipline,
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                    trailing: Text(member.availability, style: theme.textTheme.bodyMedium),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ActionSection extends StatelessWidget {
  const _ActionSection({required this.actions});

  final List<String> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recommended next steps', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: actions
                .map(
                  (action) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 6),
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            action,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
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
