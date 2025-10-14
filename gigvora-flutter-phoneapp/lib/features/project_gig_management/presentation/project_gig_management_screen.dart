import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/authorization.dart';
import '../../../core/providers.dart';
import '../../../features/auth/application/session_controller.dart';
import '../../../theme/widgets.dart';
import '../application/project_gig_management_controller.dart';
import '../data/models/project_gig_management_snapshot.dart';
import '../../work_management/presentation/work_management_panel.dart';
import 'project_workspace_card.dart';

enum GigManagementSection { manage, buy, post }

const List<String> _projectManagementRoleLabels = <String>[
  'Agency lead',
  'Operations lead',
  'Company operator',
  'Workspace admin',
  'Platform admin',
];

GigManagementSection? sectionFromQuery(String? value) {
  switch (value?.toLowerCase()) {
    case 'manage':
      return GigManagementSection.manage;
    case 'buy':
      return GigManagementSection.buy;
    case 'post':
      return GigManagementSection.post;
    default:
      return null;
  }
}

const Map<String, String> _laneLabels = <String, String>{
  'Discovery': 'Discovery',
  'Delivery': 'Delivery',
  'QA & Enablement': 'QA & Enablement',
  'Change Management': 'Change Management',
  'Launch': 'Launch',
};

const Map<String, String> _statusLabels = <String, String>{
  'planned': 'Planned',
  'in_progress': 'In progress',
  'blocked': 'Blocked',
  'at_risk': 'At risk',
  'completed': 'Completed',
};

const Map<String, String> _riskLabels = <String, String>{
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
};

const Map<String, String> _ownerTypeLabels = <String, String>{
  'agency_member': 'Agency lead',
  'company_member': 'Internal stakeholder',
  'freelancer': 'Freelancer',
  'vendor': 'Vendor partner',
};

const List<String> _statusOrder = <String>['planned', 'in_progress', 'blocked', 'at_risk', 'completed'];

const Map<String, double> _statusProgressDefaults = <String, double>{
  'planned': 10,
  'in_progress': 35,
  'blocked': 35,
  'at_risk': 60,
  'completed': 100,
};

class ProjectGigManagementScreen extends ConsumerWidget {
  const ProjectGigManagementScreen({
    super.key,
    this.userId,
    this.initialSection,
  });

  final int? userId;
  final GigManagementSection? initialSection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final sessionState = ref.watch(sessionControllerProvider);
    final access = evaluateProjectAccess(sessionState.session);

    if (!access.allowed) {
      return GigvoraScaffold(
        title: 'Gig operations',
        subtitle: 'Operate your purchases, projects, and offers from mobile',
        body: _AccessDeniedCard(reason: access.reason),
      );
    }

    final resolvedUserId = userId ??
        int.tryParse('${config.featureFlags['demoUserId'] ?? config.featureFlags['demoUser'] ?? '1'}') ??
        1;
    final state =
        ref.watch(projectGigManagementControllerProvider(resolvedUserId));
    final controller =
        ref.read(projectGigManagementControllerProvider(resolvedUserId).notifier);
    final snapshot = state.data;

    return GigvoraScaffold(
      title: 'Gig operations',
      subtitle: 'Operate your purchases, projects, and offers from mobile',
      actions: [
        IconButton(
          onPressed: controller.refresh,
          icon: const Icon(Icons.refresh),
          tooltip: 'Refresh dashboard',
        ),
      ],
      body: RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            if (state.loading && snapshot == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.hasError && snapshot == null)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: GigvoraCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                          SizedBox(width: 8),
                          Text('Unable to load gig management data'),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Pull to refresh or tap the refresh icon to try again.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            if (snapshot != null) ...[
              _SummaryCard(snapshot: snapshot, lastUpdated: state.lastUpdated),
              const SizedBox(height: 16),
            _ProjectOperationsConsoleCard(
              snapshot: snapshot,
              controller: controller,
              loading: state.loading,
            ),
            const SizedBox(height: 16),
            ProjectWorkspaceCard(
              projects: snapshot.projects,
              readOnly: !snapshot.access.canManage,
              accessMessage: snapshot.access.reason,
            ),
            if (!snapshot.access.canManage)
              Padding(
                padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
                child: GigvoraCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Gig operations are read-only for your role.',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          snapshot.access.reason ??
                              'Only authorised operators can publish new projects or purchase gigs for this workspace.',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                        if (snapshot.access.allowedRoles.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Enabled for roles: ${snapshot.access.allowedRoles.map((role) => role.replaceAll('_', ' ')).join(', ')}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(letterSpacing: 0.4, fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              _ProjectFormSection(
                controller: controller,
                initiallyExpanded:
                    initialSection == GigManagementSection.manage,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              const SizedBox(height: 16),
              _GigOrderFormSection(
                controller: controller,
                initiallyExpanded: initialSection == GigManagementSection.buy,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              const SizedBox(height: 16),
              _GigBlueprintFormSection(
                controller: controller,
                initiallyExpanded: initialSection == GigManagementSection.post,
                canManage: snapshot.access.canManage,
                access: snapshot.access,
              ),
              ...(() {
                final projectOptions = snapshot.projects
                    .where((project) => project.id != null)
                    .map((project) => ProjectOption(id: project.id!, label: project.title))
                    .toList(growable: false);
                final initialWorkProjectId = projectOptions.isNotEmpty
                    ? projectOptions.first.id
                    : (snapshot.projects.isNotEmpty && snapshot.projects.first.id != null
                        ? snapshot.projects.first.id!
                        : 1);
                return [
                  const SizedBox(height: 16),
                  WorkManagementPanel(
                    initialProjectId: initialWorkProjectId,
                    projectOptions: projectOptions,
                    readOnly: !snapshot.access.canManage,
                    accessMessage: snapshot.access.canManage ? null : snapshot.access.reason,
                  ),
                ];
              }()),
              const SizedBox(height: 16),
              _OrdersCard(snapshot: snapshot),
              const SizedBox(height: 16),
              _RemindersCard(reminders: snapshot.reminders),
              const SizedBox(height: 16),
              _StoryCard(storytelling: snapshot.storytelling),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProjectOperationsConsoleCard extends StatefulWidget {
  const _ProjectOperationsConsoleCard({
    required this.snapshot,
    required this.controller,
    required this.loading,
  });

  final ProjectGigManagementSnapshot snapshot;
  final ProjectGigManagementController controller;
  final bool loading;

  @override
  State<_ProjectOperationsConsoleCard> createState() => _ProjectOperationsConsoleCardState();
}

class _ProjectOperationsConsoleCardState extends State<_ProjectOperationsConsoleCard> {
  String _laneFilter = 'all';
  String _statusFilter = 'all';
  String _riskFilter = 'all';
  String _query = '';
  bool _processing = false;
  String? _activeTaskId;
  String? _activeAction;

  List<ProjectTaskRecord> get _tasks => widget.snapshot.operations.tasks;

  bool get _canManage => widget.snapshot.access.canManage;

  void _showSnack(String message, {bool error = false}) {
    if (!mounted) return;
    final theme = Theme.of(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor:
            error ? theme.colorScheme.error.withOpacity(0.9) : theme.colorScheme.primary.withOpacity(0.85),
      ),
    );
  }

  List<ProjectTaskRecord> _filteredTasks() {
    final query = _query.trim().toLowerCase();
    return _tasks.where((task) {
      final laneMatches = _laneFilter == 'all' || task.lane == _laneFilter;
      final statusMatches = _statusFilter == 'all' || task.status == _statusFilter;
      final riskMatches = _riskFilter == 'all' || task.riskLevel == _riskFilter;
      final queryMatches = query.isEmpty ||
          <String?>[
            task.title,
            task.ownerName.isEmpty ? null : task.ownerName,
            task.notes.isEmpty ? null : task.notes,
            task.projectName,
          ].any((value) => value != null && value!.toLowerCase().contains(query));
      return laneMatches && statusMatches && riskMatches && queryMatches;
    }).toList(growable: false);
  }

  List<MapEntry<String, List<ProjectTaskRecord>>> _groupedTasks(List<ProjectTaskRecord> tasks) {
    final grouped = <String, List<ProjectTaskRecord>>{};
    for (final task in tasks) {
      final lane = task.lane.isEmpty ? 'Delivery' : task.lane;
      grouped.putIfAbsent(lane, () => <ProjectTaskRecord>[]).add(task);
    }
    final entries = grouped.entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    for (final entry in entries) {
      entry.value.sort((a, b) {
        final startA = a.startDate?.millisecondsSinceEpoch ?? 0;
        final startB = b.startDate?.millisecondsSinceEpoch ?? 0;
        if (startA != startB) return startA.compareTo(startB);
        final statusIndexA = _statusOrder.indexOf(a.status);
        final statusIndexB = _statusOrder.indexOf(b.status);
        return statusIndexA.compareTo(statusIndexB);
      });
    }
    return entries;
  }

  Color _statusChipColor(String status, ThemeData theme) {
    switch (status) {
      case 'in_progress':
        return const Color(0xFFD1FAE5);
      case 'blocked':
        return const Color(0xFFFDE68A);
      case 'at_risk':
        return const Color(0xFFFFEDD5);
      case 'completed':
        return theme.colorScheme.primary;
      default:
        return const Color(0xFFE2E8F0);
    }
  }

  Color _statusChipTextColor(String status, ThemeData theme) {
    if (status == 'completed') {
      return theme.colorScheme.onPrimary;
    }
    switch (status) {
      case 'in_progress':
        return const Color(0xFF047857);
      case 'blocked':
        return const Color(0xFF92400E);
      case 'at_risk':
        return const Color(0xFFC2410C);
      default:
        return const Color(0xFF475569);
    }
  }

  Color _riskChipColor(String risk) {
    switch (risk) {
      case 'medium':
        return const Color(0xFFFFF7ED);
      case 'high':
        return const Color(0xFFFFE4E6);
      case 'critical':
        return const Color(0xFFFECACA);
      default:
        return const Color(0xFFE7F5EC);
    }
  }

  Color _riskChipTextColor(String risk) {
    switch (risk) {
      case 'medium':
        return const Color(0xFF92400E);
      case 'high':
        return const Color(0xFFB91C1C);
      case 'critical':
        return const Color(0xFF991B1B);
      default:
        return const Color(0xFF047857);
    }
  }

  Future<void> _openCreateTask() async {
    if (!_canManage) {
      _showSnack('Task management is read-only for your role.', error: true);
      return;
    }
    final result = await showModalBottomSheet<_TaskFormResult>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _TaskFormSheet(projects: widget.snapshot.projects),
    );
    if (!mounted || result == null) return;
    if (result.draft == null) return;
    setState(() {
      _processing = true;
      _activeTaskId = null;
      _activeAction = 'create';
    });
    try {
      await widget.controller.createProjectTask(result.draft!);
      _showSnack('Task created for ${_laneLabels[result.draft!.lane] ?? result.draft!.lane}.');
    } catch (error) {
      _showSnack('Unable to create task: $error', error: true);
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
          _activeTaskId = null;
          _activeAction = null;
        });
      }
    }
  }

  Future<void> _openEditTask(ProjectTaskRecord task) async {
    final result = await showModalBottomSheet<_TaskFormResult>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _TaskFormSheet(projects: widget.snapshot.projects, task: task),
    );
    if (!mounted || result == null) return;
    if (result.delete) {
      await _deleteTask(task);
      return;
    }
    final mutation = result.mutation;
    if (mutation == null || mutation.toJson().isEmpty) {
      return;
    }
    setState(() {
      _processing = true;
      _activeTaskId = task.id;
      _activeAction = 'update';
    });
    try {
      await widget.controller.updateProjectTask(task, mutation);
      _showSnack('Task updated.');
    } catch (error) {
      _showSnack('Unable to update task: $error', error: true);
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
          _activeTaskId = null;
          _activeAction = null;
        });
      }
    }
  }

  Future<void> _advanceTask(ProjectTaskRecord task) async {
    final currentIndex = _statusOrder.indexOf(task.status);
    final nextIndex = currentIndex == -1 ? 1 : math.min(_statusOrder.length - 1, currentIndex + 1);
    if (currentIndex != -1 && currentIndex == nextIndex) {
      _showSnack('Task already completed.');
      return;
    }
    final nextStatus = _statusOrder[nextIndex];
    setState(() {
      _processing = true;
      _activeTaskId = task.id;
      _activeAction = 'advance';
    });
    final nextProgress = nextStatus == 'completed'
        ? 100
        : math.max(task.progressPercent, _statusProgressDefaults[nextStatus] ?? 35);
    try {
      await widget.controller.updateProjectTask(
        task,
        ProjectTaskMutation(
          status: nextStatus,
          progressPercent: nextProgress,
        ),
      );
      _showSnack('Task moved to ${_statusLabels[nextStatus] ?? nextStatus}.');
    } catch (error) {
      _showSnack('Unable to advance task: $error', error: true);
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
          _activeTaskId = null;
          _activeAction = null;
        });
      }
    }
  }

  Future<void> _deleteTask(ProjectTaskRecord task) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete task'),
        content: Text('Delete "${task.title}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) {
      return;
    }
    setState(() {
      _processing = true;
      _activeTaskId = task.id;
      _activeAction = 'delete';
    });
    try {
      await widget.controller.deleteProjectTask(task);
      _showSnack('Task deleted.');
    } catch (error) {
      _showSnack('Unable to delete task: $error', error: true);
    } finally {
      if (mounted) {
        setState(() {
          _processing = false;
          _activeTaskId = null;
          _activeAction = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final operations = widget.snapshot.operations;
    final metrics = operations.metrics;
    final filtered = _filteredTasks();
    final grouped = _groupedTasks(filtered);
    final totalTasks = metrics.total != 0 ? metrics.total : _tasks.length;
    final completedTasks = metrics.completed != 0 || metrics.total != 0
        ? metrics.completed
        : _tasks.where((task) => task.status == 'completed').length;
    final riskTasks = (metrics.blocked != 0 || metrics.atRisk != 0)
        ? metrics.blocked + metrics.atRisk
        : _tasks
            .where((task) =>
                task.status == 'blocked' || task.riskLevel == 'high' || task.riskLevel == 'critical')
            .length;

    return GigvoraCard(
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
                    Text('Project operations control tower', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Monitor delivery tasks, surface risks, and orchestrate cross-functional owners.',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    if (operations.allowedRoles.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Enabled for roles: ${operations.allowedRoles.map((role) => role.replaceAll('_', ' ')).join(', ')}',
                          style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    operations.lastSyncedAt != null
                        ? 'Last synced ${formatRelativeTime(operations.lastSyncedAt!)}'
                        : widget.loading
                            ? 'Syncing…'
                            : 'Awaiting sync',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 8),
                  FilledButton.tonal(
                    onPressed: _processing || !_canManage || widget.snapshot.projects.isEmpty ? null : _openCreateTask,
                    child: Text(_processing && _activeAction == 'create' ? 'Working…' : 'Add task'),
                  ),
                ],
              ),
            ],
          ),
          if (!_canManage)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                widget.snapshot.access.reason ??
                    'Project operations are read-only for this role on mobile. Contact your administrator for write access.',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
              ),
            ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(label: 'Tracked tasks', value: '$totalTasks'),
              _SummaryChip(label: 'Completed', value: '$completedTasks'),
              _SummaryChip(label: 'At risk & blocked', value: '$riskTasks'),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SizedBox(
                width: 200,
                child: TextField(
                  enabled: !_processing,
                  decoration: const InputDecoration(labelText: 'Search tasks'),
                  onChanged: (value) => setState(() => _query = value),
                ),
              ),
              DropdownButton<String>(
                value: _laneFilter,
                onChanged: _processing ? null : (value) => setState(() => _laneFilter = value ?? 'all'),
                items: <DropdownMenuItem<String>>[
                  const DropdownMenuItem<String>(value: 'all', child: Text('All lanes')),
                  ..._laneLabels.entries
                      .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value))),
                ],
              ),
              DropdownButton<String>(
                value: _statusFilter,
                onChanged: _processing ? null : (value) => setState(() => _statusFilter = value ?? 'all'),
                items: <DropdownMenuItem<String>>[
                  const DropdownMenuItem<String>(value: 'all', child: Text('All statuses')),
                  ..._statusLabels.entries
                      .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value))),
                ],
              ),
              DropdownButton<String>(
                value: _riskFilter,
                onChanged: _processing ? null : (value) => setState(() => _riskFilter = value ?? 'all'),
                items: <DropdownMenuItem<String>>[
                  const DropdownMenuItem<String>(value: 'all', child: Text('All risk levels')),
                  ..._riskLabels.entries
                      .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text('${entry.value} risk'))),
                ],
              ),
              TextButton(
                onPressed: _processing
                    ? null
                    : () => setState(() {
                          _laneFilter = 'all';
                          _statusFilter = 'all';
                          _riskFilter = 'all';
                          _query = '';
                        }),
                child: const Text('Reset'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (grouped.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: theme.colorScheme.outlineVariant),
                color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
              ),
              child: Text(
                _canManage
                    ? 'No project tasks captured yet. Use “Add task” to build your integrated delivery plan.'
                    : 'Project tasks will appear here once your operations team starts tracking them.',
                style: theme.textTheme.bodyMedium,
              ),
            )
          else
            Column(
              children: grouped
                  .map(
                    (entry) => Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: theme.colorScheme.outlineVariant),
                        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _laneLabels[entry.key] ?? entry.key,
                            style: theme.textTheme.titleSmall?.copyWith(letterSpacing: 0.4),
                          ),
                          const SizedBox(height: 12),
                          ...entry.value.map((task) => _buildTaskTile(context, task)).toList(growable: false),
                        ],
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }

  Widget _buildTaskTile(BuildContext context, ProjectTaskRecord task) {
    final theme = Theme.of(context);
    final statusLabel = _statusLabels[task.status] ?? task.status;
    final riskLabel = _riskLabels[task.riskLevel] ?? task.riskLevel;
    final isBusy = _processing && _activeTaskId == task.id;
    final progress = task.progressPercent.round();
    final schedule =
        '${task.startDate != null ? formatRelativeTime(task.startDate!) : 'TBC'} → ${task.endDate != null ? formatRelativeTime(task.endDate!) : 'TBC'}';
    final workload = task.workloadHours != null ? '${task.workloadHours!.toStringAsFixed(1)} hrs' : 'Workload TBC';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        color: theme.colorScheme.surface,
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
                    Text(task.title, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      '${task.ownerName.isNotEmpty ? task.ownerName : 'Unassigned'} • ${_ownerTypeLabels[task.ownerType] ?? task.ownerType}',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      task.projectName,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                enabled: _canManage && !_processing,
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      _openEditTask(task);
                      break;
                    case 'advance':
                      _advanceTask(task);
                      break;
                    case 'delete':
                      _deleteTask(task);
                      break;
                  }
                },
                itemBuilder: (context) => <PopupMenuEntry<String>>[
                  const PopupMenuItem<String>(value: 'edit', child: Text('Edit details')),
                  if (task.status != 'completed')
                    const PopupMenuItem<String>(value: 'advance', child: Text('Advance status')),
                  const PopupMenuItem<String>(value: 'delete', child: Text('Delete task')),
                ],
                icon: const Icon(Icons.more_vert),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Chip(
                backgroundColor: _statusChipColor(task.status, theme),
                labelStyle: theme.textTheme.labelSmall?.copyWith(
                  color: _statusChipTextColor(task.status, theme),
                  fontWeight: FontWeight.w600,
                ),
                label: Text(statusLabel),
              ),
              Chip(
                backgroundColor: _riskChipColor(task.riskLevel),
                labelStyle: theme.textTheme.labelSmall?.copyWith(
                  color: _riskChipTextColor(task.riskLevel),
                  fontWeight: FontWeight.w600,
                ),
                label: Text('$riskLabel risk'),
              ),
              Chip(
                backgroundColor: theme.colorScheme.surfaceVariant,
                labelStyle: theme.textTheme.labelSmall,
                label: Text('$progress% complete • $workload'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(schedule, style: theme.textTheme.bodySmall),
          if (task.updatedAt != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Updated ${formatRelativeTime(task.updatedAt!)}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          if (task.notes.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                task.notes,
                style: theme.textTheme.bodyMedium,
              ),
            ),
          if (isBusy)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: const [
                  SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 8),
                  Text('Syncing changes…'),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _TaskFormResult {
  const _TaskFormResult.create(this.draft)
      : mutation = null,
        delete = false;

  const _TaskFormResult.update(this.mutation)
      : draft = null,
        delete = false;

  const _TaskFormResult.delete()
      : draft = null,
        mutation = null,
        delete = true;

  final ProjectTaskDraft? draft;
  final ProjectTaskMutation? mutation;
  final bool delete;
}

class _TaskFormSheet extends StatefulWidget {
  const _TaskFormSheet({
    required this.projects,
    this.task,
  });

  final List<ProjectGigRecord> projects;
  final ProjectTaskRecord? task;

  bool get isEditing => task != null;

  @override
  State<_TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<_TaskFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _ownerController;
  late final TextEditingController _notesController;
  late final TextEditingController _startController;
  late final TextEditingController _endController;
  late final TextEditingController _progressController;
  late final TextEditingController _workloadController;
  int? _selectedProjectId;
  late String _lane;
  late String _status;
  late String _risk;
  late String _ownerType;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    final task = widget.task;
    _selectedProjectId = task?.projectId ?? (widget.projects.isNotEmpty ? widget.projects.first.id : null);
    _lane = task?.lane ?? _laneLabels.keys.first;
    _status = task?.status ?? 'planned';
    _risk = task?.riskLevel ?? 'low';
    _ownerType = task?.ownerType ?? 'agency_member';
    _startDate = task?.startDate;
    _endDate = task?.endDate;
    _titleController = TextEditingController(text: task?.title ?? '');
    _ownerController = TextEditingController(text: task?.ownerName ?? '');
    _notesController = TextEditingController(text: task?.notes ?? '');
    _startController = TextEditingController(text: _formatDate(_startDate));
    _endController = TextEditingController(text: _formatDate(_endDate));
    _progressController = TextEditingController(
      text: task != null ? task.progressPercent.toStringAsFixed(0) : '',
    );
    _workloadController = TextEditingController(
      text: task?.workloadHours != null ? task!.workloadHours!.toStringAsFixed(1) : '',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _ownerController.dispose();
    _notesController.dispose();
    _startController.dispose();
    _endController.dispose();
    _progressController.dispose();
    _workloadController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: 24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.isEditing ? 'Edit project task' : 'Create project task',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              if (!widget.isEditing)
                DropdownButtonFormField<int>(
                  value: _selectedProjectId,
                  decoration: const InputDecoration(labelText: 'Project workspace'),
                  items: widget.projects
                      .map((project) => DropdownMenuItem<int>(
                            value: project.id,
                            child: Text(project.title),
                          ))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => _selectedProjectId = value),
                  validator: (value) => value == null ? 'Select a project' : null,
                )
              else
                TextFormField(
                  readOnly: true,
                  initialValue: widget.task?.projectName,
                  decoration: const InputDecoration(labelText: 'Project workspace'),
                ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Task title'),
                validator: (value) => value == null || value.trim().isEmpty ? 'Enter the task title' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _ownerController,
                decoration: const InputDecoration(labelText: 'Owner (optional)'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _ownerType,
                decoration: const InputDecoration(labelText: 'Owner type'),
                items: _ownerTypeLabels.entries
                    .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value)))
                    .toList(growable: false),
                onChanged: (value) => setState(() => _ownerType = value ?? 'agency_member'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _lane,
                decoration: const InputDecoration(labelText: 'Workstream lane'),
                items: _laneLabels.entries
                    .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value)))
                    .toList(growable: false),
                onChanged: (value) => setState(() => _lane = value ?? _laneLabels.keys.first),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: _statusLabels.entries
                    .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value)))
                    .toList(growable: false),
                onChanged: (value) => setState(() => _status = value ?? 'planned'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _risk,
                decoration: const InputDecoration(labelText: 'Risk level'),
                items: _riskLabels.entries
                    .map((entry) => DropdownMenuItem<String>(value: entry.key, child: Text(entry.value)))
                    .toList(growable: false),
                onChanged: (value) => setState(() => _risk = value ?? 'low'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _startController,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: 'Start date',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.calendar_today),
                          onPressed: () => _pickDate(isStart: true),
                        ),
                      ),
                      validator: (_) => null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _endController,
                      readOnly: true,
                      decoration: InputDecoration(
                        labelText: 'End date',
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.calendar_today),
                          onPressed: () => _pickDate(isStart: false),
                        ),
                      ),
                      validator: (_) {
                        if (_startDate != null && _endDate != null && _endDate!.isBefore(_startDate!)) {
                          return 'Ends before start';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _progressController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Progress (%)'),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return null;
                  }
                  final parsed = double.tryParse(value);
                  if (parsed == null || parsed < 0 || parsed > 100) {
                    return 'Enter 0–100';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _workloadController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Workload (hours)'),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return null;
                  }
                  final parsed = double.tryParse(value);
                  if (parsed == null || parsed < 0) {
                    return 'Enter a positive number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Notes (optional)'),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  if (widget.isEditing)
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(const _TaskFormResult.delete()),
                      style: TextButton.styleFrom(foregroundColor: theme.colorScheme.error),
                      child: const Text('Delete task'),
                    ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: _handleSubmit,
                    child: Text(widget.isEditing ? 'Save changes' : 'Create task'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final initialDate = isStart ? (_startDate ?? now) : (_endDate ?? _startDate ?? now);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 5),
    );
    if (selected == null) {
      return;
    }
    setState(() {
      if (isStart) {
        _startDate = selected;
        _startController.text = _formatDate(selected);
      } else {
        _endDate = selected;
        _endController.text = _formatDate(selected);
      }
    });
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final title = _titleController.text.trim();
    final ownerName = _ownerController.text.trim();
    final notes = _notesController.text.trim();
    final progress = _progressController.text.trim().isEmpty
        ? null
        : double.tryParse(_progressController.text.trim())?.clamp(0, 100);
    final workload = _workloadController.text.trim().isEmpty
        ? null
        : double.tryParse(_workloadController.text.trim());

    if (!widget.isEditing) {
      final projectId = _selectedProjectId;
      if (projectId == null) {
        return;
      }
      final draft = ProjectTaskDraft(
        projectId: projectId,
        title: title,
        lane: _lane,
        status: _status,
        riskLevel: _risk,
        ownerName: ownerName.isEmpty ? null : ownerName,
        ownerType: _ownerType,
        startDate: _startDate,
        endDate: _endDate,
        progressPercent: progress,
        workloadHours: workload,
        notes: notes.isEmpty ? null : notes,
      );
      Navigator.of(context).pop(_TaskFormResult.create(draft));
      return;
    }

    final task = widget.task!;
    bool sameDay(DateTime? a, DateTime? b) {
      if (a == null && b == null) return true;
      if (a == null || b == null) return false;
      return a.year == b.year && a.month == b.month && a.day == b.day;
    }

    final mutation = ProjectTaskMutation(
      title: title != task.title ? title : null,
      lane: _lane != task.lane ? _lane : null,
      status: _status != task.status ? _status : null,
      riskLevel: _risk != task.riskLevel ? _risk : null,
      ownerName: ownerName != task.ownerName ? (ownerName.isEmpty ? '' : ownerName) : null,
      ownerType: _ownerType != task.ownerType ? _ownerType : null,
      startDate: !sameDay(_startDate, task.startDate) ? _startDate : null,
      endDate: !sameDay(_endDate, task.endDate) ? _endDate : null,
      progressPercent: progress != null && progress != task.progressPercent ? progress : null,
      workloadHours: workload != null && workload != task.workloadHours ? workload : null,
      notes: notes != task.notes ? notes : null,
    );

    Navigator.of(context).pop(_TaskFormResult.update(mutation));
  }

  String _formatDate(DateTime? value) {
    if (value == null) {
      return '';
    }
    return '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.snapshot,
    required this.lastUpdated,
  });

  final ProjectGigManagementSnapshot snapshot;
  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    final summary = snapshot.summary;
    final assetSummary = snapshot.assetSummary;
    final vendorStats = snapshot.vendorStats;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Operational snapshot',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Monitor progress across projects, assets, and purchased gigs.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
          if (lastUpdated != null) ...[
            const SizedBox(height: 6),
            Text(
              'Last updated ${formatRelativeTime(lastUpdated!)}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(label: 'Total projects', value: '${summary.totalProjects}'),
              _SummaryChip(label: 'Active projects', value: '${summary.activeProjects}'),
              _SummaryChip(label: 'Budget in play', value: _formatCurrency(summary.budgetInPlay)),
              _SummaryChip(label: 'Gigs in delivery', value: '${summary.gigsInDelivery}'),
              _SummaryChip(label: 'Assets secured', value: '${summary.assetsSecured}'),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(
                label: 'Asset library',
                value: '${assetSummary.total} files (${_formatFileSize(assetSummary.storageBytes)})',
              ),
              _SummaryChip(
                label: 'Restricted assets',
                value: '${assetSummary.restricted}',
              ),
              _SummaryChip(
                label: 'Vendor CSAT',
                value: _formatScore(vendorStats.averageScores.overall),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AccessDeniedCard extends StatelessWidget {
  const _AccessDeniedCard({
    this.reason,
  });

  final String? reason;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        GigvoraCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.secondaryContainer.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(Icons.lock_outline, color: theme.colorScheme.onSecondaryContainer),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Workspace access required',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          reason ??
                              'Project operations are restricted to agency, company, operations, and admin leads. Request access from your workspace administrator to continue.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _projectManagementRoleLabels
                    .map(
                      (label) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondaryContainer.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: theme.colorScheme.secondaryContainer),
                        ),
                        child: Text(
                          label,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onSecondaryContainer,
                            letterSpacing: 0.4,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.mail_outline, size: 18),
                    SizedBox(width: 8),
                    SelectableText('operations@gigvora.com'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
class _ProjectFormSection extends StatefulWidget {
  const _ProjectFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_ProjectFormSection> createState() => _ProjectFormSectionState();
}

class _ProjectFormSectionState extends State<_ProjectFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _budgetController;
  late final TextEditingController _dueDateController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _budgetController = TextEditingController();
    _dueDateController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('projectForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Post a project workspace'),
        subtitle: const Text('Create a managed initiative with default rituals'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!widget.canManage)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      widget.access.reason ??
                          'Only workspace operators can publish gig offers from mobile.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                AbsorbPointer(
                  absorbing: !widget.canManage,
                  child: Opacity(
                    opacity: widget.canManage ? 1 : 0.65,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                  TextFormField(
                    controller: _titleController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Project title'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Enter a project title';
                      }
                      if (value.trim().length < 3) {
                        return 'Use at least three characters.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description'),
                    minLines: 3,
                    maxLines: 5,
                    enabled: widget.canManage && !_submitting,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Describe the project';
                      }
                      if (value.trim().length < 24) {
                        return 'Add more context so collaborators have a clear brief.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _budgetController,
                          decoration: const InputDecoration(
                            labelText: 'Budget amount (optional)',
                          ),
                          keyboardType: TextInputType.number,
                          enabled: widget.canManage && !_submitting,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return null;
                            }
                            final parsed = double.tryParse(value.replaceAll(',', ''));
                            if (parsed == null) {
                              return 'Enter a valid amount';
                            }
                            if (parsed < 0) {
                              return 'Amount cannot be negative';
                            }
                            if (parsed > 1000000000) {
                              return 'Amount exceeds the governance threshold';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _currency,
                          decoration: const InputDecoration(labelText: 'Currency'),
                          items: const [
                            DropdownMenuItem(value: 'USD', child: Text('USD')),
                            DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                            DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                          ],
                          onChanged: widget.canManage && !_submitting
                              ? (value) {
                                  if (value != null) {
                                    setState(() {
                                      _currency = value;
                                    });
                                  }
                                }
                              : null,
                          disabledHint: Text(_currency),
                          isDense: true,
                          menuMaxHeight: 240,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dueDateController,
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Target completion (optional)',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calendar_today),
                        tooltip: 'Select date',
                        onPressed:
                            widget.canManage && !_submitting ? () => _pickDate(context) : null,
                      ),
                    ),
                    onTap: widget.canManage && !_submitting ? () => _pickDate(context) : null,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return null;
                      }
                      final dueDate = _parseDate(value);
                      if (dueDate == null) {
                        return 'Select a valid date';
                      }
                      final today = DateTime.now();
                      final startOfToday = DateTime(today.year, today.month, today.day);
                      if (dueDate.isBefore(startOfToday)) {
                        return 'Choose a future date';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton(
                      onPressed: _submitting || !widget.canManage ? null : _handleSubmit,
                      child: Text(
                        _submitting ? 'Creating workspace...' : 'Create project workspace',
                      ),
                    ),
                  ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final now = DateTime.now();
    final initialDate = _parseDate(_dueDateController.text) ?? now;
    final firstDate = DateTime(now.year, now.month, now.day);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: now.add(const Duration(days: 365 * 3)),
    );
    if (selected != null) {
      _dueDateController.text = _formatDate(selected);
    }
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project creation is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final budgetValue = double.tryParse(_budgetController.text.trim().replaceAll(',', '')) ?? 0;
      final dueDate = _parseDate(_dueDateController.text.trim());
      final draft = ProjectDraft(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        budgetCurrency: _currency,
        budgetAllocated: budgetValue,
        dueDate: dueDate,
      );
      await widget.controller.createProject(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project workspace created.')),
      );
      _formKey.currentState!.reset();
      _titleController.clear();
      _descriptionController.clear();
      _budgetController.clear();
      _dueDateController.clear();
      setState(() {
        _currency = 'USD';
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to create workspace: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _GigOrderFormSection extends StatefulWidget {
  const _GigOrderFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_GigOrderFormSection> createState() => _GigOrderFormSectionState();
}

class _GigOrderFormSectionState extends State<_GigOrderFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _vendorController;
  late final TextEditingController _serviceController;
  late final TextEditingController _amountController;
  late final TextEditingController _dueDateController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _vendorController = TextEditingController();
    _serviceController = TextEditingController();
    _amountController = TextEditingController();
    _dueDateController = TextEditingController();
  }

  @override
  void dispose() {
    _vendorController.dispose();
    _serviceController.dispose();
    _amountController.dispose();
    _dueDateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('gigOrderForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Buy a gig'),
        subtitle: const Text('Capture vendor engagements and delivery timelines'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!widget.canManage)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        widget.access.reason ??
                            'Escrow-backed gig purchases are disabled for your current role.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Theme.of(context).colorScheme.error),
                      ),
                    ),
                  TextFormField(
                    controller: _vendorController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Vendor name'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Enter the vendor name'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _serviceController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Service name'),
                    enabled: widget.canManage && !_submitting,
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Describe the service'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _amountController,
                          decoration: const InputDecoration(labelText: 'Budget amount'),
                          keyboardType: TextInputType.number,
                          enabled: widget.canManage && !_submitting,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Enter a budget amount';
                            }
                            return double.tryParse(value.replaceAll(',', '')) == null
                                ? 'Invalid amount'
                                : null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _currency,
                          decoration: const InputDecoration(labelText: 'Currency'),
                          items: const [
                            DropdownMenuItem(value: 'USD', child: Text('USD')),
                            DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                            DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                          ],
                          onChanged: widget.canManage && !_submitting
                              ? (value) {
                                  if (value != null) {
                                    setState(() {
                                      _currency = value;
                                    });
                                  }
                                }
                              : null,
                          disabledHint: Text(_currency),
                          isDense: true,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dueDateController,
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Delivery due date (optional)',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.calendar_today),
                        tooltip: 'Select date',
                        onPressed:
                            widget.canManage && !_submitting ? () => _pickDate(context) : null,
                      ),
                    ),
                    onTap: widget.canManage && !_submitting ? () => _pickDate(context) : null,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return null;
                      }
                      final dueDate = _parseDate(value);
                      if (dueDate == null) {
                        return 'Select a valid date';
                      }
                      final today = DateTime.now();
                      final startOfToday = DateTime(today.year, today.month, today.day);
                      if (dueDate.isBefore(startOfToday)) {
                        return 'Choose a future date';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: FilledButton.tonal(
                      onPressed: _submitting || !widget.canManage ? null : _handleSubmit,
                      child: Text(
                        _submitting ? 'Saving gig...' : 'Add gig engagement',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final now = DateTime.now();
    final initialDate = _parseDate(_dueDateController.text) ?? now;
    final firstDate = DateTime(now.year, now.month, now.day);
    final selected = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: now.add(const Duration(days: 365 * 2)),
    );
    if (selected != null) {
      _dueDateController.text = _formatDate(selected);
    }
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig purchasing is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final amount = double.parse(_amountController.text.trim().replaceAll(',', ''));
      if (amount < 0) {
        throw ArgumentError('Amount cannot be negative.');
      }
      final dueDate = _parseDate(_dueDateController.text.trim());
      final draft = GigOrderDraft(
        vendorName: _vendorController.text.trim(),
        serviceName: _serviceController.text.trim(),
        amount: amount,
        currency: _currency,
        dueAt: dueDate,
      );
      await widget.controller.createGigOrder(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig engagement saved.')),
      );
      _formKey.currentState!.reset();
      _vendorController.clear();
      _serviceController.clear();
      _amountController.clear();
      _dueDateController.clear();
      setState(() {
        _currency = 'USD';
      });
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to save gig: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _GigBlueprintFormSection extends StatefulWidget {
  const _GigBlueprintFormSection({
    required this.controller,
    this.initiallyExpanded = false,
    required this.canManage,
    required this.access,
  });

  final ProjectGigManagementController controller;
  final bool initiallyExpanded;
  final bool canManage;
  final ProjectGigAccess access;

  @override
  State<_GigBlueprintFormSection> createState() => _GigBlueprintFormSectionState();
}

class _GigBlueprintFormSectionState extends State<_GigBlueprintFormSection> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _taglineController;
  late final TextEditingController _categoryController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _packageNameController;
  late final TextEditingController _priceController;
  late final TextEditingController _deliveryDaysController;
  late final TextEditingController _revisionLimitController;
  late final TextEditingController _leadTimeController;
  late final TextEditingController _timezoneController;
  late final TextEditingController _packageDescriptionController;
  late final TextEditingController _highlightsController;
  String _currency = 'USD';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _taglineController = TextEditingController();
    _categoryController = TextEditingController();
    _descriptionController = TextEditingController();
    _packageNameController = TextEditingController(text: 'Signature package');
    _priceController = TextEditingController(text: '2500');
    _deliveryDaysController = TextEditingController(text: '14');
    _revisionLimitController = TextEditingController(text: '2');
    _leadTimeController = TextEditingController(text: '5');
    _timezoneController = TextEditingController(text: 'UTC');
    _packageDescriptionController = TextEditingController();
    _highlightsController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _taglineController.dispose();
    _categoryController.dispose();
    _descriptionController.dispose();
    _packageNameController.dispose();
    _priceController.dispose();
    _deliveryDaysController.dispose();
    _revisionLimitController.dispose();
    _leadTimeController.dispose();
    _timezoneController.dispose();
    _packageDescriptionController.dispose();
    _highlightsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: ExpansionTile(
        key: const PageStorageKey('gigBlueprintForm'),
        initiallyExpanded: widget.initiallyExpanded,
        title: const Text('Post a gig offer'),
        subtitle: const Text('Design a packaged service with pricing and availability'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!widget.canManage)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      widget.access.reason ??
                          'Only workspace operators can publish gig offers from mobile.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                AbsorbPointer(
                  absorbing: !widget.canManage,
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: widget.canManage ? 1 : 0.65,
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _titleController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Gig title'),
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Enter a gig title'
                                : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _taglineController,
                            textInputAction: TextInputAction.next,
                            decoration:
                                const InputDecoration(labelText: 'Tagline (optional)'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _categoryController,
                            textInputAction: TextInputAction.next,
                            decoration:
                                const InputDecoration(labelText: 'Category (optional)'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _descriptionController,
                            decoration: const InputDecoration(labelText: 'Description'),
                            minLines: 4,
                            maxLines: 6,
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Describe the gig'
                                : null,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Pricing package',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _packageNameController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Package name'),
                            validator: (value) => value == null || value.trim().isEmpty
                                ? 'Name the package'
                                : null,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _priceController,
                                  decoration: const InputDecoration(labelText: 'Price'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Enter a price';
                                    }
                                    return double.tryParse(value.replaceAll(',', '')) == null
                                        ? 'Invalid price'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _currency,
                                  decoration:
                                      const InputDecoration(labelText: 'Currency'),
                                  items: const [
                                    DropdownMenuItem(value: 'USD', child: Text('USD')),
                                    DropdownMenuItem(value: 'GBP', child: Text('GBP')),
                                    DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                                  ],
                                  onChanged: widget.canManage
                                      ? (value) {
                                          if (value != null) {
                                            setState(() {
                                              _currency = value;
                                            });
                                          }
                                        }
                                      : null,
                                  disabledHint: Text(_currency),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _deliveryDaysController,
                                  decoration:
                                      const InputDecoration(labelText: 'Delivery days'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _revisionLimitController,
                                  decoration:
                                      const InputDecoration(labelText: 'Revision limit'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _packageDescriptionController,
                            decoration: const InputDecoration(
                                labelText: 'Package description (optional)'),
                            minLines: 2,
                            maxLines: 4,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _highlightsController,
                            decoration: const InputDecoration(
                                labelText: 'Highlights (one per line)'),
                            minLines: 2,
                            maxLines: 4,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Availability',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _leadTimeController,
                                  decoration:
                                      const InputDecoration(labelText: 'Lead time days'),
                                  keyboardType: TextInputType.number,
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Required';
                                    }
                                    return int.tryParse(value) == null
                                        ? 'Invalid number'
                                        : null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _timezoneController,
                                  decoration:
                                      const InputDecoration(labelText: 'Timezone'),
                                  textInputAction: TextInputAction.done,
                                  validator: (value) =>
                                      value == null || value.trim().isEmpty
                                          ? 'Enter a timezone'
                                          : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: FilledButton(
                              onPressed:
                                  _submitting || !widget.canManage ? null : _handleSubmit,
                              child: Text(
                                _submitting ? 'Publishing gig...' : 'Create gig blueprint',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!widget.canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig blueprint publishing is restricted for your role.')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    FocusScope.of(context).unfocus();
    try {
      final price = double.parse(_priceController.text.trim().replaceAll(',', ''));
      final deliveryDays = int.parse(_deliveryDaysController.text.trim());
      final revisionLimit = int.parse(_revisionLimitController.text.trim());
      final leadTimeDays = int.parse(_leadTimeController.text.trim());
      final rawHighlights = _highlightsController.text.trim();
      final lines = rawHighlights.isEmpty
          ? const <String>[]
          : rawHighlights
              .split(String.fromCharCode(10))
              .map((line) => line.replaceAll(String.fromCharCode(13), '').trim())
              .where((line) => line.isNotEmpty)
              .toList();
      final draft = GigBlueprintDraft(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        packageName: _packageNameController.text.trim(),
        packagePrice: price,
        currency: _currency,
        deliveryDays: deliveryDays,
        revisionLimit: revisionLimit,
        leadTimeDays: leadTimeDays,
        timezone: _timezoneController.text.trim(),
        tagline: _taglineController.text.trim().isEmpty
            ? null
            : _taglineController.text.trim(),
        category: _categoryController.text.trim().isEmpty
            ? null
            : _categoryController.text.trim(),
        packageDescription: _packageDescriptionController.text.trim().isEmpty
            ? null
            : _packageDescriptionController.text.trim(),
        highlights: lines.isEmpty ? null : lines,
      );
      await widget.controller.createGigBlueprint(draft);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gig blueprint saved.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to publish gig: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }
}
class _OrdersCard extends StatelessWidget {
  const _OrdersCard({required this.snapshot});

  final ProjectGigManagementSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final orders = snapshot.orders;
    final stats = snapshot.vendorStats;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Purchased gigs', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _SummaryChip(label: 'Total orders', value: '${stats.totalOrders}'),
              _SummaryChip(label: 'Active orders', value: '${stats.active}'),
              _SummaryChip(label: 'Completed orders', value: '${stats.completed}'),
              _SummaryChip(label: 'Avg CSAT', value: _formatScore(stats.averageScores.overall)),
            ],
          ),
          const SizedBox(height: 16),
          if (orders.isEmpty)
            Text(
              'No vendor engagements logged yet. Add your first gig order to track delivery.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else
            Column(
              children: orders
                  .take(5)
                  .map(
                    (order) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _OrderTile(order: order),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order});

  final GigOrderInfo order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(order.serviceName, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(
            order.vendorName,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 8),
          Text(
            'Status: ${order.status}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Budget ${_formatCurrency(order.amount, currency: order.currency)} · Progress ${_formatPercent(order.progressPercent)}',
            style: theme.textTheme.bodySmall,
          ),
          if (order.dueAt != null) ...[
            const SizedBox(height: 4),
            Text(
              'Due ${formatRelativeTime(order.dueAt!)}',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

class _RemindersCard extends StatelessWidget {
  const _RemindersCard({required this.reminders});

  final List<GigReminder> reminders;

  @override
  Widget build(BuildContext context) {
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Delivery reminders', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (reminders.isEmpty)
            Text(
              'You are fully up to date — new requirements will appear here as they activate.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else
            Column(
              children: reminders
                  .map(
                    (reminder) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ReminderTile(reminder: reminder),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

class _ReminderTile extends StatelessWidget {
  const _ReminderTile({required this.reminder});

  final GigReminder reminder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subtitle = reminder.orderNumber ?? 'Order ${reminder.orderId ?? ''}'.trim();
    final dueLabel = reminder.dueAt == null
        ? 'No due date'
        : reminder.overdue
            ? 'Overdue since ${formatRelativeTime(reminder.dueAt!)}'
            : 'Due ${formatRelativeTime(reminder.dueAt!)}';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: reminder.overdue
            ? const Color(0xFFFEE2E2)
            : theme.colorScheme.surfaceVariant.withOpacity(0.3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(reminder.title, style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(subtitle, style: theme.textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(dueLabel, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _StoryCard extends StatelessWidget {
  const _StoryCard({required this.storytelling});

  final StorytellingSnapshot storytelling;

  @override
  Widget build(BuildContext context) {
    final achievements = storytelling.achievements.take(4).toList();
    final prompts = storytelling.prompts.take(3).toList();

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Storytelling highlights', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          if (achievements.isEmpty)
            Text(
              'Ship new projects or gigs to unlock automatic storytelling prompts.',
              style: Theme.of(context).textTheme.bodyMedium,
            )
          else ...[
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: achievements
                  .map(
                    (achievement) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text('• ${achievement.bullet}'),
                    ),
                  )
                  .toList(),
            ),
            if (prompts.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Prompts to explore', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 4),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: prompts
                    .map(
                      (prompt) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(prompt),
                      ),
                    )
                    .toList(),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
String _formatCurrency(double value, {String currency = 'USD'}) {
  final absolute = value.abs();
  String formatted;
  if (absolute >= 1000000000) {
    formatted = '${(value / 1000000000).toStringAsFixed(1)}B';
  } else if (absolute >= 1000000) {
    formatted = '${(value / 1000000).toStringAsFixed(1)}M';
  } else if (absolute >= 1000) {
    formatted = '${(value / 1000).toStringAsFixed(1)}K';
  } else {
    formatted = value.toStringAsFixed(0);
  }
  return '$currency $formatted';
}

String _formatPercent(double value) {
  return '${value.round()}%';
}

String _formatScore(double? value) {
  if (value == null) {
    return 'N/A';
  }
  return value.toStringAsFixed(1);
}

String _formatFileSize(double bytes) {
  if (bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return '${bytes.toStringAsFixed(0)} B';
  }
  if (bytes < 1024 * 1024) {
    return '${(bytes / 1024).toStringAsFixed(1)} KB';
  }
  if (bytes < 1024 * 1024 * 1024) {
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
  return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
}

String _formatDate(DateTime date) {
  final year = date.year.toString().padLeft(4, '0');
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$year-$month-$day';
}

DateTime? _parseDate(String? input) {
  if (input == null || input.trim().isEmpty) {
    return null;
  }
  final parsed = DateTime.tryParse(input.trim());
  return parsed;
}
