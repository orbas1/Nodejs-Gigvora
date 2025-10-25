import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';
import '../../../theme/filter_selector.dart';
import '../../../theme/widgets.dart';
import '../../../core/access/explorer_access.dart';
import '../../auth/application/session_controller.dart';
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
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final explorerUnlocked = hasExplorerAccess(session);

    if (!sessionState.isAuthenticated) {
      return _buildAccessRestriction(
        context,
        headline: 'Sign in to open Explorer',
        message:
            'Explorer consolidates roles, gigs, launchpads, and volunteering missions into a single, secure search experience. Sign in or create an account to continue.',
        actions: [
          FilledButton(
            onPressed: () => context.push('/login'),
            child: const Text('Sign in'),
          ),
          OutlinedButton(
            onPressed: () => context.push('/register'),
            child: const Text('Create account'),
          ),
        ],
      );
    }

    if (!explorerUnlocked) {
      final eligibleRoles = kExplorerAllowedMemberships
          .map((role) => role[0].toUpperCase() + role.substring(1))
          .join(', ');

      return _buildAccessRestriction(
        context,
        headline: 'Explorer access requires activation',
        message:
            'Your current workspace membership does not include Explorer search. Switch to an eligible role or request activation from your Gigvora administrator.',
        footer: Text(
          'Eligible memberships: $eligibleRoles',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
        actions: [
          FilledButton(
            onPressed: () => context.push('/home'),
            child: const Text('Go to home'),
          ),
          OutlinedButton(
            onPressed: () => _showSupportSnackBar(context),
            child: const Text('Contact support'),
          ),
        ],
      );
    }

    final state = ref.watch(explorerControllerProvider);
    final controller = ref.read(explorerControllerProvider.notifier);
    final selected = categories.firstWhere((element) => element.id == _selectedCategory);
    final query = state.query;
    final theme = Theme.of(context);

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
      body: Stack(
        children: [
          const _ExplorerBackdrop(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.82),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: theme.colorScheme.primary.withOpacity(0.08)),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withOpacity(0.08),
                      offset: const Offset(0, 24),
                      blurRadius: 48,
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(28),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                        child: Container(
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surface.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(color: theme.colorScheme.primary.withOpacity(0.12)),
                          ),
                          child: TextField(
                            controller: _searchController,
                            textInputAction: TextInputAction.search,
                            decoration: InputDecoration(
                              hintText: 'Search across roles, gigs, projects, cohorts, and people',
                              prefixIcon: const Icon(Icons.search),
                              suffixIcon: IconButton(
                                icon: const Icon(Icons.mic_none),
                                tooltip: 'Request Explorer voice search',
                                onPressed: () {
                                  controller.recordVoiceSearchIntent();
                                  final messenger = ScaffoldMessenger.of(context);
                                  messenger.hideCurrentSnackBar();
                                  messenger.showSnackBar(
                                    const SnackBar(
                                      content: Text('Voice search is coming soon. Contact support for early access.'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                },
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                            ),
                            onChanged: controller.updateQuery,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    GigvoraFilterGroup<String>(
                      options: categories
                          .map(
                            (category) => GigvoraFilterOption<String>(
                              value: category.id,
                              label: category.label,
                              tooltip: category.isPeople
                                  ? 'Explore collaborators and networking leads matched to your workspace.'
                                  : 'View ${category.label.toLowerCase()} curated for your memberships and search query.',
                            ),
                          )
                          .toList(growable: false),
                      selectedValue: _selectedCategory,
                      onSelected: (value) {
                        if (_selectedCategory == value) {
                          return;
                        }
                        setState(() => _selectedCategory = value);
                        final selectedCategory =
                            categories.firstWhere((element) => element.id == value);
                        controller.recordFilterSelection(selectedCategory.category);
                      },
                    ),
                  ],
                ),
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
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Last updated ${formatRelativeTime(lastUpdated)}',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: theme.colorScheme.surfaceVariant.withOpacity(0.4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        offset: const Offset(0, 18),
                        blurRadius: 40,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(32),
                    child: RefreshIndicator(
                      color: theme.colorScheme.primary,
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
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAccessRestriction(
    BuildContext context, {
    required String headline,
    required String message,
    required List<Widget> actions,
    Widget? footer,
  }) {
    final theme = Theme.of(context);
    return GigvoraScaffold(
      title: 'Explorer Search',
      subtitle: 'Discover talent, opportunities, and collaborators',
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(Icons.lock_outline, size: 36, color: theme.colorScheme.primary),
                const SizedBox(height: 16),
                Text(
                  headline,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                if (footer != null) ...[
                  const SizedBox(height: 12),
                  footer,
                ],
                const SizedBox(height: 24),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  alignment: WrapAlignment.center,
                  children: actions,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSupportSnackBar(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Email support@gigvora.com to request Explorer activation.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _openOpportunity(
    BuildContext context,
    ExplorerController controller,
    OpportunityCategory category,
    String categoryLabel,
    OpportunitySummary opportunity,
  ) {
    controller.recordResultOpened(
      category: category,
      id: opportunity.id,
      title: opportunity.title,
    );

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _OpportunityDetailSheet(
        opportunity: opportunity,
        categoryLabel: categoryLabel,
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
                  onPressed: () {
                    controller.recordPersonOpened(person);
                    context.push('/profile?id=${Uri.encodeComponent(person.id)}');
                  },
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
        final meta = _metaForOpportunity(item);
        final theme = Theme.of(context);
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
                        backgroundColor: theme.colorScheme.primaryContainer.withOpacity(0.25),
                        label: Text(
                          entry,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              Text(item.title, style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                item.description,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'Updated ${formatRelativeTime(item.updatedAt)}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => _openOpportunity(
                  context,
                  controller,
                  selected.category ?? OpportunityCategory.job,
                  selected.label,
                  item,
                ),
                child: const Text('View details'),
              ),
            ],
          ),
        );
      },
    );
  }

}

List<String> _metaForOpportunity(OpportunitySummary item) {
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

class _OpportunityDetailSheet extends StatelessWidget {
  const _OpportunityDetailSheet({
    required this.opportunity,
    required this.categoryLabel,
  });

  final OpportunitySummary opportunity;
  final String categoryLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final meta = _metaForOpportunity(opportunity);
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.45,
      maxChildSize: 0.9,
      builder: (context, controller) => Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 32,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    height: 4,
                    width: 48,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  categoryLabel.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 2.4,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  opportunity.title,
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                if (meta.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: meta
                        .map(
                          (entry) => Chip(
                            label: Text(
                              entry,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: theme.colorScheme.onPrimaryContainer,
                              ),
                            ),
                            backgroundColor: theme.colorScheme.primaryContainer.withOpacity(0.25),
                          ),
                        )
                        .toList(),
                  ),
                const SizedBox(height: 16),
                Text(
                  opportunity.description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    if (opportunity.organization != null && opportunity.organization!.isNotEmpty)
                      _DetailTile(
                        icon: Icons.apartment_outlined,
                        label: 'Organisation',
                        value: opportunity.organization!,
                      ),
                    if (opportunity.location != null && opportunity.location!.isNotEmpty)
                      _DetailTile(
                        icon: Icons.location_on_outlined,
                        label: 'Primary location',
                        value: opportunity.location!,
                      ),
                    if (opportunity.employmentType != null && opportunity.employmentType!.isNotEmpty)
                      _DetailTile(
                        icon: Icons.badge_outlined,
                        label: 'Engagement type',
                        value: opportunity.employmentType!,
                      ),
                    if (opportunity.duration != null && opportunity.duration!.isNotEmpty)
                      _DetailTile(
                        icon: Icons.timer_outlined,
                        label: 'Duration',
                        value: opportunity.duration!,
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'Updated ${formatRelativeTime(opportunity.updatedAt)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailTile extends StatelessWidget {
  const _DetailTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 180, maxWidth: 220),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: theme.colorScheme.primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
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

class _ExplorerBackdrop extends StatelessWidget {
  const _ExplorerBackdrop();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        fit: StackFit.expand,
        children: const [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xB70F172A),
                  Color(0x000F172A),
                ],
              ),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.topRight,
                radius: 1.2,
                colors: [
                  Color(0x332563EB),
                  Colors.transparent,
                ],
              ),
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
