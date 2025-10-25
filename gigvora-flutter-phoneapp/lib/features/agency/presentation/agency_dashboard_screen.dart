import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';

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
                onPressed: () => context.go(AppRoute.login.path),
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
                      onPressed: () => context.go(AppRoute.home.path),
                      child: const Text('Back to home'),
                    ),
                    OutlinedButton(
                      onPressed: () => context.go(AppRoute.settings.path),
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
          _AgencyHrSection(hr: snapshot.hr),
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

class _AgencyHrSection extends StatelessWidget {
  const _AgencyHrSection({required this.hr});

  final AgencyHrSnapshot hr;

  Color _alertBackground(AgencyHrAlertSeverity severity) {
    switch (severity) {
      case AgencyHrAlertSeverity.critical:
        return const Color(0xFFFFEBEE);
      case AgencyHrAlertSeverity.warning:
        return const Color(0xFFFFF7ED);
      case AgencyHrAlertSeverity.info:
      default:
        return const Color(0xFFEFF6FF);
    }
  }

  Color _alertBorder(AgencyHrAlertSeverity severity) {
    switch (severity) {
      case AgencyHrAlertSeverity.critical:
        return const Color(0xFFF44336);
      case AgencyHrAlertSeverity.warning:
        return const Color(0xFFFB8C00);
      case AgencyHrAlertSeverity.info:
      default:
        return const Color(0xFF1D4ED8);
    }
  }

  Color _alertText(AgencyHrAlertSeverity severity) {
    switch (severity) {
      case AgencyHrAlertSeverity.critical:
        return const Color(0xFFB71C1C);
      case AgencyHrAlertSeverity.warning:
        return const Color(0xFF9C4221);
      case AgencyHrAlertSeverity.info:
      default:
        return const Color(0xFF1E3A8A);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final hrMetrics = [
      _HrMetric(
        label: 'Active headcount',
        value: hr.headcount.toString(),
        caption: '${hr.contractors} contractors',
      ),
      _HrMetric(
        label: 'Compliance tasks',
        value: hr.complianceOutstanding.toString(),
        caption: 'Acknowledgements outstanding',
      ),
      _HrMetric(
        label: 'Bench hours',
        value: '${hr.benchHours} hrs',
        caption: hr.benchHealthLabel,
      ),
      _HrMetric(
        label: 'Utilisation',
        value: '${(hr.utilizationRate * 100).toStringAsFixed(0)}%',
        caption: 'Target 88%',
      ),
    ];
    final delegation = hr.delegation;
    final milestones = hr.milestones;
    final paymentSplits = hr.paymentSplits;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Agency HR command centre', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Text(
                      'Monitor role coverage, staffing health, onboarding, and compliance follow-ups with live signals.',
                      style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${(hr.utilizationRate * 100).toStringAsFixed(0)}%',
                      style: theme.textTheme.headlineSmall?.copyWith(color: colorScheme.primary),
                    ),
                    const SizedBox(height: 4),
                    Text('Utilisation', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 4),
                    Text('Bench ${hr.benchHealthLabel}', style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: hrMetrics
                .map(
                  (metric) => SizedBox(
                    width: 160,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceVariant.withOpacity(0.35),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(metric.label, style: theme.textTheme.labelMedium),
                          const SizedBox(height: 8),
                          Text(metric.value, style: theme.textTheme.titleLarge),
                          const SizedBox(height: 6),
                          Text(
                            metric.caption,
                            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 20),
          _HrControlRow(
            delegation: delegation,
            milestones: milestones,
            paymentSplits: paymentSplits,
          ),
          const SizedBox(height: 20),
          Text('Priority alerts', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          if (hr.alerts.isEmpty)
            Text(
              'No active HR alerts. All pods are within guardrails.',
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            Column(
              children: hr.alerts
                  .map(
                    (alert) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _alertBackground(alert.severity),
                        border: Border.all(color: _alertBorder(alert.severity).withOpacity(0.6)),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(alert.message, style: theme.textTheme.bodyMedium?.copyWith(color: _alertText(alert.severity))),
                          if (alert.nextAction != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              'Next: ${alert.nextAction}',
                              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          const SizedBox(height: 20),
          Text('Outstanding policies', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          if (hr.policies.isEmpty)
            Text(
              'All published policies are acknowledged.',
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            Column(
              children: hr.policies
                  .map(
                    (policy) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: colorScheme.surfaceVariant.withOpacity(0.3),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(policy.title, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(
                                  '${policy.outstanding} outstanding · Review every ${policy.reviewCycleDays ?? 120} days',
                                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                          if (policy.effectiveDate != null)
                            Text(
                              formatRelativeTime(policy.effectiveDate!),
                              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                            ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          const SizedBox(height: 20),
          Text('Role coverage', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Column(
            children: hr.roleCoverage
                .map(
                  (role) => Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: colorScheme.surfaceVariant.withOpacity(0.25),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(role.role, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${role.active} active · ${role.hiring} hiring · Bench ${role.bench}',
                                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${(role.utilizationRate * 100).toStringAsFixed(0)}% utilisation',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(
                          value: role.utilizationRate.clamp(0.0, 1.0),
                          backgroundColor: colorScheme.surface,
                          color: role.needsAttention ? const Color(0xFFDC2626) : colorScheme.primary,
                        ),
                        if (role.needsAttention)
                          Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              'Coverage flagged for attention',
                              style: theme.textTheme.bodySmall?.copyWith(color: const Color(0xFFB91C1C)),
                            ),
                          ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: colorScheme.secondary.withOpacity(0.08),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Staffing summary', style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    _HrChip(label: 'Total capacity', value: '${hr.staffing.totalCapacityHours} hrs'),
                    _HrChip(label: 'Committed', value: '${hr.staffing.committedHours} hrs'),
                    _HrChip(label: 'Bench members', value: hr.staffing.benchMembers.toString()),
                    _HrChip(
                      label: 'Bench rate',
                      value: '${(hr.staffing.benchRate * 100).toStringAsFixed(0)}%',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  hr.staffing.summary,
                  style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
                if (hr.staffing.recommendedAction != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Next: ${hr.staffing.recommendedAction}',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.primary),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('Onboarding queue', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          if (hr.onboarding.isEmpty)
            Text(
              'No onboarding tasks pending.',
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            Column(
              children: hr.onboarding
                  .map(
                    (candidate) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(candidate.name, style: theme.textTheme.bodyLarge),
                      subtitle: Text(
                        '${candidate.role} • ${candidate.status.replaceAll('_', ' ')}',
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      trailing: candidate.startDate != null
                          ? Text(
                              'Starts ${formatRelativeTime(candidate.startDate!)}',
                              style: theme.textTheme.bodySmall,
                            )
                          : const Text('Start TBC'),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _HrControlRow extends StatelessWidget {
  const _HrControlRow({
    required this.delegation,
    required this.milestones,
    required this.paymentSplits,
  });

  final AgencyDelegationSummary delegation;
  final AgencyMilestoneSummary milestones;
  final AgencyPaymentSplitSummary paymentSplits;

  String _formatPercent(double value) {
    final percent = (value * 100).clamp(0, 100);
    return percent % 1 == 0 ? '${percent.toStringAsFixed(0)}%' : '${percent.toStringAsFixed(1)}%';
  }

  String _formatHours(double? value) => '${(value ?? 0).toStringAsFixed(0)}h';

  String _formatCurrencyLabel(double? value, String? currency) {
    if (value == null) {
      return 'Awaiting schedule';
    }
    return NumberFormat.simpleCurrency(name: currency ?? 'USD').format(value);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final assignments = delegation.assignments.take(3).toList();
    final nextMilestone = milestones.next;
    final nextPayoutLabel = paymentSplits.nextPayoutDate != null
        ? formatRelativeTime(paymentSplits.nextPayoutDate!)
        : 'Awaiting schedule';
    final payoutAmountLabel =
        _formatCurrencyLabel(paymentSplits.nextPayoutAmount, paymentSplits.nextPayoutCurrency);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 720;
        final itemWidth = isWide ? (constraints.maxWidth - 24) / 3 : constraints.maxWidth;

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: itemWidth,
              child: _HrControlCard(
                title: 'Delegation control',
                subtitle: '${delegation.activeAssignments} active pods',
                badgeLabel: _formatPercent(delegation.utilisation),
                description:
                    '${delegation.backlogCount} backlog • ${delegation.atRiskCount} at risk',
                background: const Color(0xFFF5F3FF),
                borderColor: const Color(0xFFDDD6FE),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final assignment in assignments)
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFEDE9FE)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              assignment.memberName,
                              style: theme.textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${assignment.role} • ${_formatHours(assignment.allocatedHours)} of ${_formatHours(assignment.capacityHours)}',
                              style: theme.textTheme.bodySmall
                                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    if (assignments.isEmpty)
                      Text(
                        'No delegated pods captured.',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => context.push('/projects'),
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: const Text('Open projects workspace'),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: _HrControlCard(
                title: 'Milestone assurance',
                subtitle:
                    '${milestones.completed} completed • ${milestones.overdue} overdue',
                description: '${milestones.upcoming} upcoming checkpoints',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _HrChip(label: 'Completed', value: milestones.completed.toString()),
                        _HrChip(label: 'Upcoming', value: milestones.upcoming.toString()),
                        _HrChip(label: 'Overdue', value: milestones.overdue.toString()),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (nextMilestone != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border:
                              Border.all(color: theme.colorScheme.primary.withOpacity(0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              nextMilestone.title,
                              style: theme.textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${nextMilestone.project ?? 'Delivery'} • ${nextMilestone.dueDate != null ? formatRelativeTime(nextMilestone.dueDate!) : (nextMilestone.status ?? 'scheduled')}',
                              style: theme.textTheme.bodySmall
                                  ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      )
                    else
                      Text(
                        'All milestones are on track.',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => context.push('/projects'),
                      icon: const Icon(Icons.calendar_today_outlined, size: 16),
                      label: const Text('View delivery timeline'),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: _HrControlCard(
                title: 'Payment orchestration',
                subtitle:
                    '${paymentSplits.approvedSplits} approved • ${paymentSplits.pendingSplits} pending',
                badgeLabel: _formatPercent(paymentSplits.coverage),
                description: '${paymentSplits.failedSplits} flagged for review',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _HrChip(
                          label: 'Total splits',
                          value: paymentSplits.totalSplits.toString(),
                        ),
                        _HrChip(
                          label: 'Failed',
                          value: paymentSplits.failedSplits.toString(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Next batch $nextPayoutLabel',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      payoutAmountLabel,
                      style:
                          theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => context.push('/finance'),
                      icon: const Icon(Icons.payments_outlined, size: 16),
                      label: const Text('Review payout centre'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _HrControlCard extends StatelessWidget {
  const _HrControlCard({
    required this.title,
    required this.subtitle,
    required this.description,
    required this.child,
    this.badgeLabel,
    this.background,
    this.borderColor,
  });

  final String title;
  final String subtitle;
  final String description;
  final Widget child;
  final String? badgeLabel;
  final Color? background;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background ?? colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor ?? colorScheme.outlineVariant.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              if (badgeLabel != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: borderColor ?? colorScheme.primary.withOpacity(0.25),
                    ),
                  ),
                  child: Text(
                    badgeLabel!,
                    style: theme.textTheme.labelMedium
                        ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style:
                theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _HrMetric {
  const _HrMetric({required this.label, required this.value, required this.caption});

  final String label;
  final String value;
  final String caption;
}

class _HrChip extends StatelessWidget {
  const _HrChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: colorScheme.surfaceVariant.withOpacity(0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(width: 6),
          Text(value, style: theme.textTheme.labelMedium),
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
