class ThreadMessage {
  ThreadMessage({
    required this.id,
    required this.threadId,
    required this.senderId,
    required this.messageType,
    required this.body,
    required this.metadata,
    required this.createdAt,
    required this.sender,
    this.attachments = const <MessageAttachment>[],
  });

  factory ThreadMessage.fromJson(Map<String, dynamic> json) {
    return ThreadMessage(
      id: _parseInt(json['id']) ?? 0,
      threadId: _parseInt(json['threadId']) ?? 0,
      senderId: _parseInt(json['senderId']),
      messageType: json['messageType']?.toString() ?? 'text',
      body: json['body']?.toString(),
      metadata: json['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['metadata'] as Map<String, dynamic>)
          : const <String, dynamic>{},
      createdAt: _parseDate(json['createdAt']),
      sender: MessageSender.fromJson(json['sender'] as Map<String, dynamic>? ?? const {}),
      attachments: _parseAttachments(json['attachments']),
    );
  }

  final int id;
  final int threadId;
  final int? senderId;
  final String messageType;
  final String? body;
  final Map<String, dynamic> metadata;
  final DateTime? createdAt;
  final MessageSender sender;
  final List<MessageAttachment> attachments;

  bool get isEvent => messageType == 'event';
  bool get isSystem => messageType == 'system';
}

class MessageSender {
  const MessageSender({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) {
    return MessageSender(
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

  String get displayName {
    final parts = <String?>[firstName, lastName].where((value) => value != null && value!.isNotEmpty).toList();
    if (parts.isEmpty) {
      return email ?? 'System';
    }
    return parts.join(' ');
  }
}

class MessageAttachment {
  const MessageAttachment({
    required this.id,
    required this.fileName,
    required this.mimeType,
    required this.storageKey,
    required this.fileSize,
  });

  factory MessageAttachment.fromJson(Map<String, dynamic> json) {
    return MessageAttachment(
      id: _parseInt(json['id']) ?? 0,
      fileName: json['fileName']?.toString() ?? 'Attachment',
      mimeType: json['mimeType']?.toString() ?? 'application/octet-stream',
      storageKey: json['storageKey']?.toString() ?? '',
      fileSize: _parseInt(json['fileSize']) ?? 0,
    );
  }

  final int id;
  final String fileName;
  final String mimeType;
  final String storageKey;
  final int fileSize;
}

class CallMetadata {
  const CallMetadata({
    required this.id,
    required this.type,
    required this.channelName,
    required this.initiatedBy,
    required this.initiatedAt,
    required this.expiresAt,
    required this.participants,
  });

  factory CallMetadata.fromJson(Map<String, dynamic> json) {
    return CallMetadata(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'video',
      channelName: json['channelName']?.toString() ?? '',
      initiatedBy: _parseInt(json['initiatedBy']),
      initiatedAt: _parseDate(json['initiatedAt']),
      expiresAt: _parseDate(json['expiresAt']),
      participants: _parseCallParticipants(json['participants']),
    );
  }

  final String id;
  final String type;
  final int? initiatedBy;
  final DateTime? initiatedAt;
  final DateTime? expiresAt;
  final String channelName;
  final List<CallParticipant> participants;

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
}

class CallParticipant {
  const CallParticipant({
    required this.userId,
    required this.joinedAt,
  });

  factory CallParticipant.fromJson(Map<String, dynamic> json) {
    return CallParticipant(
      userId: _parseInt(json['userId']) ?? 0,
      joinedAt: _parseDate(json['joinedAt']),
    );
  }

  final int userId;
  final DateTime? joinedAt;
}

class CallSession {
  const CallSession({
    required this.threadId,
    required this.callId,
    required this.callType,
    required this.channelName,
    required this.agoraAppId,
    required this.rtcToken,
    required this.rtmToken,
    required this.identity,
    required this.expiresAt,
    required this.expiresIn,
    required this.isNew,
    this.message,
  });

  factory CallSession.fromJson(Map<String, dynamic> json) {
    return CallSession(
      threadId: _parseInt(json['threadId']) ?? 0,
      callId: json['callId']?.toString() ?? '',
      callType: json['callType']?.toString() ?? 'video',
      channelName: json['channelName']?.toString() ?? '',
      agoraAppId: json['agoraAppId']?.toString(),
      rtcToken: json['rtcToken']?.toString(),
      rtmToken: json['rtmToken']?.toString(),
      identity: json['identity']?.toString(),
      expiresAt: _parseDate(json['expiresAt']),
      expiresIn: _parseInt(json['expiresIn']),
      isNew: json['isNew'] == true,
      message: json['message'] is Map<String, dynamic>
          ? ThreadMessage.fromJson(Map<String, dynamic>.from(json['message'] as Map<String, dynamic>))
          : null,
    );
  }

  final int threadId;
  final String callId;
  final String callType;
  final String channelName;
  final String? agoraAppId;
  final String? rtcToken;
  final String? rtmToken;
  final String? identity;
  final DateTime? expiresAt;
  final int? expiresIn;
  final bool isNew;
  final ThreadMessage? message;

  bool get hasCredentials => rtcToken != null && rtcToken!.isNotEmpty;
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

List<MessageAttachment> _parseAttachments(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => MessageAttachment.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }
  return const <MessageAttachment>[];
}

List<CallParticipant> _parseCallParticipants(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => CallParticipant.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }
  return const <CallParticipant>[];
}
