import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/date_formatter.dart';
import '../../../theme/widgets.dart';
import '../../marketplace/data/models/opportunity.dart';
import '../application/explorer_controller.dart';
import '../data/discovery_models.dart';

class ExplorerScreen extends ConsumerStatefulWidget {
  const ExplorerScreen({super.key});

  @override
  ConsumerState<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerCategory {
  const _ExplorerCategory({
    required this.id,
    required this.label,
    this.category,
  });

  final String id;
  final String label;
  final OpportunityCategory? category;

  bool get isPeople => category == null;
}

class _ExplorerScreenState extends ConsumerState<ExplorerScreen> {
  final List<_ExplorerCategory> categories = const [
    _ExplorerCategory(id: 'jobs', label: 'Jobs', category: OpportunityCategory.job),
    _ExplorerCategory(id: 'gigs', label: 'Gigs', category: OpportunityCategory.gig),
    _ExplorerCategory(id: 'projects', label: 'Projects', category: OpportunityCategory.project),
    _ExplorerCategory(id: 'launchpads', label: 'Experience Launchpad', category: OpportunityCategory.launchpad),
    _ExplorerCategory(id: 'volunteering', label: 'Volunteering', category: OpportunityCategory.volunteering),
    _ExplorerCategory(id: 'people', label: 'People'),
  ];

  late final TextEditingController _searchController;
  String _selectedCategory = 'jobs';

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(explorerControllerProvider);
    final controller = ref.read(explorerControllerProvider.notifier);
    final selected = categories.firstWhere((element) => element.id == _selectedCategory);
    final query = state.query;

    final isLoading = query.isEmpty ? state.snapshot.loading : state.search.loading;
    final error = query.isEmpty ? state.snapshot.error : state.search.error;
    final fromCache = query.isEmpty ? state.snapshot.fromCache : state.search.fromCache;
    final lastUpdated = query.isEmpty ? state.snapshot.lastUpdated : state.search.lastUpdated;

    final opportunities = query.isEmpty
        ? state.snapshot.data?.itemsFor(selected.category ?? OpportunityCategory.job) ?? const <OpportunitySummary>[]
        : selected.isPeople
            ? const <OpportunitySummary>[]
            : state.search.data?.resultsFor(selected.category ?? OpportunityCategory.job) ?? const <OpportunitySummary>[];

    final peopleResults = state.search.data?.people ?? const <SearchPerson>[];

    if (_searchController.text != query) {
      _searchController.value = TextEditingValue(text: query, selection: TextSelection.collapsed(offset: query.length));
    }

    return GigvoraScaffold(
      title: 'Explorer Search',
      subtitle: 'Discover talent, opportunities, and collaborators',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search across roles, gigs, projects, cohorts, and people',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(28)),
            ),
            onChanged: controller.updateQuery,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: categories.map((category) {
              final isActive = category.id == _selectedCategory;
              return ChoiceChip(
                label: Text(category.label),
                selected: isActive,
                onSelected: (_) {
                  setState(() => _selectedCategory = category.id);
                  controller.recordFilterSelection(category.category);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          if (fromCache && !isLoading)
            const _StatusBanner(
              icon: Icons.offline_bolt,
              background: Color(0xFFFEF3C7),
              foreground: Color(0xFF92400E),
              message: 'Showing cached discovery results while we reconnect.',
            ),
          if (error != null && !isLoading)
            const _StatusBanner(
              icon: Icons.error_outline,
              background: Color(0xFFFEE2E2),
              foreground: Color(0xFFB91C1C),
              message: 'Unable to load the latest discovery results. Pull to refresh to try again.',
            ),
          if (lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                'Last updated ${formatRelativeTime(lastUpdated)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: controller.refreshActive,
              child: _buildResults(
                context,
                selected,
                query,
                isLoading,
                opportunities,
                peopleResults,
                controller,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResults(
    BuildContext context,
    _ExplorerCategory selected,
    String query,
    bool isLoading,
    List<OpportunitySummary> opportunities,
    List<SearchPerson> people,
    ExplorerController controller,
  ) {
    if (isLoading && query.isEmpty && opportunities.isEmpty) {
      return const _ExplorerSkeleton();
    }

    if (selected.isPeople) {
      if (query.isEmpty) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 80),
            GigvoraCard(
              child: Text(
                'Search to discover people across the Gigvora network.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        );
      }

      if (people.isEmpty) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 80),
            GigvoraCard(
              child: Text(
                'No people matched "$query" yet. Try refining your search or check back soon.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
          ],
        );
      }

      return ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: people.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final person = people[index];
          return GigvoraCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(person.displayName, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(person.email, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => controller.recordPersonOpened(person),
                  child: const Text('View profile'),
                ),
              ],
            ),
          );
        },
      );
    }

    if (isLoading && opportunities.isEmpty) {
      return const _ExplorerSkeleton();
    }

    if (opportunities.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 80),
          GigvoraCard(
            child: Text(
              query.isEmpty
                  ? 'We are syncing fresh opportunities in this category. Pull to refresh for the latest list.'
                  : 'No results matched "$query" for this category. Try different keywords or filters.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: opportunities.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final item = opportunities[index];
        final meta = _buildMeta(item);
        return GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
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
              const SizedBox(height: 12),
              Text(item.title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                item.description,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'Updated ${formatRelativeTime(item.updatedAt)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => controller.recordResultOpened(
                  category: selected.category ?? OpportunityCategory.job,
                  id: item.id,
                  title: item.title,
                ),
                child: const Text('View details'),
              ),
            ],
          ),
        );
      },
    );
  }

  List<String> _buildMeta(OpportunitySummary item) {
    switch (item.category) {
      case OpportunityCategory.job:
        return [item.location, item.employmentType].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.gig:
        return [item.budget, item.duration].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.project:
        return [item.status, item.location].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.launchpad:
        return [item.track].whereType<String>().where((value) => value.isNotEmpty).toList();
      case OpportunityCategory.volunteering:
        return [item.organization, item.location].whereType<String>().where((value) => value.isNotEmpty).toList();
    }
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

class _ExplorerSkeleton extends StatelessWidget {
  const _ExplorerSkeleton();

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
                  width: 140,
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
                const SizedBox(height: 12),
                Container(
                  height: 36,
                  width: 160,
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
