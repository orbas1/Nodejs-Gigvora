import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/messaging/data/messaging_repository.dart';
import 'package:gigvora_mobile/features/messaging/data/models/message_thread.dart';
import 'package:gigvora_mobile/features/messaging/data/models/thread_message.dart';

import '../helpers/in_memory_offline_cache.dart';
import '../support/test_api_client.dart';

void main() {
  group('MessagingRepository', () {
    late InMemoryOfflineCache cache;

    setUp(() {
      cache = InMemoryOfflineCache();
    });

    tearDown(() async {
      await cache.dispose();
    });

    test('fetchInbox hydrates threads and caches subsequent responses', () async {
      var requests = 0;
      final repository = MessagingRepository(
        TestApiClient(onGet: (path) async {
          requests += 1;
          expect(path, equals('/messaging/threads'));
          return {'data': [_threadJson]};
        }),
        cache,
      );

      final result = await repository.fetchInbox(actorId: 7, forceRefresh: true);
      expect(result.data, isNotEmpty);
      expect(result.fromCache, isFalse);
      expect(result.data.first.unreadCount, equals(2));

      final cached = await repository.fetchInbox(actorId: 7);
      expect(cached.fromCache, isTrue);
      expect(cached.data.first.participants.first.user.fullName, equals('Lena Fields'));
      expect(requests, equals(1));
    });

    test('fetchThreadMessages hydrates messages and caches them', () async {
      var requests = 0;
      final repository = MessagingRepository(
        TestApiClient(onGet: (path) async {
          requests += 1;
          expect(path, equals('/messaging/threads/1/messages'));
          return {'data': [_messageJson]};
        }),
        cache,
      );

      final result = await repository.fetchThreadMessages(1, forceRefresh: true);
      expect(result.data.first.body, equals('Hello crew'));
      expect(result.fromCache, isFalse);

      final cached = await repository.fetchThreadMessages(1);
      expect(cached.fromCache, isTrue);
      expect(cached.data.first.sender.displayName, equals('Lena Fields'));
      expect(requests, equals(1));
    });

    test('sendMessage returns parsed thread message', () async {
      final repository = MessagingRepository(
        TestApiClient(onPost: (path, body) async {
          expect(path, equals('/messaging/threads/1/messages'));
          expect((body as Map)['body'], equals('Hello crew'));
          return _messageJson;
        }),
        cache,
      );

      final message = await repository.sendMessage(1, userId: 7, body: 'Hello crew');
      expect(message.id, equals(20));
      expect(message.sender.displayName, equals('Lena Fields'));
    });

    test('createCallSession returns call credentials', () async {
      final repository = MessagingRepository(
        TestApiClient(onPost: (path, body) async {
          expect(path, equals('/messaging/threads/1/calls'));
          return {
            'threadId': 1,
            'callId': 'call-1',
            'callType': 'video',
            'channelName': 'demo-channel',
            'rtcToken': 'token',
            'rtmToken': 'rtm-token',
            'identity': 'user-7',
            'expiresAt': '2024-01-02T12:00:00.000Z',
            'expiresIn': 3600,
            'isNew': true,
          };
        }),
        cache,
      );

      final session = await repository.createCallSession(1, userId: 7);
      expect(session.callId, equals('call-1'));
      expect(session.hasCredentials, isTrue);
    });

    test('markThreadRead swallows API errors', () async {
      final repository = MessagingRepository(
        TestApiClient(onPost: (path, body) async {
          throw Exception('network');
        }),
        cache,
      );

      expect(() => repository.markThreadRead(1, userId: 7), returnsNormally);
    });
  });
}

const _threadJson = {
  'id': 1,
  'subject': 'Project Kickoff',
  'channelType': 'direct',
  'lastMessagePreview': 'See you soon',
  'lastMessageAt': '2024-01-02T10:00:00.000Z',
  'unreadCount': 2,
  'participants': [
    {
      'userId': 10,
      'user': {'id': 10, 'firstName': 'Lena', 'lastName': 'Fields', 'email': 'lena@gigvora.com'},
      'role': 'sender',
      'state': 'active',
      'joinedAt': '2024-01-01T09:00:00.000Z'
    }
  ],
  'viewerState': {'lastReadAt': '2024-01-01T10:00:00.000Z'},
  'metadata': {'priority': 'high'},
};

const _messageJson = {
  'id': 20,
  'threadId': 1,
  'senderId': 10,
  'messageType': 'text',
  'body': 'Hello crew',
  'metadata': {'channel': 'app'},
  'createdAt': '2024-01-02T11:00:00.000Z',
  'sender': {'id': 10, 'firstName': 'Lena', 'lastName': 'Fields', 'email': 'lena@gigvora.com'},
};
