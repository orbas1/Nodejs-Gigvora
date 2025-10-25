import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'package:gigvora_mobile/features/messaging/application/messaging_controller.dart';
import 'package:gigvora_mobile/features/messaging/data/messaging_repository.dart';
import 'package:gigvora_mobile/features/messaging/data/models/message_thread.dart';
import 'package:gigvora_mobile/features/messaging/data/models/thread_message.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_analytics_service.dart';
import '../support/test_api_client.dart';

class _StubMessagingRepository extends MessagingRepository {
  _StubMessagingRepository()
      : super(TestApiClient(onGet: (_) async => {}, onPost: (_, __) async => {}), InMemoryOfflineCache());

  List<MessageThread> inbox = [
    MessageThread(
      id: 1,
      subject: 'Project Kickoff',
      channelType: 'direct',
      lastMessagePreview: 'See you soon',
      lastMessageAt: DateTime(2024, 1, 2, 10),
      unreadCount: 2,
      participants: [
        ThreadParticipant(
          userId: 10,
          user: const ParticipantUser(id: 10, firstName: 'Lena', lastName: 'Fields', email: 'lena@gigvora.com'),
          role: 'sender',
          state: 'active',
          joinedAt: DateTime(2024, 1, 1, 9),
        ),
      ],
      viewerState: ThreadViewerState(lastReadAt: DateTime(2024, 1, 1, 10)),
      metadata: const {'priority': 'high'},
      supportCase: const {'id': 'case-1'},
    ),
  ];

  List<ThreadMessage> messages = [
    ThreadMessage(
      id: 20,
      threadId: 1,
      senderId: 10,
      messageType: 'text',
      body: 'Hello crew',
      metadata: const {'channel': 'app'},
      createdAt: DateTime(2024, 1, 2, 11),
      sender: const MessageSender(id: 10, firstName: 'Lena', lastName: 'Fields', email: 'lena@gigvora.com'),
    ),
  ];

  List<ThreadMessage> sentMessages = [];
  int inboxFetches = 0;
  int messageFetches = 0;
  int markReadCalls = 0;

  @override
  Future<RepositoryResult<List<MessageThread>>> fetchInbox({
    required int actorId,
    bool includeParticipants = true,
    bool includeSupport = true,
    int page = 1,
    int pageSize = 30,
    bool forceRefresh = false,
  }) async {
    inboxFetches += 1;
    return RepositoryResult(
      data: inbox,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<RepositoryResult<List<ThreadMessage>>> fetchThreadMessages(
    int threadId, {
    int page = 1,
    int pageSize = 100,
    bool includeSystem = false,
    bool forceRefresh = false,
  }) async {
    messageFetches += 1;
    return RepositoryResult(
      data: messages,
      fromCache: false,
      lastUpdated: DateTime.now(),
    );
  }

  @override
  Future<ThreadMessage> sendMessage(
    int threadId, {
    required int userId,
    required String body,
    String messageType = 'text',
  }) async {
    final message = ThreadMessage(
      id: 30,
      threadId: threadId,
      senderId: userId,
      messageType: messageType,
      body: body,
      metadata: const {},
      createdAt: DateTime(2024, 1, 2, 12),
      sender: MessageSender(id: userId, firstName: 'Alex', lastName: 'Chen', email: 'alex@gigvora.com'),
    );
    sentMessages.add(message);
    messages = [...messages, message];
    return message;
  }

  @override
  Future<CallSession> createCallSession(
    int threadId, {
    required int userId,
    String callType = 'video',
    String? callId,
    String? role,
  }) async {
    return CallSession(
      threadId: threadId,
      callId: callId ?? 'call-1',
      callType: callType,
      channelName: 'demo-channel',
      agoraAppId: 'agora-demo',
      rtcToken: 'rtc-token',
      rtmToken: 'rtm-token',
      identity: 'user-$userId',
      expiresAt: DateTime(2024, 1, 2, 12),
      expiresIn: 3600,
      isNew: true,
    );
  }

  @override
  Future<void> updateTypingState(
    int threadId, {
    required int userId,
    required bool isTyping,
  }) async {}

  @override
  Future<void> markThreadRead(int threadId, {required int userId}) async {
    markReadCalls += 1;
  }
}

void main() {
  group('MessagingController', () {
    late _StubMessagingRepository repository;
    late TestAnalyticsService analytics;
    late MessagingController controller;

    setUp(() {
      repository = _StubMessagingRepository();
      analytics = TestAnalyticsService();
      controller = MessagingController(repository, analytics, actorId: 7);
    });

    test('loadInbox hydrates threads and conversation for first thread', () async {
      await controller.loadInbox(forceRefresh: true);

      expect(controller.state.threads, isNotEmpty);
      expect(controller.state.selectedThreadId, equals(1));
      expect(controller.state.messages.length, equals(1));
      expect(repository.inboxFetches, equals(1));
      expect(repository.messageFetches, equals(1));
      expect(repository.markReadCalls, equals(1));
    });

    test('sendMessage clears composer and appends new message', () async {
      await controller.loadInbox(forceRefresh: true);
      controller.updateComposer('Hello crew');
      await controller.sendMessage();

      expect(controller.state.composerText, isEmpty);
      expect(controller.state.messages.last.body, equals('Hello crew'));
      expect(repository.sentMessages, isNotEmpty);
      expect(analytics.events.last.name, equals('mobile_messaging_message_sent'));
    });

    test('startCall stores call session details', () async {
      await controller.loadInbox(forceRefresh: true);
      await controller.startCall('video');

      expect(controller.state.callSession, isNotNull);
      expect(controller.state.callSession?.callId, equals('call-1'));
      expect(controller.state.callLoading, isFalse);
    });
  });
}
