import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../../theme/widgets.dart';
import '../application/user_dashboard_controller.dart';
import '../domain/user_dashboard.dart';

const _allowedRoles = <String>{'user', 'freelancer', 'agency', 'company', 'headhunter'};

class UserDashboardScreen extends ConsumerWidget {
  const UserDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;

    if (session == null) {
      return const _LoginRequiredView();
    }

    if (!_allowedRoles.any(session.memberships.contains)) {
      return _AccessDeniedView(session: session);
    }

    final dashboardState = ref.watch(userDashboardControllerProvider);
    final controller = ref.read(userDashboardControllerProvider.notifier);

    return GigvoraScaffold(
      title: 'User & Job Seeker Command Center',
      subtitle: 'Candidate success workspace',
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
        data: (snapshot) => _UserDashboardBody(
          snapshot: snapshot,
          onRefresh: () => controller.refresh(forceRefresh: true),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _DashboardError(
          message: "We couldn't sync the command center. Pull down to try again.",
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
      title: 'User & Job Seeker Command Center',
      subtitle: 'Secure authentication required',
      body: Center(
        child: GigvoraCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sign in to access personalised insights', style: theme.textTheme.titleMedium),
              const SizedBox(height: 12),
              Text(
                'Authenticate to unlock automation analytics, interview readiness metrics, and compliance guardrails aligned '
                'with your Gigvora workspace.',
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
  const _AccessDeniedView({required this.session});

  final UserSession session;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraScaffold(
      title: 'User & Job Seeker Command Center',
      subtitle: 'Access restricted',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("You don't have an eligible membership", style: theme.textTheme.titleMedium),
                const SizedBox(height: 12),
                Text(
                  'Switch to an account with user, freelancer, agency, company, or headhunter permissions to continue. '
                  'Roles currently linked to your profile: ${session.memberships.join(', ')}.',
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
                    'Unable to load dashboard insights',
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

class _UserDashboardBody extends StatelessWidget {
  const _UserDashboardBody({required this.snapshot, required this.onRefresh});

  final UserDashboardSnapshot snapshot;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          _DashboardMeta(snapshot: snapshot),
          const SizedBox(height: 20),
          _SummaryMetricsGrid(summary: snapshot.summary, affiliate: snapshot.affiliateProgram),
          const SizedBox(height: 20),
          _PipelineAutomationCard(pipeline: snapshot.pipeline),
          const SizedBox(height: 20),
          _RemindersCard(pipeline: snapshot.pipeline),
          const SizedBox(height: 20),
          _InterviewsCard(interviews: snapshot.upcomingInterviews),
          const SizedBox(height: 20),
          _DocumentStudioCard(digest: snapshot.documentStudio),
          const SizedBox(height: 20),
          _AffiliateProgramCard(affiliate: snapshot.affiliateProgram),
          const SizedBox(height: 20),
          _FocusDigestCard(digest: snapshot.focusDigest),
          const SizedBox(height: 20),
          _ComplianceAlertsCard(alerts: snapshot.complianceAlerts),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _DashboardMeta extends StatelessWidget {
  const _DashboardMeta({required this.snapshot});

  final UserDashboardSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final formatter = DateFormat('EEE dd MMM, HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Synchronized overview', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _MetaChip(
                label: 'Last updated',
                value: formatter.format(snapshot.generatedAt),
                icon: Icons.schedule,
              ),
              _MetaChip(
                label: 'Data source',
                value: snapshot.fromCache ? 'Secured cache' : 'Live sync',
                icon: snapshot.fromCache ? Icons.cloud_download_outlined : Icons.bolt,
              ),
              _MetaChip(
                label: 'Automation coverage',
                value: '${(snapshot.pipeline.completionRate * 100).toStringAsFixed(0)}%',
                icon: Icons.auto_mode,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Pipeline, interviews, documents, and compliance signals are governed with enterprise controls across every '
            'channel, ensuring parity with the web experience.',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _SummaryMetricsGrid extends StatelessWidget {
  const _SummaryMetricsGrid({required this.summary, required this.affiliate});

  final UserDashboardSummary summary;
  final AffiliateProgramDigest affiliate;

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.simpleCurrency(name: affiliate.currency);

    final metrics = [
      _SummaryMetric('Total applications', summary.totalApplications.toString(), 'Opportunities tracked across markets.'),
      _SummaryMetric('Active pipeline', summary.activeApplications.toString(), 'Live opportunities needing touchpoints.'),
      _SummaryMetric('Interviews scheduled', summary.interviewsScheduled.toString(), 'Upcoming conversations confirmed.'),
      _SummaryMetric('Documents uploaded', summary.documentsUploaded.toString(), 'CVs, case studies, and transcripts.'),
      _SummaryMetric('Offers in play', summary.offersNegotiating.toString(), 'Negotiations running this week.'),
      _SummaryMetric('Connections', summary.connections.toString(), 'Warm introductions and advocates.'),
      _SummaryMetric(
        'Affiliate earnings',
        currency.format(affiliate.lifetimeEarnings),
        'Pending ${currency.format(affiliate.pendingPayouts)} · ${affiliate.conversionRate.toStringAsFixed(1)}% conversion',
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        int columns = 1;
        if (width >= 900) {
          columns = 3;
        } else if (width >= 600) {
          columns = 2;
        }
        final tileWidth = (width - (16.0 * (columns - 1))) / columns;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: metrics
              .map((metric) => SizedBox(
                    width: columns == 1 ? width : tileWidth,
                    child: _SummaryMetricCard(metric: metric),
                  ))
              .toList(),
        );
      },
    );
  }
}

class _SummaryMetric {
  const _SummaryMetric(this.label, this.value, this.caption);

  final String label;
  final String value;
  final String caption;
}

class _SummaryMetricCard extends StatelessWidget {
  const _SummaryMetricCard({required this.metric});

  final _SummaryMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(metric.label, style: theme.textTheme.labelLarge?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 12),
          Text(metric.value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(metric.caption, style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _PipelineAutomationCard extends StatelessWidget {
  const _PipelineAutomationCard({required this.pipeline});

  final UserPipelineAutomation pipeline;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colorScheme.primary.withOpacity(0.12),
                colorScheme.primaryContainer.withOpacity(0.18),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Career pipeline automation', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                pipeline.boardName,
                style: theme.textTheme.titleMedium?.copyWith(color: colorScheme.onPrimaryContainer),
              ),
              const SizedBox(height: 16),
              _ProgressRow(completion: pipeline.completionRate),
              const SizedBox(height: 20),
              Column(
                children: pipeline.stages
                    .map((stage) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _StageProgress(stage: stage),
                        ))
                    .toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.completion});

  final double completion;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: completion.clamp(0.0, 1.0),
              minHeight: 10,
              backgroundColor: colorScheme.onPrimary.withOpacity(0.12),
              valueColor: AlwaysStoppedAnimation<Color>(colorScheme.primary),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text('${(completion * 100).toStringAsFixed(0)}%', style: theme.textTheme.titleMedium),
      ],
    );
  }
}

class _StageProgress extends StatelessWidget {
  const _StageProgress({required this.stage});

  final UserPipelineStage stage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface.withOpacity(0.9),
        borderRadius: BorderRadius.circular(18),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(stage.name, style: theme.textTheme.titleMedium),
              Text('${stage.count} active', style: theme.textTheme.labelLarge),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: LinearProgressIndicator(
              value: stage.serviceLevelHealth.clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: colorScheme.primary.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation<Color>(colorScheme.secondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _RemindersCard extends StatelessWidget {
  const _RemindersCard({required this.pipeline});

  final UserPipelineAutomation pipeline;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final dateFormat = DateFormat('EEE, HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Automation guardrails & reminders', style: theme.textTheme.titleMedium),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: pipeline.guardrails
                .map(
                  (guardrail) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.verified_user_outlined, size: 16),
                        const SizedBox(width: 8),
                        Text(guardrail, style: theme.textTheme.labelMedium),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 20),
          Column(
            children: pipeline.reminders
                .map(
                  (reminder) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          reminder.priority == ReminderPriority.high
                              ? Icons.priority_high
                              : reminder.priority == ReminderPriority.medium
                                  ? Icons.notifications_active_outlined
                                  : Icons.schedule,
                          color: reminder.priority == ReminderPriority.high
                              ? colorScheme.error
                              : reminder.priority == ReminderPriority.medium
                                  ? colorScheme.secondary
                                  : colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(reminder.label, style: theme.textTheme.bodyLarge),
                              const SizedBox(height: 4),
                              Text(
                                'Due ${dateFormat.format(reminder.dueAt)}',
                                style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          if (pipeline.nextAudit != null)
          Text(
            "Next compliance audit ${DateFormat('EEE dd MMM').format(pipeline.nextAudit!)}.",
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _InterviewsCard extends StatelessWidget {
  const _InterviewsCard({required this.interviews});

  final List<UserInterviewSchedule> interviews;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final formatter = DateFormat('EEE dd MMM · HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Upcoming interviews', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          if (interviews.isEmpty)
            Text(
              'No interviews scheduled. Activate auto-apply or warm introductions to replenish the pipeline.',
              style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
            )
          else
            Column(
              children: interviews
                  .map(
                    (interview) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: colorScheme.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.calendar_month, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${interview.role} · ${interview.company}', style: theme.textTheme.titleMedium),
                                const SizedBox(height: 4),
                                Text(
                                  '${interview.stage} — ${formatter.format(interview.scheduledAt)}',
                                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${interview.panel}${String.fromCharCode(10)}${interview.location}',
                                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                                ),
                              ],
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

class _DocumentStudioCard extends StatelessWidget {
  const _DocumentStudioCard({required this.digest});

  final DocumentStudioDigest digest;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Document studio spotlight', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(
            'Templates, transcripts, and brand assets ready for secure sharing across recruiters and mentors.',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _DocumentStat(label: 'Total assets', value: digest.totalAssets.toString()),
              _DocumentStat(label: 'Templates', value: digest.templates.toString()),
              _DocumentStat(label: 'Portfolio projects', value: digest.portfolioProjects.toString()),
              _DocumentStat(label: 'Vendor deliverables', value: digest.vendorDeliverables.toString()),
            ],
          ),
          const SizedBox(height: 16),
          Text('Highlights', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          ...digest.highlights.map(
            (highlight) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_outline, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(highlight, style: theme.textTheme.bodyMedium),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Last updated ${digest.lastUpdatedBy}',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => context.go('/dashboard/user/cv-workspace'),
              icon: const Icon(Icons.launch),
              label: const Text('Open CV workspace'),
            ),
          ),
        ],
      ),
    );
  }
}

class _AffiliateProgramCard extends StatelessWidget {
  const _AffiliateProgramCard({required this.affiliate});

  final AffiliateProgramDigest affiliate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final currency = NumberFormat.simpleCurrency(name: affiliate.currency);
    final dateFormatter = DateFormat('EEE dd MMM');

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Affiliate & referrals', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Partner revenue, payouts, and compliance controls mirrored from the web console.',
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetaChip(label: 'Lifetime earnings', value: currency.format(affiliate.lifetimeEarnings), icon: Icons.payments),
              _MetaChip(
                label: 'Pending payout',
                value: currency.format(affiliate.pendingPayouts),
                icon: Icons.account_balance_wallet_outlined,
              ),
              _MetaChip(
                label: 'Conversion rate',
                value: '${affiliate.conversionRate.toStringAsFixed(1)}%',
                icon: Icons.trending_up,
              ),
              _MetaChip(
                label: 'Next payout',
                value: dateFormatter.format(affiliate.nextPayoutAt),
                icon: Icons.event_available,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Commission tiers', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          ...affiliate.tiers.map((tier) {
            final tierRange = tier.maxValue != null
                ? '${currency.format(tier.minValue)} – ${currency.format(tier.maxValue!)}'
                : '${currency.format(tier.minValue)}+';
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      tier.name,
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    '${tier.rate.toStringAsFixed(1)}% · $tierRange',
                    style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          Text('Top performing links', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          ...affiliate.links.map(
            (link) => Container(
              margin: const EdgeInsets.symmetric(vertical: 6),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colorScheme.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(link.label, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                        Text(link.code, style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(currency.format(link.estimatedCommission),
                          style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                      Text(
                        '${currency.format(link.totalRevenue)} · ${link.conversions} conversions',
                        style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Compliance posture', style: theme.textTheme.labelLarge),
          const SizedBox(height: 6),
          Text(
            affiliate.requiredDocuments.isEmpty
                ? 'No documents required before payout.'
                : 'Required documents: ${affiliate.requiredDocuments.join(', ')}',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text(
            affiliate.twoFactorRequired
                ? 'Two-factor authentication enforced for partner logins.'
                : 'Two-factor authentication optional for partners.',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text(
            affiliate.kycRequired
                ? 'KYC verification required before releasing payouts.'
                : 'KYC checks handled during manual review.',
            style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _DocumentStat extends StatelessWidget {
  const _DocumentStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelMedium?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 6),
          Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _FocusDigestCard extends StatelessWidget {
  const _FocusDigestCard({required this.digest});

  final FocusDigest digest;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final formatter = DateFormat('EEE dd MMM · HH:mm');
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Focus & accountability', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(
            'Next focus block: ${digest.nextFocusBlock != null ? formatter.format(digest.nextFocusBlock!) : 'Schedule to stay ahead.'}',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          Text('Reserved ${digest.minutesReserved} minutes for ${digest.focusArea.toLowerCase()}.',
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
          const SizedBox(height: 16),
          ...digest.highlights.map(
            (highlight) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.bolt, color: colorScheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(highlight, style: theme.textTheme.bodyMedium)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ComplianceAlertsCard extends StatelessWidget {
  const _ComplianceAlertsCard({required this.alerts});

  final List<String> alerts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Compliance & readiness', style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),
          ...alerts.map(
            (alert) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_moon_outlined, size: 18, color: colorScheme.secondary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(alert, style: theme.textTheme.bodyMedium),
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

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant)),
              Text(value, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}
