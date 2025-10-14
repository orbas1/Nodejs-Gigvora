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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final state = ref.watch(opportunityControllerProvider(widget.category));
    final controller = ref.read(opportunityControllerProvider(widget.category).notifier);
    final items = state.data?.items ?? const <OpportunitySummary>[];
    final gigSignals = widget.category == OpportunityCategory.gig ? _deriveGigSignals(items) : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onChanged: controller.updateQuery,
          decoration: InputDecoration(
            hintText: widget.searchPlaceholder,
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(28)),
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
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(28),
              borderSide: BorderSide(color: colorScheme.primary.withOpacity(0.6)),
            ),
          ),
        ),
        const SizedBox(height: 16),
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
              style:
                  theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Wrap(
                                        spacing: 8,
                                        runSpacing: 6,
                                        children: meta
                                            .map(
                                              (entry) => Chip(
                                                backgroundColor: Theme.of(context)
                                                    .colorScheme
                                                    .primaryContainer
                                                    .withOpacity(0.3),
                                                label: Text(entry),
                                                backgroundColor:
                                                    colorScheme.primary.withOpacity(0.08),
                                                labelStyle: theme.textTheme.labelSmall?.copyWith(
                                                  color: colorScheme.primary,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                                visualDensity: VisualDensity.compact,
                                                materialTapTargetSize:
                                                    MaterialTapTargetSize.shrinkWrap,
                                              ),
                                            )
                                            .toList(),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
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
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
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
                                const SizedBox(height: 16),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: FilledButton(
                                    onPressed: () => controller.recordPrimaryCta(item),
                                    style: FilledButton.styleFrom(
                                      shape: const StadiumBorder(),
                                    ),
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
        return [
          if ((item.location ?? '').isNotEmpty) item.location!,
          if ((item.employmentType ?? '').isNotEmpty) item.employmentType!,
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
          if ((item.location ?? '').isNotEmpty) item.location!,
        ];
    }
  }

  _GigSignals _deriveGigSignals(List<OpportunitySummary> items) {
    if (items.isEmpty) {
      return const _GigSignals(total: 0, fresh: 0, remoteFriendly: 0);
    }
    final now = DateTime.now();
    var fresh = 0;
    var remoteFriendly = 0;

    for (final item in items) {
      if (now.difference(item.updatedAt).inDays <= 7) {
        fresh += 1;
      }
      final label = '${item.location ?? ''} ${item.status ?? ''}'.toLowerCase();
      if (label.contains('remote') || label.contains('hybrid')) {
        remoteFriendly += 1;
      }
    }

    return _GigSignals(total: items.length, fresh: fresh, remoteFriendly: remoteFriendly);
  }
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

class _GigSignals {
  const _GigSignals({
    required this.total,
    required this.fresh,
    required this.remoteFriendly,
  });

  final int total;
  final int fresh;
  final int remoteFriendly;
}
