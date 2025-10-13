import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../application/project_auto_match_controller.dart';
import '../data/project_auto_match_repository.dart';

class ProjectAutoMatchScreen extends ConsumerWidget {
  const ProjectAutoMatchScreen({super.key, required this.projectId});

  final int? projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final isAuthenticated = sessionState.isAuthenticated;
    final canAdminister = session?.memberships.contains('company') == true ||
        session?.memberships.contains('agency') == true ||
        session?.memberships.contains('admin') == true;

    if (projectId == null || projectId! <= 0) {
      return GigvoraScaffold(
        title: 'Auto-match workspace',
        subtitle: 'Missing project context',
        body: Center(
          child: GigvoraCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('No project selected', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                const Text('Navigate from a project to manage auto-match queues.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => GoRouter.of(context).go('/projects'),
                  child: const Text('Browse projects'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final controllerProvider = projectAutoMatchControllerProvider(projectId!);
    final state = ref.watch(controllerProvider);
    final controller = ref.read(controllerProvider.notifier);
    final snapshot = state.snapshot;

    return GigvoraScaffold(
      title: snapshot?.project.title ?? 'Auto-match workspace',
      subtitle: 'Operations queue orchestration',
      actions: [
        IconButton(
          tooltip: 'Refresh',
          onPressed: () => controller.refresh(projectId!),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(projectId!),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            if (!isAuthenticated)
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Sign in required', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    const Text('Use an authenticated operations role to view and regenerate auto-match queues.'),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => GoRouter.of(context).go('/login'),
                      child: const Text('Sign in'),
                    ),
                  ],
                ),
              )
            else if (!canAdminister)
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Operations access only', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(
                      'Auto-match orchestration is limited to company, agency, or admin contexts. '
                      'Your active role is ${session!.roleLabel(session.activeMembership)}.',
                    ),
                  ],
                ),
              )
            else ...[
              if (state.error != null)
                GigvoraCard(
                  child: Text(
                    state.error!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
              if (state.feedback != null)
                GigvoraCard(
                  child: Text(
                    state.feedback!,
                    style: TextStyle(color: Theme.of(context).colorScheme.primary),
                  ),
                ),
              if (snapshot != null)
                GigvoraCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Project overview', style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Text(snapshot.project.description.isEmpty
                          ? 'We are syncing the latest description from the web workspace.'
                          : snapshot.project.description),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          _SummaryChip(label: 'Status', value: snapshot.project.status),
                          _SummaryChip(
                            label: 'Auto-assign',
                            value: snapshot.project.autoAssignStatus ?? 'Not generated',
                          ),
                          _SummaryChip(
                            label: 'Budget',
                            value: snapshot.project.budgetAmount != null
                                ? NumberFormat.simpleCurrency(
                                        name: snapshot.project.budgetCurrency ?? 'USD')
                                    .format(snapshot.project.budgetAmount)
                                : 'Not set',
                          ),
                          _SummaryChip(
                            label: 'Queue entries',
                            value: snapshot.entries.length.toString(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Last updated ${formatRelativeTime(snapshot.retrievedAt)}',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Regeneration controls', style: TextStyle(fontWeight: FontWeight.w600)),
                        FilledButton.icon(
                          onPressed: state.loading ? null : () => controller.regenerate(projectId!),
                          icon: state.loading
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.auto_mode),
                          label: Text(state.loading ? 'Regenerating…' : 'Regenerate queue'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _NumberField(
                      label: 'Queue size limit',
                      value: state.config.limit,
                      min: 1,
                      max: 50,
                      onChanged: (value) => controller.updateLimit(value ?? state.config.limit),
                    ),
                    const SizedBox(height: 12),
                    _NumberField(
                      label: 'Expires in minutes',
                      value: state.config.expiresInMinutes,
                      min: 30,
                      max: 1440,
                      onChanged: (value) => controller.updateExpires(value ?? state.config.expiresInMinutes),
                    ),
                    const SizedBox(height: 12),
                    _NumberField(
                      label: 'Project value (optional)',
                      value: state.config.projectValue?.round(),
                      min: 0,
                      max: 1000000,
                      allowNull: true,
                      onChanged: (value) => controller.updateProjectValue(value?.toDouble()),
                    ),
                    const SizedBox(height: 12),
                    _NumberField(
                      label: 'Fairness cap',
                      value: state.config.fairnessMaxAssignments,
                      min: 0,
                      max: 10,
                      onChanged: (value) => controller.updateFairnessCap(value ?? state.config.fairnessMaxAssignments),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile.adaptive(
                      value: state.config.ensureNewcomer,
                      onChanged: controller.toggleEnsureNewcomer,
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Ensure newcomer slot'),
                      subtitle: const Text('Reserve at least one rotation slot for newcomers each cycle.'),
                    ),
                    const Divider(height: 32),
                    const Text('Weight distribution', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    ...state.weights.entries.map((entry) {
                      final normalized = _normalizeWeights(state.weights)[entry.key] ?? 0;
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(entry.key.replaceAll(RegExp(r'([A-Z])'), ' $1'),
                                  style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text('${(normalized * 100).round()}%'),
                            ],
                          ),
                          Slider(
                            value: entry.value,
                            onChanged: (value) => controller.updateWeight(entry.key, value),
                            min: 0,
                            max: 40,
                            divisions: 40,
                          ),
                        ],
                      );
                    }).toList(),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Queue telemetry', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        _SummaryChip(label: 'Total', value: snapshot?.entries.length.toString() ?? '0'),
                        _SummaryChip(label: 'Notified', value: '${_statusCount(snapshot?.entries, 'notified')}'),
                        _SummaryChip(label: 'Pending', value: '${_statusCount(snapshot?.entries, 'pending')}'),
                        _SummaryChip(label: 'Completed', value: '${_statusCount(snapshot?.entries, 'completed')}'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (snapshot != null)
                ...snapshot.entries.map((entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GigvoraCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${entry.freelancer.firstName} ${entry.freelancer.lastName}'.trim(),
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                                Text(entry.status, style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Score ${(entry.score ?? 0).toStringAsFixed(2)} • Priority bucket ${entry.priorityBucket ?? 0}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                            if (entry.expiresAt != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  'Expires ${formatRelativeTime(entry.expiresAt!)}',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                                ),
                              ),
                          ],
                        ),
                      ),
                    )),
            ],
          ],
        ),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _NumberField extends StatelessWidget {
  const _NumberField({
    required this.label,
    required this.value,
    required this.onChanged,
    this.min,
    this.max,
    this.allowNull = false,
  });

  final String label;
  final int? value;
  final ValueChanged<int?> onChanged;
  final int? min;
  final int? max;
  final bool allowNull;

  @override
  Widget build(BuildContext context) {
    final controller = TextEditingController(text: value?.toString() ?? '');
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label),
      onSubmitted: (input) {
        if (input.isEmpty && allowNull) {
          onChanged(null);
          return;
        }
        final parsed = int.tryParse(input);
        if (parsed == null) return;
        if (min != null && parsed < min!) {
          onChanged(min);
          return;
        }
        if (max != null && parsed > max!) {
          onChanged(max);
          return;
        }
        onChanged(parsed);
      },
    );
  }
}

Map<String, double> _normalizeWeights(Map<String, double> weights) {
  final total = weights.values.fold<double>(0, (sum, value) => sum + value);
  if (total <= 0) {
    return weights.map((key, value) => MapEntry(key, 0));
  }
  return weights.map((key, value) => MapEntry(key, value / total));
}

int _statusCount(List<ProjectAutoMatchEntry>? entries, String status) {
  if (entries == null) return 0;
  return entries.where((entry) => entry.status == status).length;
}
