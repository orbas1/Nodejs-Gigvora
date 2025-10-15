class RuntimeHealthSnapshot {
  const RuntimeHealthSnapshot({
    required this.status,
    required this.httpStatus,
    required this.timestamp,
    required this.dependencies,
  });

  factory RuntimeHealthSnapshot.fromJson(Map<String, dynamic> json) {
    final dependencies = Map<String, dynamic>.from(json['dependencies'] as Map? ?? const <String, dynamic>{});
    return RuntimeHealthSnapshot(
      status: (json['status'] as String? ?? 'unknown').toLowerCase(),
      httpStatus: json['httpStatus'] is num ? (json['httpStatus'] as num).toInt() : 503,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      dependencies: dependencies,
    );
  }

  final String status;
  final int httpStatus;
  final DateTime timestamp;
  final Map<String, dynamic> dependencies;

  bool get healthy => status == 'ok' || status == 'ready';
}
