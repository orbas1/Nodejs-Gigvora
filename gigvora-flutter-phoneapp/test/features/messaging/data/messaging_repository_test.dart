import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/messaging/data/messaging_repository.dart';
import 'package:gigvora_mobile/features/messaging/data/models/message_thread.dart';
import 'package:gigvora_mobile/features/messaging/data/models/thread_message.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../support/test_api_client.dart';

void main() {
  final threadPayload = {
    'id': 1,
    'subject': 'Launch coordination',
    'channelType': 'direct',
    'lastMessagePreview': 'Kickoff happening at 10:00 AM ET.',
    'lastMessageAt': DateTime(2024, 9, 14, 10, 0).toIso8601String(),
    'unreadCount': 2,
    'participants': [
      {
        'userId': 42,
        'role': 'freelancer',
        'state': 'active',
        'joinedAt': DateTime(2024, 9, 12, 8, 30).toIso8601String(),
        'user': {
          'id': 42,
          'firstName': 'Lena',
          'lastName': 'Fields',
          'email': 'lena.fields@gigvora.com',
        },
      },
      {
        'userId': 77,
        'role': 'company',
        'state': 'active',
        'joinedAt': DateTime(2024, 9, 12, 9, 10).toIso8601String(),
        'user': {
          'id': 77,
          'firstName': 'Jordan',
          'lastName': 'Blake',
          'email': 'jordan.blake@gigvora.com',
        },
      },
    ],
    'viewerState': {
      'lastReadAt': DateTime(2024, 9, 13, 21, 45).toIso8601String(),
    },
    'metadata': {
      'priority': 'high',
      'workspaceId': 501,
    },
  };

  final messagePayload = {
    'id': 11,
    'threadId': 1,
    'senderId': 42,
    'messageType': 'text',
    'body': 'App walkthrough deck uploaded for review.',
    'metadata': {
      'attachments': 1,
      'sentiment': 'positive',
    },
    'createdAt': DateTime(2024, 9, 13, 21, 30).toIso8601String(),
    'sender': {
      'id': 42,
      'firstName': 'Lena',
      'lastName': 'Fields',
      'email': 'lena.fields@gigvora.com',
    },
    'attachments': [
      {
        'id': 9001,
        'fileName': 'kickoff-brief.pdf',
        'mimeType': 'application/pdf',
        'storageKey': 'briefs/kickoff-brief.pdf',
        'fileSize': 2482300,
      },
    ],
  };

  group('MessagingRepository', () {
    late InMemoryOfflineCache cache;
    late MessagingRepository repository;
    late bool failThreads;
    late bool failMessages;
    late TestApiClient apiClient;

    setUp(() {
      cache = InMemoryOfflineCache();
      failThreads = false;
      failMessages = false;
      apiClient = TestApiClient(
        onGet: (path) async {
          switch (path) {
            case '/messaging/threads':
              if (failThreads) {
                throw Exception('network unavailable');
              }
              return {
                'data': [threadPayload],
              };
            case '/messaging/threads/1/messages':
              if (failMessages) {
                throw Exception('timeout while fetching thread messages');
              }
              return {
                'data': [messagePayload],
              };
            default:
              throw UnsupportedError('Unexpected GET path: $path');
          }
        },
        onPost: (path, body) async {
          if (path == '/messaging/threads/1/messages') {
            final payload = Map<String, dynamic>.from(body as Map);
            return {
              ...messagePayload,
              'id': 99,
              'body': payload['body'],
              'createdAt': DateTime(2024, 9, 15, 9, 0).toIso8601String(),
            };
          }

          if (path == '/messaging/threads/1/calls') {
            return {
              'threadId': 1,
              'callId': 'call-123',
              'callType': 'video',
              'channelName': 'gigvora-video-1',
              'agoraAppId': 'agora-demo',
              'rtcToken': 'rtc-token',
              'rtmToken': 'rtm-token',
              'identity': '42',
              'expiresAt': DateTime(2024, 9, 15, 9, 30).toIso8601String(),
              'expiresIn': 1800,
              'isNew': true,
            };
          }

          if (path == '/messaging/threads/1/read') {
            return {'status': 'ok'};
          }

          throw UnsupportedError('Unexpected POST path: $path');
        },
      );
      repository = MessagingRepository(apiClient, cache);
    });

    test('fetchInbox returns parsed threads and caches the payload', () async {
      final result = await repository.fetchInbox(actorId: 42);

      expect(result.data, hasLength(1));
      expect(result.fromCache, isFalse);
      expect(result.error, isNull);
      expect(result.data.first, isA<MessageThread>());

      failThreads = true;
      final cachedResult = await repository.fetchInbox(actorId: 42);
      expect(cachedResult.fromCache, isTrue);
      expect(cachedResult.data, isNotEmpty);
    });

    test('fetchInbox falls back to cached threads when the network call fails', () async {
      await repository.fetchInbox(actorId: 42);

      failThreads = true;
      final result = await repository.fetchInbox(actorId: 42, forceRefresh: true);

      expect(result.fromCache, isTrue);
      expect(result.data, isNotEmpty);
      expect(result.error, isNotNull);
    });

    test('fetchThreadMessages caches conversations and sendMessage posts to the API', () async {
      final threadResult = await repository.fetchThreadMessages(1);
      expect(threadResult.data, hasLength(1));
      expect(threadResult.fromCache, isFalse);

      failMessages = true;
      final cachedMessages = await repository.fetchThreadMessages(1, forceRefresh: true);
      expect(cachedMessages.fromCache, isTrue);
      expect(cachedMessages.error, isNotNull);

      failMessages = false;
      final message = await repository.sendMessage(
        1,
        userId: 42,
        body: 'Appreciate the update!',
      );
      expect(message, isA<ThreadMessage>());
      expect(message.body, 'Appreciate the update!');
      expect(message.sender.id, 42);
    });
  });
}
