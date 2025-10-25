import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../data/models/message_thread.dart';
import '../data/models/pending_message.dart';
import '../data/models/thread_message.dart';
import '../data/models/typing_participant.dart';

class MessagingState {
  MessagingState({
    ResourceState<List<MessageThread>>? inbox,
    ResourceState<List<ThreadMessage>>? conversation,
    this.selectedThreadId,
    this.actorId,
    this.composerText = '',
    this.sending = false,
    this.callLoading = false,
    this.composerError,
    this.callError,
    this.callSession,
    List<PendingMessage>? pendingMessages,
    List<TypingParticipant>? typingParticipants,
    Map<int, String>? drafts,
  })  : inbox = inbox ?? ResourceState<List<MessageThread>>.loading(const []),
        conversation = conversation ?? ResourceState<List<ThreadMessage>>(data: const [], loading: false),
        pendingMessages = pendingMessages ?? const <PendingMessage>[],
        typingParticipants = typingParticipants ?? const <TypingParticipant>[],
        drafts = drafts ?? const <int, String>{};

  final ResourceState<List<MessageThread>> inbox;
  final ResourceState<List<ThreadMessage>> conversation;
  final int? selectedThreadId;
  final int? actorId;
  final String composerText;
  final bool sending;
  final bool callLoading;
  final String? composerError;
  final String? callError;
  final CallSession? callSession;
  final List<PendingMessage> pendingMessages;
  final List<TypingParticipant> typingParticipants;
  final Map<int, String> drafts;

  List<MessageThread> get threads => inbox.data ?? const <MessageThread>[];
  List<ThreadMessage> get messages => conversation.data ?? const <ThreadMessage>[];
  bool get hasActiveCall => callSession != null;
  bool get hasComposerError => (composerError ?? '').isNotEmpty;

  MessagingState copyWith({
    ResourceState<List<MessageThread>>? inbox,
    ResourceState<List<ThreadMessage>>? conversation,
    int? selectedThreadId,
    bool resetSelectedThread = false,
    int? actorId,
    bool resetActor = false,
    String? composerText,
    bool? sending,
    bool? callLoading,
    String? composerError = _sentinelString,
    String? callError = _sentinelString,
    CallSession? callSession = _sentinelCallSession,
    List<PendingMessage>? pendingMessages,
    List<TypingParticipant>? typingParticipants,
    Map<int, String>? drafts,
  }) {
    return MessagingState(
      inbox: inbox ?? this.inbox,
      conversation: conversation ?? this.conversation,
      selectedThreadId: resetSelectedThread ? null : (selectedThreadId ?? this.selectedThreadId),
      actorId: resetActor ? null : (actorId ?? this.actorId),
      composerText: composerText ?? this.composerText,
      sending: sending ?? this.sending,
      callLoading: callLoading ?? this.callLoading,
      composerError: identical(composerError, _sentinelString) ? this.composerError : composerError,
      callError: identical(callError, _sentinelString) ? this.callError : callError,
      callSession: identical(callSession, _sentinelCallSession) ? this.callSession : callSession,
      pendingMessages: pendingMessages ?? this.pendingMessages,
      typingParticipants: typingParticipants ?? this.typingParticipants,
      drafts: drafts ?? this.drafts,
    );
  }

  static const _sentinelString = Object();
  static const _sentinelCallSession = Object();
}
