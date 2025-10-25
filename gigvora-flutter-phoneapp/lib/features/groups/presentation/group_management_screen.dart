import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gigvora_mobile/router/app_routes.dart';

import '../../../theme/widgets.dart';
import '../../auth/application/session_controller.dart';
import '../../auth/domain/session.dart';
import '../application/group_management_controller.dart';
import '../data/models/group.dart';
import '../group_providers.dart';

class GroupManagementScreen extends ConsumerStatefulWidget {
  const GroupManagementScreen({super.key});

  @override
  ConsumerState<GroupManagementScreen> createState() => _GroupManagementScreenState();
}

class _GroupManagementScreenState extends ConsumerState<GroupManagementScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _memberPolicy = 'request';
  String _visibility = 'private';
  String _avatarColor = '#2563eb';
  late final ProviderSubscription<GroupManagementState> _subscription;
  ProviderSubscription<SessionState>? _sessionSubscription;
  final Map<int, _MemberDraft> _memberDrafts = <int, _MemberDraft>{};

  @override
  void initState() {
    super.initState();
    _subscription = ref.listen<GroupManagementState>(
      groupManagementControllerProvider,
      (previous, next) {
        final feedback = next.feedback;
        if (feedback != null && feedback != previous?.feedback && mounted) {
          final colorScheme = Theme.of(context).colorScheme;
          final backgroundColor = feedback.type == GroupFeedbackType.success
              ? colorScheme.secondaryContainer
              : colorScheme.errorContainer;
          final foregroundColor = feedback.type == GroupFeedbackType.success
              ? colorScheme.onSecondaryContainer
              : colorScheme.onErrorContainer;
          if (!mounted) {
            return;
          }
          final messenger = ScaffoldMessenger.of(context);
          messenger
            ..clearSnackBars()
            ..showSnackBar(
              SnackBar(
                content: Text(
                  feedback.message,
                  style: TextStyle(
                    color: foregroundColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                backgroundColor: backgroundColor,
                behavior: SnackBarBehavior.floating,
                duration: const Duration(seconds: 4),
                action: SnackBarAction(
                  label: 'Dismiss',
                  textColor: foregroundColor,
                  onPressed: () {},
                ),
              ),
            );
        }
      },
    );

    _sessionSubscription = ref.listen<SessionState>(
      sessionControllerProvider,
      (previous, next) {
        final wasAdmin = previous?.session?.memberships.contains('admin') ?? false;
        final isAdmin = next.session?.memberships.contains('admin') ?? false;
        final identityChanged = previous?.session?.email != next.session?.email;
        if (isAdmin && (!wasAdmin || identityChanged)) {
          _triggerInitialLoad(forceRefresh: true);
        }
      },
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _triggerInitialLoad();
    });
  }

  @override
  void dispose() {
    _subscription.close();
    _sessionSubscription?.close();
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _triggerInitialLoad({bool forceRefresh = false}) {
    final session = ref.read(sessionControllerProvider).session;
    final isAdmin = session?.memberships.contains('admin') ?? false;
    if (!isAdmin) {
      return;
    }
    ref.read(groupManagementControllerProvider.notifier).load(forceRefresh: forceRefresh);
  }

  bool _validateCreateForm() {
    if (_nameController.text.trim().isEmpty) {
      _showInlineError('Give your group a descriptive name before launching.');
      return false;
    }
    final sanitizedColour = _avatarColor.trim();
    if (!_isValidHexColour(sanitizedColour)) {
      _showInlineError('Use a valid 6-digit hex code for the accent colour.');
      return false;
    }
    return true;
  }

  void _showInlineError(String message) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    messenger
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: TextStyle(
              color: colorScheme.onErrorContainer,
              fontWeight: FontWeight.w600,
            ),
          ),
          backgroundColor: colorScheme.errorContainer,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: colorScheme.onErrorContainer,
            onPressed: () {},
          ),
        ),
      );
  }

  void _handleCreate() {
    if (!_validateCreateForm()) {
      return;
    }
    final controller = ref.read(groupManagementControllerProvider.notifier);
    controller.createGroup({
      'name': _nameController.text.trim(),
      'description': _descriptionController.text.trim(),
      'memberPolicy': _memberPolicy,
      'visibility': _visibility,
      'avatarColor': _avatarColor,
    });
    FocusScope.of(context).unfocus();
    _nameController.clear();
    _descriptionController.clear();
    setState(() {
      _memberPolicy = 'request';
      _visibility = 'private';
      _avatarColor = '#2563eb';
    });
  }

  void _handleInvite(int groupId) {
    final draft = _memberDrafts[groupId];
    if (draft == null || draft.userId.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Provide a user ID before inviting.')),
      );
      return;
    }
    final parsedUserId = int.tryParse(draft.userId);
    if (parsedUserId == null) {
      _showInlineError('User IDs must be numeric. Please double-check the value.');
      return;
    }
    final payload = {
      'userId': parsedUserId,
      'role': draft.role,
      'status': draft.status,
      'notes': draft.notes?.trim(),
    }..removeWhere((_, value) => value == null);
    ref.read(groupManagementControllerProvider.notifier).addMember(groupId, payload);
    setState(() {
      _memberDrafts[groupId] = const _MemberDraft();
    });
  }

  void _handleApprove(int groupId, int membershipId) {
    ref.read(groupManagementControllerProvider.notifier).approveMember(groupId, membershipId);
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    if (session == null) {
      return GigvoraScaffold(
        title: 'Admin access required',
        subtitle: 'Sign in with your administrator credentials to manage groups.',
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lock_outline, size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                'Sign in to unlock the group operations console.',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () =>
                    GoRouter.of(context).go(AppRoute.login.path),
                child: const Text('Sign in'),
              ),
            ],
          ),
        ),
      );
    }

    final isAdmin = session.memberships.contains('admin');
    if (!isAdmin) {
      return GigvoraScaffold(
        title: 'Restricted command centre',
        subtitle: 'Group orchestration is limited to workspace administrators.',
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.privacy_tip_outlined, size: 48, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: 16),
              Text(
                'Your current role does not grant access to group governance tools.',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Switch to an administrator account to continue or head back to your dashboard.',
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () =>
                    GoRouter.of(context).go(AppRoute.home.path),
                child: const Text('Return home'),
              ),
            ],
          ),
        ),
      );
    }

    final state = ref.watch(groupManagementControllerProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return GigvoraScaffold(
      title: 'Group operations command centre',
      subtitle: 'Curate every community with confidence',
      actions: [
        IconButton(
          tooltip: 'Refresh groups',
          onPressed: () => ref.read(groupManagementControllerProvider.notifier).load(forceRefresh: true),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 900;
          final baseWidth = isWide
              ? (constraints.maxWidth - 16) / 2
              : constraints.maxWidth;
          final double itemWidth = baseWidth.clamp(0.0, constraints.maxWidth);
          final cards = state.groups.map((group) {
            final draft = _memberDrafts[group.id] ?? const _MemberDraft();
            return SizedBox(
              width: itemWidth,
              child: _GroupCard(
                group: group,
                metrics: group.metrics,
                members: group.members,
                draft: draft,
                onDraftChanged: (updated) => setState(() => _memberDrafts[group.id] = updated),
                onInvite: () => _handleInvite(group.id),
                onApprove: (membershipId) => _handleApprove(group.id, membershipId),
              ),
            );
          }).toList();

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(groupManagementControllerProvider.notifier).load(forceRefresh: true);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _BuildCreateCard(
                    nameController: _nameController,
                    descriptionController: _descriptionController,
                    memberPolicy: _memberPolicy,
                    visibility: _visibility,
                    avatarColor: _avatarColor,
                    onPolicyChanged: (value) => setState(() => _memberPolicy = value),
                    onVisibilityChanged: (value) => setState(() => _visibility = value),
                    onColorChanged: (value) => setState(() => _avatarColor = value),
                    onCreatePressed: _handleCreate,
                  ),
                  const SizedBox(height: 24),
                  AnimatedOpacity(
                    opacity: state.loading ? 1 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: state.loading
                        ? const LinearProgressIndicator(minHeight: 4)
                        : const SizedBox.shrink(),
                  ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: colorScheme.errorContainer,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: colorScheme.onErrorContainer),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'We could not load the latest group data. Pull to refresh or try again shortly.',
                                style: TextStyle(
                                  color: colorScheme.onErrorContainer,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (cards.isEmpty && !state.loading)
                    const _EmptyState(),
                  if (cards.isNotEmpty)
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      children: cards,
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _BuildCreateCard extends StatelessWidget {
  const _BuildCreateCard({
    required this.nameController,
    required this.descriptionController,
    required this.memberPolicy,
    required this.visibility,
    required this.avatarColor,
    required this.onPolicyChanged,
    required this.onVisibilityChanged,
    required this.onColorChanged,
    required this.onCreatePressed,
  });

  final TextEditingController nameController;
  final TextEditingController descriptionController;
  final String memberPolicy;
  final String visibility;
  final String avatarColor;
  final ValueChanged<String> onPolicyChanged;
  final ValueChanged<String> onVisibilityChanged;
  final ValueChanged<String> onColorChanged;
  final VoidCallback onCreatePressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final previewColor = _safeColourFromHex(avatarColor, colorScheme.primary);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Launch a new group', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(
            controller: nameController,
            decoration: const InputDecoration(labelText: 'Group name'),
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: descriptionController,
            decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
            maxLines: 3,
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: visibility,
                  decoration: const InputDecoration(labelText: 'Visibility'),
                  items: const [
                    DropdownMenuItem(value: 'public', child: Text('Public')),
                    DropdownMenuItem(value: 'private', child: Text('Workspace only')),
                    DropdownMenuItem(value: 'secret', child: Text('Hidden')),
                  ],
                  onChanged: (value) => onVisibilityChanged(value ?? 'private'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: memberPolicy,
                  decoration: const InputDecoration(labelText: 'Membership policy'),
                  items: const [
                    DropdownMenuItem(value: 'open', child: Text('Open')),
                    DropdownMenuItem(value: 'request', child: Text('Request to join')),
                    DropdownMenuItem(value: 'invite', child: Text('Invite only')),
                  ],
                  onChanged: (value) => onPolicyChanged(value ?? 'request'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InputDecorator(
            decoration: const InputDecoration(labelText: 'Accent colour'),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    avatarColor.toUpperCase(),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 36,
                  height: 36,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: previewColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: colorScheme.outlineVariant),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () async {
                    final picked = await showDialog<String>(
                      context: context,
                      builder: (context) => _ColourPickerDialog(initial: avatarColor),
                    );
                    if (picked != null) {
                      onColorChanged(picked);
                    }
                  },
                  child: const Text('Pick'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.icon(
              onPressed: onCreatePressed,
              icon: const Icon(Icons.add),
              label: const Text('Create group'),
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupCard extends StatefulWidget {
  const _GroupCard({
    required this.group,
    required this.metrics,
    required this.members,
    required this.draft,
    required this.onDraftChanged,
    required this.onInvite,
    required this.onApprove,
  });

  final GroupSummary group;
  final GroupMetrics metrics;
  final List<GroupMember> members;
  final _MemberDraft draft;
  final ValueChanged<_MemberDraft> onDraftChanged;
  final VoidCallback onInvite;
  final ValueChanged<int> onApprove;

  @override
  State<_GroupCard> createState() => _GroupCardState();
}

class _GroupCardState extends State<_GroupCard> {
  late TextEditingController _userIdController;
  late TextEditingController _notesController;
  late _MemberDraft _currentDraft;

  @override
  void initState() {
    super.initState();
    _currentDraft = widget.draft;
    _userIdController = TextEditingController(text: widget.draft.userId)
      ..addListener(() {
        final value = _userIdController.text;
        if (value != _currentDraft.userId) {
          _updateDraft(_currentDraft.copyWith(userId: value));
        }
      });
    _notesController = TextEditingController(text: widget.draft.notes ?? '')
      ..addListener(() {
        final value = _notesController.text;
        if (value != (_currentDraft.notes ?? '')) {
          _updateDraft(_currentDraft.copyWith(notes: value));
        }
      });
  }

  @override
  void didUpdateWidget(covariant _GroupCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.draft != oldWidget.draft) {
      _syncFromDraft(widget.draft);
    }
  }

  void _syncFromDraft(_MemberDraft draft) {
    _currentDraft = draft;
    if (_userIdController.text != draft.userId) {
      _userIdController.text = draft.userId;
    }
    final draftNotes = draft.notes ?? '';
    if (_notesController.text != draftNotes) {
      _notesController.text = draftNotes;
    }
  }

  void _updateDraft(_MemberDraft draft) {
    if (_currentDraft == draft) {
      return;
    }
    _currentDraft = draft;
    widget.onDraftChanged(draft);
  }

  @override
  void dispose() {
    _userIdController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.group.name,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.group.description ?? 'No description provided.',
                      style: theme.textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Chip(
                label: Text(widget.group.memberPolicy),
                backgroundColor: theme.colorScheme.secondaryContainer,
                labelStyle: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSecondaryContainer,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _MetricPill(label: 'Active', value: widget.metrics.activeMembers.toString()),
              _MetricPill(label: 'Pending', value: widget.metrics.pendingMembers.toString()),
              _MetricPill(label: 'Acceptance', value: '${widget.metrics.acceptanceRate}%'),
            ],
          ),
          const SizedBox(height: 16),
          Text('Recent members', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          if (widget.members.isEmpty)
            Text('No memberships yet.', style: theme.textTheme.bodySmall)
          else
            ...widget.members.take(5).map(
              (member) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(member.profile?.name ?? 'User ${member.userId}'),
                subtitle: Text('${member.role} • ${member.status}'),
                trailing: member.status != 'active'
                    ? TextButton(
                        onPressed: () => widget.onApprove(member.id),
                        child: const Text('Approve'),
                      )
                    : null,
              ),
            ),
          const Divider(height: 32),
          Text('Add member by ID', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          TextField(
            controller: _userIdController,
            keyboardType: TextInputType.number,
            inputFormatters: const [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(labelText: 'User ID'),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _currentDraft.role,
            decoration: const InputDecoration(labelText: 'Role'),
            items: const [
              DropdownMenuItem(value: 'owner', child: Text('Owner')),
              DropdownMenuItem(value: 'moderator', child: Text('Moderator')),
              DropdownMenuItem(value: 'member', child: Text('Member')),
              DropdownMenuItem(value: 'observer', child: Text('Observer')),
            ],
            onChanged: (value) {
              if (value == null) return;
              _updateDraft(_currentDraft.copyWith(role: value));
            },
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _currentDraft.status,
            decoration: const InputDecoration(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: 'invited', child: Text('Invited')),
              DropdownMenuItem(value: 'pending', child: Text('Pending')),
              DropdownMenuItem(value: 'active', child: Text('Active')),
              DropdownMenuItem(value: 'suspended', child: Text('Suspended')),
            ],
            onChanged: (value) {
              if (value == null) return;
              _updateDraft(_currentDraft.copyWith(status: value));
            },
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(labelText: 'Notes (optional)'),
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton(
              onPressed: widget.onInvite,
              child: const Text('Invite member'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary)),
          Text(value, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ColourPickerDialog extends StatefulWidget {
  const _ColourPickerDialog({required this.initial});

  final String initial;

  @override
  State<_ColourPickerDialog> createState() => _ColourPickerDialogState();
}

class _ColourPickerDialogState extends State<_ColourPickerDialog> {
  late String _current;
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _current = widget.initial;
    _controller = TextEditingController(text: _current)
      ..addListener(() {
        setState(() {
          _current = _controller.text;
        });
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Pick accent colour'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 48,
            width: 48,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: _safeColourFromHex(_current, Theme.of(context).colorScheme.primary),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            decoration: const InputDecoration(labelText: 'Hex colour'),
            textCapitalization: TextCapitalization.characters,
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(
          onPressed: _isValidHexColour(_current)
              ? () => Navigator.of(context).pop(_formatHex(_current))
              : null,
          child: const Text('Select'),
        ),
      ],
    );
  }
}

class _MemberDraft {
  const _MemberDraft({
    this.userId = '',
    this.role = 'member',
    this.status = 'invited',
    this.notes,
  });

  final String userId;
  final String role;
  final String status;
  final String? notes;

  _MemberDraft copyWith({String? userId, String? role, String? status, String? notes}) {
    return _MemberDraft(
      userId: userId ?? this.userId,
      role: role ?? this.role,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is _MemberDraft &&
        other.userId == userId &&
        other.role == role &&
        other.status == status &&
        other.notes == notes;
  }

  @override
  int get hashCode => Object.hash(userId, role, status, notes);
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GigvoraCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colorScheme.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.groups_3, color: colorScheme.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No managed groups yet',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text(
                  'Create your first community or invite an existing admin to start orchestrating memberships.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

bool _isValidHexColour(String value) {
  final sanitized = value.trim().replaceAll('#', '');
  final regex = RegExp(r'^[0-9a-fA-F]{6}$');
  return regex.hasMatch(sanitized);
}

String _formatHex(String value) {
  final sanitized = value.trim().replaceAll('#', '');
  return '#${sanitized.toLowerCase()}';
}

Color _safeColourFromHex(String value, Color fallback) {
  if (!_isValidHexColour(value)) {
    return fallback;
  }
  final sanitized = value.replaceAll('#', '');
  final colorValue = int.parse('FF$sanitized', radix: 16);
  return Color(colorValue);
}
