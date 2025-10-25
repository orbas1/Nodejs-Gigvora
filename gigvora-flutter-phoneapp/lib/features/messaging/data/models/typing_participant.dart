class TypingParticipant {
  const TypingParticipant({
    required this.userId,
    required this.displayName,
    required this.expiresAt,
  });

  final int userId;
  final String displayName;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  TypingParticipant copyWith({
    int? userId,
    String? displayName,
    DateTime? expiresAt,
  }) {
    return TypingParticipant(
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }
}
