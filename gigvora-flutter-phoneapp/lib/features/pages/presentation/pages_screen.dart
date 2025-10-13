import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../theme/widgets.dart';
import '../application/page_studio_controller.dart';
import '../domain/page_models.dart';

class PagesScreen extends ConsumerWidget {
  const PagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(pageStudioControllerProvider);
    final controller = ref.read(pageStudioControllerProvider.notifier);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final summary = _PageSummary.fromState(state);

    return GigvoraScaffold(
      title: 'Brand pages studio',
      subtitle: 'Launch company & agency destinations with Explorer parity',
      actions: [
        IconButton(
          tooltip: 'Refresh page analytics',
          onPressed: state.loading ? null : controller.refresh,
          icon: state.loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            if (state.errorMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.errorMessage!,
                        style: theme.textTheme.bodyMedium?.copyWith(color: const Color(0xFFB91C1C)),
                      ),
                    ),
                  ],
                ),
              ),
            if (state.lastSynced != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  'Last synced ${formatRelativeTime(state.lastSynced!)}',
                  style:
                      theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Create a new page',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Blueprint-driven templates keep styling, accessibility, and publishing guardrails consistent.',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.auto_awesome, color: colorScheme.primary),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _MetricChip(label: 'Pages live', value: summary.pagesLive.toString()),
                      _MetricChip(label: 'Drafts in review', value: summary.draftsInReview.toString()),
                      _MetricChip(
                        label: 'Avg conversion',
                        value: '${summary.averageConversion.toStringAsFixed(1)}%',
                      ),
                      _MetricChip(label: 'Followers', value: summary.followerReach.toString()),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: state.saving
                        ? null
                        : () => _openCreatePageSheet(context, ref),
                    icon: state.saving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.add_circle_outline),
                    label: Text(state.saving ? 'Creating page…' : 'Create page'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Published pages', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (state.published.isEmpty)
                    _EmptyState(
                      icon: Icons.campaign_outlined,
                      message: 'No public pages yet. Publish a draft to activate Explorer distribution.',
                    )
                  else
                    ...state.published.map((page) => _PageTile(page: page, colorScheme: colorScheme)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Drafts & approvals', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (state.drafts.isEmpty)
                    _EmptyState(
                      icon: Icons.inventory_outlined,
                      message: 'Draft pages will appear here with reviewer assignments and due dates.',
                    )
                  else
                    ...state.drafts.map((page) => _PageTile(page: page, colorScheme: colorScheme)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Governance & security', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  _GovernanceList(colorScheme: colorScheme),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Explorer integration', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Pages automatically surface in Explorer with geo-personalised modules, conversion tracking, and mobile parity.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: const [
                      _ExplorerPill(icon: Icons.public, label: '28 regions localised'),
                      _ExplorerPill(icon: Icons.shield_outlined, label: 'SOC 2 aligned guardrails'),
                      _ExplorerPill(icon: Icons.speed, label: 'Real-time conversion analytics'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.primary,
              letterSpacing: 0.4,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PageTile extends StatelessWidget {
  const _PageTile({required this.page, required this.colorScheme});

  final PageProfile page;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.surfaceVariant.withOpacity(0.3)),
        color: colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      page.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      page.headline,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                    ),
                    if (page.audience.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: page.audience
                            .map((tag) => Chip(
                                  label: Text(tag),
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ))
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: page.isPublished
                          ? const Color(0xFFE0F2FE)
                          : const Color(0xFFF3E8FF),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      page.isPublished ? 'Published' : page.status.toUpperCase(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: page.isPublished ? const Color(0xFF0369A1) : const Color(0xFF6D28D9),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Updated ${formatRelativeTime(page.updatedAt)}',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _TileStat(icon: Icons.people_alt_outlined, label: 'Followers', value: page.followers.toString()),
              _TileStat(icon: Icons.auto_graph_outlined, label: 'Engagement', value: '${page.engagementScore}%'),
              _TileStat(
                icon: Icons.timeline_outlined,
                label: 'Conversion',
                value: '${(page.conversionRate * 100).toStringAsFixed(1)}%',
              ),
              if (page.admins.isNotEmpty)
                _TileStat(icon: Icons.verified_user_outlined, label: 'Admins', value: page.admins.join(', ')),
            ],
          ),
          if (page.nextEvent != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Next event ${formatAbsolute(page.nextEvent!)}',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
            ),
        ],
      ),
    );
  }
}

class _TileStat extends StatelessWidget {
  const _TileStat({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.primary),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.25),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _GovernanceList extends StatelessWidget {
  const _GovernanceList({required this.colorScheme});

  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final entries = [
      ('Brand guardrails', 'Pre-flight reviews enforce voice, imagery, and tone across all pages.'),
      ('Accessibility automation', 'WCAG 2.2 AA checks for contrast, keyboard nav, and semantic structure.'),
      ('Privacy controls', 'Visitor consent, cookie policies, and data retention mirrored from Trust Centre.'),
      ('Role-based access', 'Only company & agency admins can publish or manage page roles.'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: entries
          .map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(top: 6),
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(entry.$1, style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 4),
                        Text(
                          entry.$2,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ExplorerPill extends StatelessWidget {
  const _ExplorerPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.primary.withOpacity(0.08),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PageSummary {
  const _PageSummary({
    required this.pagesLive,
    required this.draftsInReview,
    required this.averageConversion,
    required this.followerReach,
  });

  factory _PageSummary.fromState(PageStudioState state) {
    final live = state.published.length;
    final drafts = state.drafts.length;
    final conversion = state.published.isEmpty
        ? 0
        : state.published.map((page) => page.conversionRate).reduce((value, element) => value + element) /
            state.published.length;
    final followers = state.published.fold<int>(0, (total, page) => total + page.followers);
    return _PageSummary(
      pagesLive: live,
      draftsInReview: drafts,
      averageConversion: conversion * 100,
      followerReach: followers,
    );
  }

  final int pagesLive;
  final int draftsInReview;
  final double averageConversion;
  final int followerReach;
}

Future<void> _openCreatePageSheet(BuildContext context, WidgetRef ref) async {
  final nameController = TextEditingController();
  final headlineController = TextEditingController();
  final audienceController = TextEditingController();
  var blueprint = 'Employer brand page';
  var visibility = 'review';
  final formKey = GlobalKey<FormState>();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) {
      return Consumer(
        builder: (context, sheetRef, _) {
          final sheetState = sheetRef.watch(pageStudioControllerProvider);
          return StatefulBuilder(
            builder: (context, setModalState) {
              return Padding(
                padding: EdgeInsets.only(
                  left: 24,
                  right: 24,
                  top: 24,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                ),
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Create page',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: nameController,
                        decoration: const InputDecoration(labelText: 'Page name'),
                        textInputAction: TextInputAction.next,
                        validator: (value) => value == null || value.isEmpty ? 'Enter a page name' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: headlineController,
                        decoration: const InputDecoration(labelText: 'Headline'),
                        textInputAction: TextInputAction.next,
                        validator: (value) => value == null || value.isEmpty ? 'Enter a headline' : null,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: blueprint,
                        decoration: const InputDecoration(labelText: 'Blueprint'),
                        items: const [
                          DropdownMenuItem(value: 'Employer brand page', child: Text('Employer brand page')),
                          DropdownMenuItem(value: 'Agency showcase page', child: Text('Agency showcase page')),
                          DropdownMenuItem(value: 'Community initiative page', child: Text('Community initiative page')),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setModalState(() => blueprint = value);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: visibility,
                        decoration: const InputDecoration(labelText: 'Visibility'),
                        items: const [
                          DropdownMenuItem(value: 'review', child: Text('Internal review')),
                          DropdownMenuItem(value: 'public', child: Text('Public (publish immediately)')),
                          DropdownMenuItem(value: 'draft', child: Text('Private draft')),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setModalState(() => visibility = value);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: audienceController,
                        decoration: const InputDecoration(
                          labelText: 'Audience tags',
                          helperText: 'Comma separated tags power Explorer targeting.',
                        ),
                      ),
                      const SizedBox(height: 20),
                      Align(
                        alignment: Alignment.centerRight,
                        child: FilledButton.icon(
                          onPressed: sheetState.saving
                              ? null
                              : () async {
                                  if (!formKey.currentState!.validate()) {
                                    return;
                                  }
                                  final draft = PageDraft(
                                    name: nameController.text.trim(),
                                    headline: headlineController.text.trim(),
                                    blueprint: blueprint,
                                    visibility: visibility,
                                    audience: audienceController.text
                                        .split(',')
                                        .map((entry) => entry.trim())
                                        .where((entry) => entry.isNotEmpty)
                                        .toList(),
                                  );
                                  final success = await sheetRef
                                      .read(pageStudioControllerProvider.notifier)
                                      .createPage(draft);
                                  if (success && context.mounted) {
                                    Navigator.of(context).pop();
                                    ScaffoldMessenger.of(sheetContext).showSnackBar(
                                      const SnackBar(content: Text('Page draft created successfully.')),
                                    );
                                  }
                                },
                          icon: sheetState.saving
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.check_circle_outline),
                          label: Text(sheetState.saving ? 'Creating…' : 'Save page'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      );
    },
  );

  nameController.dispose();
  headlineController.dispose();
  audienceController.dispose();
}
