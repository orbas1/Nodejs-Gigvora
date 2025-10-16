class RbacMatrix {
  const RbacMatrix({
    required this.version,
    required this.publishedAt,
    required this.reviewCadenceDays,
    required this.personas,
    required this.guardrails,
    required this.resources,
  });

  factory RbacMatrix.fromJson(Map<String, dynamic> json) {
    final personasJson = json['personas'] as List<dynamic>? ?? const [];
    final guardrailsJson = json['guardrails'] as List<dynamic>? ?? const [];
    final resourcesJson = json['resources'] as List<dynamic>? ?? const [];
    return RbacMatrix(
      version: (json['version'] ?? '').toString(),
      publishedAt: DateTime.tryParse(json['publishedAt']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
      reviewCadenceDays: json['reviewCadenceDays'] is num ? (json['reviewCadenceDays'] as num).toInt() : null,
      personas: personasJson
          .map((entry) => RbacPersona.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(growable: false),
      guardrails: guardrailsJson
          .map((entry) => RbacGuardrail.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(growable: false),
      resources: resourcesJson
          .map((entry) => RbacResource.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(growable: false),
    );
  }

  final String version;
  final DateTime publishedAt;
  final int? reviewCadenceDays;
  final List<RbacPersona> personas;
  final List<RbacGuardrail> guardrails;
  final List<RbacResource> resources;
}

class RbacPersona {
  const RbacPersona({
    required this.key,
    required this.label,
    required this.description,
    required this.defaultChannels,
    required this.escalationTarget,
    required this.grants,
  });

  factory RbacPersona.fromJson(Map<String, dynamic> json) {
    final grantsJson = json['grants'] as List<dynamic>? ?? const [];
    return RbacPersona(
      key: (json['key'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      defaultChannels: (json['defaultChannels'] as List<dynamic>? ?? const [])
          .map((entry) => entry.toString())
          .toList(growable: false),
      escalationTarget: json['escalationTarget']?.toString(),
      grants: grantsJson
          .map((entry) => RbacGrant.fromJson(Map<String, dynamic>.from(entry as Map)))
          .toList(growable: false),
    );
  }

  final String key;
  final String label;
  final String description;
  final List<String> defaultChannels;
  final String? escalationTarget;
  final List<RbacGrant> grants;
}

class RbacGrant {
  const RbacGrant({
    required this.policyKey,
    required this.resource,
    required this.actions,
    required this.constraints,
    required this.decision,
    required this.auditRetentionDays,
  });

  factory RbacGrant.fromJson(Map<String, dynamic> json) {
    return RbacGrant(
      policyKey: (json['policyKey'] ?? '').toString(),
      resource: (json['resource'] ?? '').toString(),
      actions:
          (json['actions'] as List<dynamic>? ?? const []).map((entry) => entry.toString()).toList(growable: false),
      constraints:
          (json['constraints'] as List<dynamic>? ?? const []).map((entry) => entry.toString()).toList(growable: false),
      decision: (json['decision'] ?? '').toString(),
      auditRetentionDays: json['auditRetentionDays'] is num ? (json['auditRetentionDays'] as num).toInt() : null,
    );
  }

  final String policyKey;
  final String resource;
  final List<String> actions;
  final List<String> constraints;
  final String decision;
  final int? auditRetentionDays;
}

class RbacGuardrail {
  const RbacGuardrail({
    required this.key,
    required this.label,
    required this.description,
    required this.coverage,
    required this.severity,
  });

  factory RbacGuardrail.fromJson(Map<String, dynamic> json) {
    return RbacGuardrail(
      key: (json['key'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      coverage:
          (json['coverage'] as List<dynamic>? ?? const []).map((entry) => entry.toString()).toList(growable: false),
      severity: (json['severity'] ?? '').toString(),
    );
  }

  final String key;
  final String label;
  final String description;
  final List<String> coverage;
  final String severity;
}

class RbacResource {
  const RbacResource({
    required this.key,
    required this.label,
    required this.description,
    required this.owner,
    required this.dataClassification,
    required this.surfaces,
  });

  factory RbacResource.fromJson(Map<String, dynamic> json) {
    return RbacResource(
      key: (json['key'] ?? '').toString(),
      label: (json['label'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      owner: json['owner']?.toString(),
      dataClassification: json['dataClassification']?.toString(),
      surfaces:
          (json['surfaces'] as List<dynamic>? ?? const []).map((entry) => entry.toString()).toList(growable: false),
    );
  }

  final String key;
  final String label;
  final String description;
  final String? owner;
  final String? dataClassification;
  final List<String> surfaces;
}
