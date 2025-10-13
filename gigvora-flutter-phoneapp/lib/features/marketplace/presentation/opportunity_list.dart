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
    final state = ref.watch(opportunityControllerProvider(widget.category));
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    final items = state.data?.items ?? const <OpportunitySummary>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: widget.searchPlaceholder,
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(28)),
    return GigvoraScaffold(
      title: widget.title,
      subtitle: widget.subtitle,
      actions: widget.actions,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
          onChanged: controller.updateQuery,
        ),
        const SizedBox(height: 16),
        if (state.fromCache && !state.loading)
          _StatusBanner(
            icon: Icons.offline_bolt,
            background: const Color(0xFFFEF3C7),
            foreground: const Color(0xFF92400E),
            message: 'Showing cached results while we reconnect.',
          ),
        if (state.hasError && !state.loading)
          _StatusBanner(
            icon: Icons.error_outline,
            background: const Color(0xFFFEE2E2),
            foreground: const Color(0xFFB91C1C),
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
