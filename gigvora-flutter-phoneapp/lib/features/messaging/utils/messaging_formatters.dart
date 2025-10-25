import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../data/models/message_thread.dart';
import '../data/models/thread_message.dart';

extension ThreadListHelpers on List<MessageThread> {
  List<MessageThread> sortedByLastActivity() {
    final items = [...this];
    items.sort((a, b) {
      final aTime = a.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bTime = b.lastMessageAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bTime.compareTo(aTime);
    });
    return items;
  }
}

List<ThreadMessage> sortMessagesByTimestamp(List<ThreadMessage> messages) {
  final items = [...messages];
  items.sort((a, b) {
    final aTime = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    final bTime = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    return aTime.compareTo(bTime);
  });
  return items;
}

String buildThreadTitle(MessageThread thread, {int? actorId}) {
  if (thread.subject != null && thread.subject!.isNotEmpty) {
    return thread.subject!;
  }
  final participants = formatThreadParticipants(thread, actorId: actorId);
  if (participants.isNotEmpty) {
    return participants.join(', ');
  }
  return 'Conversation #${thread.id}';
}

List<String> formatThreadParticipants(MessageThread thread, {int? actorId}) {
  final visible = thread.participants.where((participant) {
    if (actorId == null) {
      return true;
    }
    return participant.userId != actorId;
  }).toList();

  final source = visible.isEmpty ? thread.participants : visible;
  return source
      .map((participant) =>
          participant.user.fullName?.trim().isNotEmpty == true ? participant.user.fullName! : 'User ${participant.userId}')
      .toList(growable: false);
}

bool isThreadUnread(MessageThread thread) {
  if (thread.unreadCount > 0) {
    return true;
  }
  final lastMessageAt = thread.lastMessageAt;
  if (lastMessageAt == null) {
    return false;
  }
  final lastReadAt = thread.viewerState.lastReadAt;
  if (lastReadAt == null) {
    return true;
  }
  return lastMessageAt.isAfter(lastReadAt);
}

String describeLastActivity(MessageThread thread) {
  final lastMessageAt = thread.lastMessageAt;
  if (lastMessageAt == null) {
    return 'No messages yet';
  }
  return formatRelativeTime(lastMessageAt);
}

String formatMessageSender(ThreadMessage message) {
  if (message.senderId == null || message.senderId == 0) {
    return 'System';
  }
  return message.sender.displayName;
}

bool messageBelongsToUser(ThreadMessage message, int? actorId) {
  if (actorId == null || actorId <= 0) {
    return false;
  }
  return message.senderId == actorId;
}

String formatMessageTimestamp(ThreadMessage message) {
  final createdAt = message.createdAt;
  if (createdAt == null) {
    return '';
  }
  return formatRelativeTime(createdAt);
}

CallMetadata? resolveCallMetadata(ThreadMessage message) {
  final data = message.metadata['call'];
  if (data is Map<String, dynamic>) {
    return CallMetadata.fromJson(data);
  }
  if (data is Map) {
    return CallMetadata.fromJson(Map<String, dynamic>.from(data as Map));
  }
  return null;
}

bool isCallEvent(ThreadMessage message) {
  return message.messageType == 'event' && message.metadata['eventType'] == 'call';
}

bool isCallActive(CallMetadata metadata) {
  if (metadata.expiresAt == null) {
    return true;
  }
  return metadata.expiresAt!.isAfter(DateTime.now());
}

String formatAttachmentSize(int bytes) {
  if (bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var value = bytes.toDouble();
  var unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  final precision = unitIndex == 0 ? 0 : (value >= 100 ? 0 : 1);
  return '${value.toStringAsFixed(precision)} ${units[unitIndex]}';
}
