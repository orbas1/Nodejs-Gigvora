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
    final normalizedMemberships =
        (session?.memberships ?? const <String>[])
            .map((role) => role.toLowerCase())
            .toSet();
    final canAdminister =
        normalizedMemberships.intersection(_allowedMemberships).isNotEmpty;

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
    final theme = Theme.of(context);
    final entries = snapshot?.entries ?? const <ProjectAutoMatchEntry>[];

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
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            if (!isAuthenticated)
              _AccessCard(
                title: 'Sign in required',
                description:
                    'Use an authenticated operations role to view and regenerate auto-match queues.',
                actionLabel: 'Sign in',
                onPressed: () => GoRouter.of(context).go('/login'),
                tone: _AccessTone.sky,
              )
            else if (!canAdminister)
              _AccessCard(
                title: 'Operations access only',
                description:
                    'Auto-match orchestration is limited to company, agency, or admin contexts. '
                    'Switch your active membership from settings to continue.',
                actionLabel: 'Manage memberships',
                onPressed: () => GoRouter.of(context).go('/settings'),
                badge: session?.activeMembership != null
                    ? 'Active role: ${session!.roleLabel(session.activeMembership)}'
                    : null,
                tone: _AccessTone.amber,
              )
            else ...[
              if (state.loading && snapshot == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: CircularProgressIndicator()),
                ),
              if (state.error != null)
                GigvoraCard(
                  child: Text(
                    state.error!,
                    style: TextStyle(color: theme.colorScheme.error),
                  ),
                ),
              if (state.feedback != null)
                GigvoraCard(
                  child: Text(
                    state.feedback!,
                    style: TextStyle(color: theme.colorScheme.primary),
                  ),
                ),
              if (snapshot != null) ...[
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
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
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
                                Text(
                                  entry.key.replaceAll(RegExp(r'([A-Z])'), ' $1'),
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
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
                          _SummaryChip(label: 'Total', value: entries.length.toString()),
                          _SummaryChip(label: 'Notified', value: '${_statusCount(entries, 'notified')}'),
                          _SummaryChip(label: 'Pending', value: '${_statusCount(entries, 'pending')}'),
                          _SummaryChip(label: 'Completed', value: '${_statusCount(entries, 'completed')}'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (entries.isEmpty)
                  GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('No matches yet', style: TextStyle(fontWeight: FontWeight.w600)),
                        SizedBox(height: 8),
                        Text('Regenerate the queue to invite high-fit freelancers into the next rotation.'),
                      ],
                    ),
                  )
                else
                  ...[
                    for (var i = 0; i < entries.length; i++)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _QueueEntryCard(entry: entries[i], index: i),
                      ),
                  ],
              ],
            ],
          ],
        ),
      ),
    );
  }
}

const Set<String> _allowedMemberships = {'company', 'agency', 'admin'};

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

class _QueueEntryCard extends ConsumerWidget {
  const _QueueEntryCard({required this.entry, required this.index});

  final ProjectAutoMatchEntry entry;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final status = entry.status.toLowerCase();
    final preset = _statusPresets[status] ?? _statusPresets['default']!;
    final breakdown = _ensureMap(entry.breakdown);
    final fairness = _ensureMap(_ensureMap(entry.metadata)['fairness']);
    final position = entry.position ?? index + 1;

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
                      '${entry.freelancer.firstName} ${entry.freelancer.lastName}'.trim(),
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Score ${(entry.score ?? 0).toStringAsFixed(2)} • Priority bucket ${entry.priorityBucket ?? '—'}',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: preset.background,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: preset.border),
                ),
                child: Text(
                  preset.label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: preset.foreground,
                    letterSpacing: 0.6,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _InfoPill(label: 'Queue position', value: '#$position'),
              if (entry.expiresAt != null)
                _InfoPill(
                  label: 'Expires',
                  value: formatRelativeTime(entry.expiresAt!),
                ),
              _InfoPill(
                label: 'Latest completion',
                value: breakdown['lastCompletedDays'] is num
                    ? '${(breakdown['lastCompletedDays'] as num).round()} days'
                    : 'Awaiting first completion',
              ),
              _InfoPill(
                label: 'Fairness boost',
                value: fairness['ensureNewcomer'] == true || fairness['ensuredNewcomer'] == true
                    ? 'Reserved newcomer slot'
                    : 'Rotation',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoPill extends ConsumerWidget {
  const _InfoPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = ref.watch(designTokensProvider).maybeWhen(
          data: (value) => value,
          orElse: () => null,
        );
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: tokens?.spacing['md'] ?? 16,
        vertical: tokens?.spacing['sm'] ?? 10,
      ),
      decoration: BoxDecoration(
        color: scheme.surfaceVariant.withOpacity(0.35),
        borderRadius: BorderRadius.circular(tokens?.radius['xl'] ?? 999),
        border: Border.all(color: scheme.outlineVariant.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

enum _AccessTone { sky, amber }

class _AccessCard extends StatelessWidget {
  const _AccessCard({
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onPressed,
    this.tone = _AccessTone.sky,
    this.badge,
  });

  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onPressed;
  final _AccessTone tone;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final colors = tone == _AccessTone.amber
        ? _AccessCardColors(
            border: scheme.tertiaryContainer.withOpacity(0.6),
            background: scheme.tertiaryContainer.withOpacity(0.25),
            foreground: scheme.tertiary,
          )
        : _AccessCardColors(
            border: scheme.primaryContainer.withOpacity(0.6),
            background: scheme.primaryContainer.withOpacity(0.25),
            foreground: scheme.primary,
          );
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: colors.background,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: colors.border),
              ),
              child: Text(badge!, style: TextStyle(color: colors.foreground, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 12),
          ],
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(description, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 16),
          FilledButton(onPressed: onPressed, child: Text(actionLabel)),
        ],
      ),
    );
  }
}

class _AccessCardColors {
  const _AccessCardColors({required this.border, required this.background, required this.foreground});

  final Color border;
  final Color background;
  final Color foreground;
}

const Map<String, _StatusPreset> _statusPresets = <String, _StatusPreset>{
  'notified': _StatusPreset(
    label: 'Live invitation',
    background: Color(0xFFE3FCEF),
    border: Color(0xFFBBF7D0),
    foreground: Color(0xFF047857),
  ),
  'pending': _StatusPreset(
    label: 'Pending rotation',
    background: Color(0xFFF1F5F9),
    border: Color(0xFFE2E8F0),
    foreground: Color(0xFF1E293B),
  ),
  'completed': _StatusPreset(
    label: 'Completed rotation',
    background: Color(0xFFE0F2FE),
    border: Color(0xFFBFDBFE),
    foreground: Color(0xFF0369A1),
  ),
  'expired': _StatusPreset(
    label: 'Invitation expired',
    background: Color(0xFFFFF7ED),
    border: Color(0xFFFDE68A),
    foreground: Color(0xFFB45309),
  ),
  'dropped': _StatusPreset(
    label: 'Manually removed',
    background: Color(0xFFFEE2E2),
    border: Color(0xFFFECACA),
    foreground: Color(0xFFB91C1C),
  ),
  'default': _StatusPreset(
    label: 'Queued',
    background: Color(0xFFF8FAFC),
    border: Color(0xFFE2E8F0),
    foreground: Color(0xFF1E293B),
  ),
};

class _StatusPreset {
  const _StatusPreset({
    required this.label,
    required this.background,
    required this.border,
    required this.foreground,
  });

  final String label;
  final Color background;
  final Color border;
  final Color foreground;
}

Map<String, dynamic> _ensureMap(Map<String, dynamic>? value) => value ?? <String, dynamic>{};

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
