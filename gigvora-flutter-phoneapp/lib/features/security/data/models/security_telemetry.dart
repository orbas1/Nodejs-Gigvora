class SecurityTelemetry {
  const SecurityTelemetry({
    required this.metrics,
    required this.posture,
    required this.patchWindow,
    required this.alerts,
    required this.incidents,
    required this.playbooks,
  });

  final SecurityMetrics metrics;
  final SecurityPosture posture;
  final SecurityPatchWindow patchWindow;
  final List<SecurityAlert> alerts;
  final List<SecurityIncident> incidents;
  final List<SecurityPlaybook> playbooks;

  factory SecurityTelemetry.fromJson(Map<String, dynamic> json) {
    return SecurityTelemetry(
      metrics: SecurityMetrics.fromJson(json['metrics'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      posture: SecurityPosture.fromJson(json['posture'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      patchWindow:
          SecurityPatchWindow.fromJson(json['patchWindow'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      alerts: (json['alerts'] as List<dynamic>? ?? const [])
          .map((item) => SecurityAlert.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      incidents: (json['incidents'] as List<dynamic>? ?? const [])
          .map((item) => SecurityIncident.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      playbooks: (json['playbooks'] as List<dynamic>? ?? const [])
          .map((item) => SecurityPlaybook.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'metrics': metrics.toJson(),
      'posture': posture.toJson(),
      'patchWindow': patchWindow.toJson(),
      'alerts': alerts.map((alert) => alert.toJson()).toList(),
      'incidents': incidents.map((incident) => incident.toJson()).toList(),
      'playbooks': playbooks.map((playbook) => playbook.toJson()).toList(),
    };
  }

  bool get isEmpty =>
      alerts.isEmpty && incidents.isEmpty && playbooks.isEmpty && metrics.blockedIntrusions == 0 && metrics.quarantinedAssets == 0;

  static SecurityTelemetry empty() => SecurityTelemetry(
        metrics: const SecurityMetrics(),
        posture: const SecurityPosture(),
        patchWindow: const SecurityPatchWindow(),
        alerts: const [],
        incidents: const [],
        playbooks: const [],
      );
}

class SecurityMetrics {
  const SecurityMetrics({
    this.blockedIntrusions = 0,
    this.quarantinedAssets = 0,
    this.highRiskVulnerabilities = 0,
    this.meanTimeToRespondMinutes = 0,
  });

  final int blockedIntrusions;
  final int quarantinedAssets;
  final int highRiskVulnerabilities;
  final int meanTimeToRespondMinutes;

  factory SecurityMetrics.fromJson(Map<String, dynamic> json) {
    return SecurityMetrics(
      blockedIntrusions: (json['blockedIntrusions'] as num?)?.round() ?? 0,
      quarantinedAssets: (json['quarantinedAssets'] as num?)?.round() ?? 0,
      highRiskVulnerabilities: (json['highRiskVulnerabilities'] as num?)?.round() ?? 0,
      meanTimeToRespondMinutes: (json['meanTimeToRespondMinutes'] as num?)?.round() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'blockedIntrusions': blockedIntrusions,
        'quarantinedAssets': quarantinedAssets,
        'highRiskVulnerabilities': highRiskVulnerabilities,
        'meanTimeToRespondMinutes': meanTimeToRespondMinutes,
      };
}

class SecurityPosture {
  const SecurityPosture({
    this.status = 'steady',
    this.attackSurfaceScore = 0,
    this.attackSurfaceChange = 0,
    this.signals = const [],
  });

  final String status;
  final int attackSurfaceScore;
  final int attackSurfaceChange;
  final List<String> signals;

  factory SecurityPosture.fromJson(Map<String, dynamic> json) {
    return SecurityPosture(
      status: (json['status'] as String?)?.trim() ?? 'steady',
      attackSurfaceScore: (json['attackSurfaceScore'] as num?)?.round() ?? 0,
      attackSurfaceChange: (json['attackSurfaceChange'] as num?)?.round() ?? 0,
      signals: (json['signals'] as List<dynamic>? ?? const []).map((item) => '$item').toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'attackSurfaceScore': attackSurfaceScore,
        'attackSurfaceChange': attackSurfaceChange,
        'signals': signals,
      };
}

class SecurityPatchWindow {
  const SecurityPatchWindow({
    this.nextWindow,
    this.backlog = 0,
    this.backlogChange = 0,
  });

  final DateTime? nextWindow;
  final int backlog;
  final int backlogChange;

  factory SecurityPatchWindow.fromJson(Map<String, dynamic> json) {
    final value = json['nextWindow'];
    DateTime? nextWindow;
    if (value is String && value.isNotEmpty) {
      nextWindow = DateTime.tryParse(value);
    }
    return SecurityPatchWindow(
      nextWindow: nextWindow,
      backlog: (json['backlog'] as num?)?.round() ?? 0,
      backlogChange: (json['backlogChange'] as num?)?.round() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'nextWindow': nextWindow?.toIso8601String(),
        'backlog': backlog,
        'backlogChange': backlogChange,
      };
}

class SecurityAlert {
  const SecurityAlert({
    required this.id,
    required this.severity,
    required this.category,
    required this.source,
    required this.asset,
    required this.location,
    required this.detectedAt,
    required this.status,
    required this.recommendedAction,
  });

  final String id;
  final String severity;
  final String category;
  final String source;
  final String asset;
  final String location;
  final DateTime detectedAt;
  final String status;
  final String recommendedAction;

  factory SecurityAlert.fromJson(Map<String, dynamic> json) {
    return SecurityAlert(
      id: (json['id'] as String?)?.trim() ?? 'alert-${DateTime.now().millisecondsSinceEpoch}',
      severity: (json['severity'] as String?)?.toLowerCase().trim() ?? 'medium',
      category: (json['category'] as String?)?.trim() ?? 'Threat',
      source: (json['source'] as String?)?.trim() ?? 'Unknown',
      asset: (json['asset'] as String?)?.trim() ?? 'Unassigned asset',
      location: (json['location'] as String?)?.trim() ?? 'global',
      detectedAt: DateTime.tryParse('${json['detectedAt']}') ?? DateTime.now().toUtc(),
      status: (json['status'] as String?)?.trim() ?? 'open',
      recommendedAction: (json['recommendedAction'] as String?)?.trim() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'severity': severity,
        'category': category,
        'source': source,
        'asset': asset,
        'location': location,
        'detectedAt': detectedAt.toIso8601String(),
        'status': status,
        'recommendedAction': recommendedAction,
      };
}

class SecurityIncident {
  const SecurityIncident({
    required this.id,
    required this.title,
    required this.severity,
    required this.owner,
    required this.openedAt,
    required this.status,
    required this.summary,
  });

  final String id;
  final String title;
  final String severity;
  final String owner;
  final DateTime openedAt;
  final String status;
  final String summary;

  factory SecurityIncident.fromJson(Map<String, dynamic> json) {
    return SecurityIncident(
      id: (json['id'] as String?)?.trim() ?? 'incident-${DateTime.now().millisecondsSinceEpoch}',
      title: (json['title'] as String?)?.trim() ?? 'Security incident',
      severity: (json['severity'] as String?)?.toLowerCase().trim() ?? 'medium',
      owner: (json['owner'] as String?)?.trim() ?? 'Security operations',
      openedAt: DateTime.tryParse('${json['openedAt']}') ?? DateTime.now().toUtc(),
      status: (json['status'] as String?)?.trim() ?? 'investigating',
      summary: (json['summary'] as String?)?.trim() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'severity': severity,
        'owner': owner,
        'openedAt': openedAt.toIso8601String(),
        'status': status,
        'summary': summary,
      };
}

class SecurityPlaybook {
  const SecurityPlaybook({
    required this.id,
    required this.name,
    required this.owner,
    required this.runCount,
    required this.lastExecutedAt,
  });

  final String id;
  final String name;
  final String owner;
  final int runCount;
  final DateTime lastExecutedAt;

  factory SecurityPlaybook.fromJson(Map<String, dynamic> json) {
    return SecurityPlaybook(
      id: (json['id'] as String?)?.trim() ?? 'playbook-${DateTime.now().millisecondsSinceEpoch}',
      name: (json['name'] as String?)?.trim() ?? 'Security playbook',
      owner: (json['owner'] as String?)?.trim() ?? 'Security team',
      runCount: (json['runCount'] as num?)?.round() ?? 0,
      lastExecutedAt: DateTime.tryParse('${json['lastExecutedAt']}') ?? DateTime.now().toUtc(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'owner': owner,
        'runCount': runCount,
        'lastExecutedAt': lastExecutedAt.toIso8601String(),
      };
}
