class AnalyticsMetric {
  const AnalyticsMetric({
    required this.label,
    required this.value,
    this.delta,
    this.trend,
  });

  final String label;
  final String value;
  final String? delta;
  final String? trend;

  factory AnalyticsMetric.fromJson(Map<String, dynamic> json) {
    return AnalyticsMetric(
      label: json['label'] as String? ?? 'Metric',
      value: json['value'] as String? ?? '—',
      delta: json['delta'] as String?,
      trend: json['trend'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'value': value,
      'delta': delta,
      'trend': trend,
    };
  }
}

class ForecastInsight {
  const ForecastInsight({
    required this.projectedHires,
    required this.backlog,
    required this.timeToFillDays,
    required this.atRiskProjects,
    this.confidence,
    this.signals = const <String>[],
    this.lastSynced,
  });

  final double? projectedHires;
  final double? backlog;
  final double? timeToFillDays;
  final double? atRiskProjects;
  final double? confidence;
  final List<String> signals;
  final DateTime? lastSynced;

  factory ForecastInsight.fromJson(Map<String, dynamic> json) {
    return ForecastInsight(
      projectedHires: (json['projectedHires'] as num?)?.toDouble(),
      backlog: (json['backlog'] as num?)?.toDouble(),
      timeToFillDays: (json['timeToFillDays'] as num?)?.toDouble(),
      atRiskProjects: (json['atRiskProjects'] as num?)?.toDouble(),
      confidence: (json['confidence'] as num?)?.toDouble(),
      signals: (json['signals'] as List?)
              ?.map((item) => '$item')
              .where((item) => item.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
      lastSynced: json['lastSynced'] != null ? DateTime.tryParse('${json['lastSynced']}') : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'projectedHires': projectedHires,
      'backlog': backlog,
      'timeToFillDays': timeToFillDays,
      'atRiskProjects': atRiskProjects,
      'confidence': confidence,
      'signals': signals,
      'lastSynced': lastSynced?.toIso8601String(),
    };
  }
}

class ScenarioPlan {
  const ScenarioPlan({
    required this.name,
    required this.hiringPlan,
    required this.budgetImpact,
    required this.probability,
    this.status,
    this.summary,
  });

  final String name;
  final double? hiringPlan;
  final double? budgetImpact;
  final double? probability;
  final String? status;
  final String? summary;

  factory ScenarioPlan.fromJson(Map<String, dynamic> json) {
    return ScenarioPlan(
      name: json['name'] as String? ?? json['title'] as String? ?? 'Scenario',
      hiringPlan: (json['hiringPlan'] as num?)?.toDouble(),
      budgetImpact: (json['budgetImpact'] as num?)?.toDouble(),
      probability: (json['probability'] as num?)?.toDouble(),
      status: json['status'] as String?,
      summary: json['summary'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'hiringPlan': hiringPlan,
      'budgetImpact': budgetImpact,
      'probability': probability,
      'status': status,
      'summary': summary,
    };
  }
}

class ConversionStage {
  const ConversionStage({
    required this.stage,
    required this.conversionRate,
    required this.dropOffRate,
    required this.medianTimeDays,
  });

  final String stage;
  final double? conversionRate;
  final double? dropOffRate;
  final double? medianTimeDays;

  factory ConversionStage.fromJson(Map<String, dynamic> json) {
    return ConversionStage(
      stage: json['stage'] as String? ?? json['name'] as String? ?? 'Stage',
      conversionRate: (json['conversionRate'] as num?)?.toDouble(),
      dropOffRate: (json['dropOffRate'] as num?)?.toDouble(),
      medianTimeDays: (json['medianTimeDays'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stage': stage,
      'conversionRate': conversionRate,
      'dropOffRate': dropOffRate,
      'medianTimeDays': medianTimeDays,
    };
  }
}

class ConversionSnapshot {
  const ConversionSnapshot({
    required this.applicationToInterview,
    required this.interviewToOffer,
    required this.offerToHire,
    required this.cycleTimeDays,
    this.pipelineVelocity,
    this.stages = const <ConversionStage>[],
  });

  final double? applicationToInterview;
  final double? interviewToOffer;
  final double? offerToHire;
  final double? cycleTimeDays;
  final double? pipelineVelocity;
  final List<ConversionStage> stages;

  factory ConversionSnapshot.fromJson(Map<String, dynamic> json) {
    return ConversionSnapshot(
      applicationToInterview: (json['applicationToInterview'] as num?)?.toDouble(),
      interviewToOffer: (json['interviewToOffer'] as num?)?.toDouble(),
      offerToHire: (json['offerToHire'] as num?)?.toDouble(),
      cycleTimeDays: (json['cycleTimeDays'] as num?)?.toDouble(),
      pipelineVelocity: (json['pipelineVelocity'] as num?)?.toDouble(),
      stages: (json['stages'] as List?)
              ?.map((item) => ConversionStage.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <ConversionStage>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'applicationToInterview': applicationToInterview,
      'interviewToOffer': interviewToOffer,
      'offerToHire': offerToHire,
      'cycleTimeDays': cycleTimeDays,
      'pipelineVelocity': pipelineVelocity,
      'stages': stages.map((stage) => stage.toJson()).toList(growable: false),
    };
  }
}

class WorkforcePlanAlignment {
  const WorkforcePlanAlignment({
    required this.headcountPlan,
    required this.headcountActual,
    required this.variance,
    required this.budgetPlan,
    required this.budgetActual,
  });

  final double? headcountPlan;
  final double? headcountActual;
  final double? variance;
  final double? budgetPlan;
  final double? budgetActual;

  factory WorkforcePlanAlignment.fromJson(Map<String, dynamic> json) {
    return WorkforcePlanAlignment(
      headcountPlan: (json['headcountPlan'] as num?)?.toDouble(),
      headcountActual: (json['headcountActual'] as num?)?.toDouble(),
      variance: (json['variance'] as num?)?.toDouble(),
      budgetPlan: (json['budgetPlan'] as num?)?.toDouble(),
      budgetActual: (json['budgetActual'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'headcountPlan': headcountPlan,
      'headcountActual': headcountActual,
      'variance': variance,
      'budgetPlan': budgetPlan,
      'budgetActual': budgetActual,
    };
  }
}

class WorkforcePulse {
  const WorkforcePulse({
    required this.attritionRisk,
    required this.mobilityOpportunities,
    required this.skillGapAlerts,
    this.planAlignment,
    this.signals = const <String>[],
    this.cohortHighlights = const <String>[],
  });

  final double? attritionRisk;
  final double? mobilityOpportunities;
  final double? skillGapAlerts;
  final WorkforcePlanAlignment? planAlignment;
  final List<String> signals;
  final List<String> cohortHighlights;

  factory WorkforcePulse.fromJson(Map<String, dynamic> json) {
    return WorkforcePulse(
      attritionRisk: (json['attritionRisk'] as num?)?.toDouble(),
      mobilityOpportunities: (json['mobilityOpportunities'] as num?)?.toDouble(),
      skillGapAlerts: (json['skillGapAlerts'] as num?)?.toDouble(),
      planAlignment: json['planAlignment'] is Map
          ? WorkforcePlanAlignment.fromJson(Map<String, dynamic>.from(json['planAlignment'] as Map))
          : null,
      signals: (json['signals'] as List?)
              ?.map((item) => '$item')
              .where((item) => item.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
      cohortHighlights: (json['cohortHighlights'] as List?)
              ?.map((item) => '$item')
              .where((item) => item.isNotEmpty)
              .toList(growable: false) ??
          const <String>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'attritionRisk': attritionRisk,
      'mobilityOpportunities': mobilityOpportunities,
      'skillGapAlerts': skillGapAlerts,
      'planAlignment': planAlignment?.toJson(),
      'signals': signals,
      'cohortHighlights': cohortHighlights,
    };
  }
}

class AlertEvent {
  const AlertEvent({
    required this.title,
    required this.severity,
    required this.detectedAt,
    this.owner,
  });

  final String title;
  final String severity;
  final DateTime? detectedAt;
  final String? owner;

  factory AlertEvent.fromJson(Map<String, dynamic> json) {
    return AlertEvent(
      title: json['title'] as String? ?? 'Alert',
      severity: json['severity'] as String? ?? 'info',
      detectedAt: json['detectedAt'] != null ? DateTime.tryParse('${json['detectedAt']}') : null,
      owner: json['owner'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'severity': severity,
      'detectedAt': detectedAt?.toIso8601String(),
      'owner': owner,
    };
  }
}

class AnalyticsAlerting {
  const AnalyticsAlerting({
    required this.openAlerts,
    required this.criticalAlerts,
    required this.dataFreshnessMinutes,
    this.recent = const <AlertEvent>[],
  });

  final int? openAlerts;
  final int? criticalAlerts;
  final double? dataFreshnessMinutes;
  final List<AlertEvent> recent;

  factory AnalyticsAlerting.fromJson(Map<String, dynamic> json) {
    return AnalyticsAlerting(
      openAlerts: (json['openAlerts'] as num?)?.toInt(),
      criticalAlerts: (json['criticalAlerts'] as num?)?.toInt(),
      dataFreshnessMinutes: (json['dataFreshnessMinutes'] as num?)?.toDouble(),
      recent: (json['recent'] as List?)
              ?.map((item) => AlertEvent.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AlertEvent>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'openAlerts': openAlerts,
      'criticalAlerts': criticalAlerts,
      'dataFreshnessMinutes': dataFreshnessMinutes,
      'recent': recent.map((alert) => alert.toJson()).toList(growable: false),
    };
  }
}

class CompanyAnalyticsDashboard {
  const CompanyAnalyticsDashboard({
    required this.summary,
    required this.forecast,
    required this.scenarios,
    required this.conversion,
    required this.workforce,
    required this.alerting,
  });

  final List<AnalyticsMetric> summary;
  final ForecastInsight forecast;
  final List<ScenarioPlan> scenarios;
  final ConversionSnapshot conversion;
  final WorkforcePulse workforce;
  final AnalyticsAlerting alerting;

  factory CompanyAnalyticsDashboard.fromJson(Map<String, dynamic> json) {
    return CompanyAnalyticsDashboard(
      summary: (json['summary'] as List?)
              ?.map((item) => AnalyticsMetric.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AnalyticsMetric>[],
      forecast: json['forecast'] is Map
          ? ForecastInsight.fromJson(Map<String, dynamic>.from(json['forecast'] as Map))
          : const ForecastInsight(projectedHires: null, backlog: null, timeToFillDays: null, atRiskProjects: null),
      scenarios: (json['scenarios'] as List?)
              ?.map((item) => ScenarioPlan.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <ScenarioPlan>[],
      conversion: json['conversion'] is Map
          ? ConversionSnapshot.fromJson(Map<String, dynamic>.from(json['conversion'] as Map))
          : const ConversionSnapshot(
              applicationToInterview: null,
              interviewToOffer: null,
              offerToHire: null,
              cycleTimeDays: null,
            ),
      workforce: json['workforce'] is Map
          ? WorkforcePulse.fromJson(Map<String, dynamic>.from(json['workforce'] as Map))
          : const WorkforcePulse(attritionRisk: null, mobilityOpportunities: null, skillGapAlerts: null),
      alerting: json['alerting'] is Map
          ? AnalyticsAlerting.fromJson(Map<String, dynamic>.from(json['alerting'] as Map))
          : const AnalyticsAlerting(openAlerts: 0, criticalAlerts: 0, dataFreshnessMinutes: null),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'summary': summary.map((metric) => metric.toJson()).toList(growable: false),
      'forecast': forecast.toJson(),
      'scenarios': scenarios.map((scenario) => scenario.toJson()).toList(growable: false),
      'conversion': conversion.toJson(),
      'workforce': workforce.toJson(),
      'alerting': alerting.toJson(),
    };
  }

  factory CompanyAnalyticsDashboard.empty() {
    return CompanyAnalyticsDashboard(
      summary: const <AnalyticsMetric>[],
      forecast: const ForecastInsight(
        projectedHires: null,
        backlog: null,
        timeToFillDays: null,
        atRiskProjects: null,
      ),
      scenarios: const <ScenarioPlan>[],
      conversion: const ConversionSnapshot(
        applicationToInterview: null,
        interviewToOffer: null,
        offerToHire: null,
        cycleTimeDays: null,
      ),
      workforce: const WorkforcePulse(
        attritionRisk: null,
        mobilityOpportunities: null,
        skillGapAlerts: null,
      ),
      alerting: const AnalyticsAlerting(
        openAlerts: 0,
        criticalAlerts: 0,
        dataFreshnessMinutes: null,
      ),
    );
  }
}
