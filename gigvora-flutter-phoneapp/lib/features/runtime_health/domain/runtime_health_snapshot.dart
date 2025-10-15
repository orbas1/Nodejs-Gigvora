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
    this.metrics,
  });

  factory RuntimeHealthSnapshot.fromJson(
    Map<String, dynamic> json, {
    Map<String, dynamic>? maintenance,
    Map<String, dynamic>? perimeter,
    Map<String, dynamic>? waf,
    Map<String, dynamic>? metrics,
  }) {
    final dependencies = Map<String, dynamic>.from(json['dependencies'] as Map? ?? const <String, dynamic>{});
    final maintenanceData = maintenance ?? Map<String, dynamic>.from(json['maintenance'] as Map? ?? const <String, dynamic>{});
    final perimeterData = perimeter ?? Map<String, dynamic>.from(json['perimeter'] as Map? ?? const <String, dynamic>{});
    final wafData = waf ?? Map<String, dynamic>.from(json['waf'] as Map? ?? const <String, dynamic>{});
    final autoBlockData = Map<String, dynamic>.from(wafData['autoBlock'] as Map? ?? const <String, dynamic>{});
    final metricsData = metrics ?? Map<String, dynamic>.from(json['metrics'] as Map? ?? const <String, dynamic>{});
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
      metrics: metricsData.isEmpty ? null : RuntimeMetricsStatus.fromJson(metricsData),
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
  final RuntimeMetricsStatus? metrics;

  bool get healthy => status == 'ok' || status == 'ready';
  bool get metricsStale => metrics?.isStale ?? false;
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

class RuntimeMetricsStatus {
  const RuntimeMetricsStatus({
    required this.exporter,
    required this.endpoint,
    required this.scrapes,
    required this.stale,
    this.lastScrapeAt,
    this.secondsSinceLastScrape,
    this.staleThresholdSeconds,
    this.rateLimit,
    this.waf,
    this.perimeter,
    this.database,
  });

  factory RuntimeMetricsStatus.fromJson(Map<String, dynamic> json) {
    final rateLimitJson = Map<String, dynamic>.from(json['rateLimit'] as Map? ?? const <String, dynamic>{});
    final wafJson = Map<String, dynamic>.from(json['waf'] as Map? ?? const <String, dynamic>{});
    final perimeterJson = Map<String, dynamic>.from(json['perimeter'] as Map? ?? const <String, dynamic>{});
    final databaseJson = Map<String, dynamic>.from(json['database'] as Map? ?? const <String, dynamic>{});

    return RuntimeMetricsStatus(
      exporter: json['exporter'] as String? ?? 'prometheus',
      endpoint: json['endpoint'] as String? ?? '/health/metrics',
      scrapes: json['scrapes'] is num ? (json['scrapes'] as num).toInt() : 0,
      stale: json['stale'] == true,
      lastScrapeAt: DateTime.tryParse(json['lastScrapeAt'] as String? ?? ''),
      secondsSinceLastScrape: json['secondsSinceLastScrape'] is num
          ? (json['secondsSinceLastScrape'] as num).toInt()
          : null,
      staleThresholdSeconds: json['staleThresholdSeconds'] is num
          ? (json['staleThresholdSeconds'] as num).toInt()
          : null,
      rateLimit: rateLimitJson.isEmpty ? null : RuntimeMetricsRateLimit.fromJson(rateLimitJson),
      waf: wafJson.isEmpty ? null : RuntimeMetricsWaf.fromJson(wafJson),
      perimeter: perimeterJson.isEmpty ? null : RuntimeMetricsPerimeter.fromJson(perimeterJson),
      database: databaseJson.isEmpty ? null : RuntimeMetricsDatabase.fromJson(databaseJson),
    );
  }

  final String exporter;
  final String endpoint;
  final int scrapes;
  final bool stale;
  final DateTime? lastScrapeAt;
  final int? secondsSinceLastScrape;
  final int? staleThresholdSeconds;
  final RuntimeMetricsRateLimit? rateLimit;
  final RuntimeMetricsWaf? waf;
  final RuntimeMetricsPerimeter? perimeter;
  final RuntimeMetricsDatabase? database;

  bool get hasScraped => scrapes > 0;
  bool get isStale => stale;
}

class RuntimeMetricsRateLimit {
  const RuntimeMetricsRateLimit({
    required this.hits,
    required this.allowed,
    required this.blocked,
    required this.blockedRatio,
    required this.activeKeys,
    required this.requestsPerSecond,
  });

  factory RuntimeMetricsRateLimit.fromJson(Map<String, dynamic> json) {
    return RuntimeMetricsRateLimit(
      hits: json['hits'] is num ? (json['hits'] as num).toInt() : 0,
      allowed: json['allowed'] is num ? (json['allowed'] as num).toInt() : 0,
      blocked: json['blocked'] is num ? (json['blocked'] as num).toInt() : 0,
      blockedRatio: json['blockedRatio'] is num ? (json['blockedRatio'] as num).toDouble() : 0,
      activeKeys: json['activeKeys'] is num ? (json['activeKeys'] as num).toInt() : 0,
      requestsPerSecond: json['requestsPerSecond'] is num
          ? (json['requestsPerSecond'] as num).toDouble()
          : 0,
    );
  }

  final int hits;
  final int allowed;
  final int blocked;
  final double blockedRatio;
  final int activeKeys;
  final double requestsPerSecond;
}

class RuntimeMetricsWaf {
  const RuntimeMetricsWaf({
    required this.blockedRequests,
    required this.evaluatedRequests,
    required this.autoBlockEvents,
    required this.activeAutoBlocks,
    this.lastBlockedAt,
  });

  factory RuntimeMetricsWaf.fromJson(Map<String, dynamic> json) {
    return RuntimeMetricsWaf(
      blockedRequests: json['blockedRequests'] is num ? (json['blockedRequests'] as num).toInt() : 0,
      evaluatedRequests: json['evaluatedRequests'] is num ? (json['evaluatedRequests'] as num).toInt() : 0,
      autoBlockEvents: json['autoBlockEvents'] is num ? (json['autoBlockEvents'] as num).toInt() : 0,
      activeAutoBlocks: json['activeAutoBlocks'] is num ? (json['activeAutoBlocks'] as num).toInt() : 0,
      lastBlockedAt: DateTime.tryParse(json['lastBlockedAt'] as String? ?? ''),
    );
  }

  final int blockedRequests;
  final int evaluatedRequests;
  final int autoBlockEvents;
  final int activeAutoBlocks;
  final DateTime? lastBlockedAt;
}

class RuntimeMetricsPerimeter {
  const RuntimeMetricsPerimeter({
    required this.totalBlocked,
    required this.activeOrigins,
    this.lastBlockedAt,
  });

  factory RuntimeMetricsPerimeter.fromJson(Map<String, dynamic> json) {
    return RuntimeMetricsPerimeter(
      totalBlocked: json['totalBlocked'] is num ? (json['totalBlocked'] as num).toInt() : 0,
      activeOrigins: json['activeOrigins'] is num ? (json['activeOrigins'] as num).toInt() : 0,
      lastBlockedAt: DateTime.tryParse(json['lastBlockedAt'] as String? ?? ''),
    );
  }

  final int totalBlocked;
  final int activeOrigins;
  final DateTime? lastBlockedAt;
}

class RuntimeMetricsDatabase {
  const RuntimeMetricsDatabase({
    this.vendor,
    this.size = 0,
    this.available = 0,
    this.borrowed = 0,
    this.pending = 0,
    this.updatedAt,
  });

  factory RuntimeMetricsDatabase.fromJson(Map<String, dynamic> json) {
    return RuntimeMetricsDatabase(
      vendor: json['vendor'] as String?,
      size: json['size'] is num ? (json['size'] as num).toInt() : 0,
      available: json['available'] is num ? (json['available'] as num).toInt() : 0,
      borrowed: json['borrowed'] is num ? (json['borrowed'] as num).toInt() : 0,
      pending: json['pending'] is num ? (json['pending'] as num).toInt() : 0,
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? ''),
    );
  }

  final String? vendor;
  final int size;
  final int available;
  final int borrowed;
  final int pending;
  final DateTime? updatedAt;
}
