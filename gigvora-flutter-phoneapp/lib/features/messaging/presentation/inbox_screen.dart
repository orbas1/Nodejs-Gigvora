import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../../theme/widgets.dart';
import '../application/messaging_controller.dart';
import '../application/messaging_state.dart';
import '../data/models/message_thread.dart';
import '../data/models/thread_message.dart';
import '../utils/messaging_formatters.dart';
import '../utils/messaging_access.dart';
import '../../auth/application/session_controller.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  late final TextEditingController _actorController;
  late final TextEditingController _composerController;

  @override
  void initState() {
    super.initState();
    final state = ref.read(messagingControllerProvider);
    _actorController = TextEditingController(text: state.actorId?.toString() ?? '');
    _composerController = TextEditingController(text: state.composerText);

    ref.listen<MessagingState>(messagingControllerProvider, (previous, next) {
      if (previous?.actorId != next.actorId) {
        final textValue = next.actorId?.toString() ?? '';
        if (_actorController.text != textValue) {
          _actorController.text = textValue;
        }
      }

      if (previous?.composerText != next.composerText && _composerController.text != next.composerText) {
        _composerController
          ..text = next.composerText
          ..selection = TextSelection.fromPosition(
            TextPosition(offset: _composerController.text.length),
          );
      }
    });
  }

  @override
  void dispose() {
    _actorController.dispose();
    _composerController.dispose();
    super.dispose();
  }

  void _applyActorId() {
    final raw = _actorController.text.trim();
    final parsed = int.tryParse(raw);
    ref.read(messagingControllerProvider.notifier).updateActorId(parsed);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messagingControllerProvider);
    final controller = ref.read(messagingControllerProvider.notifier);
    final tokens = ref.watch(designTokensProvider).maybeWhen(data: (value) => value, orElse: () => null);
    final sessionState = ref.watch(sessionControllerProvider);
    final session = sessionState.session;
    final isAuthenticated = sessionState.isAuthenticated;
    final hasMessagingAccess = canAccessMessaging(session);
    final membershipBadges = messagingMembershipLabels(session);
    final allowedRoleLabels = messagingAllowedRoleLabels(session);

    if (!isAuthenticated) {
      return GigvoraScaffold(
        title: 'Inbox',
        subtitle: 'Stay aligned with partners, teams, and clients in one secure channel.',
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: GigvoraCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sign in to access messaging', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Text('Secure messaging, call controls, and synced history unlock once you authenticate.', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      FilledButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Sign in'),
                      ),
                      OutlinedButton(
                        onPressed: () => context.go('/home'),
                        child: const Text('Return home'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (!hasMessagingAccess) {
      return GigvoraScaffold(
        title: 'Inbox',
        subtitle: 'Stay aligned with partners, teams, and clients in one secure channel.',
        body: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: GigvoraCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Inbox access pending', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  Text(
                    'Your current workspace membership doesn\'t include messaging. Ask an administrator to enable one of the roles below for secure conversations.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  if (allowedRoleLabels.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: allowedRoleLabels
                          .map(
                            (label) => Chip(
                              label: Text(label),
                              backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                            ),
                          )
                          .toList(),
                    ),
                  if (allowedRoleLabels.isNotEmpty) const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      FilledButton(
                        onPressed: () => context.go('/home'),
                        child: const Text('Return home'),
                      ),
                      OutlinedButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Email support@gigvora.com to enable messaging.'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        child: const Text('Contact support'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final threads = state.threads;
    final messages = state.messages;
    MessageThread? selectedThread;
    if (state.selectedThreadId != null) {
      for (final thread in threads) {
        if (thread.id == state.selectedThreadId) {
          selectedThread = thread;
          break;
        }
      }
    }
    selectedThread ??= threads.isNotEmpty ? threads.first : null;

    return GigvoraScaffold(
      title: 'Inbox',
      subtitle: 'Stay aligned with partners, teams, and clients in one secure channel.',
      actions: [
        IconButton(
          tooltip: 'Refresh inbox',
          onPressed: () => controller.loadInbox(forceRefresh: true),
          icon: state.inbox.loading
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.refresh),
        ),
      ],
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 720;
          final spacing = tokens?.spacing['lg']?.toDouble() ?? 20.0;

          final threadPanel = _ThreadPanel(
            state: state,
            threads: threads,
            onSelect: controller.selectThread,
            onRefresh: () => controller.loadInbox(forceRefresh: true),
            actorController: _actorController,
            onApplyActorId: _applyActorId,
            membershipBadges: membershipBadges,
          );

          final conversationPanel = _ConversationPanel(
            state: state,
            messages: messages,
            selectedThread: selectedThread,
            composerController: _composerController,
            onSend: () {
              controller.sendMessage();
            },
            onComposerChanged: controller.updateComposer,
            onRefresh: controller.refreshConversation,
            onStartVideo: () {
              controller.startCall('video');
            },
            onStartVoice: () {
              controller.startCall('voice');
            },
            onJoinCall: (metadata) {
              controller.startCall(metadata.type, callId: metadata.id);
            },
            onEndCall: controller.endActiveCall,
          );

          if (isWide) {
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Flexible(
                  flex: 2,
                  child: Padding(
                    padding: EdgeInsets.only(right: spacing),
                    child: threadPanel,
                  ),
                ),
                Flexible(
                  flex: 3,
                  child: conversationPanel,
                ),
              ],
            );
          }

          return Column(
            children: [
              Expanded(flex: 2, child: threadPanel),
              SizedBox(height: spacing),
              Expanded(flex: 3, child: conversationPanel),
            ],
          );
        },
      ),
    );
  }
}

class _ThreadPanel extends StatelessWidget {
  const _ThreadPanel({
    required this.state,
    required this.threads,
    required this.onSelect,
    required this.onRefresh,
    required this.actorController,
    required this.onApplyActorId,
    required this.membershipBadges,
  });

  final MessagingState state;
  final List<MessageThread> threads;
  final ValueChanged<int> onSelect;
  final Future<void> Function() onRefresh;
  final TextEditingController actorController;
  final VoidCallback onApplyActorId;
  final List<String> membershipBadges;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          if (membershipBadges.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: GigvoraCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Active messaging workspaces',
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: membershipBadges
                          .map(
                            (label) => Chip(
                              label: Text(label),
                              backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                              labelStyle: theme.textTheme.labelMedium?.copyWith(
                                    color: theme.colorScheme.primary,
                                  ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
          _ActorSelector(actorController: actorController, onApply: onApplyActorId),
          const SizedBox(height: 16),
          if (state.inbox.hasError)
            _StatusBanner(
              icon: Icons.error_outline,
              color: theme.colorScheme.error,
              background: theme.colorScheme.error.withOpacity(0.1),
              message: state.inbox.error.toString(),
            ),
          if (state.inbox.fromCache && !state.inbox.loading)
            _StatusBanner(
              icon: Icons.offline_bolt,
              color: theme.colorScheme.secondary,
              background: theme.colorScheme.secondary.withOpacity(0.1),
              message: 'Showing cached threads while we reconnect.',
            ),
          if (state.inbox.lastUpdated != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'Last synced ${formatRelativeTime(state.inbox.lastUpdated!)}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
          if (state.inbox.loading && threads.isEmpty)
            ...List.generate(4, (index) => _ThreadSkeleton(index: index)),
          if (!state.inbox.loading && threads.isEmpty)
            const _EmptyThreadsState(),
          if (threads.isNotEmpty)
            ...threads.map(
              (thread) => _ThreadCard(
                thread: thread,
                selected: state.selectedThreadId == thread.id,
                actorId: state.actorId,
                onTap: () => onSelect(thread.id),
              ),
            ),
        ],
      ),
    );
  }
}

class _ConversationPanel extends StatelessWidget {
  const _ConversationPanel({
    required this.state,
    required this.messages,
    required this.selectedThread,
    required this.composerController,
    required this.onSend,
    required this.onComposerChanged,
    required this.onRefresh,
    required this.onStartVideo,
    required this.onStartVoice,
    required this.onJoinCall,
    required this.onEndCall,
  });

  final MessagingState state;
  final List<ThreadMessage> messages;
  final MessageThread? selectedThread;
  final TextEditingController composerController;
  final VoidCallback onSend;
  final ValueChanged<String> onComposerChanged;
  final Future<void> Function() onRefresh;
  final VoidCallback onStartVideo;
  final VoidCallback onStartVoice;
  final void Function(CallMetadata metadata) onJoinCall;
  final VoidCallback onEndCall;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ConversationHeader(
            state: state,
            selectedThread: selectedThread,
            onStartVideo: onStartVideo,
            onStartVoice: onStartVoice,
          ),
          const SizedBox(height: 16),
          if (state.conversation.hasError && messages.isNotEmpty)
            _StatusBanner(
              icon: Icons.warning_amber_outlined,
              color: theme.colorScheme.error,
              background: theme.colorScheme.error.withOpacity(0.12),
              message: state.conversation.error.toString(),
            ),
          if (state.callError != null && state.callError!.isNotEmpty)
            _StatusBanner(
              icon: Icons.warning_amber_outlined,
              color: theme.colorScheme.error,
              background: theme.colorScheme.error.withOpacity(0.1),
              message: state.callError!,
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: onRefresh,
              child: Builder(
                builder: (context) {
                  if (state.conversation.loading && messages.isEmpty) {
                    return ListView.separated(
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: 4,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, __) => const _MessageSkeleton(),
                    );
                  }

                  if (messages.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        if (state.conversation.hasError)
                          _StatusBanner(
                            icon: Icons.error_outline,
                            color: theme.colorScheme.error,
                            background: theme.colorScheme.error.withOpacity(0.12),
                            message: state.conversation.error.toString(),
                          ),
                        const SizedBox(height: 80),
                        Center(
                          child: Text(
                            'No messages yet. Share updates, approvals, or files to get the conversation started.',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: messages.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      final isOwn = messageBelongsToUser(message, state.actorId);
                      if (isCallEvent(message)) {
                        final metadata = resolveCallMetadata(message);
                        if (metadata == null) {
                          return _SystemMessageBubble(
                            sender: formatMessageSender(message),
                            timestamp: formatMessageTimestamp(message),
                            body: message.body ?? 'Call update',
                          );
                        }
                        final active = isCallActive(metadata);
                        return _CallMessageCard(
                          message: message,
                          metadata: metadata,
                          isActive: active,
                          joining: state.callLoading,
                          activeCallId: state.callSession?.callId,
                          onJoin: active ? () => onJoinCall(metadata) : null,
                        );
                      }

                      return _MessageBubble(
                        message: message,
                        isOwn: isOwn,
                      );
                    },
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          _ComposerSection(
            controller: composerController,
            onChanged: onComposerChanged,
            onSend: onSend,
            enabled: state.selectedThreadId != null && !state.sending,
            sending: state.sending,
            errorText: state.composerError,
          ),
          if (state.callSession != null)
            _ActiveCallBanner(
              session: state.callSession!,
              onClose: onEndCall,
            ),
        ],
      ),
    );
  }
}

class _ActorSelector extends StatelessWidget {
  const _ActorSelector({required this.actorController, required this.onApply});

  final TextEditingController actorController;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GigvoraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Act as user', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('Enter a user ID to preview their synced inbox.', style: theme.textTheme.bodySmall),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: actorController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'User ID',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: onApply,
                child: const Text('Apply'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ThreadCard extends StatelessWidget {
  const _ThreadCard({
    required this.thread,
    required this.selected,
    required this.actorId,
    required this.onTap,
  });

  final MessageThread thread;
  final bool selected;
  final int? actorId;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final title = buildThreadTitle(thread, actorId: actorId);
    final participants = formatThreadParticipants(thread, actorId: actorId);
    final unread = isThreadUnread(thread);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: selected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outlineVariant.withOpacity(0.5),
            ),
            color: selected
                ? theme.colorScheme.primary.withOpacity(0.08)
                : theme.colorScheme.surface,
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    describeLastActivity(thread),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              if (participants.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    participants.join(', '),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              if (thread.lastMessagePreview != null && thread.lastMessagePreview!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    thread.lastMessagePreview!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
              if (unread)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      'Unread',
                      style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onPrimary),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConversationHeader extends StatelessWidget {
  const _ConversationHeader({
    required this.state,
    required this.selectedThread,
    required this.onStartVideo,
    required this.onStartVoice,
  });

  final MessagingState state;
  final MessageThread? selectedThread;
  final VoidCallback onStartVideo;
  final VoidCallback onStartVoice;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (selectedThread == null) {
      return Text(
        'Select a conversation to view history, launch calls, and collaborate.',
        style: theme.textTheme.bodyMedium,
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                buildThreadTitle(selectedThread, actorId: state.actorId),
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                formatThreadParticipants(selectedThread, actorId: state.actorId).join(', '),
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Wrap(
          spacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: state.actorId != null && !state.callLoading && state.callSession == null
                  ? onStartVoice
                  : null,
              icon: state.callLoading
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.phone_outlined, size: 16),
              label: const Text('Voice'),
            ),
            FilledButton.icon(
              onPressed: state.actorId != null && !state.callLoading && state.callSession == null
                  ? onStartVideo
                  : null,
              icon: state.callLoading
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.videocam_outlined, size: 16),
              label: const Text('Video'),
            ),
          ],
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.isOwn});

  final ThreadMessage message;
  final bool isOwn;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final background = isOwn ? theme.colorScheme.primary : theme.colorScheme.surfaceVariant;
    final foreground = isOwn ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface;

    return Column(
      crossAxisAlignment: isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          '${formatMessageSender(message)} • ${formatMessageTimestamp(message)}',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                offset: const Offset(0, 8),
                blurRadius: 16,
              ),
            ],
          ),
          child: Text(
            message.body?.isNotEmpty == true ? message.body! : 'No message body',
            style: theme.textTheme.bodyMedium?.copyWith(color: foreground),
          ),
        ),
      ],
    );
  }
}

class _SystemMessageBubble extends StatelessWidget {
  const _SystemMessageBubble({
    required this.sender,
    required this.timestamp,
    required this.body,
  });

  final String sender;
  final String timestamp;
  final String body;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$sender • $timestamp',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
          ),
          child: Text(body, style: theme.textTheme.bodyMedium),
        ),
      ],
    );
  }
}

class _CallMessageCard extends StatelessWidget {
  const _CallMessageCard({
    required this.message,
    required this.metadata,
    required this.isActive,
    required this.joining,
    required this.activeCallId,
    required this.onJoin,
  });

  final ThreadMessage message;
  final CallMetadata metadata;
  final bool isActive;
  final bool joining;
  final String? activeCallId;
  final VoidCallback? onJoin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = isActive ? Colors.green.shade600 : theme.colorScheme.onSurfaceVariant;
    final statusLabel = isActive ? 'Active' : 'Ended';
    final participants = metadata.participants
        .map((participant) => participant.userId == message.senderId ? 'You' : 'User ${participant.userId}')
        .join(', ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${formatMessageSender(message)} • ${formatMessageTimestamp(message)}',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.4)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                offset: const Offset(0, 10),
                blurRadius: 24,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      metadata.type == 'voice' ? 'Voice call' : 'Video call',
                      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    statusLabel,
                    style: theme.textTheme.labelMedium?.copyWith(color: statusColor),
                  ),
                ],
              ),
              if (participants.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Participants: $participants',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              if (metadata.expiresAt != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Expires ${formatRelativeTime(metadata.expiresAt!)}',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: ElevatedButton.icon(
                  onPressed: onJoin != null && !joining && (activeCallId == null || activeCallId == metadata.id) ? onJoin : null,
                  icon: joining
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.call),
                  label: Text(activeCallId == metadata.id ? 'Return to call' : 'Join call'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ComposerSection extends StatelessWidget {
  const _ComposerSection({
    required this.controller,
    required this.onChanged,
    required this.onSend,
    required this.enabled,
    required this.sending,
    this.errorText,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onSend;
  final bool enabled;
  final bool sending;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: controller,
          enabled: enabled,
          maxLines: 4,
          minLines: 3,
          onChanged: onChanged,
          decoration: InputDecoration(
            labelText: 'Write your reply…',
            errorText: errorText?.isNotEmpty == true ? errorText : null,
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            onPressed: enabled && controller.text.trim().isNotEmpty && !sending
                ? () {
                    onSend();
                  }
                : null,
            icon: sending
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            label: const Text('Send'),
          ),
        ),
      ],
    );
  }
}

class _ActiveCallBanner extends StatelessWidget {
  const _ActiveCallBanner({required this.session, required this.onClose});

  final CallSession session;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          const Icon(Icons.videocam_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Active call (${session.callType}) • Channel ${session.channelName}',
              style: theme.textTheme.bodyMedium,
            ),
          ),
          TextButton(
            onPressed: onClose,
            child: const Text('Dismiss'),
          ),
        ],
      ),
    );
  }
}

class _ThreadSkeleton extends StatelessWidget {
  const _ThreadSkeleton({required this.index});

  final int index;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        height: 84,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }
}

class _MessageSkeleton extends StatelessWidget {
  const _MessageSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.4),
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}

class _EmptyThreadsState extends StatelessWidget {
  const _EmptyThreadsState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 160,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: theme.colorScheme.outlineVariant.withOpacity(0.5), style: BorderStyle.solid),
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
      ),
      child: Center(
        child: Text(
          'No conversations yet. Launch a project or invite collaborators to start messaging.',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium,
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.icon,
    required this.color,
    required this.background,
    required this.message,
  });

  final IconData icon;
  final Color color;
  final Color background;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color),
            ),
          ),
        ],
      ),
    );
  }
}
