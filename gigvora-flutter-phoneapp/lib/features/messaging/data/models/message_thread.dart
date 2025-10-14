import 'thread_message.dart';

class MessageThread {
  MessageThread({
    required this.id,
    required this.subject,
    required this.channelType,
    required this.lastMessagePreview,
    required this.lastMessageAt,
    required this.unreadCount,
    required this.participants,
    required this.viewerState,
    required this.metadata,
    this.supportCase,
  });

  factory MessageThread.fromJson(Map<String, dynamic> json) {
    return MessageThread(
      id: _parseInt(json['id']) ?? 0,
      subject: json['subject']?.toString(),
      channelType: json['channelType']?.toString() ?? 'direct',
      lastMessagePreview: json['lastMessagePreview']?.toString(),
      lastMessageAt: _parseDate(json['lastMessageAt']),
      unreadCount: _parseInt(json['unreadCount']) ?? 0,
      participants: _parseParticipants(json['participants']),
      viewerState: ThreadViewerState.fromJson(json['viewerState'] as Map<String, dynamic>? ?? const {}),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
      supportCase: json['supportCase'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['supportCase'] as Map<String, dynamic>)
          : null,
    );
  }

  final int id;
  final String? subject;
  final String channelType;
  final String? lastMessagePreview;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final List<ThreadParticipant> participants;
  final ThreadViewerState viewerState;
  final Map<String, dynamic> metadata;
  final Map<String, dynamic>? supportCase;

  MessageThread copyWith({
    int? id,
    String? subject,
    String? channelType,
    String? lastMessagePreview,
    DateTime? lastMessageAt,
    int? unreadCount,
    List<ThreadParticipant>? participants,
    ThreadViewerState? viewerState,
    Map<String, dynamic>? metadata,
    Map<String, dynamic>? supportCase,
  }) {
    return MessageThread(
      id: id ?? this.id,
      subject: subject ?? this.subject,
      channelType: channelType ?? this.channelType,
      lastMessagePreview: lastMessagePreview ?? this.lastMessagePreview,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      unreadCount: unreadCount ?? this.unreadCount,
      participants: participants ?? this.participants,
      viewerState: viewerState ?? this.viewerState,
      metadata: metadata ?? this.metadata,
      supportCase: supportCase ?? this.supportCase,
    );
  }
}

class ThreadParticipant {
  ThreadParticipant({
    required this.userId,
    required this.user,
    required this.role,
    required this.state,
    required this.joinedAt,
  });

  factory ThreadParticipant.fromJson(Map<String, dynamic> json) {
    return ThreadParticipant(
      userId: _parseInt(json['userId']) ?? 0,
      user: ParticipantUser.fromJson(json['user'] as Map<String, dynamic>? ?? const {}),
      role: json['role']?.toString(),
      state: json['state']?.toString(),
      joinedAt: _parseDate(json['joinedAt']),
    );
  }

  final int userId;
  final ParticipantUser user;
  final String? role;
  final String? state;
  final DateTime? joinedAt;
}

class ParticipantUser {
  const ParticipantUser({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  factory ParticipantUser.fromJson(Map<String, dynamic> json) {
    return ParticipantUser(
      id: _parseInt(json['id']) ?? 0,
      firstName: json['firstName']?.toString(),
      lastName: json['lastName']?.toString(),
      email: json['email']?.toString(),
    );
  }

  final int id;
  final String? firstName;
  final String? lastName;
  final String? email;

  String? get fullName {
    final parts = <String?>[firstName, lastName].where((value) => value != null && value!.isNotEmpty).toList();
    if (parts.isEmpty) {
      return null;
    }
    return parts.join(' ');
  }
}

class ThreadViewerState {
  ThreadViewerState({
    required this.lastReadAt,
  });

  factory ThreadViewerState.fromJson(Map<String, dynamic> json) {
    return ThreadViewerState(
      lastReadAt: _parseDate(json['lastReadAt']),
    );
  }

  final DateTime? lastReadAt;
}

int? _parseInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  return int.tryParse(value.toString());
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

List<ThreadParticipant> _parseParticipants(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => ThreadParticipant.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }
  return const <ThreadParticipant>[];
}
