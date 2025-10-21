import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/widgets.dart';
import '../application/opportunity_controller.dart';
import '../data/models/opportunity.dart';
import '../data/models/opportunity_detail.dart';
import 'widgets/gig_lifecycle_showcase.dart';

class OpportunityListScreen extends ConsumerWidget {
  const OpportunityListScreen({
    super.key,
    required this.category,
    required this.title,
    required this.subtitle,
    required this.ctaLabel,
    required this.searchPlaceholder,
    required this.emptyDefaultMessage,
    required this.emptySearchMessage,
    this.actions,
  });

  final OpportunityCategory category;
  final String title;
  final String subtitle;
  final String ctaLabel;
  final String searchPlaceholder;
  final String emptyDefaultMessage;
  final String emptySearchMessage;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GigvoraScaffold(
      title: title,
      subtitle: subtitle,
      actions: actions,
      floatingActionButton: _OpportunityCrudFab(category: category),
      body: OpportunityListView(
        category: category,
        ctaLabel: ctaLabel,
        searchPlaceholder: searchPlaceholder,
        emptyDefaultMessage: emptyDefaultMessage,
        emptySearchMessage: emptySearchMessage,
      ),
    );
  }
}

class OpportunityListView extends ConsumerStatefulWidget {
  const OpportunityListView({
    super.key,
    required this.category,
    required this.ctaLabel,
    required this.searchPlaceholder,
    required this.emptyDefaultMessage,
    required this.emptySearchMessage,
  });

  final OpportunityCategory category;
  final String ctaLabel;
  final String searchPlaceholder;
  final String emptyDefaultMessage;
  final String emptySearchMessage;

  @override
  ConsumerState<OpportunityListView> createState() => _OpportunityListViewState();
}

class _OpportunityListViewState extends ConsumerState<OpportunityListView> {
  late final TextEditingController _searchController;
  bool _remoteOnly = false;
  String _freshness = '30d';
  final Set<String> _selectedOrganizations = <String>{};
  final Set<String> _selectedTagSlugs = <String>{};
  bool _defaultsApplied = false;

  bool get _isGigCategory => widget.category == OpportunityCategory.gig;
  bool get _isVolunteerCategory => widget.category == OpportunityCategory.volunteering;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    if (_isGigCategory) {
      controller.setIncludeFacets(true);
    }
    if (_isVolunteerCategory) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_defaultsApplied) {
          return;
        }
        _defaultsApplied = true;
        controller.updateFilters({'updatedWithin': '30d'});
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final state = ref.watch(opportunityControllerProvider(widget.category));
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    final items = state.data?.items ?? const <OpportunitySummary>[];

    final organizationOptions = _isVolunteerCategory
        ? items
            .map((item) => item.organization?.trim())
            .whereType<String>()
            .where((value) => value.isNotEmpty)
            .toSet()
            .toList(growable: false)
          ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()))
        : const <String>[];
    final tagOptions = _isGigCategory ? _deriveTagOptions(items, state.data?.facets) : const <_TagOption>[];

    if (_isVolunteerCategory) {
      final validSelection = _selectedOrganizations.where(organizationOptions.contains).toSet();
      if (validSelection.length != _selectedOrganizations.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          setState(() {
            _selectedOrganizations
              ..clear()
              ..addAll(validSelection);
          });
          _applyFilters(controller);
        });
      }
    }

    if (_isGigCategory) {
      final availableSlugs = tagOptions.map((option) => option.slug).toSet();
      final validTags = _selectedTagSlugs.where(availableSlugs.contains).toSet();
      if (validTags.length != _selectedTagSlugs.length) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          setState(() {
            _selectedTagSlugs
              ..clear()
              ..addAll(validTags);
          });
          _applyFilters(controller);
        });
      }
    }

    final filtersActive = _remoteOnly || _freshness != '30d' || _selectedOrganizations.isNotEmpty || _selectedTagSlugs.isNotEmpty;
    final gigSignals = widget.category == OpportunityCategory.gig ? _deriveGigSignals(items) : null;
    final showGigLifecycle = _isGigCategory;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_isVolunteerCategory)
          _VolunteerFilterCard(
            searchController: _searchController,
            searchPlaceholder: widget.searchPlaceholder,
            onQueryChanged: controller.updateQuery,
            remoteOnly: _remoteOnly,
            onRemoteToggle: () {
              setState(() => _remoteOnly = !_remoteOnly);
              _applyFilters(controller);
            },
            freshness: _freshness,
            onFreshnessChanged: (value) {
              setState(() => _freshness = value);
              _applyFilters(controller);
            },
            organizationOptions: organizationOptions,
            selectedOrganizations: _selectedOrganizations,
            onOrganizationToggled: (value) {
              setState(() {
                if (_selectedOrganizations.contains(value)) {
                  _selectedOrganizations.remove(value);
                } else {
                  _selectedOrganizations.add(value);
                }
              });
              _applyFilters(controller);
            },
            onClearFilters: () {
              setState(() {
                _remoteOnly = false;
                _freshness = '30d';
                _selectedOrganizations.clear();
              });
              _applyFilters(controller);
            },
            filtersActive: filtersActive || controller.filters.isNotEmpty || _searchController.text.trim().isNotEmpty,
            activeResultCount: items.length,
          )
        else ...[
          TextField(
            key: const Key('opportunity_search_field'),
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onChanged: controller.updateQuery,
            decoration: InputDecoration(
              hintText: widget.searchPlaceholder,
              prefixIcon: Icon(Icons.search, color: colorScheme.onSurfaceVariant),
              filled: true,
              fillColor: colorScheme.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.4)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.3)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(28),
                borderSide: BorderSide(color: colorScheme.primary.withOpacity(0.6)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_isGigCategory && tagOptions.isNotEmpty)
            _GigTagFilterBar(
              options: tagOptions,
              selected: _selectedTagSlugs,
              onToggle: (slug) {
                setState(() {
                  if (_selectedTagSlugs.contains(slug)) {
                    _selectedTagSlugs.remove(slug);
                  } else {
                    _selectedTagSlugs.add(slug);
                  }
                });
                _applyFilters(controller);
              },
              onClear: () {
                setState(() {
                  _selectedTagSlugs.clear();
                });
                _applyFilters(controller);
              },
            ),
        ],
        const SizedBox(height: 8),
        if (state.fromCache && !state.loading)
          const _StatusBanner(
            icon: Icons.offline_bolt,
            background: Color(0xFFFEF3C7),
            foreground: Color(0xFF92400E),
            message: 'Showing cached results while we reconnect.',
          ),
        if (state.hasError && !state.loading)
          const _StatusBanner(
            icon: Icons.error_outline,
            background: Color(0xFFFEE2E2),
            foreground: Color(0xFFB91C1C),
            message: 'Unable to sync the latest results. Pull to refresh to retry.',
          ),
        if (state.lastUpdated != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(
              'Last updated ${formatRelativeTime(state.lastUpdated!)}',
              style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ),
        if (gigSignals != null && items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: GigvoraCard(
              child: Wrap(
                spacing: 24,
                runSpacing: 16,
                children: [
                  _SignalTile(label: 'Live briefs', value: gigSignals.total),
                  _SignalTile(label: 'Published 7d', value: gigSignals.fresh),
                  _SignalTile(label: 'Remote-ready', value: gigSignals.remoteFriendly),
                  _SignalTile(label: 'With budgets', value: gigSignals.withBudgets),
                ],
              ),
            ),
          ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: controller.refresh,
            child: state.loading && items.isEmpty
                ? const _OpportunitySkeleton()
                : items.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          const SizedBox(height: 80),
                          GigvoraCard(
                            child: Text(
                              _searchController.text.isEmpty
                                  ? widget.emptyDefaultMessage
                                  : widget.emptySearchMessage,
                              style: theme.textTheme.bodyMedium,
                            ),
                          ),
                          if (showGigLifecycle) ...const [
                            SizedBox(height: 24),
                            GigLifecycleShowcase(),
                            SizedBox(height: 24),
                          ],
                        ],
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: items.length + (showGigLifecycle ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (showGigLifecycle && index == items.length) {
                            return const Padding(
                              padding: EdgeInsets.only(top: 8, bottom: 24),
                              child: GigLifecycleShowcase(),
                            );
                          }

                          final item = items[index];
                          final meta = _buildMeta(item);
                          final taxonomyLabels = item.taxonomyLabels.take(4).toList(growable: false);
                          final primaryChipBackground = colorScheme.primary.withOpacity(0.08);
                          final primaryChipBorder = colorScheme.primary.withOpacity(0.2);
                          final addBottomSpacing = showGigLifecycle || index < items.length - 1;

                          return Padding(
                            padding: EdgeInsets.only(bottom: addBottomSpacing ? 16 : 0),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(28),
                              onTap: () => _openDetails(context, controller, item),
                              child: GigvoraCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Wrap(
                                      alignment: WrapAlignment.spaceBetween,
                                      runSpacing: 8,
                                      children: [
                                        if (meta.isNotEmpty)
                                          Wrap(
                                            spacing: 8,
                                            runSpacing: 6,
                                            children: meta
                                                .map(
                                                  (entry) => Chip(
                                                    backgroundColor: primaryChipBackground,
                                                    label: Text(entry),
                                                    labelStyle: theme.textTheme.labelSmall?.copyWith(
                                                      color: colorScheme.primary,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                    shape: StadiumBorder(
                                                      side: BorderSide(color: primaryChipBorder),
                                                    ),
                                                    visualDensity: VisualDensity.compact,
                                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                                  ),
                                                )
                                                .toList(),
                                          ),
                                        Text(
                                          'Updated ${formatRelativeTime(item.updatedAt)}',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: colorScheme.onSurfaceVariant,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      item.title,
                                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      item.description,
                                      maxLines: 4,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    if (taxonomyLabels.isNotEmpty) ...[
                                      const SizedBox(height: 12),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 4,
                                        children: taxonomyLabels
                                            .map(
                                              (label) => Chip(
                                                label: Text(label),
                                                backgroundColor: colorScheme.secondaryContainer,
                                                labelStyle: theme.textTheme.labelSmall?.copyWith(
                                                  color: colorScheme.onSecondaryContainer,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                                visualDensity: VisualDensity.compact,
                                                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              ),
                                            )
                                            .toList(),
                                      ),
                                    ],
                                    const SizedBox(height: 16),
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: FilledButton(
                                        onPressed: () => controller.recordPrimaryCta(item),
                                        style: FilledButton.styleFrom(shape: const StadiumBorder()),
                                        child: Text(widget.ctaLabel),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ),
      ],
    );
  }

  void _applyFilters(OpportunityController controller) {
    if (_isVolunteerCategory) {
      controller.updateFilters({
        'isRemote': _remoteOnly ? true : null,
        'updatedWithin': _freshness == 'all' ? null : _freshness,
        'organizations': _selectedOrganizations.isEmpty
            ? null
            : _selectedOrganizations.toList(growable: false),
      });
      return;
    }

    if (_isGigCategory) {
      controller.updateFilters({
        'taxonomySlugs': _selectedTagSlugs.isEmpty
            ? null
            : _selectedTagSlugs.toList(growable: false),
      });
      return;
    }

    controller.setFilters(null);
  }

  Future<void> _openDetails(
    BuildContext context,
    OpportunityController controller,
    OpportunitySummary opportunity,
  ) async {
    controller.recordPrimaryCta(opportunity);
    final result = await showModalBottomSheet<OpportunityDetailSheetOutcome?>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => OpportunityDetailSheet(
        category: widget.category,
        summary: opportunity,
        primaryActionLabel: widget.ctaLabel,
      ),
    );

    if (!mounted || result == null) {
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    if (result.deleted) {
      messenger.showSnackBar(
        SnackBar(content: Text('${_friendlyCategoryLabel(widget.category)} removed.')),
      );
    } else if (result.detail != null) {
      messenger.showSnackBar(
        SnackBar(content: Text('${_friendlyCategoryLabel(widget.category)} updated.')),
      );
    }
  }

  List<String> _buildMeta(OpportunitySummary item) {
    switch (widget.category) {
      case OpportunityCategory.job:
        return [
          if ((item.location ?? '').isNotEmpty) item.location!,
          if ((item.employmentType ?? '').isNotEmpty) item.employmentType!,
          if (item.isRemote) 'Remote',
        ];
      case OpportunityCategory.gig:
        return [
          if ((item.budget ?? '').isNotEmpty) item.budget!,
          if ((item.duration ?? '').isNotEmpty) item.duration!,
        ];
      case OpportunityCategory.project:
        return [
          if ((item.status ?? '').isNotEmpty) item.status!,
          if ((item.location ?? '').isNotEmpty) item.location!,
        ];
      case OpportunityCategory.launchpad:
        return [
          if ((item.track ?? '').isNotEmpty) item.track!,
          if ((item.organization ?? '').isNotEmpty) item.organization!,
        ];
      case OpportunityCategory.volunteering:
        return [
          if ((item.organization ?? '').isNotEmpty) item.organization!,
          if (item.isRemote) 'Remote friendly',
          if ((item.location ?? '').isNotEmpty) item.location!,
        ];
    }
  }

  _GigSignals _deriveGigSignals(List<OpportunitySummary> items) {
    if (items.isEmpty) {
      return const _GigSignals(total: 0, fresh: 0, remoteFriendly: 0, withBudgets: 0);
    }
    final now = DateTime.now();
    var fresh = 0;
    var remoteFriendly = 0;
    var withBudgets = 0;

    for (final item in items) {
      if (now.difference(item.updatedAt).inDays <= 7) {
        fresh += 1;
      }
      final label = '${item.location ?? ''} ${item.status ?? ''}'.toLowerCase();
      if (label.contains('remote') || label.contains('hybrid') || item.isRemote) {
        remoteFriendly += 1;
      }
      if ((item.budget ?? '').trim().isNotEmpty) {
        withBudgets += 1;
      }
    }

    return _GigSignals(total: items.length, fresh: fresh, remoteFriendly: remoteFriendly, withBudgets: withBudgets);
  }
}

class _GigSignals {
  const _GigSignals({
    required this.total,
    required this.fresh,
    required this.remoteFriendly,
    required this.withBudgets,
  });

  final int total;
  final int fresh;
  final int remoteFriendly;
  final int withBudgets;
}

class _SignalTile extends StatelessWidget {
  const _SignalTile({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$value',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
      ],
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
        borderRadius: BorderRadius.circular(18),
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

class _GigTagFilterBar extends StatelessWidget {
  const _GigTagFilterBar({
    required this.options,
    required this.selected,
    required this.onToggle,
    required this.onClear,
  });

  final List<_TagOption> options;
  final Set<String> selected;
  final ValueChanged<String> onToggle;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Filter by expertise tags',
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              TextButton(onPressed: onClear, child: const Text('Clear')),
            ],
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: options.map((option) {
              final isSelected = selected.contains(option.slug);
              return FilterChip(
                label: Text('${option.label} (${option.count})'),
                selected: isSelected,
                onSelected: (_) => onToggle(option.slug),
                shape: const StadiumBorder(),
                selectedColor: colorScheme.primary.withOpacity(0.12),
                labelStyle: theme.textTheme.labelMedium?.copyWith(
                  color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _OpportunitySkeleton extends StatelessWidget {
  const _OpportunitySkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 3,
      padding: const EdgeInsets.symmetric(vertical: 24),
      itemBuilder: (context, index) {
        return Padding(
          padding: EdgeInsets.only(left: 4, right: 4, bottom: index == 2 ? 0 : 16),
          child: const _ShimmerPlaceholder(height: 160, borderRadius: BorderRadius.all(Radius.circular(28))),
        );
      },
    );
  }
}

class _ShimmerPlaceholder extends StatelessWidget {
  const _ShimmerPlaceholder({
    required this.height,
    required this.borderRadius,
  });

  final double height;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          colors: [
            colorScheme.surfaceVariant.withOpacity(0.4),
            colorScheme.surfaceVariant.withOpacity(0.2),
            colorScheme.surfaceVariant.withOpacity(0.4),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
    );
  }
}

class _VolunteerFilterCard extends StatelessWidget {
  const _VolunteerFilterCard({
    required this.searchController,
    required this.searchPlaceholder,
    required this.onQueryChanged,
    required this.remoteOnly,
    required this.onRemoteToggle,
    required this.freshness,
    required this.onFreshnessChanged,
    required this.organizationOptions,
    required this.selectedOrganizations,
    required this.onOrganizationToggled,
    required this.onClearFilters,
    required this.filtersActive,
    required this.activeResultCount,
  });

  final TextEditingController searchController;
  final String searchPlaceholder;
  final ValueChanged<String> onQueryChanged;
  final bool remoteOnly;
  final VoidCallback onRemoteToggle;
  final String freshness;
  final ValueChanged<String> onFreshnessChanged;
  final List<String> organizationOptions;
  final Set<String> selectedOrganizations;
  final ValueChanged<String> onOrganizationToggled;
  final VoidCallback onClearFilters;
  final bool filtersActive;
  final int activeResultCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: searchController,
            textInputAction: TextInputAction.search,
            onChanged: onQueryChanged,
            decoration: InputDecoration(
              hintText: searchPlaceholder,
              prefixIcon: Icon(Icons.search, color: colorScheme.primary),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: freshness,
                  decoration: const InputDecoration(
                    labelText: 'Freshness',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: '24h', child: Text('Updated in 24h')),
                    DropdownMenuItem(value: '7d', child: Text('Past week')),
                    DropdownMenuItem(value: '30d', child: Text('Past 30 days')),
                    DropdownMenuItem(value: 'all', child: Text('All time')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      onFreshnessChanged(value);
                    }
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onRemoteToggle,
                  style: OutlinedButton.styleFrom(
                    backgroundColor: remoteOnly ? colorScheme.primary.withOpacity(0.08) : null,
                    foregroundColor: remoteOnly ? colorScheme.primary : colorScheme.onSurfaceVariant,
                    shape: const StadiumBorder(),
                  ),
                  icon: Icon(remoteOnly ? Icons.cloud_done : Icons.cloud_queue),
                  label: Text(remoteOnly ? 'Remote only' : 'Remote + onsite'),
                ),
              ),
            ],
          ),
          if (organizationOptions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Trusted causes', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: organizationOptions
                  .map(
                    (option) => FilterChip(
                      label: Text(option),
                      selected: selectedOrganizations.contains(option),
                      onSelected: (_) => onOrganizationToggled(option),
                    ),
                  )
                  .toList(),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  filtersActive
                      ? '$activeResultCount opportunities after filters'
                      : 'Showing all available missions',
                  style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ),
              TextButton(onPressed: onClearFilters, child: const Text('Reset')),
            ],
          ),
        ],
      ),
    );
  }
}

class _TagOption {
  const _TagOption({required this.slug, required this.label, required this.count});

  final String slug;
  final String label;
  final int count;
}

List<_TagOption> _deriveTagOptions(List<OpportunitySummary> items, Map<String, dynamic>? facets) {
  final map = <String, _TagOption>{};
  void register(String slug, {String? label, int count = 1}) {
    final trimmedSlug = slug.trim();
    if (trimmedSlug.isEmpty) {
      return;
    }
    final entry = map[trimmedSlug];
    if (entry == null) {
      map[trimmedSlug] = _TagOption(
        slug: trimmedSlug,
        label: (label ?? trimmedSlug).trim().isEmpty ? trimmedSlug : (label ?? trimmedSlug),
        count: count,
      );
    } else {
      map[trimmedSlug] = _TagOption(
        slug: entry.slug,
        label: (label ?? entry.label).trim().isEmpty ? entry.label : (label ?? entry.label),
        count: entry.count + count,
      );
    }
  }

  if (facets != null) {
    final taxonomyFacet = facets['taxonomySlugs'];
    if (taxonomyFacet is Map<String, dynamic>) {
      taxonomyFacet.forEach((key, value) {
        final count = value is num ? value.toInt() : 1;
        register(key, count: count);
      });
    }
  }

  for (final item in items) {
    for (var i = 0; i < item.taxonomySlugs.length; i++) {
      final slug = item.taxonomySlugs[i];
      final label = i < item.taxonomyLabels.length ? item.taxonomyLabels[i] : null;
      register(slug, label: label);
    }
  }

  final options = map.values.toList()
    ..sort((a, b) {
      final countComparison = b.count.compareTo(a.count);
      if (countComparison != 0) {
        return countComparison;
      }
      return a.label.toLowerCase().compareTo(b.label.toLowerCase());
    });

  return options;
}

class _OpportunityCrudFab extends ConsumerWidget {
  const _OpportunityCrudFab({
    required this.category,
  });

  final OpportunityCategory category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final label = _friendlyCategoryTitle(category);
    return FloatingActionButton.extended(
      onPressed: () async {
        final result = await showModalBottomSheet<OpportunityDetail?>(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          backgroundColor: Colors.transparent,
          builder: (sheetContext) => OpportunityCrudSheet(
            category: category,
          ),
        );
        if (result != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('$label published successfully.')),
          );
        }
      },
      icon: const Icon(Icons.add),
      label: Text('New $label'),
      backgroundColor: theme.colorScheme.primary,
      foregroundColor: theme.colorScheme.onPrimary,
    );
  }
}

String _friendlyCategoryLabel(OpportunityCategory category) {
  switch (category) {
    case OpportunityCategory.job:
      return 'job';
    case OpportunityCategory.gig:
      return 'gig';
    case OpportunityCategory.project:
      return 'project';
    case OpportunityCategory.launchpad:
      return 'Experience Launchpad';
    case OpportunityCategory.volunteering:
      return 'volunteer opportunity';
  }
}

String _friendlyCategoryTitle(OpportunityCategory category) {
  final label = _friendlyCategoryLabel(category);
  if (label.isEmpty) {
    return 'Opportunity';
  }
  return label[0].toUpperCase() + label.substring(1);
}

class OpportunityDetailSheetOutcome {
  const OpportunityDetailSheetOutcome({
    this.detail,
    this.deleted = false,
  });

  final OpportunityDetail? detail;
  final bool deleted;
}

class OpportunityDetailSheet extends ConsumerStatefulWidget {
  const OpportunityDetailSheet({
    super.key,
    required this.category,
    required this.summary,
    required this.primaryActionLabel,
  });

  final OpportunityCategory category;
  final OpportunitySummary summary;
  final String primaryActionLabel;

  @override
  ConsumerState<OpportunityDetailSheet> createState() => _OpportunityDetailSheetState();
}

class _OpportunityDetailSheetState extends ConsumerState<OpportunityDetailSheet> {
  OpportunityDetail? _detail;
  bool _loading = true;
  Object? _error;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
      final detail = await controller.loadDetail(widget.summary.id);
      if (!mounted) return;
      setState(() {
        _detail = detail;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.6,
      maxChildSize: 0.98,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.12),
                blurRadius: 28,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  height: 4,
                  width: 48,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                if (_processing)
                  const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: LinearProgressIndicator(minHeight: 2),
                  ),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: _buildBody(scrollController),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBody(ScrollController controller) {
    final theme = Theme.of(context);
    if (_loading) {
      return Center(
        child: CircularProgressIndicator(color: theme.colorScheme.primary),
      );
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: theme.colorScheme.error, size: 48),
            const SizedBox(height: 16),
            Text(
              'We couldn\'t load this ${_friendlyCategoryLabel(widget.category)} just now.',
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Text(
              'Please check your connection and try again.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _loadDetail,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final detail = _detail!;
    final controllerNotifier = ref.read(opportunityControllerProvider(widget.category).notifier);
    final meta = <String>[
      if ((detail.location ?? '').isNotEmpty) detail.location!,
      if ((detail.organization ?? '').isNotEmpty) detail.organization!,
      if (detail.isRemote) 'Remote friendly',
    ];
    final chips = <String>[
      if ((detail.budget ?? '').isNotEmpty) detail.budget!,
      if ((detail.duration ?? '').isNotEmpty) detail.duration!,
      if ((detail.employmentType ?? '').isNotEmpty) detail.employmentType!,
      if ((detail.status ?? '').isNotEmpty) detail.status!,
    ];

    return ListView(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      children: [
        Text(
          detail.title,
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        if (meta.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: meta
                .map(
                  (entry) => Chip(
                    label: Text(entry),
                    backgroundColor: theme.colorScheme.secondaryContainer,
                    labelStyle: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
                .toList(),
          ),
        if (detail.rating != null || detail.publishedAt != null) ...[
          const SizedBox(height: 16),
          Row(
            children: [
              if (detail.rating != null) ...[
                Icon(Icons.star, color: Colors.amber.shade600),
                const SizedBox(width: 4),
                Text('${detail.rating!.toStringAsFixed(1)} (${detail.reviewCount})',
                    style: theme.textTheme.bodyMedium),
              ],
              if (detail.publishedAt != null) ...[
                if (detail.rating != null) const SizedBox(width: 16),
                Icon(Icons.calendar_today, size: 18, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  'Updated ${formatRelativeTime(detail.publishedAt!)}',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ],
          ),
        ],
        if (chips.isNotEmpty) ...[
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: chips
                .map((entry) => _InfoChip(label: entry, color: theme.colorScheme.primary))
                .toList(),
          ),
        ],
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: () async {
            await controllerNotifier.recordPrimaryCta(widget.summary);
            if (!mounted) return;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('We\'ve recorded your interest.')),
            );
          },
          icon: const Icon(Icons.send),
          label: Text(widget.primaryActionLabel),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _openEditor(detail),
                icon: const Icon(Icons.edit),
                label: const Text('Edit profile'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextButton.icon(
                onPressed: _processing ? null : () => _confirmDelete(detail.id),
                icon: const Icon(Icons.delete_forever),
                label: const Text('Archive'),
                style: TextButton.styleFrom(foregroundColor: theme.colorScheme.error),
              ),
            ),
          ],
        ),
        if (widget.category == OpportunityCategory.job) ...[
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              final router = GoRouter.of(context);
              Navigator.of(context).pop();
              router.push('/jobs/${detail.id}');
            },
            icon: const Icon(Icons.open_in_new),
            label: const Text('Open full mobile profile'),
          ),
        ],
        if ((detail.summary ?? '').isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeading(title: 'Highlights'),
          const SizedBox(height: 8),
          Text(
            detail.summary!,
            style: theme.textTheme.bodyLarge?.copyWith(height: 1.5),
          ),
        ],
        const SizedBox(height: 24),
        _SectionHeading(title: 'Full description'),
        const SizedBox(height: 8),
        Text(
          detail.description,
          style: theme.textTheme.bodyMedium?.copyWith(height: 1.6),
        ),
        if (detail.media.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeading(title: 'Media gallery'),
          const SizedBox(height: 12),
          _MediaCarousel(media: detail.media),
        ],
        if (detail.skills.isNotEmpty || detail.tags.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeading(title: 'Skills & tags'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ...detail.skills.map(
                (skill) => _InfoChip(label: skill, color: theme.colorScheme.secondary),
              ),
              ...detail.tags.map(
                (tag) => _InfoChip(label: tag, color: theme.colorScheme.tertiary),
              ),
            ],
          ),
        ],
        if ((detail.posterName ?? '').isNotEmpty || (detail.posterAvatarUrl ?? '').isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeading(title: 'Posted by'),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
              foregroundColor: theme.colorScheme.primary,
              backgroundImage:
                  (detail.posterAvatarUrl ?? '').isNotEmpty ? NetworkImage(detail.posterAvatarUrl!) : null,
              child: (detail.posterAvatarUrl ?? '').isNotEmpty
                  ? null
                  : Text(
                      (detail.posterName ?? 'Team')[0].toUpperCase(),
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
            ),
            title: Text(detail.posterName ?? 'Gigvora team'),
            subtitle: Text(
              detail.organization ?? _friendlyCategoryTitle(widget.category),
              style: theme.textTheme.bodySmall,
            ),
          ),
        ],
        if (detail.reviews.isNotEmpty) ...[
          const SizedBox(height: 24),
          _SectionHeading(title: 'Reviews & social proof'),
          const SizedBox(height: 12),
          _ReviewList(reviews: detail.reviews),
        ],
      ],
    );
  }

  Future<void> _openEditor(OpportunityDetail detail) async {
    final result = await showModalBottomSheet<OpportunityDetail?>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => OpportunityCrudSheet(
        category: widget.category,
        initialDetail: detail,
      ),
    );
    if (!mounted || result == null) {
      return;
    }
    Navigator.of(context).pop(OpportunityDetailSheetOutcome(detail: result));
  }

  Future<void> _confirmDelete(String id) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Archive opportunity'),
            content: Text(
              'Are you sure you want to archive this ${_friendlyCategoryLabel(widget.category)}? This action cannot be undone.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
                child: const Text('Archive'),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed || !mounted) return;

    setState(() => _processing = true);
    try {
      final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
      await controller.deleteOpportunity(id);
      if (!mounted) return;
      Navigator.of(context).pop(const OpportunityDetailSheetOutcome(deleted: true));
    } catch (error) {
      if (!mounted) return;
      setState(() => _processing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to archive: $error')),
      );
    }
  }
}

class OpportunityCrudSheet extends ConsumerStatefulWidget {
  const OpportunityCrudSheet({
    super.key,
    required this.category,
    this.initialDetail,
  });

  final OpportunityCategory category;
  final OpportunityDetail? initialDetail;

  bool get isEditing => initialDetail != null;

  @override
  ConsumerState<OpportunityCrudSheet> createState() => _OpportunityCrudSheetState();
}

class _OpportunityCrudSheetState extends ConsumerState<OpportunityCrudSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _summaryController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late final TextEditingController _organizationController;
  late final TextEditingController _budgetController;
  late final TextEditingController _durationController;
  late final TextEditingController _employmentController;
  late final TextEditingController _statusController;
  late final TextEditingController _ctaController;
  late final TextEditingController _videoController;
  late final TextEditingController _posterNameController;
  late final TextEditingController _posterAvatarController;
  final TextEditingController _skillInputController = TextEditingController();
  final TextEditingController _tagInputController = TextEditingController();
  final TextEditingController _mediaInputController = TextEditingController();
  bool _isRemote = false;
  bool _saving = false;
  final Set<String> _skills = <String>{};
  final Set<String> _tags = <String>{};
  final List<String> _imageUrls = <String>[];

  @override
  void initState() {
    super.initState();
    final draft = widget.initialDetail?.toDraft();
    _titleController = TextEditingController(text: draft?.title ?? '');
    _summaryController = TextEditingController(text: draft?.summary ?? '');
    _descriptionController = TextEditingController(text: draft?.description ?? '');
    _locationController = TextEditingController(text: draft?.location ?? '');
    _organizationController = TextEditingController(text: draft?.organization ?? '');
    _budgetController = TextEditingController(text: draft?.budget ?? '');
    _durationController = TextEditingController(text: draft?.duration ?? '');
    _employmentController = TextEditingController(text: draft?.employmentType ?? '');
    _statusController = TextEditingController(text: draft?.status ?? '');
    _ctaController = TextEditingController(text: draft?.ctaUrl ?? '');
    _videoController = TextEditingController(text: draft?.videoUrl ?? '');
    _posterNameController = TextEditingController(text: draft?.posterName ?? '');
    _posterAvatarController = TextEditingController(text: draft?.posterAvatarUrl ?? '');
    _isRemote = draft?.isRemote ?? false;
    _skills.addAll(draft?.skills ?? const <String>[]);
    _tags.addAll(draft?.tags ?? const <String>[]);
    _imageUrls.addAll(
      (draft?.media ?? const <OpportunityMediaAsset>[])
          .where((asset) => !asset.isVideo)
          .map((asset) => asset.url),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _organizationController.dispose();
    _budgetController.dispose();
    _durationController.dispose();
    _employmentController.dispose();
    _statusController.dispose();
    _ctaController.dispose();
    _videoController.dispose();
    _posterNameController.dispose();
    _posterAvatarController.dispose();
    _skillInputController.dispose();
    _tagInputController.dispose();
    _mediaInputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final entityLabel = _friendlyCategoryTitle(widget.category);
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      minChildSize: 0.6,
      maxChildSize: 0.98,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.12),
                blurRadius: 28,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Form(
              key: _formKey,
              child: ListView(
                controller: scrollController,
                padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
                children: [
                  Center(
                    child: Container(
                      height: 4,
                      width: 48,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.outlineVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  Text(
                    widget.isEditing ? 'Edit $entityLabel profile' : 'Publish new $entityLabel',
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Enrich this ${_friendlyCategoryLabel(widget.category)} with visuals, skills, and call-to-action links.',
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Title *', border: OutlineInputBorder()),
                    textCapitalization: TextCapitalization.sentences,
                    validator: (value) => (value == null || value.trim().isEmpty) ? 'Title is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _summaryController,
                    decoration: const InputDecoration(
                      labelText: 'One-line summary',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Full description *',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 8,
                    validator: (value) => (value == null || value.trim().length < 40)
                        ? 'Please provide at least 40 characters'
                        : null,
                  ),
                  const SizedBox(height: 24),
                  _SectionHeading(title: 'Logistics'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _locationController,
                          decoration: const InputDecoration(
                            labelText: 'Location',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _organizationController,
                          decoration: const InputDecoration(
                            labelText: 'Organization',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _budgetController,
                          decoration: const InputDecoration(
                            labelText: 'Budget / price',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _durationController,
                          decoration: const InputDecoration(
                            labelText: 'Duration / availability',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _employmentController,
                          decoration: const InputDecoration(
                            labelText: 'Engagement type',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _statusController,
                          decoration: const InputDecoration(
                            labelText: 'Status / stage',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SwitchListTile.adaptive(
                    value: _isRemote,
                    onChanged: (value) => setState(() => _isRemote = value),
                    title: const Text('Remote friendly'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 24),
                  _SectionHeading(title: 'Skills & taxonomy'),
                  const SizedBox(height: 12),
                  _TokenField(
                    controller: _skillInputController,
                    label: 'Add skill',
                    hintText: 'e.g. Motion design',
                    onSubmitted: _addSkill,
                  ),
                  if (_skills.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _skills
                          .map(
                            (skill) => InputChip(
                              label: Text(skill),
                              onDeleted: () => setState(() => _skills.remove(skill)),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _TokenField(
                    controller: _tagInputController,
                    label: 'Add tag',
                    hintText: 'e.g. Sustainability',
                    onSubmitted: _addTag,
                  ),
                  if (_tags.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _tags
                          .map(
                            (tag) => InputChip(
                              label: Text(tag),
                              onDeleted: () => setState(() => _tags.remove(tag)),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 24),
                  _SectionHeading(title: 'Media'),
                  const SizedBox(height: 12),
                  _TokenField(
                    controller: _mediaInputController,
                    label: 'Add image URL',
                    hintText: 'https://',
                    keyboardType: TextInputType.url,
                    onSubmitted: _addImage,
                  ),
                  if (_imageUrls.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Column(
                      children: _imageUrls
                          .map(
                            (url) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  color: Theme.of(context).colorScheme.surfaceVariant,
                                  image: DecorationImage(
                                    image: NetworkImage(url),
                                    fit: BoxFit.cover,
                                    onError: (_, __) {},
                                  ),
                                ),
                              ),
                              title: Text(url, maxLines: 1, overflow: TextOverflow.ellipsis),
                              trailing: IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: () => setState(() => _imageUrls.remove(url)),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _videoController,
                    decoration: const InputDecoration(
                      labelText: 'Promo video URL',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.url,
                  ),
                  const SizedBox(height: 24),
                  _SectionHeading(title: 'Calls to action'),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _ctaController,
                    decoration: const InputDecoration(
                      labelText: 'Primary CTA link',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.url,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _posterNameController,
                          decoration: const InputDecoration(
                            labelText: 'Poster name',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _posterAvatarController,
                          decoration: const InputDecoration(
                            labelText: 'Poster avatar URL',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.url,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _saving ? null : _submit,
                    icon: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.save),
                    label: Text(widget.isEditing ? 'Save changes' : 'Publish $entityLabel'),
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _addSkill(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;
    setState(() => _skills.add(trimmed));
    _skillInputController.clear();
  }

  void _addTag(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;
    setState(() => _tags.add(trimmed));
    _tagInputController.clear();
  }

  void _addImage(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return;
    setState(() => _imageUrls.add(trimmed));
    _mediaInputController.clear();
  }

  Future<void> _submit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    final media = [
      ..._imageUrls.map(
        (url) => OpportunityMediaAsset(url: url.trim(), type: OpportunityMediaType.image),
      ),
    ];
    final videoUrl = _videoController.text.trim();
    if (videoUrl.isNotEmpty) {
      media.add(OpportunityMediaAsset(url: videoUrl, type: OpportunityMediaType.video));
    }

    final draft = OpportunityDraft(
      title: _titleController.text.trim(),
      summary: _summaryController.text.trim().isEmpty ? null : _summaryController.text.trim(),
      description: _descriptionController.text.trim(),
      location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
      organization:
          _organizationController.text.trim().isEmpty ? null : _organizationController.text.trim(),
      isRemote: _isRemote,
      skills: _skills.toList(),
      tags: _tags.toList(),
      media: media,
      ctaUrl: _ctaController.text.trim().isEmpty ? null : _ctaController.text.trim(),
      budget: _budgetController.text.trim().isEmpty ? null : _budgetController.text.trim(),
      duration: _durationController.text.trim().isEmpty ? null : _durationController.text.trim(),
      employmentType:
          _employmentController.text.trim().isEmpty ? null : _employmentController.text.trim(),
      status: _statusController.text.trim().isEmpty ? null : _statusController.text.trim(),
      videoUrl: videoUrl.isEmpty ? null : videoUrl,
      posterName: _posterNameController.text.trim().isEmpty ? null : _posterNameController.text.trim(),
      posterAvatarUrl:
          _posterAvatarController.text.trim().isEmpty ? null : _posterAvatarController.text.trim(),
    );

    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    try {
      final detail = widget.isEditing
          ? await controller.updateOpportunity(widget.initialDetail!.id, draft)
          : await controller.createOpportunity(draft);
      if (!mounted) return;
      Navigator.of(context).pop(detail);
    } catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to save: $error')),
      );
    }
  }
}

class _MediaCarousel extends StatefulWidget {
  const _MediaCarousel({required this.media});

  final List<OpportunityMediaAsset> media;

  @override
  State<_MediaCarousel> createState() => _MediaCarouselState();
}

class _MediaCarouselState extends State<_MediaCarousel> {
  late final PageController _controller;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: PageView.builder(
              controller: _controller,
              onPageChanged: (value) => setState(() => _index = value),
              itemCount: widget.media.length,
              itemBuilder: (context, index) {
                final asset = widget.media[index];
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      color: theme.colorScheme.surfaceVariant,
                      child: asset.isVideo
                          ? Stack(
                              fit: StackFit.expand,
                              children: [
                                if ((asset.thumbnailUrl ?? '').isNotEmpty)
                                  Image.network(asset.thumbnailUrl!, fit: BoxFit.cover),
                                Center(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.4),
                                      shape: BoxShape.circle,
                                    ),
                                    padding: const EdgeInsets.all(16),
                                    child: const Icon(Icons.play_arrow, color: Colors.white, size: 48),
                                  ),
                                ),
                              ],
                            )
                          : Image.network(asset.url, fit: BoxFit.cover),
                    ),
                    if ((asset.caption ?? '').isNotEmpty)
                      Positioned(
                        left: 16,
                        right: 16,
                        bottom: 16,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.55),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            asset.caption!,
                            style: theme.textTheme.bodySmall?.copyWith(color: Colors.white),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
        if (widget.media.length > 1) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.media.length,
              (i) => Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i == _index
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outlineVariant,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ReviewList extends StatelessWidget {
  const _ReviewList({required this.reviews});

  final List<OpportunityReview> reviews;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: reviews.map((review) => _ReviewTile(review: review)).toList(),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});

  final OpportunityReview review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.star, color: Colors.amber.shade600, size: 18),
              const SizedBox(width: 4),
              Text(review.rating.toStringAsFixed(1), style: theme.textTheme.labelLarge),
              const Spacer(),
              Text(
                formatRelativeTime(review.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(review.comment, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(
            review.reviewer,
            style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Chip(
      backgroundColor: color.withOpacity(0.12),
      label: Text(label),
      labelStyle: theme.textTheme.labelMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Text(
      title,
      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
    );
  }
}

class _TokenField extends StatelessWidget {
  const _TokenField({
    required this.controller,
    required this.label,
    required this.onSubmitted,
    this.hintText,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final String? hintText;
  final TextInputType? keyboardType;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: TextInputAction.done,
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        border: const OutlineInputBorder(),
        suffixIcon: IconButton(
          icon: const Icon(Icons.add_circle_outline),
          onPressed: () => onSubmitted(controller.text),
        ),
      ),
    );
  }
}

