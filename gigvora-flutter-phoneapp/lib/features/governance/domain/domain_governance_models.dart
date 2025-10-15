class DomainGovernanceSummaryResponse {
  DomainGovernanceSummaryResponse({
    required this.contexts,
    required this.generatedAt,
  });

  final List<DomainGovernanceSummary> contexts;
  final DateTime generatedAt;
}

class DomainGovernanceSummary {
  DomainGovernanceSummary({
    required this.contextName,
    required this.displayName,
    this.description,
    this.dataClassification,
    this.ownerTeam,
    this.dataSteward,
    required this.piiModelCount,
    required this.piiFieldCount,
    required this.reviewStatus,
    this.reviewedAt,
    this.nextReviewDueAt,
    this.automationCoverage,
    this.remediationItems,
  });

  final String contextName;
  final String displayName;
  final String? description;
  final String? dataClassification;
  final String? ownerTeam;
  final String? dataSteward;
  final int piiModelCount;
  final int piiFieldCount;
  final String reviewStatus;
  final DateTime? reviewedAt;
  final DateTime? nextReviewDueAt;
  final double? automationCoverage;
  final int? remediationItems;

  factory DomainGovernanceSummary.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value is String && value.isNotEmpty) {
        return DateTime.tryParse(value);
      }
      return null;
    }

    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      if (value is String) {
        return double.tryParse(value);
      }
      return null;
    }

    int? parseInt(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is num) return value.toInt();
      if (value is String) return int.tryParse(value);
      return null;
    }

    return DomainGovernanceSummary(
      contextName: json['contextName'] as String? ?? json['name'] as String? ?? 'unknown',
      displayName: json['displayName'] as String? ?? json['contextName'] as String? ?? 'Unknown context',
      description: json['description'] as String?,
      dataClassification: json['dataClassification'] as String?,
      ownerTeam: json['ownerTeam'] as String?,
      dataSteward: json['dataSteward'] as String?,
      piiModelCount: parseInt(json['piiModelCount']) ?? 0,
      piiFieldCount: parseInt(json['piiFieldCount']) ?? 0,
      reviewStatus: (json['reviewStatus'] as String? ?? 'unknown').toLowerCase(),
      reviewedAt: parseDate(json['reviewedAt']),
      nextReviewDueAt: parseDate(json['nextReviewDueAt']),
      automationCoverage: parseDouble(json['automationCoverage']),
      remediationItems: parseInt(json['remediationItems']),
    );
  }
}

class DomainGovernanceDetail {
  DomainGovernanceDetail({
    required this.context,
    required this.models,
    this.ownerTeam,
    this.dataSteward,
    this.dataClassification,
    this.businessCriticality,
    this.defaultRetention,
    this.dataResidency,
    this.regulatoryFrameworks = const [],
    this.qualityChecks = const [],
    this.piiModelCount = 0,
    this.piiFieldCount = 0,
    this.review,
  });

  final GovernanceContext context;
  final List<GovernanceModel> models;
  final String? ownerTeam;
  final String? dataSteward;
  final String? dataClassification;
  final String? businessCriticality;
  final String? defaultRetention;
  final Map<String, dynamic>? dataResidency;
  final List<String> regulatoryFrameworks;
  final List<Map<String, dynamic>> qualityChecks;
  final int piiModelCount;
  final int piiFieldCount;
  final GovernanceReview? review;

  factory DomainGovernanceDetail.fromJson(Map<String, dynamic> json) {
    final modelsJson = json['models'] as List<dynamic>? ?? const [];
    return DomainGovernanceDetail(
      context: GovernanceContext.fromJson(json['context'] as Map<String, dynamic>? ?? const {}),
      models: modelsJson.map((model) => GovernanceModel.fromJson(model as Map<String, dynamic>)).toList(),
      ownerTeam: json['ownerTeam'] as String?,
      dataSteward: json['dataSteward'] as String?,
      dataClassification: json['dataClassification'] as String?,
      businessCriticality: json['businessCriticality'] as String?,
      defaultRetention: json['defaultRetention'] as String?,
      dataResidency: json['dataResidency'] as Map<String, dynamic>?,
      regulatoryFrameworks:
          (json['regulatoryFrameworks'] as List<dynamic>? ?? const []).map((item) => '$item').toList(),
      qualityChecks:
          (json['qualityChecks'] as List<dynamic>? ?? const []).map((item) => item as Map<String, dynamic>).toList(),
      piiModelCount: json['piiModelCount'] as int? ?? 0,
      piiFieldCount: json['piiFieldCount'] as int? ?? 0,
      review: json['review'] == null
          ? null
          : GovernanceReview.fromJson(json['review'] as Map<String, dynamic>),
    );
  }
}

class GovernanceContext {
  GovernanceContext({
    required this.name,
    required this.displayName,
    this.description,
    this.metadata,
  });

  final String name;
  final String displayName;
  final String? description;
  final Map<String, dynamic>? metadata;

  factory GovernanceContext.fromJson(Map<String, dynamic> json) {
    return GovernanceContext(
      name: json['name'] as String? ?? 'unknown',
      displayName: json['displayName'] as String? ?? json['name'] as String? ?? 'Unknown context',
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}

class GovernanceModel {
  GovernanceModel({
    required this.name,
    required this.tableName,
    required this.piiFields,
    required this.attributes,
    this.retention,
    this.classification,
  });

  final String name;
  final String? tableName;
  final List<String> piiFields;
  final List<GovernanceAttribute> attributes;
  final String? retention;
  final String? classification;

  factory GovernanceModel.fromJson(Map<String, dynamic> json) {
    final attributesJson = json['attributes'] as List<dynamic>? ?? const [];
    return GovernanceModel(
      name: json['name'] as String? ?? 'Unknown',
      tableName: json['tableName'] as String?,
      piiFields: (json['piiFields'] as List<dynamic>? ?? const []).map((item) => '$item').toList(),
      attributes: attributesJson
          .map((attribute) => GovernanceAttribute.fromJson(attribute as Map<String, dynamic>))
          .toList(),
      retention: json['retention'] as String?,
      classification: json['classification'] as String?,
    );
  }
}

class GovernanceAttribute {
  GovernanceAttribute({
    required this.name,
    this.type,
    required this.allowNull,
    required this.pii,
    this.retention,
    this.description,
  });

  final String name;
  final String? type;
  final bool allowNull;
  final bool pii;
  final String? retention;
  final String? description;

  factory GovernanceAttribute.fromJson(Map<String, dynamic> json) {
    return GovernanceAttribute(
      name: json['name'] as String? ?? 'field',
      type: json['type'] as String?,
      allowNull: json['allowNull'] as bool? ?? true,
      pii: json['pii'] as bool? ?? false,
      retention: json['retention'] as String?,
      description: json['description'] as String?,
    );
  }
}

class GovernanceReview {
  GovernanceReview({
    required this.reviewStatus,
    this.ownerTeam,
    this.dataSteward,
    this.reviewedAt,
    this.nextReviewDueAt,
    this.scorecard,
    this.notes,
  });

  final String reviewStatus;
  final String? ownerTeam;
  final String? dataSteward;
  final DateTime? reviewedAt;
  final DateTime? nextReviewDueAt;
  final Map<String, dynamic>? scorecard;
  final String? notes;

  factory GovernanceReview.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic value) {
      if (value is String && value.isNotEmpty) {
        return DateTime.tryParse(value);
      }
      return null;
    }

    return GovernanceReview(
      reviewStatus: (json['reviewStatus'] as String? ?? 'unknown').toLowerCase(),
      ownerTeam: json['ownerTeam'] as String?,
      dataSteward: json['dataSteward'] as String?,
      reviewedAt: parseDate(json['reviewedAt']),
      nextReviewDueAt: parseDate(json['nextReviewDueAt']),
      scorecard: json['scorecard'] as Map<String, dynamic>?,
      notes: json['notes'] as String?,
    );
  }
}
