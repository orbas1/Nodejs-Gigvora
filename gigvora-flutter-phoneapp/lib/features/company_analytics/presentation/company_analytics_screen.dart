import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../../analytics/utils/formatters.dart';
import '../../analytics/widgets/analytics_metric_grid.dart';
import '../application/company_analytics_controller.dart';
import '../data/models/company_analytics_dashboard.dart';

class CompanyAnalyticsScreen extends ConsumerWidget {
  const CompanyAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(companyAnalyticsControllerProvider);
    final controller = ref.read(companyAnalyticsControllerProvider.notifier);
    final dashboard = state.data ?? CompanyAnalyticsDashboard.empty();

    return GigvoraScaffold(
      title: 'Analytics & planning',
      subtitle: 'Forecasts, conversion telemetry, and workforce intelligence',
      actions: [
        IconButton(
          tooltip: 'Refresh analytics',
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
              _InfoBanner(
                icon: Icons.offline_bolt_outlined,
                message:
                    'Showing cached analytics until connectivity returns. Pull down to request the latest signals.',
                background: const Color(0xFFE0F2FE),
                foreground: const Color(0xFF0F4C81),
              ),
            if (state.error != null && !state.loading)
              _InfoBanner(
                icon: Icons.warning_amber_outlined,
                message: 'Unable to update analytics. ${state.error}',
                background: const Color(0xFFFDEDED),
                foreground: const Color(0xFFB42318),
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
            _SummaryMetrics(metrics: dashboard.summary),
            const SizedBox(height: 24),
            _ForecastPanel(forecast: dashboard.forecast, scenarios: dashboard.scenarios),
            const SizedBox(height: 24),
            _ConversionPanel(conversion: dashboard.conversion),
            const SizedBox(height: 24),
            _WorkforcePanel(workforce: dashboard.workforce),
            const SizedBox(height: 24),
            _AlertingPanel(alerting: dashboard.alerting),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  const _InfoBanner({
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

  final List<AnalyticsMetric> metrics;

  @override
  Widget build(BuildContext context) {
    final items = metrics
        .map(
          (metric) => AnalyticsDatum(
            label: metric.label,
            value: metric.value,
            delta: metric.delta,
            trend: _mapTrend(metric.trend),
          ),
        )
        .toList();

    return AnalyticsMetricGrid(
      metrics: items,
      variant: AnalyticsMetricVariant.gradient,
    );
  }

  AnalyticsTrend? _mapTrend(String? trend) {
    switch (trend) {
      case 'up':
        return AnalyticsTrend.up;
      case 'down':
        return AnalyticsTrend.down;
      case 'neutral':
        return AnalyticsTrend.neutral;
    }
    return null;
  }
}

class _ForecastPanel extends StatelessWidget {
  const _ForecastPanel({required this.forecast, required this.scenarios});

  final ForecastInsight forecast;
  final List<ScenarioPlan> scenarios;

  String _formatDouble(double? value, {String suffix = '', int fractionDigits = 1}) {
    if (value == null) {
      return '—';
    }
    return '${value.toStringAsFixed(fractionDigits)}$suffix';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Forecast & scenarios', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ForecastTile(label: 'Projected hires', value: _formatDouble(forecast.projectedHires)),
              _ForecastTile(label: 'Backlog roles', value: _formatDouble(forecast.backlog)),
              _ForecastTile(label: 'Time to fill', value: _formatDouble(forecast.timeToFillDays, suffix: ' days')),
              _ForecastTile(label: 'Projects at risk', value: _formatDouble(forecast.atRiskProjects)),
              _ForecastTile(label: 'Confidence', value: _formatDouble(forecast.confidence, suffix: '%')),
              if (forecast.lastSynced != null)
              _ForecastTile(label: 'Synced', value: formatRelativeTime(forecast.lastSynced!)),
            ],
          ),
          if (forecast.signals.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Signals informing forecast', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...forecast.signals.map(
              (signal) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Icon(Icons.insights, size: 16, color: Color(0xFF0F4C81)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        signal,
                        style: textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (scenarios.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Scenario planning', style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            _ScenarioTable(scenarios: scenarios),
          ],
        ],
      ),
    );
  }
}

class _ForecastTile extends StatelessWidget {
  const _ForecastTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      width: 180,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(value, style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _ScenarioTable extends StatelessWidget {
  const _ScenarioTable({required this.scenarios});

  final List<ScenarioPlan> scenarios;

  String _formatBudget(double? amount) {
    if (amount == null) {
      return '—';
    }
    final currency = NumberFormat.compactCurrency(symbol: r'$').format(amount);
    return currency;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.hardEdge,
      child: DataTable(
        headingRowColor: MaterialStateProperty.all(const Color(0xFFF1F5F9)),
        columns: const [
          DataColumn(label: Text('Scenario')),
          DataColumn(label: Text('Hiring plan')),
          DataColumn(label: Text('Budget impact')),
          DataColumn(label: Text('Probability')),
          DataColumn(label: Text('Status')),
        ],
        rows: scenarios
            .map(
              (scenario) => DataRow(
                cells: [
                  DataCell(Text(scenario.name)),
                  DataCell(Text(scenario.hiringPlan?.toStringAsFixed(0) ?? '—')),
                  DataCell(Text(_formatBudget(scenario.budgetImpact))),
                  DataCell(Text(scenario.probability != null
                      ? '${(scenario.probability! * 100).toStringAsFixed(0)}%'
                      : '—')),
                  DataCell(Text(scenario.status ?? '—')),
                ],
              ),
            )
            .toList(),
      ),
    );
  }
}

class _ConversionPanel extends StatelessWidget {
  const _ConversionPanel({required this.conversion});

  final ConversionSnapshot conversion;

  String _formatPercent(double? value) {
    if (value == null) {
      return '—';
    }
    return '${value.toStringAsFixed(1)}%';
  }

  String _formatDays(double? value) {
    if (value == null) {
      return '—';
    }
    return '${value.toStringAsFixed(1)} days';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Conversion telemetry', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ForecastTile(label: 'Application → interview', value: _formatPercent(conversion.applicationToInterview)),
              _ForecastTile(label: 'Interview → offer', value: _formatPercent(conversion.interviewToOffer)),
              _ForecastTile(label: 'Offer → hire', value: _formatPercent(conversion.offerToHire)),
              _ForecastTile(label: 'Cycle time', value: _formatDays(conversion.cycleTimeDays)),
            ],
          ),
          if (conversion.stages.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Stage performance', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Column(
              children: conversion.stages
                  .map(
                    (stage) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(stage.stage, style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 6),
                                Text(
                                  'Conversion ${_formatPercent(stage.conversionRate)} • Drop-off ${_formatPercent(stage.dropOffRate)}',
                                  style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            _formatDays(stage.medianTimeDays),
                            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _WorkforcePanel extends StatelessWidget {
  const _WorkforcePanel({required this.workforce});

  final WorkforcePulse workforce;

  String _formatDouble(double? value, {String suffix = ''}) {
    if (value == null) {
      return '—';
    }
    return '${value.toStringAsFixed(1)}$suffix';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final alignment = workforce.planAlignment;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Workforce intelligence', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ForecastTile(label: 'Attrition risk', value: _formatDouble(workforce.attritionRisk)),
              _ForecastTile(label: 'Mobility opportunities', value: _formatDouble(workforce.mobilityOpportunities, suffix: ' roles')),
              _ForecastTile(label: 'Skill gap alerts', value: _formatDouble(workforce.skillGapAlerts)),
              _ForecastTile(
                label: 'Headcount variance',
                value: alignment?.variance != null ? alignment!.variance!.toStringAsFixed(0) : '—',
              ),
          _ForecastTile(
            label: 'Budget variance',
            value: alignment?.budgetActual != null && alignment?.budgetPlan != null
                ? formatCurrency(
                    alignment!.budgetActual! - alignment.budgetPlan!,
                    currency: 'USD',
                  )
                : '—',
          ),
            ],
          ),
          if (workforce.signals.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Signals & highlights', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...workforce.signals.map(
              (signal) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Icon(Icons.bolt_outlined, size: 16, color: Color(0xFF0F4C81)),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        signal,
                        style: textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (workforce.cohortHighlights.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Cohort snapshots', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...workforce.cohortHighlights.map(
              (highlight) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.groups_outlined, size: 16, color: Color(0xFF0F4C81)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        highlight,
                        style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
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

class _AlertingPanel extends StatelessWidget {
  const _AlertingPanel({required this.alerting});

  final AnalyticsAlerting alerting;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final theme = Theme.of(context);

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Governance & alerts', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _ForecastTile(label: 'Open alerts', value: alerting.openAlerts?.toString() ?? '—'),
              _ForecastTile(label: 'Critical alerts', value: alerting.criticalAlerts?.toString() ?? '—'),
              _ForecastTile(
                label: 'Data freshness',
                value: alerting.dataFreshnessMinutes != null
                    ? '${alerting.dataFreshnessMinutes!.toStringAsFixed(0)} mins'
                    : '—',
              ),
            ],
          ),
          if (alerting.recent.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Recent activity', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...alerting.recent.map(
              (alert) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  color: const Color(0xFFF8FAFC),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      alert.severity == 'high'
                          ? Icons.error_outline
                          : alert.severity == 'medium'
                              ? Icons.report_problem_outlined
                              : Icons.info_outline,
                      color: alert.severity == 'high'
                          ? const Color(0xFFDC2626)
                          : alert.severity == 'medium'
                              ? const Color(0xFFF59E0B)
                              : const Color(0xFF0F4C81),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(alert.title, style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 4),
                          Text(
                            alert.owner != null
                                ? '${alert.owner} • ${alert.detectedAt != null ? formatRelativeTime(alert.detectedAt!) : 'Recently'}'
                                : alert.detectedAt != null
                                    ? formatRelativeTime(alert.detectedAt!)
                                    : 'Recently',
                            style: textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
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

