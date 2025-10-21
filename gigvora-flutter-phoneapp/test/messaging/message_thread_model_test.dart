import 'package:flutter_test/flutter_test.dart';

import 'package:gigvora_mobile/features/messaging/data/models/message_thread.dart';

void main() {
  group('MessageThread', () {
    test('fromJson parses nested participants and metadata', () {
      final thread = MessageThread.fromJson(_threadJson);

      expect(thread.id, equals(1));
      expect(thread.participants.first.user.fullName, equals('Lena Fields'));
      expect(thread.viewerState.lastReadAt?.isBefore(DateTime.now()), isTrue);
      expect(thread.metadata['priority'], equals('high'));
    });

    test('copyWith allows overriding selective fields', () {
      final thread = MessageThread.fromJson(_threadJson);
      final updated = thread.copyWith(unreadCount: 0, lastMessagePreview: 'Updated');

      expect(updated.unreadCount, equals(0));
      expect(updated.lastMessagePreview, equals('Updated'));
      expect(updated.id, equals(thread.id));
    });
  });

  group('ParticipantUser', () {
    test('fullName returns null when no names are provided', () {
      const user = ParticipantUser(id: 1, firstName: null, lastName: null, email: 'ops@gigvora.com');
      expect(user.fullName, isNull);
    });
  });

  group('ThreadViewerState', () {
    test('fromJson gracefully handles null timestamps', () {
      final state = ThreadViewerState.fromJson(const {});
      expect(state.lastReadAt, isNull);
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
  'supportCase': {'id': 'case-1'},
};
