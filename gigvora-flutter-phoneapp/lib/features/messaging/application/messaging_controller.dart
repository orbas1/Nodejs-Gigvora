import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';
import 'package:uuid/uuid.dart';

import '../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../data/messaging_repository.dart';
import '../data/models/message_thread.dart';
import '../data/models/pending_message.dart';
import '../data/models/thread_message.dart';
import '../data/models/typing_participant.dart';
import '../utils/messaging_formatters.dart';
import '../utils/messaging_access.dart';
import 'messaging_state.dart';

class MessagingController extends StateNotifier<MessagingState> {
  MessagingController(
    this._repository,
    this._analytics,
    this._realtimeGateway, {
    required int? actorId,
  }) : super(MessagingState(actorId: actorId)) {
    _initialise();
  }

  final MessagingRepository _repository;
  final AnalyticsService _analytics;
  final RealtimeGateway _realtimeGateway;
  final Uuid _uuid = const Uuid();

  bool _initialised = false;
  bool _syncingPending = false;
  StreamSubscription<RealtimeMessage>? _typingSubscription;
  final Map<int, Timer> _typingExpiryTimers = <int, Timer>{};
  Timer? _typingActivityTimer;
  bool _typingActive = false;

  Future<void> _initialise() async {
    if (_initialised) {
      return;
    }
    _initialised = true;
    await loadInbox();
  }

  Future<void> loadInbox({bool forceRefresh = false}) async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      state = state.copyWith(
        inbox: ResourceState<List<MessageThread>>(
          data: const <MessageThread>[],
          loading: false,
          error: StateError('A valid user ID is required to load the inbox.'),
        ),
        conversation: ResourceState<List<ThreadMessage>>(data: const <ThreadMessage>[], loading: false),
        resetSelectedThread: true,
        composerError: null,
        callError: null,
      );
      return;
    }

    final currentInbox = state.inbox;
    state = state.copyWith(
      inbox: currentInbox.copyWith(loading: true, error: null),
    );

    try {
      final result = await _repository.fetchInbox(actorId: actorId, forceRefresh: forceRefresh);
      var threads = result.data;
      threads = threads.sortedByLastActivity();
      final metadata = {
        ...currentInbox.metadata,
        'lastUpdated': DateTime.now().toIso8601String(),
      };

      final inboxState = ResourceState<List<MessageThread>>(
        data: threads,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated ?? DateTime.now(),
        metadata: metadata,
      );

      int? selectedThreadId = state.selectedThreadId;
      if (threads.isEmpty) {
        selectedThreadId = null;
        state = state.copyWith(
          inbox: inboxState,
          conversation: ResourceState<List<ThreadMessage>>(data: const <ThreadMessage>[], loading: false),
          selectedThreadId: selectedThreadId,
        );
        return;
      }

      if (selectedThreadId == null || !threads.any((thread) => thread.id == selectedThreadId)) {
        selectedThreadId = threads.first.id;
      }

      state = state.copyWith(
        inbox: inboxState,
        selectedThreadId: selectedThreadId,
      );

      if (selectedThreadId != null) {
        await loadMessages(selectedThreadId);
      }
    } catch (error) {
      state = state.copyWith(
        inbox: currentInbox.copyWith(loading: false, error: error),
      );
    }
  }

  Future<void> loadMessages(int threadId, {bool forceRefresh = false}) async {
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      return;
    }

    final previousThreadId = state.selectedThreadId;
    final currentConversation = state.conversation;
    if (previousThreadId != threadId) {
      _clearTypingIndicators();
    }

    state = state.copyWith(
      conversation: currentConversation.copyWith(loading: true, error: null),
      selectedThreadId: threadId,
      composerError: null,
      callError: null,
    );

    try {
      final result = await _repository.fetchThreadMessages(threadId, forceRefresh: forceRefresh);
      if (!mounted) {
        return;
      }

      final messages = sortMessagesByTimestamp(result.data);
      final now = DateTime.now();
      final updatedThreads = state.threads
          .map(
            (thread) => thread.id == threadId
                ? thread.copyWith(
                    unreadCount: 0,
                    viewerState: ThreadViewerState(lastReadAt: now),
                  )
                : thread,
          )
          .toList(growable: false);
      final conversationState = ResourceState<List<ThreadMessage>>(
        data: messages,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated ?? DateTime.now(),
      );

      final pending = await _repository.loadPendingMessages(threadId);
      final draft = await _repository.readDraft(threadId) ?? '';
      if (!mounted) {
        return;
      }

      final drafts = {...state.drafts};
      drafts[threadId] = draft;

      var composerText = state.composerText;
      if (previousThreadId != threadId) {
        composerText = draft;
      }

      state = state.copyWith(
        conversation: conversationState,
        selectedThreadId: threadId,
        inbox: state.inbox.copyWith(data: updatedThreads),
        pendingMessages: pending,
        drafts: drafts,
        composerText: composerText,
      );

      _subscribeToTyping(threadId);
      unawaited(_repository.markThreadRead(threadId, userId: actorId));

      if (!result.fromCache) {
        unawaited(_flushPendingMessages(threadId));
      }
    } catch (error) {
      state = state.copyWith(
        conversation: currentConversation.copyWith(loading: false, error: error, data: const <ThreadMessage>[]),
      );
    }
  }

  void updateComposer(String value) {
    state = state.copyWith(composerText: value, composerError: null);
    final threadId = state.selectedThreadId;
    if (threadId != null) {
      final drafts = {...state.drafts};
      drafts[threadId] = value;
      state = state.copyWith(drafts: drafts);
      unawaited(_repository.persistDraft(threadId, value));
    }
    _triggerTypingActivity(value);
  }

  Future<void> sendMessage() async {
    final actorId = state.actorId;
    final threadId = state.selectedThreadId;
    final body = state.composerText.trim();
    if (actorId == null || actorId <= 0 || threadId == null || body.isEmpty) {
      if (body.isEmpty) {
        state = state.copyWith(composerError: 'Enter a message to send.');
      }
      return;
    }

    state = state.copyWith(sending: true, composerError: null);

    try {
      final message = await _repository.sendMessage(
        threadId,
        userId: actorId,
        body: body,
      );
      if (!mounted) {
        return;
      }

      final updatedMessages = [...state.messages];
      final existingIndex = updatedMessages.indexWhere((element) => element.id == message.id);
      if (existingIndex >= 0) {
        updatedMessages[existingIndex] = message;
      } else {
        updatedMessages.add(message);
      }

      final drafts = {...state.drafts};
      drafts[threadId] = '';

      state = state.copyWith(
        conversation: state.conversation.copyWith(data: sortMessagesByTimestamp(updatedMessages)),
        composerText: '',
        sending: false,
        drafts: drafts,
      );

      _typingActivityTimer?.cancel();
      _typingActive = false;
      unawaited(_repository.updateTypingState(threadId, userId: actorId, isTyping: false));
      await _repository.clearDraft(threadId);

      await _analytics.track(
        'mobile_messaging_message_sent',
        context: {
          'threadId': threadId,
          'length': body.length,
        },
        metadata: const {'source': 'mobile_app'},
      );

      unawaited(_flushPendingMessages(threadId));
      await loadInbox(forceRefresh: true);
    } catch (error) {
      final pendingMessage = PendingMessage(
        localId: _uuid.v4(),
        threadId: threadId,
        userId: actorId,
        body: body,
        createdAt: DateTime.now(),
        lastError: error.toString(),
      );

      final pending = [...state.pendingMessages, pendingMessage];
      await _repository.writePendingMessages(threadId, pending);
      await _repository.persistDraft(threadId, '');

      if (!mounted) {
        return;
      }

      final drafts = {...state.drafts};
      drafts[threadId] = '';

      state = state.copyWith(
        sending: false,
        composerText: '',
        pendingMessages: pending,
        drafts: drafts,
        composerError: 'Message stored offline. We\'ll resend when you reconnect.',
      );

      _typingActivityTimer?.cancel();
      if (_typingActive) {
        _typingActive = false;
        unawaited(_repository.updateTypingState(threadId, userId: actorId, isTyping: false));
      }
    }
  }

  Future<void> refreshConversation() async {
    final threadId = state.selectedThreadId;
    if (threadId == null) {
      return;
    }
    await loadMessages(threadId, forceRefresh: true);
    if (!state.conversation.fromCache) {
      unawaited(_flushPendingMessages(threadId));
    }
  }

  void selectThread(int threadId) {
    if (state.selectedThreadId == threadId) {
      return;
    }
    final actorId = state.actorId;
    final previousThreadId = state.selectedThreadId;
    if (_typingActive && actorId != null && previousThreadId != null) {
      unawaited(_repository.updateTypingState(previousThreadId, userId: actorId, isTyping: false));
      _typingActive = false;
    }
    _typingActivityTimer?.cancel();
    state = state.copyWith(selectedThreadId: threadId, composerText: '');
    unawaited(loadMessages(threadId));
  }

  void _triggerTypingActivity(String value) {
    final actorId = state.actorId;
    final threadId = state.selectedThreadId;
    if (actorId == null || actorId <= 0 || threadId == null) {
      return;
    }

    final isActive = value.trim().isNotEmpty;
    _typingActivityTimer?.cancel();

    if (isActive) {
      if (!_typingActive) {
        _typingActive = true;
        unawaited(_repository.updateTypingState(threadId, userId: actorId, isTyping: true));
      }
      _typingActivityTimer = Timer(const Duration(seconds: 5), () {
        if (!_typingActive) {
          return;
        }
        _typingActive = false;
        unawaited(_repository.updateTypingState(threadId, userId: actorId, isTyping: false));
      });
    } else if (_typingActive) {
      _typingActive = false;
      unawaited(_repository.updateTypingState(threadId, userId: actorId, isTyping: false));
    }
  }

  void _subscribeToTyping(int threadId) {
    _typingSubscription?.cancel();
    try {
      _typingSubscription = _realtimeGateway
          .streamFor('messaging.thread.$threadId.typing', parameters: {'threadId': threadId})
          .listen(_handleTypingMessage, onError: (_) {});
    } catch (_) {
      // ignore subscription errors for now
    }
  }

  void _handleTypingMessage(RealtimeMessage message) {
    final payload = message.payload ?? const <String, dynamic>{};
    final threadId = _parseInt(payload['threadId']) ?? state.selectedThreadId;
    if (threadId == null || threadId != state.selectedThreadId) {
      return;
    }

    final userId = _parseInt(payload['userId']);
    if (userId == null || userId == state.actorId) {
      return;
    }

    final typingFlag = _parseBool(payload['typing']) ??
        _parseBool(payload['isTyping']) ??
        message.event.toLowerCase().contains('started');
    final displayName = payload['displayName']?.toString() ?? 'Member $userId';
    final expiresAtRaw = payload['expiresAt'];
    DateTime? expiresAt;
    if (expiresAtRaw is String) {
      expiresAt = DateTime.tryParse(expiresAtRaw);
    } else if (expiresAtRaw is DateTime) {
      expiresAt = expiresAtRaw;
    }
    expiresAt ??= DateTime.now().add(const Duration(seconds: 6));

    final participants = [...state.typingParticipants];
    final existingIndex = participants.indexWhere((participant) => participant.userId == userId);

    if (typingFlag) {
      final participant = TypingParticipant(
        userId: userId,
        displayName: displayName,
        expiresAt: expiresAt!,
      );
      if (existingIndex >= 0) {
        participants[existingIndex] = participant;
      } else {
        participants.add(participant);
      }
      state = state.copyWith(typingParticipants: _pruneTypingParticipants(participants));
      _scheduleTypingExpiry(userId, expiresAt!);
    } else if (existingIndex >= 0) {
      participants.removeAt(existingIndex);
      state = state.copyWith(typingParticipants: _pruneTypingParticipants(participants));
      _typingExpiryTimers.remove(userId)?.cancel();
    }
  }

  List<TypingParticipant> _pruneTypingParticipants(List<TypingParticipant> participants) {
    return participants.where((participant) => !participant.isExpired).toList(growable: false);
  }

  void _scheduleTypingExpiry(int userId, DateTime expiresAt) {
    _typingExpiryTimers[userId]?.cancel();
    final duration = expiresAt.difference(DateTime.now());
    if (duration.isNegative) {
      _removeTypingParticipant(userId);
      return;
    }
    _typingExpiryTimers[userId] = Timer(duration, () {
      _typingExpiryTimers.remove(userId);
      _removeTypingParticipant(userId);
    });
  }

  void _removeTypingParticipant(int userId) {
    final participants = [...state.typingParticipants];
    final removed = participants.removeWhere((participant) => participant.userId == userId || participant.isExpired);
    if (removed > 0) {
      state = state.copyWith(typingParticipants: participants);
    }
  }

  void _clearTypingIndicators() {
    for (final timer in _typingExpiryTimers.values) {
      timer.cancel();
    }
    _typingExpiryTimers.clear();
    _typingSubscription?.cancel();
    _typingSubscription = null;
    if (state.typingParticipants.isNotEmpty) {
      state = state.copyWith(typingParticipants: const <TypingParticipant>[]);
    }
  }

  Future<void> _flushPendingMessages(int threadId) async {
    if (_syncingPending) {
      return;
    }
    final actorId = state.actorId;
    if (actorId == null || actorId <= 0) {
      return;
    }

    _syncingPending = true;
    try {
      final pending = await _repository.loadPendingMessages(threadId);
      if (pending.isEmpty) {
        if (mounted) {
          state = state.copyWith(pendingMessages: const <PendingMessage>[]);
        }
        await _repository.clearPendingMessages(threadId);
        return;
      }

      final remaining = <PendingMessage>[];
      final delivered = [...state.messages];
      final seen = delivered.map((message) => message.id).toSet();

      for (final pendingMessage in pending) {
        try {
          final message = await _repository.sendMessage(
            threadId,
            userId: actorId,
            body: pendingMessage.body,
          );
          if (!seen.contains(message.id)) {
            delivered.add(message);
            seen.add(message.id);
          }
        } catch (error) {
          remaining.add(pendingMessage.copyWith(lastError: error.toString()));
        }
      }

      await _repository.writePendingMessages(threadId, remaining);

      if (mounted) {
        state = state.copyWith(
          conversation: state.conversation.copyWith(data: sortMessagesByTimestamp(delivered)),
          pendingMessages: remaining,
        );
      }
    } finally {
      _syncingPending = false;
    }
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString());
  }

  static bool? _parseBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is num) return value != 0;
    final lower = value.toString().toLowerCase();
    if (lower == 'true' || lower == 'yes' || lower == '1') {
      return true;
    }
    if (lower == 'false' || lower == 'no' || lower == '0') {
      return false;
    }
    return null;
  }

  @override
  void dispose() {
    _typingActivityTimer?.cancel();
    for (final timer in _typingExpiryTimers.values) {
      timer.cancel();
    }
    _typingExpiryTimers.clear();
    _typingSubscription?.cancel();
    if (_typingActive && state.actorId != null && state.selectedThreadId != null) {
      unawaited(
        _repository.updateTypingState(
          state.selectedThreadId!,
          userId: state.actorId!,
          isTyping: false,
        ),
      );
    }
    super.dispose();
  }

  Future<void> startCall(String callType, {String? callId, String? role}) async {
    final actorId = state.actorId;
    final threadId = state.selectedThreadId;
    if (actorId == null || actorId <= 0 || threadId == null) {
      state = state.copyWith(callError: 'Select a conversation and ensure you are signed in.');
      return;
    }

    state = state.copyWith(callLoading: true, callError: null, callSession: null);

    try {
      final session = await _repository.createCallSession(
        threadId,
        userId: actorId,
        callType: callType,
        callId: callId,
        role: role,
      );
      state = state.copyWith(callSession: session, callLoading: false);

      if (session.message != null) {
        final updatedMessages = [...state.messages];
        final existingIndex = updatedMessages.indexWhere((message) => message.id == session.message!.id);
        if (existingIndex >= 0) {
          updatedMessages[existingIndex] = session.message!;
        } else {
          updatedMessages.add(session.message!);
        }
        state = state.copyWith(
          conversation: state.conversation.copyWith(
            data: sortMessagesByTimestamp(updatedMessages),
          ),
        );
      }

      await loadInbox(forceRefresh: true);
    } catch (error) {
      state = state.copyWith(callLoading: false, callError: error.toString());
    }
  }

  void endActiveCall() {
    state = state.copyWith(callSession: null, callError: null);
  }

  void updateActorId(int? actorId) {
    state = state.copyWith(actorId: actorId);
    unawaited(loadInbox(forceRefresh: true));
  }
}

final messagingRepositoryProvider = Provider<MessagingRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return MessagingRepository(apiClient, cache);
});

final messagingControllerProvider = StateNotifierProvider.autoDispose<MessagingController, MessagingState>((ref) {
  final repository = ref.watch(messagingRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  final realtimeGateway = ref.watch(realtimeGatewayProvider);
  final config = ref.watch(appConfigProvider);
  final sessionState = ref.watch(sessionControllerProvider);
  final session = sessionState.session;
  final hasAccess = canAccessMessaging(session);
  final configuredActorId = int.tryParse(config.featureFlags['demoActorId']?.toString() ?? '');
  final actorId = hasAccess ? configuredActorId : null;
  final controller = MessagingController(repository, analytics, realtimeGateway, actorId: actorId);
  ref.onDispose(() {
    controller.dispose();
  });
  return controller;
});
