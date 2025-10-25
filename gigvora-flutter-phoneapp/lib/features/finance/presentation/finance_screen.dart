import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../../analytics/utils/formatters.dart';
import '../../analytics/widgets/analytics_metric_grid.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../../services/data/models/dispute_case.dart';
import '../application/finance_controller.dart';
import '../data/models/finance_overview.dart';
import '../domain/finance_access_policy.dart';

class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final controller = ref.read(sessionControllerProvider.notifier);

    if (!sessionState.isAuthenticated) {
      return GigvoraScaffold(
        title: 'Finance control tower',
        subtitle: 'Payments, escrow, and disputes',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sign in to your workspace to view finance telemetry and release funds.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => GoRouter.of(context).go('/login'),
              icon: const Icon(Icons.lock_open_outlined),
              label: const Text('Sign in to continue'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => GoRouter.of(context).go('/signup'),
              icon: const Icon(Icons.person_add_alt),
              label: const Text('Create a Gigvora profile'),
            ),
            const SizedBox(height: 24),
            Text(
              'Want to explore the workflows now? Tap below to load a demo workspace session.',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () => controller.loginDemo(),
              icon: const Icon(Icons.play_circle_outline),
              label: const Text('Launch demo session'),
            ),
          ],
        ),
      );
    }

    final session = sessionState.session!;
    final hasAccess = FinanceAccessPolicy.hasAccess(session);

    if (!hasAccess) {
      return GigvoraScaffold(
        title: 'Finance control tower',
        subtitle: 'Payments, escrow, and disputes',
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This workspace section is reserved for finance, company, or agency administrators.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 12),
            Text(
              'Ask your workspace owner to grant finance operations access if you need to manage escrow releases.',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => _showSnack(context, 'Ping your workspace owner to enable finance access.'),
              icon: const Icon(Icons.support_agent_outlined),
              label: const Text('Contact workspace owner'),
            ),
          ],
        ),
      );
    }

    final state = ref.watch(financeControllerProvider);
    final financeController = ref.read(financeControllerProvider.notifier);
    final overview = state.data ?? FinanceOverview.empty();

    return GigvoraScaffold(
      title: 'Finance control tower',
      subtitle: 'Payments, escrow, and disputes',
      actions: [
        IconButton(
          tooltip: 'Refresh overview',
          onPressed: financeController.refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (state.fromCache && !state.loading)
            const _StatusBanner(
              icon: Icons.offline_bolt,
              background: Color(0xFFFEF3C7),
              foreground: Color(0xFF92400E),
              message: 'Showing cached finance telemetry while the network reconnects.',
            ),
          if (state.hasError && !state.loading)
            const _StatusBanner(
              icon: Icons.error_outline,
              background: Color(0xFFFEE2E2),
              foreground: Color(0xFFB91C1C),
              message: 'Unable to sync the latest finance metrics. Pull to refresh to try again.',
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
          Expanded(
            child: RefreshIndicator(
              onRefresh: financeController.refresh,
              child: state.loading && overview.isEmpty
                  ? const _FinanceSkeleton()
                  : ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        _FinanceMetricsGrid(
                          summary: overview.summary,
                          automation: overview.automation,
                        ),
                        const SizedBox(height: 24),
                        _AccountSection(accounts: overview.accounts),
                        const SizedBox(height: 24),
                        _ReleaseSection(
                          releases: overview.releases,
                          onManualRelease: (release) async {
                            await financeController.recordReleaseAction(release, action: 'manual_release');
                            _showSnack(context, 'Marked ${release.reference} for manual review.');
                          },
                          onEvidence: (release) async {
                            await financeController.recordReleaseAction(release, action: 'evidence_requested');
                            _showSnack(context, 'Evidence reminder sent for ${release.reference}.');
                          },
                        ),
                        const SizedBox(height: 24),
                        _DisputeSection(
                          disputes: overview.disputes,
                          onEscalate: (dispute) async {
                            await financeController.recordDisputeAction(dispute, action: 'escalate');
                            _showSnack(context, 'Dispute ${dispute.id} escalated to arbitration.');
                          },
                          onAddEvidence: (dispute) async {
                            await financeController.recordDisputeAction(dispute, action: 'add_evidence');
                            _showSnack(context, 'Evidence reminder queued for ${dispute.id}.');
                          },
                        ),
                        const SizedBox(height: 24),
                        _ComplianceSection(
                          tasks: overview.complianceTasks,
                          onComplete: (task) async {
                            await financeController.recordTaskAction(task, action: 'complete');
                            _showSnack(context, 'Task ${task.title} marked as complete.');
                          },
                        ),
                        const SizedBox(height: 24),
                        _CashflowSection(
                          cashflow: overview.cashflow,
                          currency: overview.summary.currency,
                          maxMagnitude: overview.maxCashflowMagnitude,
                        ),
                        const SizedBox(height: 24),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(24),
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
                  .bodyMedium
                  ?.copyWith(color: foreground, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _FinanceSkeleton extends StatelessWidget {
  const _FinanceSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: List.generate(
            4,
            (index) => Container(
              width: MediaQuery.of(context).size.width / 2 - 32,
              constraints: const BoxConstraints(minWidth: 160, maxWidth: 200),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 12, width: 64, color: Colors.white.withOpacity(0.4)),
                  const SizedBox(height: 16),
                  Container(height: 20, width: 80, color: Colors.white.withOpacity(0.4)),
                  const SizedBox(height: 8),
                  Container(height: 12, width: 140, color: Colors.white.withOpacity(0.3)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          height: 140,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ],
    );
  }
}

class _FinanceMetricsGrid extends StatelessWidget {
  const _FinanceMetricsGrid({required this.summary, required this.automation});

  final FinanceSummary summary;
  final FinanceAutomationSignals automation;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    String revenueChangeCopy(double change) {
      if (change.isNaN) {
        return '—';
      }
      final rounded = change.toStringAsFixed(1);
      final prefix = change > 0 ? '+' : '';
      return '$prefix$rounded%';
    }

    final summaryMetrics = [
      AnalyticsDatum(
        label: 'Funds in escrow',
        value: formatCurrency(summary.inEscrow, currency: summary.currency),
        caption: 'Safeguarded across regulated payment partners.',
      ),
      AnalyticsDatum(
        label: 'Pending release',
        value: formatCurrency(summary.pendingRelease, currency: summary.currency),
        caption: 'Awaiting milestone approvals or automation windows.',
      ),
      AnalyticsDatum(
        label: 'Held in disputes',
        value: formatCurrency(summary.disputeHold, currency: summary.currency),
        caption: 'Frozen while trust & safety mediates counter-parties.',
      ),
      AnalyticsDatum(
        label: 'Released this week',
        value: formatCurrency(summary.releasedThisWeek, currency: summary.currency),
        caption: 'Cleared to providers over the last seven days.',
      ),
      AnalyticsDatum(
        label: 'Month-to-date revenue',
        value: formatCurrency(
          summary.monthToDateRevenue.amount,
          currency: summary.monthToDateRevenue.currency,
        ),
        caption:
            'Previous ${formatCurrency(summary.monthToDateRevenue.previousAmount, currency: summary.monthToDateRevenue.currency)} • ${revenueChangeCopy(summary.monthToDateRevenue.changePercentage)} vs prior period.',
      ),
      AnalyticsDatum(
        label: 'Tax reserve FY${summary.taxReadyBalance.fiscalYear}',
        value: formatCurrency(
          summary.taxReadyBalance.amount,
          currency: summary.taxReadyBalance.currency,
        ),
        caption: summary.taxReadyBalance.latestExport != null
            ? 'Latest export ${formatDate(summary.taxReadyBalance.latestExport!.generatedAt)} • ${summary.taxReadyBalance.latestExport!.status.toUpperCase()}'
            : 'Reconcile filings before quarter close.',
      ),
      AnalyticsDatum(
        label: 'Tracked expenses',
        value: formatCurrency(
          summary.trackedExpenses.amount,
          currency: summary.trackedExpenses.currency,
        ),
        caption: '${summary.trackedExpenses.count} entries logged this month.',
      ),
      AnalyticsDatum(
        label: 'Savings runway',
        value: summary.savingsRunway.months != null
            ? '${summary.savingsRunway.months!.toStringAsFixed(1)} months'
            : '—',
        caption:
            'Reserve ${formatCurrency(summary.savingsRunway.reserveAmount, currency: summary.savingsRunway.currency)} • Burn ${summary.savingsRunway.monthlyBurn != null ? formatCurrency(summary.savingsRunway.monthlyBurn!, currency: summary.savingsRunway.currency) : '—'}',
      ),
    ];

    final automationMetrics = [
      AnalyticsDatum(
        label: 'Auto-release rate',
        value: formatPercent(automation.autoReleaseRate),
        caption: 'Payouts cleared straight through automations.',
      ),
      AnalyticsDatum(
        label: 'Manual review',
        value: formatPercent(automation.manualReviewRate),
        caption: 'Queued for finance analyst validation.',
      ),
      AnalyticsDatum(
        label: 'Avg clearance',
        value: '${automation.averageClearanceHours.toStringAsFixed(1)} hrs',
        caption: 'Time from approval to release.',
      ),
      AnalyticsDatum(
        label: 'Flagged transactions',
        value: automation.flaggedTransactions.toString(),
        caption: 'Escrows escalated by anomaly detection.',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Financial posture', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        AnalyticsMetricGrid(metrics: summaryMetrics),
        const SizedBox(height: 24),
        Text('Automation health', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        AnalyticsMetricGrid(
          metrics: automationMetrics,
          variant: AnalyticsMetricVariant.gradient,
        ),
        const SizedBox(height: 12),
        Text(
          'Net cashflow (7d): ${formatCurrency(summary.netCashFlow7d, currency: summary.currency)} • Forecast (30d): ${formatCurrency(summary.forecast30d, currency: summary.currency)}',
          style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
      ],
    );
  }
}

class _AccountSection extends StatelessWidget {
  const _AccountSection({required this.accounts});

  final List<FinanceAccountSummary> accounts;

  @override
  Widget build(BuildContext context) {
    if (accounts.isEmpty) {
      return GigvoraCard(
        child: Text(
          'No safeguarding accounts connected yet. Add finance partners to begin monitoring balances.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Escrow accounts',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          ...accounts.map((account) => _AccountTile(account: account)),
        ],
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({required this.account});

  final FinanceAccountSummary account;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final statusColor = account.status == 'healthy'
        ? colorScheme.primary
        : account.status == 'attention'
            ? Colors.amber.shade700
            : Colors.red.shade600;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(account.name, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                  Text(account.institution, style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                ],
              ),
              Chip(
                label: Text(account.status == 'attention' ? 'Needs attention' : account.status),
                backgroundColor: statusColor.withOpacity(0.12),
                labelStyle: textTheme.labelSmall?.copyWith(color: statusColor, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _InfoPill(
                label: 'Balance',
                value: formatCurrency(account.balance, currency: account.currency),
              ),
              _InfoPill(
                label: 'Safeguarding',
                value: formatCurrency(account.safeguarding, currency: account.currency),
              ),
              _InfoPill(
                label: 'Pending transfers',
                value: formatCurrency(account.pendingTransfers, currency: account.currency),
              ),
            ],
          ),
          if (account.lastReconciledAt != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Last reconciled ${formatDate(account.lastReconciledAt)}',
                style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ),
        ],
      ),
    );
  }
}

class _ReleaseSection extends StatelessWidget {
  const _ReleaseSection({
    required this.releases,
    required this.onManualRelease,
    required this.onEvidence,
  });

  final List<FinanceRelease> releases;
  final ValueChanged<FinanceRelease> onManualRelease;
  final ValueChanged<FinanceRelease> onEvidence;

  @override
  Widget build(BuildContext context) {
    if (releases.isEmpty) {
      return GigvoraCard(
        child: Text(
          'No upcoming releases. Escrow automation will populate this queue as milestones progress.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Release pipeline',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          ...releases.map((release) => _ReleaseTile(
                release: release,
                onManualRelease: onManualRelease,
                onEvidence: onEvidence,
              )),
        ],
      ),
    );
  }
}

class _ReleaseTile extends StatelessWidget {
  const _ReleaseTile({
    required this.release,
    required this.onManualRelease,
    required this.onEvidence,
  });

  final FinanceRelease release;
  final ValueChanged<FinanceRelease> onManualRelease;
  final ValueChanged<FinanceRelease> onEvidence;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final riskColor = release.risk.contains('attention')
        ? Colors.amber.shade700
        : release.risk.contains('risk')
            ? Colors.red.shade600
            : colorScheme.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surfaceVariant.withOpacity(0.35),
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(release.vendor, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    Text(release.milestone,
                        style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                  ],
                ),
                Wrap(
                  spacing: 8,
                  children: [
                    Chip(
                      label: Text(release.automation.replaceAll('_', ' ')),
                      backgroundColor: colorScheme.primary.withOpacity(0.12),
                      labelStyle: textTheme.labelSmall?.copyWith(color: colorScheme.primary),
                    ),
                    Chip(
                      label: Text(release.risk.replaceAll('_', ' ')),
                      backgroundColor: riskColor.withOpacity(0.12),
                      labelStyle: textTheme.labelSmall?.copyWith(color: riskColor),
                    ),
                    if (release.requiresEvidence)
                      Chip(
                        label: const Text('Evidence'),
                        backgroundColor: Colors.amber.shade100,
                        labelStyle: textTheme.labelSmall?.copyWith(color: Colors.amber.shade800),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _InfoPill(label: 'Reference', value: release.reference),
                _InfoPill(label: 'Scheduled', value: formatDateTime(release.scheduledAt)),
                _InfoPill(label: 'Amount', value: formatCurrency(release.amount, currency: release.currency)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: [
                OutlinedButton.icon(
                  onPressed: () => onEvidence(release),
                  icon: const Icon(Icons.note_add_outlined),
                  label: const Text('Request evidence'),
                ),
                ElevatedButton.icon(
                  onPressed: () => onManualRelease(release),
                  icon: const Icon(Icons.playlist_add_check),
                  label: const Text('Manual release'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DisputeSection extends StatelessWidget {
  const _DisputeSection({
    required this.disputes,
    required this.onEscalate,
    required this.onAddEvidence,
  });

  final List<DisputeCase> disputes;
  final ValueChanged<DisputeCase> onEscalate;
  final ValueChanged<DisputeCase> onAddEvidence;

  @override
  Widget build(BuildContext context) {
    if (disputes.isEmpty) {
      return GigvoraCard(
        child: Text(
          'No active disputes. Finance automation will continue to monitor for escalations.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Active disputes', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ...disputes.map((dispute) => _DisputeTile(
                dispute: dispute,
                onEscalate: onEscalate,
                onAddEvidence: onAddEvidence,
              )),
        ],
      ),
    );
  }
}

class _DisputeTile extends StatelessWidget {
  const _DisputeTile({
    required this.dispute,
    required this.onEscalate,
    required this.onAddEvidence,
  });

  final DisputeCase dispute;
  final ValueChanged<DisputeCase> onEscalate;
  final ValueChanged<DisputeCase> onAddEvidence;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surfaceVariant.withOpacity(0.35),
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Case ${dispute.id}', style: textTheme.labelSmall?.copyWith(color: colorScheme.primary)),
            const SizedBox(height: 8),
            Text(dispute.customer ?? 'Counterparty',
                style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              dispute.reason,
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _InfoPill(label: 'Stage', value: dispute.stage.name),
                _InfoPill(label: 'Priority', value: dispute.priority.name),
                _InfoPill(
                  label: 'Amount',
                  value: formatCurrency(dispute.amount ?? 0, currency: dispute.currencyCode ?? 'USD'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: [
                OutlinedButton.icon(
                  onPressed: () => onAddEvidence(dispute),
                  icon: const Icon(Icons.note_alt_outlined),
                  label: const Text('Request evidence'),
                ),
                ElevatedButton.icon(
                  onPressed: () => onEscalate(dispute),
                  icon: const Icon(Icons.warning_amber_rounded),
                  label: const Text('Escalate'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ComplianceSection extends StatelessWidget {
  const _ComplianceSection({required this.tasks, required this.onComplete});

  final List<FinanceComplianceTask> tasks;
  final ValueChanged<FinanceComplianceTask> onComplete;

  @override
  Widget build(BuildContext context) {
    if (tasks.isEmpty) {
      return GigvoraCard(
        child: Text(
          'All compliance actions are clear. Finance automation will alert you when new tasks arise.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Compliance follow-ups', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ...tasks.map((task) => _ComplianceTile(task: task, onComplete: onComplete)),
        ],
      ),
    );
  }
}

class _ComplianceTile extends StatelessWidget {
  const _ComplianceTile({required this.task, required this.onComplete});

  final FinanceComplianceTask task;
  final ValueChanged<FinanceComplianceTask> onComplete;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final tone = task.severity.contains('high')
        ? Colors.red.shade600
        : task.severity.contains('medium')
            ? Colors.amber.shade700
            : colorScheme.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surfaceVariant.withOpacity(0.35),
          borderRadius: BorderRadius.circular(20),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(task.title, style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                    Text('Owner: ${task.owner}',
                        style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                  ],
                ),
                Chip(
                  label: Text(task.status.replaceAll('_', ' ')),
                  backgroundColor: tone.withOpacity(0.12),
                  labelStyle: textTheme.labelSmall?.copyWith(color: tone),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: [
                _InfoPill(label: 'Severity', value: task.severity),
                if (task.dueDate != null)
                  _InfoPill(label: 'Due', value: formatDate(task.dueDate)),
                if (task.tags.isNotEmpty)
                  _InfoPill(label: 'Tags', value: task.tags.join(' • ')),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => onComplete(task),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Mark complete'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CashflowSection extends StatelessWidget {
  const _CashflowSection({
    required this.cashflow,
    required this.currency,
    required this.maxMagnitude,
  });

  final List<FinanceCashflowBucket> cashflow;
  final String currency;
  final double maxMagnitude;

  @override
  Widget build(BuildContext context) {
    if (cashflow.isEmpty) {
      return GigvoraCard(
        child: Text(
          'Cashflow projections will appear once finance telemetry syncs with live engagements.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Cashflow outlook', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ...cashflow.map((bucket) {
            final isPositive = bucket.net >= 0;
            final ratio = maxMagnitude == 0 ? 0.0 : (bucket.net.abs() / maxMagnitude).clamp(0.05, 1.0);
            final barColor = isPositive ? Colors.green.shade600 : Colors.red.shade600;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(bucket.label, style: Theme.of(context).textTheme.titleSmall),
                      Text(
                        formatCurrency(bucket.net, currency: currency),
                        style: Theme.of(context)
                            .textTheme
                            .bodyLarge
                            ?.copyWith(color: isPositive ? Colors.green.shade700 : Colors.red.shade700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: ratio,
                      child: Container(
                        decoration: BoxDecoration(
                          color: barColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Inflow ${formatCurrency(bucket.inflow, currency: currency)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                      Text('Outflow ${formatCurrency(bucket.outflow, currency: currency)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colorScheme.outline.withOpacity(0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: Theme.of(context)
                  .textTheme
                  .labelSmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant, letterSpacing: 0.8)),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

void _showSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

