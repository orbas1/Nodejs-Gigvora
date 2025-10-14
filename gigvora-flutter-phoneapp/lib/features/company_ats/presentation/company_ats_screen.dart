import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../theme/widgets.dart';
import '../application/company_ats_controller.dart';
import '../data/models/company_ats_dashboard.dart';

class CompanyAtsScreen extends ConsumerWidget {
  const CompanyAtsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(companyAtsControllerProvider);
    final controller = ref.read(companyAtsControllerProvider.notifier);
    final dashboard = state.data ?? CompanyAtsDashboard.empty();

    return GigvoraScaffold(
      title: 'ATS operations',
      subtitle: 'Enterprise hiring intelligence',
      actions: [
        IconButton(
          tooltip: 'Refresh',
          onPressed: () => controller.refresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.fromCache && !state.loading)
              const _StatusBanner(
                icon: Icons.offline_pin,
                message: 'Showing cached ATS insights. Pull to refresh when connectivity returns.',
                background: Color(0xFFE0F2FE),
                foreground: Color(0xFF0B6BCB),
              ),
            if (state.error != null && !state.loading)
              _StatusBanner(
                icon: Icons.error_outline,
                message: 'Unable to sync ATS operations data. ${state.error}',
                background: const Color(0xFFFEE2E2),
                foreground: const Color(0xFFB91C1C),
              ),
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
            _SummaryMetrics(metrics: dashboard.metrics),
            const SizedBox(height: 24),
            _ReadinessSection(readiness: dashboard.readiness),
            const SizedBox(height: 24),
            _StagePerformanceCard(stages: dashboard.stages),
            const SizedBox(height: 24),
            _ApprovalQueueCard(queue: dashboard.approvals),
            const SizedBox(height: 24),
            _CampaignInsightsCard(campaigns: dashboard.campaigns),
            const SizedBox(height: 24),
            _FunnelCard(stages: dashboard.funnel),
            const SizedBox(height: 24),
            _ActivityHighlights(activity: dashboard.activity, interviewOps: dashboard.interviewOperations),
            const SizedBox(height: 24),
            _CandidateExperienceCard(
              experience: dashboard.candidateExperience,
              care: dashboard.candidateCare,
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.message,
    required this.icon,
    required this.background,
    required this.foreground,
  });

  final String message;
  final IconData icon;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
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

class _SummaryMetrics extends StatelessWidget {
  const _SummaryMetrics({required this.metrics});

  final List<AtsMetric> metrics;

  @override
  Widget build(BuildContext context) {
    if (metrics.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: metrics
          .map(
            (metric) => SizedBox(
              width: 260,
              child: GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(metric.label, style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(metric.value, style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                    if (metric.caption != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        metric.caption!,
                        style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ReadinessSection extends StatelessWidget {
  const _ReadinessSection({required this.readiness});

  final AtsReadiness readiness;

  String _statusLabel(String status) {
    final formatted = status.replaceAll('_', ' ');
    return formatted.isEmpty ? 'Monitoring' : formatted[0].toUpperCase() + formatted.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final measuredSignals = readiness.measuredSignals;
    final expectedSignals = readiness.expectedSignals;
    final signalLabel = measuredSignals != null && expectedSignals != null
        ? '$measuredSignals of $expectedSignals signals'
        : 'Lifecycle signals';

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enterprise readiness', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ReadinessPill(
                label: 'Tier',
                value: readiness.tier.replaceAll('_', ' '),
              ),
              _ReadinessPill(
                label: 'Status',
                value: _statusLabel(readiness.status),
                background: colorScheme.primary.withOpacity(0.12),
                foreground: colorScheme.primary,
              ),
              if (readiness.maturityScore != null)
                _ReadinessPill(
                  label: 'Maturity',
                  value: '${readiness.maturityScore!.toStringAsFixed(1)}%',
                ),
              if (readiness.scoreConfidence != null)
                _ReadinessPill(
                  label: 'Score confidence',
                  value: '${readiness.scoreConfidence!.toStringAsFixed(0)}%',
                ),
              if (readiness.dataFreshnessHours != null)
                _ReadinessPill(
                  label: 'Data freshness',
                  value: '${readiness.dataFreshnessHours!.toStringAsFixed(1)} hrs',
                ),
              _ReadinessPill(
                label: 'Signals',
                value: signalLabel,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (readiness.highlights.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Highlights', style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...readiness.highlights.map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 6, right: 12),
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            item,
                            style: textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          if (readiness.watchouts.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Watchouts', style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...readiness.watchouts.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.warning_amber_rounded, color: colorScheme.error, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        item,
                        style: textTheme.bodyMedium?.copyWith(color: colorScheme.error),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (readiness.actions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Next plays', style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...readiness.actions.map(
              (action) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(action.label, style: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      action.description,
                      style: textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                    if (action.impact != null || action.category != null) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (action.impact != null)
                            Chip(
                              label: Text('Impact ${action.impact}'),
                              visualDensity: VisualDensity.compact,
                            ),
                          if (action.category != null)
                            Chip(
                              label: Text(action.category!.toUpperCase()),
                              visualDensity: VisualDensity.compact,
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReadinessPill extends StatelessWidget {
  const _ReadinessPill({
    required this.label,
    required this.value,
    this.background,
    this.foreground,
  });

  final String label;
  final String value;
  final Color? background;
  final Color? foreground;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: background ?? colorScheme.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: textTheme.labelSmall?.copyWith(color: foreground ?? colorScheme.onSurfaceVariant)),
          const SizedBox(height: 4),
          Text(
            value,
            style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: foreground ?? colorScheme.onSurface),
          ),
        ],
      ),
    );
  }
}

class _StagePerformanceCard extends StatelessWidget {
  const _StagePerformanceCard({required this.stages});

  final List<AtsStagePerformance> stages;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Stage performance', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Monitor SLA adherence and velocity across each stage of your ATS pipeline.',
            style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          if (stages.isEmpty)
            Text('Connect ATS stages to unlock performance analytics.', style: textTheme.bodyMedium)
          else
            Column(
              children: stages
                  .map(
                    (stage) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(stage.name, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(
                                  'SLA ${stage.slaHours?.toStringAsFixed(0) ?? '—'} hrs • Avg ${stage.averageDurationHours?.toStringAsFixed(1) ?? '—'} hrs',
                                  style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${stage.advanceRate.toStringAsFixed(1)}% advance', style: textTheme.bodyMedium),
                              Text(
                                '${stage.pendingReviews} pending',
                                style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
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

class _ApprovalQueueCard extends StatelessWidget {
  const _ApprovalQueueCard({required this.queue});

  final AtsApprovalQueue queue;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Approval queue', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            '${queue.total} approvals in-flight · ${queue.overdue} overdue',
            style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          if (queue.items.isEmpty)
            Text('All approvals cleared within SLA.', style: textTheme.bodyMedium)
          else
            Column(
              children: queue.items
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.approverRole, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(
                                  '${item.status.replaceAll('_', ' ')} • Waiting ${item.waitingHours?.toStringAsFixed(1) ?? '—'} hrs',
                                  style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                          if (item.isOverdue)
                            Chip(
                              label: const Text('Overdue'),
                              backgroundColor: theme.colorScheme.error.withOpacity(0.12),
                              labelStyle: textTheme.labelSmall?.copyWith(color: theme.colorScheme.error),
                              visualDensity: VisualDensity.compact,
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

class _CampaignInsightsCard extends StatelessWidget {
  const _CampaignInsightsCard({required this.campaigns});

  final List<AtsCampaignInsight> campaigns;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Campaign intelligence', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            'Optimise sourcing spend across Gigvora, referrals, and agency partners.',
            style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          if (campaigns.isEmpty)
            Text('No campaign metrics captured in this window.', style: textTheme.bodyMedium)
          else
            Column(
              children: campaigns
                  .map(
                    (campaign) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(campaign.channel, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(
                                  '${campaign.applications} applications • ${campaign.hires} hires',
                                  style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${campaign.conversionRate.toStringAsFixed(1)}% conversion', style: textTheme.bodyMedium),
                              Text(
                                'CPA ${(campaign.costPerApplication ?? 0).toStringAsFixed(0)}',
                                style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
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

class _FunnelCard extends StatelessWidget {
  const _FunnelCard({required this.stages});

  final List<AtsFunnelStage> stages;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Pipeline conversion', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          if (stages.isEmpty)
            Text('Conversion funnel will populate once ATS signals are connected.', style: textTheme.bodyMedium)
          else
            Column(
              children: stages
                  .map(
                    (stage) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(stage.label, style: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${stage.count} candidates', style: textTheme.bodyMedium),
                              Text(
                                '${stage.conversionFromPrevious.toStringAsFixed(1)}% stage · ${stage.cumulativeConversion.toStringAsFixed(1)}% overall',
                                style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
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

class _ActivityHighlights extends StatelessWidget {
  const _ActivityHighlights({required this.activity, required this.interviewOps});

  final AtsActivitySummary activity;
  final AtsInterviewOperations interviewOps;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Recent lifecycle activity', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                _ActivityTile(label: 'Approvals completed', value: activity.approvalsCompleted.toString()),
                _ActivityTile(label: 'Campaign reports', value: activity.campaignsTracked.toString()),
                _ActivityTile(label: 'Interviews scheduled', value: activity.interviewsScheduled.toString()),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Interview operations', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                _ActivityTile(label: 'Upcoming interviews', value: interviewOps.upcomingCount.toString()),
                _ActivityTile(
                  label: 'Average lead time',
                  value: interviewOps.averageLeadTimeHours != null
                      ? '${interviewOps.averageLeadTimeHours!.toStringAsFixed(1)} hrs'
                      : '—',
                ),
                _ActivityTile(
                  label: 'Average duration',
                  value: interviewOps.averageDurationMinutes != null
                      ? '${interviewOps.averageDurationMinutes!.toStringAsFixed(0)} mins'
                      : '—',
                ),
                _ActivityTile(
                  label: 'Reschedule rate',
                  value: interviewOps.rescheduleRate != null
                      ? '${interviewOps.rescheduleRate!.toStringAsFixed(1)}%'
                      : '—',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: textTheme.bodyMedium)),
          Text(value, style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _CandidateExperienceCard extends StatelessWidget {
  const _CandidateExperienceCard({required this.experience, required this.care});

  final AtsCandidateExperience experience;
  final AtsCandidateCare care;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Candidate experience guardrails', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ExperiencePill(label: 'NPS', value: experience.nps != null ? experience.nps!.toStringAsFixed(1) : '—'),
              _ExperiencePill(
                label: 'Avg satisfaction',
                value: experience.averageScore != null ? experience.averageScore!.toStringAsFixed(1) : '—',
              ),
              _ExperiencePill(
                label: 'Survey responses',
                value: (experience.responseCount ?? 0).toString(),
              ),
              _ExperiencePill(
                label: 'Follow-ups pending',
                value: (experience.followUpsPending ?? 0).toString(),
              ),
              _ExperiencePill(
                label: 'Open tickets',
                value: (care.openTickets ?? 0).toString(),
              ),
              _ExperiencePill(
                label: 'Response time',
                value: care.averageResponseMinutes != null
                    ? '${care.averageResponseMinutes!.toStringAsFixed(0)} mins'
                    : '—',
              ),
              _ExperiencePill(
                label: 'Escalations',
                value: (care.escalations ?? 0).toString(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ExperiencePill extends StatelessWidget {
  const _ExperiencePill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final colorScheme = theme.colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.secondaryContainer.withOpacity(0.35),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(value, style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

String formatRelativeTime(DateTime dateTime) {
  final now = DateTime.now();
  final difference = now.difference(dateTime);
  if (difference.inMinutes.abs() < 1) {
    return 'just now';
  }
  if (difference.isNegative) {
    if (difference.abs().inHours < 1) {
      return 'in ${difference.abs().inMinutes} mins';
    }
    return 'in ${difference.abs().inHours} hrs';
  }
  if (difference.inHours < 1) {
    return '${difference.inMinutes} mins ago';
  }
  if (difference.inHours < 24) {
    return '${difference.inHours} hrs ago';
  }
  return '${difference.inDays} days ago';
}
