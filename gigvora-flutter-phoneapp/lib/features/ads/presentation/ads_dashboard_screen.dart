import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';

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
