class RuntimeHealthSnapshot {
  const RuntimeHealthSnapshot({
    required this.status,
    required this.httpStatus,
    required this.timestamp,
    required this.dependencies,
    this.supportContact,
    this.totalPerimeterBlocks = 0,
    this.wafBlockedRequests = 0,
    this.wafEvaluatedRequests = 0,
    this.wafLastBlockedAt,
    this.wafTopRules = const <Map<String, dynamic>>[],
    this.wafAutoBlock,
  });

  factory RuntimeHealthSnapshot.fromJson(
    Map<String, dynamic> json, {
    Map<String, dynamic>? maintenance,
    Map<String, dynamic>? perimeter,
    Map<String, dynamic>? waf,
  }) {
    final dependencies = Map<String, dynamic>.from(json['dependencies'] as Map? ?? const <String, dynamic>{});
    final maintenanceData = maintenance ?? Map<String, dynamic>.from(json['maintenance'] as Map? ?? const <String, dynamic>{});
    final perimeterData = perimeter ?? Map<String, dynamic>.from(json['perimeter'] as Map? ?? const <String, dynamic>{});
    final wafData = waf ?? Map<String, dynamic>.from(json['waf'] as Map? ?? const <String, dynamic>{});
    final autoBlockData = Map<String, dynamic>.from(wafData['autoBlock'] as Map? ?? const <String, dynamic>{});
    return RuntimeHealthSnapshot(
      status: (json['status'] as String? ?? 'unknown').toLowerCase(),
      httpStatus: json['httpStatus'] is num ? (json['httpStatus'] as num).toInt() : 503,
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      dependencies: dependencies,
      supportContact: maintenanceData['supportContact'] as String?,
      totalPerimeterBlocks: perimeterData['totalBlocked'] is num ? (perimeterData['totalBlocked'] as num).toInt() : 0,
      wafBlockedRequests: wafData['blockedRequests'] is num ? (wafData['blockedRequests'] as num).toInt() : 0,
      wafEvaluatedRequests: wafData['evaluatedRequests'] is num ? (wafData['evaluatedRequests'] as num).toInt() : 0,
      wafLastBlockedAt: DateTime.tryParse(wafData['lastBlockedAt'] as String? ?? ''),
      wafTopRules: List<Map<String, dynamic>>.from(
        (wafData['blockedByRule'] as List? ?? const <Map<String, dynamic>>[]).map(
          (entry) => Map<String, dynamic>.from(entry as Map? ?? const <String, dynamic>{}),
        ),
      ),
      wafAutoBlock: autoBlockData.isEmpty
          ? null
          : RuntimeWafAutoBlockSummary.fromJson(autoBlockData),
    );
  }

  final String status;
  final int httpStatus;
  final DateTime timestamp;
  final Map<String, dynamic> dependencies;
  final String? supportContact;
  final int totalPerimeterBlocks;
  final int wafBlockedRequests;
  final int wafEvaluatedRequests;
  final DateTime? wafLastBlockedAt;
  final List<Map<String, dynamic>> wafTopRules;
  final RuntimeWafAutoBlockSummary? wafAutoBlock;

  bool get healthy => status == 'ok' || status == 'ready';
}

class RuntimeWafAutoBlockSummary {
  const RuntimeWafAutoBlockSummary({
    required this.enabled,
    required this.threshold,
    required this.windowSeconds,
    required this.ttlSeconds,
    required this.totalTriggered,
    required this.active,
    this.lastTriggered,
  });

  factory RuntimeWafAutoBlockSummary.fromJson(Map<String, dynamic> json) {
    final activeEntries = (json['active'] as List? ?? const <Map<String, dynamic>>[])
        .map((entry) => RuntimeWafAutoBlockRecord.fromJson(
              Map<String, dynamic>.from(entry as Map? ?? const <String, dynamic>{}),
            ))
        .toList();
    final lastJson = json['lastTriggered'] as Map?;
    return RuntimeWafAutoBlockSummary(
      enabled: json['enabled'] == true,
      threshold: json['threshold'] is num ? (json['threshold'] as num).toInt() : null,
      windowSeconds: json['windowSeconds'] is num ? (json['windowSeconds'] as num).toInt() : null,
      ttlSeconds: json['ttlSeconds'] is num ? (json['ttlSeconds'] as num).toInt() : null,
      totalTriggered: json['totalTriggered'] is num ? (json['totalTriggered'] as num).toInt() : 0,
      active: activeEntries,
      lastTriggered: lastJson == null
          ? null
          : RuntimeWafAutoBlockRecord.fromJson(
              Map<String, dynamic>.from(lastJson as Map? ?? const <String, dynamic>{}),
            ),
    );
  }

  final bool enabled;
  final int? threshold;
  final int? windowSeconds;
  final int? ttlSeconds;
  final int totalTriggered;
  final List<RuntimeWafAutoBlockRecord> active;
  final RuntimeWafAutoBlockRecord? lastTriggered;

  bool get hasActive => active.isNotEmpty;
}

class RuntimeWafAutoBlockRecord {
  const RuntimeWafAutoBlockRecord({
    required this.ip,
    this.blockedAt,
    this.expiresAt,
    this.hits = 0,
    this.matchedRules = const <Map<String, dynamic>>[],
  });

  factory RuntimeWafAutoBlockRecord.fromJson(Map<String, dynamic> json) {
    return RuntimeWafAutoBlockRecord(
      ip: json['ip'] as String? ?? 'unknown',
      blockedAt: DateTime.tryParse(json['blockedAt'] as String? ?? ''),
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? ''),
      hits: json['hits'] is num ? (json['hits'] as num).toInt() : 0,
      matchedRules: List<Map<String, dynamic>>.from(
        (json['matchedRules'] as List? ?? const <Map<String, dynamic>>[]).map(
          (entry) => Map<String, dynamic>.from(entry as Map? ?? const <String, dynamic>{}),
        ),
      ),
    );
  }

  final String ip;
  final DateTime? blockedAt;
  final DateTime? expiresAt;
  final int hits;
  final List<Map<String, dynamic>> matchedRules;
}
