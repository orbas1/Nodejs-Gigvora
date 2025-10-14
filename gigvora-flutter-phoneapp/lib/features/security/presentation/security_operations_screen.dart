import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/security_controller.dart';
import '../data/models/security_telemetry.dart';

class SecurityOperationsScreen extends ConsumerWidget {
  const SecurityOperationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(securityControllerProvider);
    final controller = ref.read(securityControllerProvider.notifier);
    final telemetry = state.data ?? SecurityTelemetry.empty();

    return GigvoraScaffold(
      title: 'Security operations',
      subtitle: 'Breach prevention, threat response, and posture telemetry',
      actions: [
        IconButton(
          onPressed: () => controller.refresh(),
          tooltip: 'Refresh telemetry',
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.fromCache && !state.loading)
            const _StatusBanner(
              icon: Icons.offline_bolt,
              background: Color(0xFFDBEAFE),
              foreground: Color(0xFF1E40AF),
              message: 'Showing cached security telemetry while the network reconnects.',
            ),
          if (state.hasError && !state.loading)
            const _StatusBanner(
              icon: Icons.error_outline,
              background: Color(0xFFFEE2E2),
              foreground: Color(0xFFB91C1C),
              message: 'We could not sync the latest security posture. Pull to refresh to try again.',
            ),
          if (state.lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Last synchronised ${formatRelativeTime(state.lastUpdated!)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refresh,
              child: state.loading && telemetry.isEmpty
                  ? const _SecuritySkeleton()
                  : ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        _MetricsOverview(metrics: telemetry.metrics, posture: telemetry.posture),
                        const SizedBox(height: 24),
                        _ThreatQueue(
                          alerts: telemetry.alerts,
                          onAcknowledge: controller.acknowledgeAlert,
                          onSuppress: controller.suppressAlert,
                          onThreatSweep: () => controller.triggerThreatSweep(scope: 'production'),
                        ),
                        const SizedBox(height: 24),
                        _IncidentAndPlaybookPanel(
                          incidents: telemetry.incidents,
                          playbooks: telemetry.playbooks,
                          patchWindow: telemetry.patchWindow,
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
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
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(icon, color: foreground),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _SecuritySkeleton extends StatelessWidget {
  const _SecuritySkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 8),
        _SkeletonBox(height: 160),
        const SizedBox(height: 16),
        _SkeletonBox(height: 180),
        const SizedBox(height: 16),
        _SkeletonBox(height: 200),
        const SizedBox(height: 16),
        _SkeletonBox(height: 200),
      ],
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  const _SkeletonBox({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFFE5E7EB), Color(0xFFF9FAFB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
    );
  }
}

class _MetricsOverview extends StatelessWidget {
  const _MetricsOverview({required this.metrics, required this.posture});

  final SecurityMetrics metrics;
  final SecurityPosture posture;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final cards = [
      _MetricTile(
        icon: Icons.security_rounded,
        label: 'Blocked intrusions',
        value: metrics.blockedIntrusions.toString(),
        caption: 'Last 24 hours',
        color: colorScheme.primary,
      ),
      _MetricTile(
        icon: Icons.devices_other_outlined,
        label: 'Quarantined assets',
        value: metrics.quarantinedAssets.toString(),
        caption: 'Awaiting clearance',
        color: colorScheme.tertiary,
      ),
      _MetricTile(
        icon: Icons.bug_report_outlined,
        label: 'High-risk vulnerabilities',
        value: metrics.highRiskVulnerabilities.toString(),
        caption: 'Needing remediation',
        color: colorScheme.secondary,
      ),
      _MetricTile(
        icon: Icons.timer_outlined,
        label: 'Mean time to respond',
        value: '${metrics.meanTimeToRespondMinutes}m',
        caption: 'Across last 10 incidents',
        color: const Color(0xFF2563EB),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: cards,
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colorScheme.primary.withOpacity(0.1)),
            color: colorScheme.primaryContainer.withOpacity(0.24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Current posture: ${posture.status.toUpperCase()}',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                'Attack surface score ${posture.attackSurfaceScore} (${posture.attackSurfaceChange >= 0 ? '+' : ''}${posture.attackSurfaceChange})',
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: posture.signals
                    .map(
                      (signal) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle, color: colorScheme.primary, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                signal,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: colorScheme.onSurfaceVariant),
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
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.caption,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final String caption;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textColor = _derivedTextColor(color);
    return Container(
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(color: textColor, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(color: textColor, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            caption,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: textColor.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }

  Color _derivedTextColor(Color base) {
    return HSVColor.fromColor(base).withValue(0.4).toColor();
  }
}

class _ThreatQueue extends StatelessWidget {
  const _ThreatQueue({
    required this.alerts,
    required this.onAcknowledge,
    required this.onSuppress,
    required this.onThreatSweep,
  });

  final List<SecurityAlert> alerts;
  final Future<void> Function(SecurityAlert) onAcknowledge;
  final Future<void> Function(SecurityAlert) onSuppress;
  final Future<void> Function() onThreatSweep;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.outlineVariant),
        color: colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Threat queue',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700, color: colorScheme.onSurface),
                  ),
                  Text(
                    '${alerts.length} active ${alerts.length == 1 ? 'alert' : 'alerts'}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
              FilledButton.icon(
                onPressed: onThreatSweep,
                icon: const Icon(Icons.auto_mode_rounded),
                label: const Text('Launch threat sweep'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (alerts.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: const Color(0xFFE0F2F1),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.verified_user, color: Color(0xFF0F766E)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'No unacknowledged threats detected. Automated monitoring continues across all zero-trust zones.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: const Color(0xFF115E59), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            )
          else
            Column(
              children: alerts
                  .map(
                    (alert) => _AlertCard(
                      alert: alert,
                      onAcknowledge: () => onAcknowledge(alert),
                      onSuppress: () => onSuppress(alert),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({
    required this.alert,
    required this.onAcknowledge,
    required this.onSuppress,
  });

  final SecurityAlert alert;
  final Future<void> Function() onAcknowledge;
  final Future<void> Function() onSuppress;

  Color _severityColor(BuildContext context) {
    switch (alert.severity) {
      case 'critical':
        return const Color(0xFFDC2626);
      case 'high':
        return const Color(0xFFF97316);
      case 'medium':
        return const Color(0xFF2563EB);
      default:
        return const Color(0xFF0F766E);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final tone = _severityColor(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: tone.withOpacity(0.25)),
        color: tone.withOpacity(0.08),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield_moon_outlined, color: tone),
              const SizedBox(width: 8),
              Text(
                alert.category,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(color: colorScheme.onSurface, fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: tone.withOpacity(0.35)),
                  color: tone.withOpacity(0.15),
                ),
                child: Text(
                  alert.severity.toUpperCase(),
                  style: Theme.of(context)
                      .textTheme
                      .labelSmall
                      ?.copyWith(color: tone, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${alert.source} · ${alert.asset}',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            alert.recommendedAction,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Chip(
                avatar: const Icon(Icons.location_on_outlined, size: 16),
                label: Text(alert.location),
              ),
              Chip(
                avatar: const Icon(Icons.schedule, size: 16),
                label: Text('Detected ${formatRelativeTime(alert.detectedAt)}'),
              ),
              Chip(
                avatar: const Icon(Icons.verified_user_outlined, size: 16),
                label: Text('Status: ${alert.status}'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              FilledButton(
                onPressed: onAcknowledge,
                child: const Text('Acknowledge'),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: onSuppress,
                child: const Text('Suppress 60m'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _IncidentAndPlaybookPanel extends StatelessWidget {
  const _IncidentAndPlaybookPanel({
    required this.incidents,
    required this.playbooks,
    required this.patchWindow,
  });

  final List<SecurityIncident> incidents;
  final List<SecurityPlaybook> playbooks;
  final SecurityPatchWindow patchWindow;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _SectionCard(
                title: 'Incident response',
                subtitle: '${incidents.length} active ${incidents.length == 1 ? 'case' : 'cases'}',
                child: incidents.isEmpty
                    ? _EmptyState(
                        icon: Icons.verified_user,
                        message: 'No active incidents. Response crews are standing by.',
                      )
                    : Column(
                        children: incidents
                            .map(
                              (incident) => _IncidentTile(incident: incident),
                            )
                            .toList(),
                      ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _SectionCard(
                title: 'Response playbooks',
                subtitle: '${playbooks.length} automated guides',
                child: playbooks.isEmpty
                    ? _EmptyState(
                        icon: Icons.auto_fix_high,
                        message: 'Publish response playbooks to accelerate zero-day containment.',
                      )
                    : Column(
                        children: playbooks
                            .map(
                              (playbook) => _PlaybookTile(playbook: playbook),
                            )
                            .toList(),
                      ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colorScheme.outlineVariant),
            color: colorScheme.surfaceVariant,
          ),
          child: Row(
            children: [
              const Icon(Icons.system_update_alt, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  patchWindow.nextWindow == null
                      ? 'Next patch window to be scheduled. Backlog ${patchWindow.backlog} items.'
                      : 'Next patch window ${formatRelativeTime(patchWindow.nextWindow!)} · Backlog ${patchWindow.backlog} (${patchWindow.backlogChange >= 0 ? '+' : ''}${patchWindow.backlogChange} vs prior).',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.subtitle, required this.child});

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colorScheme.outlineVariant),
        color: colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700, color: colorScheme.onSurface),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _IncidentTile extends StatelessWidget {
  const _IncidentTile({required this.incident});

  final SecurityIncident incident;

  @override
  Widget build(BuildContext context) {
    final tone = _incidentColor(incident.severity);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: tone.withOpacity(0.25)),
        color: tone.withOpacity(0.08),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_outlined, color: tone),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  incident.title,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700, color: tone.darken()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            incident.summary,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: tone.darken().withOpacity(0.8)),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(
                avatar: const Icon(Icons.person_outline, size: 16),
                label: Text(incident.owner),
              ),
              Chip(
                avatar: const Icon(Icons.schedule, size: 16),
                label: Text('Opened ${formatRelativeTime(incident.openedAt)}'),
              ),
              Chip(
                avatar: const Icon(Icons.verified_user_outlined, size: 16),
                label: Text('Status: ${incident.status}'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _incidentColor(String severity) {
    switch (severity) {
      case 'critical':
        return const Color(0xFFB91C1C);
      case 'high':
        return const Color(0xFFD97706);
      case 'medium':
        return const Color(0xFF2563EB);
      default:
        return const Color(0xFF047857);
    }
  }
}

extension on Color {
  Color darken([double amount = .1]) {
    final hsl = HSLColor.fromColor(this);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    return hslDark.toColor();
  }
}

class _PlaybookTile extends StatelessWidget {
  const _PlaybookTile({required this.playbook});

  final SecurityPlaybook playbook;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outlineVariant),
        color: colorScheme.surfaceVariant,
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_stories_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  playbook.name,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700, color: colorScheme.onSurface),
                ),
                const SizedBox(height: 4),
                Text(
                  'Owned by ${playbook.owner}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${playbook.runCount} runs',
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(color: colorScheme.onSurface, fontWeight: FontWeight.w700),
              ),
              Text(
                'Last ${formatRelativeTime(playbook.lastExecutedAt)}',
                style: Theme.of(context)
                    .textTheme
                    .labelSmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.outlineVariant),
        color: colorScheme.surfaceVariant,
      ),
      child: Row(
        children: [
          Icon(icon, color: colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
