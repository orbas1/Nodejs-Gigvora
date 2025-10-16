class ConsentPolicyInfo {
  ConsentPolicyInfo({
    required this.id,
    required this.code,
    required this.title,
    required this.audience,
    required this.region,
    required this.legalBasis,
    required this.required,
    required this.revocable,
    this.retentionPeriodDays,
    this.description,
  });

  final int id;
  final String code;
  final String title;
  final String audience;
  final String region;
  final String legalBasis;
  final bool required;
  final bool revocable;
  final int? retentionPeriodDays;
  final String? description;

  factory ConsentPolicyInfo.fromJson(Map<String, dynamic> json) {
    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) return int.tryParse(value);
      return null;
    }

    return ConsentPolicyInfo(
      id: parseInt(json['id']) ?? 0,
      code: json['code'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled policy',
      audience: (json['audience'] as String? ?? 'user').toLowerCase(),
      region: (json['region'] as String? ?? 'global').toLowerCase(),
      legalBasis: json['legalBasis'] as String? ?? 'unknown',
      required: json['required'] as bool? ?? false,
      revocable: json['revocable'] as bool? ?? true,
      retentionPeriodDays: parseInt(json['retentionPeriodDays']),
      description: json['description'] as String?,
    );
  }
}

class UserConsentDecision {
  UserConsentDecision({
    required this.id,
    required this.policyId,
    required this.policyVersionId,
    required this.status,
    this.grantedAt,
    this.withdrawnAt,
    this.source,
  });

  final int id;
  final int policyId;
  final int policyVersionId;
  final String status;
  final DateTime? grantedAt;
  final DateTime? withdrawnAt;
  final String? source;

  factory UserConsentDecision.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value is String && value.isNotEmpty) {
        return DateTime.tryParse(value);
      }
      return null;
    }

    int parseInt(dynamic value) {
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) {
        final parsed = int.tryParse(value);
        if (parsed != null) return parsed;
      }
      return 0;
    }

    return UserConsentDecision(
      id: parseInt(json['id']),
      policyId: parseInt(json['policyId']),
      policyVersionId: parseInt(json['policyVersionId']),
      status: (json['status'] as String? ?? 'withdrawn').toLowerCase(),
      grantedAt: parseDate(json['grantedAt']),
      withdrawnAt: parseDate(json['withdrawnAt']),
      source: json['source'] as String?,
    );
  }
}

class ConsentAuditEventInfo {
  ConsentAuditEventInfo({
    required this.id,
    required this.action,
    this.occurredAt,
    this.actorLabel,
    this.metadata,
    this.version,
    this.versionEffectiveAt,
    this.versionSupersededAt,
    this.consentStatus,
    this.consentGrantedAt,
    this.consentWithdrawnAt,
  });

  final int id;
  final String action;
  final DateTime? occurredAt;
  final String? actorLabel;
  final Map<String, dynamic>? metadata;
  final int? version;
  final DateTime? versionEffectiveAt;
  final DateTime? versionSupersededAt;
  final String? consentStatus;
  final DateTime? consentGrantedAt;
  final DateTime? consentWithdrawnAt;

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) {
      return int.tryParse(value);
    }
    return null;
  }

  factory ConsentAuditEventInfo.fromJson(Map<String, dynamic> json) {
    final actor = json['actor'] as Map<String, dynamic>?;
    final actorType = actor?['type'] as String? ?? 'system';
    final actorId = actor?['id'];
    final actorLabel = actorId != null ? '$actorType • $actorId' : actorType;

    final versionJson = json['policyVersion'] as Map<String, dynamic>?;
    final consentJson = json['userConsent'] as Map<String, dynamic>?;

    return ConsentAuditEventInfo(
      id: _parseInt(json['id']) ?? 0,
      action: json['action'] as String? ?? 'unknown_event',
      occurredAt: _parseDate(json['occurredAt']),
      actorLabel: actorLabel,
      metadata: json['metadata'] is Map<String, dynamic> ? json['metadata'] as Map<String, dynamic> : null,
      version: _parseInt(versionJson?['version']),
      versionEffectiveAt: _parseDate(versionJson?['effectiveAt']),
      versionSupersededAt: _parseDate(versionJson?['supersededAt']),
      consentStatus: consentJson?['status'] as String?,
      consentGrantedAt: _parseDate(consentJson?['grantedAt']),
      consentWithdrawnAt: _parseDate(consentJson?['withdrawnAt']),
    );
  }
}

class ConsentSnapshotEntry {
  ConsentSnapshotEntry({
    required this.policy,
    this.consent,
    this.auditTrail = const [],
  });

  final ConsentPolicyInfo policy;
  final UserConsentDecision? consent;
  final List<ConsentAuditEventInfo> auditTrail;

  factory ConsentSnapshotEntry.fromJson(Map<String, dynamic> json) {
    return ConsentSnapshotEntry(
      policy: ConsentPolicyInfo.fromJson(json['policy'] as Map<String, dynamic>),
      consent: json['consent'] == null
          ? null
          : UserConsentDecision.fromJson(json['consent'] as Map<String, dynamic>),
      auditTrail: (json['auditTrail'] as List<dynamic>? ?? const [])
          .map((entry) => ConsentAuditEventInfo.fromJson(entry as Map<String, dynamic>))
          .toList(),
    );
  }
}

class UserConsentSnapshot {
  UserConsentSnapshot({
    required this.userId,
    required this.entries,
    required this.outstandingRequired,
    required this.fetchedAt,
  });

  final int userId;
  final List<ConsentSnapshotEntry> entries;
  final int outstandingRequired;
  final DateTime fetchedAt;

  factory UserConsentSnapshot.fromJson(Map<String, dynamic> json) {
    final policiesJson = json['policies'] as List<dynamic>? ?? const [];
    return UserConsentSnapshot(
      userId: json['userId'] is int
          ? json['userId'] as int
          : int.tryParse('${json['userId']}') ?? 0,
      entries: policiesJson
          .map((item) => ConsentSnapshotEntry.fromJson(item as Map<String, dynamic>))
          .toList(),
      outstandingRequired: json['outstandingRequired'] is int
          ? json['outstandingRequired'] as int
          : int.tryParse('${json['outstandingRequired']}') ?? 0,
      fetchedAt: DateTime.now(),
    );
  }

  int get grantedCount => entries.where((entry) => entry.consent?.status == 'granted').length;
}
