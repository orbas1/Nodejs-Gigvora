import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../application/ads_dashboard_controller.dart';
import '../data/models/ads_dashboard_models.dart';

class AdsDashboardScreen extends ConsumerStatefulWidget {
  const AdsDashboardScreen({super.key});

  @override
  ConsumerState<AdsDashboardScreen> createState() => _AdsDashboardScreenState();
}

class _AdsDashboardScreenState extends ConsumerState<AdsDashboardScreen> {
  String? _selectedSurface;

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);
    final controller = ref.read(adsDashboardControllerProvider.notifier);
    final adsState = ref.watch(adsDashboardControllerProvider);
    final snapshot = adsState.data ?? AdDashboardSnapshot.empty();
    final surfaces = snapshot.surfaces;

    if (!sessionState.isAuthenticated ||
        !(sessionState.session?.memberships.contains('admin') ?? false)) {
      return GigvoraScaffold(
        title: 'Gigvora Ads Console',
        subtitle: 'Administrator access required',
        useAppDrawer: true,
        body: Center(
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Access restricted',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Only Gigvora administrators can open the ads console. Switch to an authorised account to continue.',
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  child: const Text('Return'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_selectedSurface == null && surfaces.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() {
          _selectedSurface = surfaces.first.surface;
        });
        controller.preloadPlacements(surfaces.first.surface);
      });
    } else if (_selectedSurface != null && surfaces.every((surface) => surface.surface != _selectedSurface)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (surfaces.isNotEmpty) {
          setState(() {
            _selectedSurface = surfaces.first.surface;
          });
          controller.preloadPlacements(surfaces.first.surface);
        } else {
          setState(() {
            _selectedSurface = null;
          });
        }
      });
    }

    final placementsBySurface = controller.placementsBySurface;
    final activePlacements = _selectedSurface != null
        ? placementsBySurface[_selectedSurface!] ?? const <AdPlacement>[]
        : const <AdPlacement>[];
    final loadingSurface = controller.loadingSurface;

    return GigvoraScaffold(
      title: 'Gigvora Ads Console',
      subtitle: 'Campaign coverage & placement telemetry',
      useAppDrawer: true,
      actions: [
        IconButton(
          tooltip: 'Refresh dashboard',
          icon: const Icon(Icons.refresh),
          onPressed: controller.refresh,
        ),
      ],
      body: adsState.loading && !adsState.hasData
          ? const _AdsSkeleton()
          : RefreshIndicator(
              onRefresh: controller.refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  if (adsState.fromCache && !adsState.loading)
                    const _StatusBanner(
                      icon: Icons.offline_bolt,
                      background: Color(0xFFFEF3C7),
                      foreground: Color(0xFF92400E),
                      message: 'Showing cached campaign data while we sync the latest placements.',
                    ),
                  if (adsState.hasError && !adsState.loading)
                    _StatusBanner(
                      icon: Icons.error_outline,
                      background: const Color(0xFFFEE2E2),
                      foreground: const Color(0xFFB91C1C),
                      message: 'We couldn\'t refresh ads telemetry. Pull to refresh to try again.',
                    ),
                  _SummarySection(overview: snapshot.overview),
                  if (snapshot.forecast != null) ...[
                    const SizedBox(height: 24),
                    _ForecastSection(forecast: snapshot.forecast!),
                  ],
                  const SizedBox(height: 24),
                  _SurfaceSection(
                    surfaces: surfaces,
                    selectedSurface: _selectedSurface,
                    onSurfaceSelected: (surface) {
                      setState(() {
                        _selectedSurface = surface;
                      });
                      controller.preloadPlacements(surface);
                    },
                    placements: activePlacements,
                    loading: loadingSurface == _selectedSurface,
                  ),
                  const SizedBox(height: 24),
                  _InsightsSection(overview: snapshot.overview),
                  const SizedBox(height: 24),
                  _RecommendationsSection(recommendations: snapshot.recommendations),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}

class _AdsSkeleton extends StatelessWidget {
  const _AdsSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(height: 20, width: 160, decoration: _skeletonDecoration(context)),
              const SizedBox(height: 12),
              Container(height: 16, width: double.infinity, decoration: _skeletonDecoration(context)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: List.generate(
                  4,
                  (_) => Container(height: 100, width: 140, decoration: _skeletonDecoration(context)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  BoxDecoration _skeletonDecoration(BuildContext context) {
    return BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
      borderRadius: BorderRadius.circular(16),
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
        crossAxisAlignment: CrossAxisAlignment.start,
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

class _SummarySection extends ConsumerWidget {
  const _SummarySection({required this.overview});

  final AdOverview overview;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final tiles = [
      _MetricTile(
        label: 'Total placements',
        value: overview.totalPlacements.toString(),
        caption: 'Across Gigvora surfaces',
        icon: Icons.campaign_outlined,
        color: colorScheme.primary,
      ),
      _MetricTile(
        label: 'Active today',
        value: overview.activePlacements.toString(),
        caption: 'Currently live',
        icon: Icons.check_circle_outline,
        color: colorScheme.tertiary,
      ),
      _MetricTile(
        label: 'Upcoming',
        value: overview.upcomingPlacements.toString(),
        caption: 'Scheduled in window',
        icon: Icons.schedule,
        color: colorScheme.secondary,
      ),
      _MetricTile(
        label: 'Campaigns',
        value: overview.totalCampaigns.toString(),
        caption: 'Distinct marketing pushes',
        icon: Icons.stacked_line_chart,
        color: colorScheme.primary,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Campaign summary',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: tiles
              .map(
                (tile) => SizedBox(
                  width: 200,
                  child: tile,
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.caption,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final String caption;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color),
              Text(
                value,
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            caption,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _ForecastSection extends StatelessWidget {
  const _ForecastSection({required this.forecast});

  final AdForecast forecast;

  String _formatPercent(NumberFormat formatter, double value, {bool fromPercentage = false}) {
    final ratio = fromPercentage ? value / 100 : value;
    return formatter.format(ratio);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final compact = NumberFormat.compact();
    final currencyNoDecimals = NumberFormat.simpleCurrency(decimalDigits: 0);
    final currencyPrecise = NumberFormat.simpleCurrency();
    final percent = NumberFormat.percentPattern()..maximumFractionDigits = 0;
    final percentPrecise = NumberFormat.percentPattern()..maximumFractionDigits = 1;

    final summary = forecast.summary;
    final traffic = forecast.traffic;
    final scenarios = forecast.scenarios;
    final assumptions = forecast.assumptions;
    final safetyChecks = forecast.safetyChecks;
    final trend = traffic.trend.take(7).toList();
    final dateFormatter = DateFormat.MMMd();

    Widget buildMetric({
      required IconData icon,
      required String label,
      required String value,
      String? caption,
      Color? color,
    }) {
      return SizedBox(
        width: 210,
        child: GigvoraCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(icon, color: color ?? theme.colorScheme.primary),
                  Text(
                    value,
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              if (caption != null) ...[
                const SizedBox(height: 4),
                Text(
                  caption,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ],
          ),
        ),
      );
    }

    Color levelColor(String level) {
      switch (level) {
        case 'warning':
          return const Color(0xFFFFB020);
        case 'critical':
          return const Color(0xFFEF4444);
        default:
          return theme.colorScheme.primary;
      }
    }

    IconData levelIcon(String level) {
      switch (level) {
        case 'warning':
        case 'critical':
          return Icons.warning_amber_rounded;
        default:
          return Icons.info_outline;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Results forecast',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 16),
        GigvoraCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${summary.horizonDays}-day performance outlook',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  Chip(
                    avatar: const Icon(Icons.trending_up, size: 18),
                    label: const Text('Forecast ready'),
                    shape: StadiumBorder(side: BorderSide(color: theme.colorScheme.primary.withOpacity(0.2))),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  buildMetric(
                    icon: Icons.query_stats_outlined,
                    label: 'Projected sessions',
                    value: compact.format(summary.projectedSessions),
                    caption:
                        'Coverage ${summary.coverageScore.toStringAsFixed(1)}% • ${summary.creativeVariants} variants',
                    color: theme.colorScheme.primary,
                  ),
                  buildMetric(
                    icon: Icons.show_chart,
                    label: 'Impressions',
                    value: compact.format(summary.expectedImpressions),
                    caption:
                        'CTR ${_formatPercent(percentPrecise, summary.ctr, fromPercentage: true)}',
                    color: theme.colorScheme.primary,
                  ),
                  buildMetric(
                    icon: Icons.mouse_outlined,
                    label: 'Clicks',
                    value: compact.format(summary.expectedClicks),
                    caption:
                        'Active coverage ${_formatPercent(percentPrecise, summary.activePlacementRatio)}',
                    color: theme.colorScheme.tertiary,
                  ),
                  buildMetric(
                    icon: Icons.how_to_reg_outlined,
                    label: 'Leads',
                    value: compact.format(summary.expectedLeads),
                    caption:
                        'Conversion ${_formatPercent(percentPrecise, summary.conversionRate, fromPercentage: true)}',
                    color: theme.colorScheme.secondary,
                  ),
                  buildMetric(
                    icon: Icons.attach_money,
                    label: 'Revenue forecast',
                    value: currencyNoDecimals.format(summary.expectedRevenue),
                    caption:
                        'Spend ${currencyPrecise.format(summary.expectedSpend)} • ROI ${summary.projectedRoi != null ? _formatPercent(percentPrecise, summary.projectedRoi!) : '—'}',
                    color: theme.colorScheme.primary,
                  ),
                  buildMetric(
                    icon: Icons.card_giftcard_outlined,
                    label: 'Incentive coverage',
                    value: '${summary.couponCoverage.toStringAsFixed(1)}% of placements',
                    caption: 'Quality score ${summary.averageScore.toStringAsFixed(1)}',
                    color: theme.colorScheme.secondary,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GigvoraCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Scenario planning',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              if (scenarios.isEmpty)
                Text(
                  'Scenario modelling will unlock once campaigns gather more telemetry.',
                  style: theme.textTheme.bodyMedium,
                )
              else
                Column(
                  children: scenarios
                      .map(
                        (scenario) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                              child: Icon(Icons.stacked_bar_chart, color: theme.colorScheme.primary),
                            ),
                            title: Text(
                              scenario.label,
                              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Confidence ${_formatPercent(percentPrecise, scenario.confidence)}',
                                  style: theme.textTheme.bodySmall,
                                ),
                                Text(
                                  '${compact.format(scenario.impressions)} impressions • ${compact.format(scenario.clicks)} clicks • ${compact.format(scenario.leads)} leads',
                                  style: theme.textTheme.bodySmall,
                                ),
                                Text(
                                  '${currencyPrecise.format(scenario.revenue)} revenue vs ${currencyPrecise.format(scenario.spend)} spend',
                                  style: theme.textTheme.bodySmall,
                                ),
                                Text(
                                  'ROI ${scenario.roi != null ? _formatPercent(percentPrecise, scenario.roi!) : '—'}',
                                  style: theme.textTheme.bodySmall,
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
        ),
        const SizedBox(height: 16),
        GigvoraCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Traffic & guardrails',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 24,
                runSpacing: 12,
                children: [
                  _TrafficStat(
                    label: 'Avg daily sessions',
                    value: compact.format(traffic.averageDailySessions),
                  ),
                  _TrafficStat(
                    label: 'Projected lift',
                    value: _formatPercent(percentPrecise, traffic.growthRate),
                  ),
                  _TrafficStat(
                    label: 'Returning visitors',
                    value: _formatPercent(percentPrecise, traffic.returningVisitorRate, fromPercentage: true),
                  ),
                  _TrafficStat(
                    label: 'Mobile share',
                    value: _formatPercent(percentPrecise, traffic.mobileShare, fromPercentage: true),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (traffic.sourceBreakdown.isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Source mix',
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    ...traffic.sourceBreakdown.map(
                      (source) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(source.source, style: theme.textTheme.bodyMedium),
                            Text(
                              _formatPercent(percentPrecise, source.share),
                              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              if (trend.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  'Trend (last ${trend.length} days)',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                ...trend.map(
                  (point) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(point.date != null ? dateFormatter.format(point.date!) : '—'),
                        Text(compact.format(point.sessions), style: theme.textTheme.bodyMedium),
                      ],
                    ),
                  ),
                ),
              ],
              if (traffic.usesFallback) ...[
                const SizedBox(height: 12),
                Text(
                  'Analytics fallback in use — connect session rollups for higher fidelity.',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.secondary),
                ),
              ],
              if (assumptions.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Key assumptions',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                ...assumptions.map(
                  (assumption) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, size: 18, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            assumption,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                'Operational guardrails',
                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              if (safetyChecks.isEmpty)
                Text(
                  'No operational risks detected. Continue monitoring placement freshness.',
                  style: theme.textTheme.bodyMedium,
                )
              else
                Column(
                  children: safetyChecks
                      .map(
                        (check) => Card(
                          color: levelColor(check.level).withOpacity(0.08),
                          elevation: 0,
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: ListTile(
                            leading: Icon(levelIcon(check.level), color: levelColor(check.level)),
                            title: Text(
                              check.message,
                              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            subtitle: check.suggestion.isNotEmpty
                                ? Text(check.suggestion, style: theme.textTheme.bodySmall)
                                : null,
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

class _TrafficStat extends StatelessWidget {
  const _TrafficStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 160,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _SurfaceSection extends StatelessWidget {
  const _SurfaceSection({
    required this.surfaces,
    required this.selectedSurface,
    required this.onSurfaceSelected,
    required this.placements,
    required this.loading,
  });

  final List<AdSurfaceGroup> surfaces;
  final String? selectedSurface;
  final ValueChanged<String> onSurfaceSelected;
  final List<AdPlacement> placements;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Network surfaces',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: surfaces
              .map(
                (surface) => ChoiceChip(
                  selected: selectedSurface == surface.surface,
                  onSelected: (_) => onSurfaceSelected(surface.surface),
                  label: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(surface.label),
                      Text(
                        '${surface.totalPlacements} placements',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        if (loading)
          const _PlacementsLoading()
        else if (placements.isEmpty)
          _EmptyPlacementsCard(surface: selectedSurface)
        else
          Column(
            children: placements
                .map((placement) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _PlacementCard(placement: placement),
                    ))
                .toList(),
          ),
      ],
    );
  }
}

class _PlacementsLoading extends StatelessWidget {
  const _PlacementsLoading();

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Row(
        children: [
          const CircularProgressIndicator(strokeWidth: 2),
          const SizedBox(width: 16),
          Text(
            'Loading placements for this surface…',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _EmptyPlacementsCard extends StatelessWidget {
  const _EmptyPlacementsCard({required this.surface});

  final String? surface;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Text(
        surface == null
            ? 'Select a surface to inspect placements.'
            : 'There are no placements configured for ${surface!}.',
        style: Theme.of(context)
            .textTheme
            .bodyMedium
            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
    );
  }
}

class _PlacementCard extends StatelessWidget {
  const _PlacementCard({required this.placement});

  final AdPlacement placement;

  @override
  Widget build(BuildContext context) {
    final creative = placement.creative;
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      creative?.headline ?? creative?.name ?? 'Untitled placement',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      creative?.subheadline ?? creative?.body ?? 'Awaiting creative copy.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _StatusChip(
                          label: placement.isActive
                              ? 'Active'
                              : placement.isUpcoming
                                  ? 'Upcoming'
                                  : 'Paused',
                          color: placement.isActive
                              ? const Color(0xFF047857)
                              : placement.isUpcoming
                                  ? const Color(0xFF1D4ED8)
                                  : theme.colorScheme.onSurfaceVariant,
                        ),
                        if (creative?.campaign?.objective != null)
                          _StatusChip(
                            label: creative!.campaign!.objective!,
                            color: theme.colorScheme.primary,
                          ),
                        if (placement.opportunityType != null)
                          _StatusChip(
                            label: placement.opportunityType!,
                            color: theme.colorScheme.secondary,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    placement.score.toStringAsFixed(1),
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Score',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Starts in ${_formatMinutes(placement.timeUntilStartMinutes)}',
                    style: theme.textTheme.bodySmall,
                  ),
                  Text(
                    'Ends in ${_formatMinutes(placement.timeUntilEndMinutes)}',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ...placement.keywords.take(4).map((keyword) => _KeywordChip(keyword: keyword)),
              ...placement.taxonomies.take(3).map((taxonomy) => _TaxonomyChip(taxonomy: taxonomy)),
            ],
          ),
        ],
      ),
    );
  }

  String _formatMinutes(int? minutes) {
    if (minutes == null || minutes <= 0) {
      return '—';
    }
    if (minutes >= 1440) {
      return '${(minutes / 1440).round()}d';
    }
    if (minutes >= 60) {
      return '${(minutes / 60).round()}h';
    }
    return '${minutes}m';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

class _KeywordChip extends StatelessWidget {
  const _KeywordChip({required this.keyword});

  final AdKeywordAssignment keyword;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, size: 16),
          const SizedBox(width: 6),
          Text(keyword.keyword),
          const SizedBox(width: 6),
          Text(
            keyword.weight.toString(),
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _TaxonomyChip extends StatelessWidget {
  const _TaxonomyChip({required this.taxonomy});

  final AdTaxonomyAssignment taxonomy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.secondary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.bolt, size: 16),
          const SizedBox(width: 6),
          Text(taxonomy.slug.replaceAll(RegExp(r'[-_]'), ' ')),
          const SizedBox(width: 6),
          Text(
            taxonomy.weight.toString(),
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _InsightsSection extends StatelessWidget {
  const _InsightsSection({required this.overview});

  final AdOverview overview;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Insights',
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Text(
            'Keyword targeting spans ${overview.keywordHighlights.length} active clusters with ${overview.taxonomyHighlights.length} taxonomy focus areas.',
            style: theme.textTheme.bodyMedium,
          ),
          if (overview.context.keywordHints.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Context hints: ${overview.context.keywordHints.join(', ')}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: overview.keywordHighlights
                .map((highlight) => _InsightPill(
                      icon: Icons.auto_awesome,
                      label: highlight.keyword,
                      value: highlight.weight.toString(),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: overview.taxonomyHighlights
                .map((highlight) => _InsightPill(
                      icon: Icons.category_outlined,
                      label: highlight.slug.replaceAll(RegExp(r'[-_]'), ' '),
                      value: highlight.weight.toString(),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _InsightPill extends StatelessWidget {
  const _InsightPill({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 8),
          Text(label),
          const SizedBox(width: 6),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _RecommendationsSection extends StatelessWidget {
  const _RecommendationsSection({required this.recommendations});

  final List<String> recommendations;

  @override
  Widget build(BuildContext context) {
    if (recommendations.isEmpty) {
      return GigvoraCard(
        child: Text(
          'No recommendations right now. Monitor performance and rotate creatives regularly.',
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      );
    }

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Recommendations',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          ...recommendations.map(
            (recommendation) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.verified, color: Color(0xFF2563EB)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      recommendation,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
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
