import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../theme/widgets.dart';
import '../application/project_workspace_controller.dart';
import '../data/models/project_gig_management_snapshot.dart';
import '../data/models/project_workspace_snapshot.dart';

class ProjectWorkspaceCard extends ConsumerStatefulWidget {
  const ProjectWorkspaceCard({
    super.key,
    required this.projects,
    required this.readOnly,
    this.accessMessage,
  });

  final List<ProjectGigRecord> projects;
  final bool readOnly;
  final String? accessMessage;

  @override
  ConsumerState<ProjectWorkspaceCard> createState() => _ProjectWorkspaceCardState();
}

class _ProjectWorkspaceCardState extends ConsumerState<ProjectWorkspaceCard> {
  late int _selectedProjectId;
  int? _acknowledgingConversationId;

  @override
  void initState() {
    super.initState();
    _selectedProjectId = widget.projects.isNotEmpty ? widget.projects.first.id : 0;
  }

  void _selectProject(int? value) {
    if (value == null || value == _selectedProjectId) {
      return;
    }
    setState(() => _selectedProjectId = value);
  }

  String _formatPercent(double? value) {
    if (value == null) return '—';
    final percent = value.clamp(0, 100);
    return '${percent.toStringAsFixed(0)}%';
  }

  String _formatScore(double? value) {
    if (value == null) return 'N/A';
    return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
  }

  String _formatBytes(double? value) {
    if (value == null || value <= 0) {
      return '0 B';
    }
    const units = <String>['B', 'KB', 'MB', 'GB', 'TB'];
    var size = value;
    var unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    final decimals = size >= 10 ? 0 : 1;
    return '${size.toStringAsFixed(decimals)} ${units[unitIndex]}';
  }

  String? _formatRelative(DateTime? value) {
    if (value == null) return null;
    final now = DateTime.now();
    final diff = now.difference(value);
    if (diff.inMinutes < 1) return 'moments ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr${diff.inHours == 1 ? '' : 's'} ago';
    return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
  }

  Future<void> _acknowledgeConversation(
    ProjectWorkspaceController controller,
    ProjectWorkspaceConversation conversation,
  ) async {
    if (widget.readOnly || conversation.id == 0) {
      return;
    }
    setState(() => _acknowledgingConversationId = conversation.id);
    try {
      await controller.acknowledgeConversation(conversation.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Conversation marked as read.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to update conversation: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _acknowledgingConversationId = null);
      }
    }
  }

  List<_RoleEntry> _buildRoleMatrix(ProjectWorkspaceSnapshot snapshot) {
    final entries = <_RoleEntry>[];
    final brief = snapshot.brief;
    if (brief != null && brief.clientStakeholders.isNotEmpty) {
      for (final stakeholder in brief.clientStakeholders) {
        entries.add(
          _RoleEntry(
            name: stakeholder,
            role: 'Client stakeholder',
            authority: 'Executive sponsor & escalation',
          ),
        );
      }
    }
    for (final approval in snapshot.approvals) {
      if (approval.ownerName == null) continue;
      entries.add(
        _RoleEntry(
          name: approval.ownerName!,
          role: '${approval.stage ?? 'workspace'} approval',
          authority: 'Controls ${approval.title}',
        ),
      );
    }
    for (final whiteboard in snapshot.whiteboards) {
      if (whiteboard.ownerName == null) continue;
      entries.add(
        _RoleEntry(
          name: whiteboard.ownerName!,
          role: 'Workspace collaborator',
          authority: 'Leads ${whiteboard.title}',
        ),
      );
    }
    for (final conversation in snapshot.conversations) {
      for (final participant in conversation.participants) {
        entries.add(
          _RoleEntry(
            name: participant,
            role: '${conversation.channelType ?? 'project'} channel',
            authority: '${conversation.priority?.replaceAll('_', ' ') ?? 'normal'} priority guardian',
          ),
        );
      }
    }
    entries.sort((a, b) => a.name.compareTo(b.name));
    return entries;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.projects.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final projectId = _selectedProjectId;
    final state = ref.watch(projectWorkspaceControllerProvider(projectId));
    final controller = ref.read(projectWorkspaceControllerProvider(projectId).notifier);
    final snapshot = state.data;

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Workspace command centre',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Chat, approvals, posts, and role governance synchronised for every project pod.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Refresh workspace',
                onPressed: state.loading ? null : controller.refresh,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<int>(
            value: projectId,
            decoration: const InputDecoration(labelText: 'Project workspace'),
            onChanged: widget.projects.length == 1 ? null : _selectProject,
            items: widget.projects
                .map(
                  (project) => DropdownMenuItem<int>(
                    value: project.id,
                    child: Text(project.title),
                  ),
                )
                .toList(growable: false),
          ),
          if (widget.readOnly)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                widget.accessMessage ??
                    'Workspace updates are read-only for your role. Contact your administrator for elevated access.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          const SizedBox(height: 16),
          if (state.loading && snapshot == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (state.error != null && snapshot == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'Unable to load workspace right now. ${state.error}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error),
              ),
            )
          else if (snapshot != null) ...[
            _WorkspaceHeadline(
              snapshot: snapshot,
              readOnly: widget.readOnly,
              formatPercent: _formatPercent,
              formatScore: _formatScore,
              formatBytes: _formatBytes,
            ),
            const SizedBox(height: 16),
            _MissionBriefSection(snapshot: snapshot),
            const SizedBox(height: 16),
            _RoleMatrixSection(entries: _buildRoleMatrix(snapshot)),
            const SizedBox(height: 16),
            _ConversationSection(
              snapshot: snapshot,
              acknowledgingConversationId: _acknowledgingConversationId,
              readOnly: widget.readOnly,
              formatRelative: _formatRelative,
              onAcknowledge: (conversation) => _acknowledgeConversation(controller, conversation),
            ),
            const SizedBox(height: 16),
            _ApprovalsSection(snapshot: snapshot, formatRelative: _formatRelative),
            const SizedBox(height: 16),
            _KnowledgeSection(snapshot: snapshot, formatRelative: _formatRelative),
            const SizedBox(height: 16),
            _AssetSection(snapshot: snapshot, formatBytes: _formatBytes, formatRelative: _formatRelative),
          ],
          if (state.loading && snapshot != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: const [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 8),
                  Text('Syncing workspace...'),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _WorkspaceHeadline extends StatelessWidget {
  const _WorkspaceHeadline({
    required this.snapshot,
    required this.readOnly,
    required this.formatPercent,
    required this.formatScore,
    required this.formatBytes,
  });

  final ProjectWorkspaceSnapshot snapshot;
  final bool readOnly;
  final String Function(double?) formatPercent;
  final String Function(double?) formatScore;
  final String Function(double?) formatBytes;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final metrics = snapshot.metrics;
    final workspace = snapshot.workspace;
    final chips = <_HeadlineChip>[
      _HeadlineChip(label: 'Progress', value: formatPercent(metrics.progressPercent)),
      _HeadlineChip(label: 'Health', value: formatScore(metrics.healthScore)),
      _HeadlineChip(label: 'Velocity', value: formatScore(metrics.velocityScore)),
      _HeadlineChip(label: 'Unread chat', value: '${metrics.unreadMessages}'),
      _HeadlineChip(label: 'Approvals', value: '${metrics.pendingApprovals}'),
      _HeadlineChip(label: 'Assets', value: formatBytes(metrics.totalAssetsSizeBytes)),
    ];

    return Column(
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
                    snapshot.projectTitle,
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    workspace.nextMilestone != null
                        ? 'Next milestone: ${workspace.nextMilestone} · ${DateFormat.MMMd().format(workspace.nextMilestoneDueAt ?? DateTime.now())}'
                        : 'Milestone schedule in flight',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: 100,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatPercent(workspace.progressPercent), style: theme.textTheme.titleMedium),
                  LinearProgressIndicator(
                    value: workspace.progressPercent.clamp(0, 100) / 100,
                    minHeight: 8,
                  ),
                  if (readOnly)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'Read only',
                        style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: chips
              .map((chip) => Chip(
                    label: Text('${chip.label}: ${chip.value}'),
                    backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                    labelStyle: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ))
              .toList(growable: false),
        ),
      ],
    );
  }
}

class _MissionBriefSection extends StatelessWidget {
  const _MissionBriefSection({required this.snapshot});

  final ProjectWorkspaceSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brief = snapshot.brief;
    if (brief == null) {
      return Text(
        'Workspace brief will initialise on first sync.',
        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Mission brief', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        if (brief.summary != null)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.4),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(brief.summary!, style: theme.textTheme.bodyMedium),
          ),
        const SizedBox(height: 12),
        _ListSection(title: 'Objectives', values: brief.objectives),
        const SizedBox(height: 8),
        _ListSection(title: 'Success metrics', values: brief.successMetrics),
        const SizedBox(height: 8),
        _ListSection(title: 'Deliverables', values: brief.deliverables),
        const SizedBox(height: 8),
        _ListSection(title: 'Stakeholders', values: brief.clientStakeholders),
      ],
    );
  }
}

class _RoleMatrixSection extends StatelessWidget {
  const _RoleMatrixSection({required this.entries});

  final List<_RoleEntry> entries;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (entries.isEmpty) {
      return Text(
        'Assign collaborators and approvers to unlock governance signals.',
        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Role authority matrix', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        ...entries.map(
          (entry) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.35),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.name, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(entry.role.toUpperCase(), style: theme.textTheme.labelSmall),
                const SizedBox(height: 4),
                Text(entry.authority, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ConversationSection extends StatelessWidget {
  const _ConversationSection({
    required this.snapshot,
    required this.acknowledgingConversationId,
    required this.readOnly,
    required this.formatRelative,
    required this.onAcknowledge,
  });

  final ProjectWorkspaceSnapshot snapshot;
  final int? acknowledgingConversationId;
  final bool readOnly;
  final String? Function(DateTime?) formatRelative;
  final void Function(ProjectWorkspaceConversation conversation) onAcknowledge;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final conversations = snapshot.conversations;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('In-project chat', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        if (conversations.isEmpty)
          Text(
            'No workspace conversations yet. Launch a standup thread to kickstart delivery rituals.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          )
        else
          ...conversations.map(
            (conversation) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(conversation.topic, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                              if (conversation.lastMessagePreview != null)
                                Text(
                                  conversation.lastMessagePreview!,
                                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            conversation.priority?.replaceAll('_', ' ') ?? 'normal',
                            style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Chip(
                          label: Text('${conversation.unreadCount} unread'),
                          backgroundColor: theme.colorScheme.secondaryContainer,
                        ),
                        Chip(
                          label: Text(conversation.channelType?.replaceAll('_', ' ') ?? 'project'),
                          backgroundColor: theme.colorScheme.surfaceVariant,
                        ),
                        if (conversation.lastMessageAt != null)
                          Chip(
                            label: Text('Updated ${formatRelative(conversation.lastMessageAt)}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: conversation.participants
                          .map(
                            (participant) => Chip(
                              label: Text(participant),
                              backgroundColor: theme.colorScheme.primary.withOpacity(0.08),
                            ),
                          )
                          .toList(growable: false),
                    ),
                    if (!readOnly)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: acknowledgingConversationId == conversation.id
                              ? null
                              : () => onAcknowledge(conversation),
                          icon: acknowledgingConversationId == conversation.id
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.check_circle_outline),
                          label: Text(
                            acknowledgingConversationId == conversation.id ? 'Marking…' : 'Mark read',
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ApprovalsSection extends StatelessWidget {
  const _ApprovalsSection({required this.snapshot, required this.formatRelative});

  final ProjectWorkspaceSnapshot snapshot;
  final String? Function(DateTime?) formatRelative;

  Color _statusColor(BuildContext context, String? status) {
    final theme = Theme.of(context);
    switch (status) {
      case 'approved':
        return theme.colorScheme.primary;
      case 'changes_requested':
        return theme.colorScheme.tertiary;
      case 'rejected':
        return theme.colorScheme.error;
      default:
        return theme.colorScheme.onSurfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final approvals = snapshot.approvals;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Approvals & governance', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        if (approvals.isEmpty)
          Text(
            'Approval workflows will populate once deliverables enter review.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          )
        else
          ...approvals.map(
            (approval) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(approval.title, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                              if (approval.stage != null)
                                Text(
                                  'Stage ${approval.stage}',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Chip(
                          label: Text(approval.status?.replaceAll('_', ' ') ?? 'pending'),
                          backgroundColor: _statusColor(context, approval.status).withOpacity(0.15),
                          labelStyle: theme.textTheme.labelSmall?.copyWith(
                            color: _statusColor(context, approval.status),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (approval.ownerName != null)
                          Chip(label: Text('Owner ${approval.ownerName}'), backgroundColor: theme.colorScheme.surfaceVariant),
                        if (approval.approverEmail != null)
                          Chip(
                            label: Text(approval.approverEmail!),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        if (approval.dueAt != null)
                          Chip(
                            label: Text('Due ${DateFormat.MMMd().format(approval.dueAt!)}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        if (approval.submittedAt != null)
                          Chip(
                            label: Text('Submitted ${formatRelative(approval.submittedAt)}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                      ],
                    ),
                    if (approval.decisionNotes != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          approval.decisionNotes!,
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _KnowledgeSection extends StatelessWidget {
  const _KnowledgeSection({required this.snapshot, required this.formatRelative});

  final ProjectWorkspaceSnapshot snapshot;
  final String? Function(DateTime?) formatRelative;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final whiteboards = snapshot.whiteboards;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Knowledge posts & rituals', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        if (whiteboards.isEmpty)
          Text(
            'Publish retros and knowledge artefacts to align every stakeholder.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          )
        else
          ...whiteboards.map(
            (board) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(board.title, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        Chip(
                          label: Text(board.status?.replaceAll('_', ' ') ?? 'draft'),
                          backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                        ),
                        if (board.ownerName != null)
                          Chip(
                            label: Text('Owner ${board.ownerName}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        if (board.lastEditedAt != null)
                          Chip(
                            label: Text('Updated ${formatRelative(board.lastEditedAt)}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                      ],
                    ),
                    if (board.tags.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: board.tags
                              .map(
                                (tag) => Chip(
                                  label: Text(tag),
                                  backgroundColor: theme.colorScheme.secondaryContainer,
                                ),
                              )
                              .toList(growable: false),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _AssetSection extends StatelessWidget {
  const _AssetSection({
    required this.snapshot,
    required this.formatBytes,
    required this.formatRelative,
  });

  final ProjectWorkspaceSnapshot snapshot;
  final String Function(double?) formatBytes;
  final String? Function(DateTime?) formatRelative;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final files = snapshot.files;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Secure assets & posts', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        if (files.isEmpty)
          Text(
            'Upload briefs, QA packs, and delivery assets to keep every pod member in lockstep.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          )
        else
          ...files.map(
            (file) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(file.name, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        if (file.category != null)
                          Chip(
                            label: Text(file.category!.replaceAll('_', ' ')),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        Chip(
                          label: Text(formatBytes(file.sizeBytes)),
                          backgroundColor: theme.colorScheme.primaryContainer,
                        ),
                        if (file.version != null)
                          Chip(
                            label: Text('v${file.version}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        if (file.permissions?.visibility != null)
                          Chip(
                            label: Text('Visibility ${file.permissions!.visibility}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                        if (file.uploadedAt != null)
                          Chip(
                            label: Text('Uploaded ${formatRelative(file.uploadedAt)}'),
                            backgroundColor: theme.colorScheme.surfaceVariant,
                          ),
                      ],
                    ),
                    if (file.permissions?.allowedRoles.isNotEmpty ?? false)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: file.permissions!.allowedRoles
                              .map(
                                (role) => Chip(
                                  label: Text(role.replaceAll('_', ' ')),
                                  backgroundColor: theme.colorScheme.secondaryContainer,
                                ),
                              )
                              .toList(growable: false),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ListSection extends StatelessWidget {
  const _ListSection({required this.title, required this.values});

  final String title;
  final List<String> values;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.labelLarge),
        const SizedBox(height: 4),
        if (values.isEmpty)
          Text(
            'No entries yet.',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          )
        else
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: values
                .map(
                  (value) => Chip(
                    label: Text(value),
                    backgroundColor: theme.colorScheme.secondaryContainer,
                  ),
                )
                .toList(growable: false),
          ),
      ],
    );
  }
}

class _HeadlineChip {
  const _HeadlineChip({required this.label, required this.value});

  final String label;
  final String value;
}

class _RoleEntry {
  const _RoleEntry({required this.name, required this.role, required this.authority});

  final String name;
  final String role;
  final String authority;
}
