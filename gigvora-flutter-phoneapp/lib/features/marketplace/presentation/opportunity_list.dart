import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/opportunity_controller.dart';
import '../data/models/opportunity.dart';

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
  bool _defaultsApplied = false;

  bool get _showVolunteerFilters => widget.category == OpportunityCategory.volunteering;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    if (_showVolunteerFilters) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_defaultsApplied) {
          return;
        }
        _defaultsApplied = true;
        final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
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
    final state = ref.watch(opportunityControllerProvider(widget.category));
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    final items = state.data?.items ?? const <OpportunitySummary>[];
    final organizationOptions = _showVolunteerFilters
        ? items
            .map((item) => item.organization?.trim())
            .whereType<String>()
            .where((value) => value.isNotEmpty)
            .toSet()
            .toList(growable: false)
          ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()))
        : const <String>[];

    if (_showVolunteerFilters) {
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_showVolunteerFilters)
          _VolunteerFilterCard(
            searchController: _searchController,
            searchPlaceholder: widget.searchPlaceholder,
            onQueryChanged: controller.updateQuery,
            remoteOnly: _remoteOnly,
            onRemoteToggle: () {
              setState(() {
                _remoteOnly = !_remoteOnly;
              });
              _applyFilters(controller);
            },
            freshness: _freshness,
            onFreshnessChanged: (value) {
              setState(() {
                _freshness = value;
              });
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
                _remoteOnly || _freshness != '30d' || _selectedOrganizations.isNotEmpty || controller.filters.isNotEmpty,
            activeResultCount: items.length,
          )
        else ...[
          TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: widget.searchPlaceholder,
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(28)),
            ),
            onChanged: controller.updateQuery,
          ),
          const SizedBox(height: 16),
        ],
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
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
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
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          final item = items[index];
                          final meta = _buildMeta(item);
                          final taxonomyLabels = item.taxonomyLabels.take(4).toList(growable: false);
                          return GigvoraCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Wrap(
                                        spacing: 8,
                                        runSpacing: 4,
                                        children: meta
                                            .map(
                                              (entry) => Chip(
                                                backgroundColor: const Color(0xFFE0F2FE),
                                                label: Text(entry),
                                              ),
                                            )
                                            .toList(),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Updated ${formatRelativeTime(item.updatedAt)}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(item.title, style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 8),
                                Text(
                                  item.description,
                                  maxLines: 4,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                if (taxonomyLabels.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: taxonomyLabels
                                        .map(
                                          (label) => Chip(
                                            backgroundColor: const Color(0xFFE0E7FF),
                                            label: Text(label),
                                          ),
                                        )
                                        .toList(),
                                  ),
                                ],
                                const SizedBox(height: 16),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: ElevatedButton(
                                    onPressed: () => controller.recordPrimaryCta(item),
                                    child: Text(widget.ctaLabel),
                                  ),
                                ),
                              ],
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
    controller.updateFilters({
      'isRemote': _remoteOnly ? true : null,
      'updatedWithin': _freshness == 'all' ? null : _freshness,
      'organizations': _selectedOrganizations.isEmpty
          ? null
          : _selectedOrganizations.toList(growable: false),
    });
  }

  List<String> _buildMeta(OpportunitySummary item) {
    switch (widget.category) {
      case OpportunityCategory.job:
        return [item.location, item.employmentType].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.gig:
        return [item.budget, item.duration].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.project:
        return [item.status, item.location].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.launchpad:
        return [item.track].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.volunteering:
        return [
          item.organization,
          if (item.isRemote) 'Remote friendly',
          item.location,
        ].whereType<String>().where((value) => value.isNotEmpty).toList();
    }
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
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: searchController,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: searchPlaceholder,
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
              ),
              onChanged: onQueryChanged,
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
                      backgroundColor: remoteOnly ? const Color(0xFFE0F2F1) : null,
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
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: foreground),
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
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  width: MediaQuery.of(context).size.width * 0.7,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 36,
                  width: 140,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(24),
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
