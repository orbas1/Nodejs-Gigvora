import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../core/providers.dart';
import '../../auth/application/session_controller.dart';
import '../data/messaging_repository.dart';
import '../data/models/message_thread.dart';
import '../data/models/thread_message.dart';
import '../utils/messaging_formatters.dart';
import '../utils/messaging_access.dart';
import 'messaging_state.dart';

class MessagingController extends StateNotifier<MessagingState> {
  MessagingController(
    this._repository,
    this._analytics, {
    required int? actorId,
  }) : super(MessagingState(actorId: actorId)) {
    _initialise();
  }

  final MessagingRepository _repository;
  final AnalyticsService _analytics;

  bool _initialised = false;

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

    final currentConversation = state.conversation;
    state = state.copyWith(
      conversation: currentConversation.copyWith(loading: true, error: null),
      selectedThreadId: threadId,
      composerError: null,
      callError: null,
    );

    try {
      final result = await _repository.fetchThreadMessages(threadId, forceRefresh: forceRefresh);
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

      state = state.copyWith(
        conversation: conversationState,
        selectedThreadId: threadId,
        inbox: state.inbox.copyWith(data: updatedThreads),
      );

      unawaited(_repository.markThreadRead(threadId, userId: actorId));
    } catch (error) {
      state = state.copyWith(
        conversation: currentConversation.copyWith(loading: false, error: error, data: const <ThreadMessage>[]),
      );
    }
  }

  void updateComposer(String value) {
    state = state.copyWith(composerText: value, composerError: null);
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
      final updatedMessages = [...state.messages, message];
      state = state.copyWith(
        conversation: state.conversation.copyWith(data: sortMessagesByTimestamp(updatedMessages)),
        composerText: '',
        sending: false,
      );

      await _analytics.track(
        'mobile_messaging_message_sent',
        context: {
          'threadId': threadId,
          'length': body.length,
        },
        metadata: const {'source': 'mobile_app'},
      );

      await loadInbox(forceRefresh: true);
    } catch (error) {
      state = state.copyWith(
        sending: false,
        composerError: error.toString(),
      );
    }
  }

  Future<void> refreshConversation() async {
    final threadId = state.selectedThreadId;
    if (threadId == null) {
      return;
    }
    await loadMessages(threadId, forceRefresh: true);
  }

  void selectThread(int threadId) {
    if (state.selectedThreadId == threadId) {
      return;
    }
    state = state.copyWith(selectedThreadId: threadId);
    unawaited(loadMessages(threadId));
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
  final config = ref.watch(appConfigProvider);
  final sessionState = ref.watch(sessionControllerProvider);
  final session = sessionState.session;
  final hasAccess = canAccessMessaging(session);
  final configuredActorId = int.tryParse(config.featureFlags['demoActorId']?.toString() ?? '');
  final actorId = hasAccess ? configuredActorId : null;
  final controller = MessagingController(repository, analytics, actorId: actorId);
  ref.onDispose(() {
    controller.dispose();
  });
  return controller;
});
