import 'dart:convert';

enum IntegrationStatus { connected, actionRequired, notConnected, degraded }

enum IncidentStatus { open, monitoring, resolved }

enum IncidentSeverity { low, medium, high, critical }

IntegrationStatus integrationStatusFromString(String? value) {
  switch (value) {
    case 'connected':
      return IntegrationStatus.connected;
    case 'action_required':
      return IntegrationStatus.actionRequired;
    case 'degraded':
      return IntegrationStatus.degraded;
    case 'not_connected':
    default:
      return IntegrationStatus.notConnected;
  }
}

String integrationStatusToString(IntegrationStatus status) {
  switch (status) {
    case IntegrationStatus.connected:
      return 'connected';
    case IntegrationStatus.actionRequired:
      return 'action_required';
    case IntegrationStatus.degraded:
      return 'degraded';
    case IntegrationStatus.notConnected:
      return 'not_connected';
  }
}

IncidentStatus incidentStatusFromString(String? value) {
  switch (value) {
    case 'monitoring':
      return IncidentStatus.monitoring;
    case 'resolved':
      return IncidentStatus.resolved;
    case 'open':
    default:
      return IncidentStatus.open;
  }
}

String incidentStatusToString(IncidentStatus status) {
  switch (status) {
    case IncidentStatus.monitoring:
      return 'monitoring';
    case IncidentStatus.resolved:
      return 'resolved';
    case IncidentStatus.open:
    default:
      return 'open';
  }
}

IncidentSeverity incidentSeverityFromString(String? value) {
  switch (value) {
    case 'medium':
      return IncidentSeverity.medium;
    case 'high':
      return IncidentSeverity.high;
    case 'critical':
      return IncidentSeverity.critical;
    case 'low':
    default:
      return IncidentSeverity.low;
  }
}

String incidentSeverityToString(IncidentSeverity severity) {
  switch (severity) {
    case IncidentSeverity.medium:
      return 'medium';
    case IncidentSeverity.high:
      return 'high';
    case IncidentSeverity.critical:
      return 'critical';
    case IncidentSeverity.low:
    default:
      return 'low';
  }
}

class IntegrationIncident {
  const IntegrationIncident({
    required this.id,
    required this.summary,
    required this.openedAt,
    this.status = IncidentStatus.open,
    this.severity = IncidentSeverity.low,
    this.resolvedAt,
  });

  final String id;
  final String summary;
  final DateTime openedAt;
  final IncidentStatus status;
  final IncidentSeverity severity;
  final DateTime? resolvedAt;

  factory IntegrationIncident.fromJson(Map<String, dynamic> json) {
    return IntegrationIncident(
      id: json['id']?.toString() ?? 'incident-${DateTime.now().millisecondsSinceEpoch}',
      summary: json['summary']?.toString() ?? 'Integration incident',
      openedAt: DateTime.tryParse(json['openedAt']?.toString() ?? '') ?? DateTime.now(),
      status: incidentStatusFromString(json['status']?.toString()),
      severity: incidentSeverityFromString(json['severity']?.toString()),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.tryParse(json['resolvedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'summary': summary,
      'openedAt': openedAt.toIso8601String(),
      'status': incidentStatusToString(status),
      'severity': incidentSeverityToString(severity),
      if (resolvedAt != null) 'resolvedAt': resolvedAt!.toIso8601String(),
    };
  }

  IntegrationIncident close() {
    return IntegrationIncident(
      id: id,
      summary: summary,
      openedAt: openedAt,
      status: IncidentStatus.resolved,
      severity: severity,
      resolvedAt: DateTime.now(),
    );
  }
}

class IntegrationConnector {
  const IntegrationConnector({
    required this.key,
    required this.name,
    required this.description,
    required this.category,
    required this.owner,
    required this.status,
    required this.scopes,
    required this.regions,
    required this.compliance,
    this.lastSyncedAt,
    this.connectedAt,
    this.requiresApiKey = false,
    this.apiKeyFingerprint,
    this.incidents = const <IntegrationIncident>[],
  });

  final String key;
  final String name;
  final String description;
  final String category;
  final String owner;
  final IntegrationStatus status;
  final List<String> scopes;
  final List<String> regions;
  final List<String> compliance;
  final DateTime? lastSyncedAt;
  final DateTime? connectedAt;
  final bool requiresApiKey;
  final String? apiKeyFingerprint;
  final List<IntegrationIncident> incidents;

  bool get hasOpenIncident => incidents.any((incident) => incident.status != IncidentStatus.resolved);

  IntegrationConnector copyWith({
    IntegrationStatus? status,
    DateTime? lastSyncedAt,
    DateTime? connectedAt,
    bool? requiresApiKey,
    String? apiKeyFingerprint,
    List<IntegrationIncident>? incidents,
  }) {
    return IntegrationConnector(
      key: key,
      name: name,
      description: description,
      category: category,
      owner: owner,
      status: status ?? this.status,
      scopes: scopes,
      regions: regions,
      compliance: compliance,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      connectedAt: connectedAt ?? this.connectedAt,
      requiresApiKey: requiresApiKey ?? this.requiresApiKey,
      apiKeyFingerprint: apiKeyFingerprint ?? this.apiKeyFingerprint,
      incidents: incidents ?? this.incidents,
    );
  }

  factory IntegrationConnector.fromJson(Map<String, dynamic> json) {
    return IntegrationConnector(
      key: json['key']?.toString() ?? json['id']?.toString() ?? 'connector-${DateTime.now().millisecondsSinceEpoch}',
      name: json['name']?.toString() ?? 'Integration',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'general',
      owner: json['owner']?.toString() ?? 'Operations',
      status: integrationStatusFromString(json['status']?.toString()),
      scopes: (json['scopes'] as List?)?.map((value) => value.toString()).toList(growable: false) ?? const <String>[],
      regions: (json['regions'] as List?)?.map((value) => value.toString()).toList(growable: false) ?? const <String>[],
      compliance:
          (json['compliance'] as List?)?.map((value) => value.toString()).toList(growable: false) ?? const <String>[],
      lastSyncedAt:
          json['lastSyncedAt'] != null ? DateTime.tryParse(json['lastSyncedAt'].toString()) : null,
      connectedAt: json['connectedAt'] != null ? DateTime.tryParse(json['connectedAt'].toString()) : null,
      requiresApiKey: json['requiresApiKey'] == true,
      apiKeyFingerprint: json['apiKeyFingerprint']?.toString(),
      incidents: (json['incidents'] as List?)
              ?.map((value) => IntegrationIncident.fromJson(Map<String, dynamic>.from(value as Map)))
              .toList(growable: false) ??
          const <IntegrationIncident>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'name': name,
      'description': description,
      'category': category,
      'owner': owner,
      'status': integrationStatusToString(status),
      'scopes': scopes,
      'regions': regions,
      'compliance': compliance,
      if (lastSyncedAt != null) 'lastSyncedAt': lastSyncedAt!.toIso8601String(),
      if (connectedAt != null) 'connectedAt': connectedAt!.toIso8601String(),
      'requiresApiKey': requiresApiKey,
      if (apiKeyFingerprint != null) 'apiKeyFingerprint': apiKeyFingerprint,
      'incidents': incidents.map((incident) => incident.toJson()).toList(growable: false),
    };
  }
}

class IntegrationAuditEvent {
  const IntegrationAuditEvent({
    required this.id,
    required this.connector,
    required this.action,
    required this.actor,
    required this.createdAt,
    this.context,
  });

  final String id;
  final String connector;
  final String action;
  final String actor;
  final DateTime createdAt;
  final String? context;

  factory IntegrationAuditEvent.fromJson(Map<String, dynamic> json) {
    return IntegrationAuditEvent(
      id: json['id']?.toString() ?? 'audit-${DateTime.now().millisecondsSinceEpoch}',
      connector: json['connector']?.toString() ?? 'system',
      action: json['action']?.toString() ?? 'updated',
      actor: json['actor']?.toString() ?? 'system',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      context: json['context']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'connector': connector,
      'action': action,
      'actor': actor,
      'createdAt': createdAt.toIso8601String(),
      if (context != null) 'context': context,
    };
  }
}

class IntegrationCategory {
  const IntegrationCategory({
    required this.id,
    required this.title,
    required this.description,
    required this.connectors,
  });

  final String id;
  final String title;
  final String description;
  final List<IntegrationConnector> connectors;

  IntegrationCategory copyWith({List<IntegrationConnector>? connectors}) {
    return IntegrationCategory(
      id: id,
      title: title,
      description: description,
      connectors: connectors ?? this.connectors,
    );
  }

  factory IntegrationCategory.fromJson(Map<String, dynamic> json) {
    final connectors = (json['connectors'] as List?)
            ?.map((value) => IntegrationConnector.fromJson(Map<String, dynamic>.from(value as Map)))
            .toList(growable: false) ??
        const <IntegrationConnector>[];
    return IntegrationCategory(
      id: json['id']?.toString() ?? json['key']?.toString() ?? 'category',
      title: json['title']?.toString() ?? 'Integrations',
      description: json['description']?.toString() ?? '',
      connectors: connectors,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'connectors': connectors.map((connector) => connector.toJson()).toList(growable: false),
    };
  }
}

class IntegrationSummary {
  const IntegrationSummary({
    required this.total,
    required this.connected,
    required this.actionRequired,
    required this.byok,
    required this.byokConfigured,
    required this.openIncidents,
  });

  final int total;
  final int connected;
  final int actionRequired;
  final int byok;
  final int byokConfigured;
  final int openIncidents;

  int get healthScore {
    if (total == 0) {
      return 0;
    }
    final healthy = connected - actionRequired;
    return healthy <= 0 ? 0 : ((healthy / total) * 100).clamp(0, 100).round();
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'connected': connected,
      'actionRequired': actionRequired,
      'byok': byok,
      'byokConfigured': byokConfigured,
      'openIncidents': openIncidents,
      'healthScore': healthScore,
    };
  }

  factory IntegrationSummary.fromConnectors(List<IntegrationConnector> connectors) {
    var connected = 0;
    var actionRequired = 0;
    var byok = 0;
    var byokConfigured = 0;
    var openIncidents = 0;
    for (final connector in connectors) {
      if (connector.status == IntegrationStatus.connected) {
        connected += 1;
      }
      if (connector.status == IntegrationStatus.actionRequired) {
        actionRequired += 1;
      }
      if (connector.requiresApiKey) {
        byok += 1;
        if (connector.apiKeyFingerprint != null) {
          byokConfigured += 1;
        }
      }
      if (connector.hasOpenIncident) {
        openIncidents += 1;
      }
    }
    return IntegrationSummary(
      total: connectors.length,
      connected: connected,
      actionRequired: actionRequired,
      byok: byok,
      byokConfigured: byokConfigured,
      openIncidents: openIncidents,
    );
  }
}

class IntegrationHubOverview {
  const IntegrationHubOverview({
    required this.categories,
    required this.auditLog,
    required this.lastSyncedAt,
  });

  final List<IntegrationCategory> categories;
  final List<IntegrationAuditEvent> auditLog;
  final DateTime? lastSyncedAt;

  bool get isEmpty => categories.isEmpty;

  IntegrationSummary get summary {
    final connectors = categories.expand((category) => category.connectors).toList(growable: false);
    return IntegrationSummary.fromConnectors(connectors);
  }

  IntegrationHubOverview copyWith({
    List<IntegrationCategory>? categories,
    List<IntegrationAuditEvent>? auditLog,
    DateTime? lastSyncedAt,
  }) {
    return IntegrationHubOverview(
      categories: categories ?? this.categories,
      auditLog: auditLog ?? this.auditLog,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
    );
  }

  factory IntegrationHubOverview.empty() {
    return const IntegrationHubOverview(categories: <IntegrationCategory>[], auditLog: <IntegrationAuditEvent>[], lastSyncedAt: null);
  }

  factory IntegrationHubOverview.fromJson(Map<String, dynamic> json) {
    final categories = (json['categories'] as List?)
            ?.map((value) => IntegrationCategory.fromJson(Map<String, dynamic>.from(value as Map)))
            .toList(growable: false) ??
        const <IntegrationCategory>[];
    final auditLog = (json['auditLog'] as List?)
            ?.map((value) => IntegrationAuditEvent.fromJson(Map<String, dynamic>.from(value as Map)))
            .toList(growable: false) ??
        const <IntegrationAuditEvent>[];
    return IntegrationHubOverview(
      categories: categories,
      auditLog: auditLog,
      lastSyncedAt: json['lastSyncedAt'] != null
          ? DateTime.tryParse(json['lastSyncedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'categories': categories.map((category) => category.toJson()).toList(growable: false),
      'auditLog': auditLog.map((event) => event.toJson()).toList(growable: false),
      if (lastSyncedAt != null) 'lastSyncedAt': lastSyncedAt!.toIso8601String(),
      'summary': summary.toJson(),
    };
  }

  String encode() => jsonEncode(toJson());

  static IntegrationHubOverview decode(String raw) {
    return IntegrationHubOverview.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }
}
