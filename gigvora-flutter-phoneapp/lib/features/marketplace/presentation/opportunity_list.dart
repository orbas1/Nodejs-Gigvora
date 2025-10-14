import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/opportunity_controller.dart';
import '../data/models/opportunity.dart';
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
  bool get _showVolunteerFilters => widget.category == OpportunityCategory.volunteering;
  bool get _isVolunteerCategory => widget.category == OpportunityCategory.volunteering;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    if (_isGigCategory) {
      controller.setIncludeFacets(true);
    }
    if (_showVolunteerFilters) {
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

    final organizationOptions = _showVolunteerFilters
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

    final filtersActive = _remoteOnly || _freshness != '30d' || _selectedOrganizations.isNotEmpty;
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
            filtersActive:
                filtersActive || controller.filters.isNotEmpty || _searchController.text.trim().isNotEmpty,
            activeResultCount: items.length,
          )
        else ...[
          TextField(
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
                borderSide: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.4)),
                borderSide: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.3)),
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
                                                  backgroundColor: colorScheme.primary.withOpacity(0.08),
                                                  label: Text(entry),
                                                  labelStyle: theme.textTheme.labelSmall?.copyWith(
                                                    color: colorScheme.primary,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                  backgroundColor: primaryChipBackground,
                                                  shape: StadiumBorder(
                                                    side: BorderSide(color: primaryChipBorder),
                                                  ),
                                                  visualDensity: VisualDensity.compact,
                                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                                  label: Text(entry),
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
                          );
                        },
                      ),
          ),
        ),
      ],
    );
  }

  void _applyFilters(OpportunityController controller) {
    if (_showVolunteerFilters) {
      controller.setFilters({
        'isRemote': _remoteOnly ? true : null,
        'updatedWithin': _freshness == 'all' ? null : _freshness,
        'organizations': _selectedOrganizations.isEmpty
            ? null
            : _selectedOrganizations.toList(growable: false),
      });
      return;
    }

    if (_isGigCategory) {
      controller.setFilters({
        'taxonomySlugs': _selectedTagSlugs.isEmpty
            ? null
            : _selectedTagSlugs.toList(growable: false),
      });
      return;
    }

    controller.setFilters(null);
    controller.updateFilters({
      'isRemote': _remoteOnly ? true : null,
      'updatedWithin': _freshness == 'all' ? null : _freshness,
      'organizations': _selectedOrganizations.isEmpty ? null : _selectedOrganizations.toList(growable: false),
    });
  }

  List<String> _buildMeta(OpportunitySummary item) {
    switch (widget.category) {
      case OpportunityCategory.job:
        return [
          if ((item.location ?? '').isNotEmpty) item.location!,
          if ((item.employmentType ?? '').isNotEmpty) item.employmentType!,
          if (item.isRemote) 'Remote',
          if (item.isRemote == true) 'Remote',
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
          if (item.isRemote == true) 'Remote friendly',
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
      if (label.contains('remote') || label.contains('hybrid') || item.isRemote == true) {
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
          value.toString(),
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
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
  final void Function(String slug) onToggle;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.take(12).map((option) {
            final isSelected = selected.contains(option.slug);
            return FilterChip(
              label: Text('${option.label} (${option.count})'),
              selected: isSelected,
              onSelected: (_) => onToggle(option.slug),
              labelStyle: theme.textTheme.labelSmall?.copyWith(
                color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
              showCheckmark: false,
              backgroundColor: colorScheme.surfaceVariant.withOpacity(0.6),
              selectedColor: colorScheme.primary.withOpacity(0.18),
              side: BorderSide(
                color: isSelected
                    ? colorScheme.primary.withOpacity(0.4)
                    : colorScheme.outlineVariant.withOpacity(0.5),
              ),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              visualDensity: VisualDensity.compact,
            );
          }).toList(),
        ),
        if (selected.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextButton.icon(
              onPressed: onClear,
              icon: const Icon(Icons.clear),
              label: const Text('Clear SEO tags'),
            ),
          ),
      ],
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
  if (items.isEmpty && facets == null) {
    return const <_TagOption>[];
  }

  String formatLabel(String slug, [String? label]) {
    final candidate = label?.trim();
    if (candidate != null && candidate.isNotEmpty) {
      return candidate;
    }
    return slug
        .replaceAll(RegExp(r'[_-]+'), ' ')
        .split(' ')
        .where((part) => part.isNotEmpty)
        .map((part) => part[0].toUpperCase() + part.substring(1))
        .join(' ');
  }

  final Map<String, _TagOption> map = {};

  void register(String slug, {String? label, int weight = 1}) {
    if (slug.isEmpty) {
      return;
    }
    final key = slug.toLowerCase();
    final current = map[key];
    final resolvedLabel = formatLabel(slug, label ?? current?.label);
    final count = (current?.count ?? 0) + weight;
    map[key] = _TagOption(slug: slug, label: resolvedLabel, count: count);
  }

  final taxonomyFacet = facets != null && facets['taxonomySlugs'] is Map<String, dynamic>
      ? Map<String, dynamic>.from(facets['taxonomySlugs'] as Map)
      : const <String, dynamic>{};
  taxonomyFacet.forEach((slug, value) {
    final count = value is num ? value.toInt() : 0;
    if (slug is String && count > 0) {
      register(slug, weight: count);
    }
  });

  for (final item in items) {
    if (item.taxonomies.isNotEmpty) {
      for (final taxonomy in item.taxonomies) {
        register(taxonomy.slug, label: taxonomy.label);
      }
      continue;
    }
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
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: searchController,
              textInputAction: TextInputAction.search,
              onChanged: onQueryChanged,
              decoration: InputDecoration(
                hintText: searchPlaceholder,
                prefixIcon: Icon(Icons.search, color: colorScheme.onSurfaceVariant),
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
                      backgroundColor: remoteOnly ? colorScheme.primary.withOpacity(0.1) : null,
                      foregroundColor: remoteOnly ? colorScheme.primary : colorScheme.onSurfaceVariant,
                      backgroundColor: remoteOnly ? colorScheme.primary.withOpacity(0.08) : null,
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
                      (organization) => FilterChip(
                        label: Text(organization),
                        selected: selectedOrganizations.contains(organization),
                        onSelected: (_) => onOrganizationToggled(organization),
                      ),
                    )
                    .toList(),
              ),
            ],
            if (filtersActive) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Text('Showing $activeResultCount matches', style: theme.textTheme.bodySmall),
                  const Spacer(),
                  TextButton(onPressed: onClearFilters, child: const Text('Clear filters')),
                ],
              ),
            ],
          ],
        ),
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
        borderRadius: BorderRadius.circular(16),
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

class _OpportunitySkeleton extends StatelessWidget {
  const _OpportunitySkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 12,
                  width: 160,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  height: 16,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  height: 16,
                  width: MediaQuery.of(context).size.width * 0.7,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  height: 40,
                  width: 140,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
