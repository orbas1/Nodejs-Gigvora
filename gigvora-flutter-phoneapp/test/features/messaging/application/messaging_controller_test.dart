import 'package:flutter_test/flutter_test.dart';
import 'package:gigvora_mobile/features/messaging/application/messaging_controller.dart';
import 'package:gigvora_mobile/features/messaging/application/messaging_state.dart';
import 'package:gigvora_mobile/features/messaging/data/messaging_repository.dart';

import '../../../helpers/in_memory_offline_cache.dart';
import '../../../support/test_analytics_service.dart';
import '../../../support/test_api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('MessagingController', () {
    late InMemoryOfflineCache cache;
    late MessagingRepository repository;
    late TestAnalyticsService analytics;
    late MessagingController controller;
    late List<Map<String, dynamic>> threads;
    late List<Map<String, dynamic>> messages;
    late bool failThreads;
    late bool failMessages;

    setUp(() {
      cache = InMemoryOfflineCache();
      analytics = TestAnalyticsService();
      failThreads = false;
      failMessages = false;
      threads = [
        {
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
          ],
          'viewerState': {
            'lastReadAt': DateTime(2024, 9, 13, 21, 45).toIso8601String(),
          },
          'metadata': {
            'priority': 'high',
            'workspaceId': 501,
          },
        },
      ];
      messages = [
        {
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
        },
      ];

      final apiClient = TestApiClient(
        onGet: (path) async {
          if (path == '/messaging/threads') {
            if (failThreads) throw Exception('network unavailable');
            return {
              'data': threads,
            };
          }
          if (path == '/messaging/threads/1/messages') {
            if (failMessages) throw Exception('messages offline');
            return {
              'data': messages,
            };
          }
          throw UnsupportedError('Unexpected GET path: $path');
        },
        onPost: (path, body) async {
          if (path == '/messaging/threads/1/messages') {
            final payload = Map<String, dynamic>.from(body as Map);
            final newMessage = {
              'id': DateTime(2024, 9, 15, 9, 0).millisecondsSinceEpoch,
              'threadId': 1,
              'senderId': payload['userId'],
              'messageType': payload['messageType'],
              'body': payload['body'],
              'metadata': {'sentiment': 'neutral'},
              'createdAt': DateTime(2024, 9, 15, 9, 0).toIso8601String(),
              'sender': {
                'id': payload['userId'],
                'firstName': 'Lena',
                'lastName': 'Fields',
                'email': 'lena.fields@gigvora.com',
              },
              'attachments': const <Map<String, dynamic>>[],
            };
            messages = [...messages, newMessage];
            threads = threads
                .map((thread) => thread['id'] == 1
                    ? {
                        ...thread,
                        'lastMessagePreview': newMessage['body'],
                        'lastMessageAt': newMessage['createdAt'],
                        'unreadCount': 0,
                      }
                    : thread)
                .toList(growable: false);
            return newMessage;
          }

          if (path == '/messaging/threads/1/read') {
            threads = threads
                .map((thread) => thread['id'] == 1
                    ? {
                        ...thread,
                        'unreadCount': 0,
                      }
                    : thread)
                .toList(growable: false);
            return {'status': 'ok'};
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

          throw UnsupportedError('Unexpected POST path: $path');
        },
      );

      repository = MessagingRepository(apiClient, cache);
      controller = MessagingController(repository, analytics, actorId: 42);
    });

    tearDown(() {
      controller.dispose();
    });

    test('loadInbox hydrates state and resolves the active conversation', () async {
      await controller.loadInbox(forceRefresh: true);

      expect(controller.state.inbox.loading, isFalse);
      expect(controller.state.threads, isNotEmpty);
      expect(controller.state.selectedThreadId, equals(1));

      await controller.loadMessages(1, forceRefresh: true);
      expect(controller.state.conversation.loading, isFalse);
      expect(controller.state.messages, isNotEmpty);
      expect(controller.state.inbox.data.first.unreadCount, equals(0));
    });

    test('sendMessage appends to the current conversation and clears the composer', () async {
      await controller.loadInbox(forceRefresh: true);
      await controller.loadMessages(1, forceRefresh: true);

      controller.updateComposer('We are live!');
      await controller.sendMessage();

      expect(controller.state.composerText, isEmpty);
      expect(controller.state.messages.last.body, 'We are live!');
      expect(analytics.events.any((event) => event.name == 'mobile_messaging_message_sent'), isTrue);
    });

    test('gracefully reports when no actor id is available', () async {
      final invalidController = MessagingController(repository, analytics, actorId: null);
      await invalidController.loadInbox();

      expect(invalidController.state.inbox.error, isA<StateError>());
      expect(invalidController.state.inbox.data, isEmpty);
      invalidController.dispose();
    });
  });
}
