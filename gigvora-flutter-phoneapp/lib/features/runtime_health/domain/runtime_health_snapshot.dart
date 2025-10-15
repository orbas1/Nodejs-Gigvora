class RuntimeHealthSnapshot {
  const RuntimeHealthSnapshot({
    required this.status,
    required this.httpStatus,
    required this.timestamp,
    required this.dependencies,
    this.supportContact,
    this.totalPerimeterBlocks = 0,
  });

  factory RuntimeHealthSnapshot.fromJson(
    Map<String, dynamic> json, {
    Map<String, dynamic>? maintenance,
    Map<String, dynamic>? perimeter,
  }) {
    final dependencies = Map<String, dynamic>.from(json['dependencies'] as Map? ?? const <String, dynamic>{});
    final maintenanceData = maintenance ?? Map<String, dynamic>.from(json['maintenance'] as Map? ?? const <String, dynamic>{});
    final perimeterData = perimeter ?? Map<String, dynamic>.from(json['perimeter'] as Map? ?? const <String, dynamic>{});
    return RuntimeHealthSnapshot(
      status: (json['status'] as String? ?? 'unknown').toLowerCase(),
      httpStatus: json['httpStatus'] is num ? (json['httpStatus'] as num).toInt() : 503,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      dependencies: dependencies,
      supportContact: maintenanceData['supportContact'] as String?,
      totalPerimeterBlocks: perimeterData['totalBlocked'] is num ? (perimeterData['totalBlocked'] as num).toInt() : 0,
    );
  }

  final String status;
  final int httpStatus;
  final DateTime timestamp;
  final Map<String, dynamic> dependencies;
  final String? supportContact;
  final int totalPerimeterBlocks;

  bool get healthy => status == 'ok' || status == 'ready';
}
