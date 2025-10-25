import 'package:equatable/equatable.dart';

class PendingMessage extends Equatable {
  const PendingMessage({
    required this.localId,
    required this.threadId,
    required this.userId,
    required this.body,
    required this.createdAt,
    this.lastError,
  });

  factory PendingMessage.fromJson(Map<String, dynamic> json) {
    return PendingMessage(
      localId: json['localId']?.toString() ?? '',
      threadId: _parseInt(json['threadId']) ?? 0,
      userId: _parseInt(json['userId']) ?? 0,
      body: json['body']?.toString() ?? '',
      createdAt: _parseDate(json['createdAt']) ?? DateTime.now(),
      lastError: json['lastError']?.toString(),
    );
  }

  final String localId;
  final int threadId;
  final int userId;
  final String body;
  final DateTime createdAt;
  final String? lastError;

  bool get hasError => (lastError ?? '').isNotEmpty;

  PendingMessage copyWith({
    String? localId,
    int? threadId,
    int? userId,
    String? body,
    DateTime? createdAt,
    String? lastError = _sentinel,
  }) {
    return PendingMessage(
      localId: localId ?? this.localId,
      threadId: threadId ?? this.threadId,
      userId: userId ?? this.userId,
      body: body ?? this.body,
      createdAt: createdAt ?? this.createdAt,
      lastError: identical(lastError, _sentinel) ? this.lastError : lastError as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'localId': localId,
      'threadId': threadId,
      'userId': userId,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      if (lastError != null) 'lastError': lastError,
    };
  }

  static const _sentinel = Object();

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString());
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse(value.toString());
  }

  @override
  List<Object?> get props => [localId, threadId, userId, body, createdAt, lastError];
}
