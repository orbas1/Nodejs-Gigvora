class AgencyMetricCard {
  const AgencyMetricCard({
    required this.label,
    required this.value,
    this.caption,
    this.trend,
    this.accentHex = 0xFF2563EB,
  });

  final String label;
  final String value;
  final String? caption;
  final String? trend;
  final int accentHex;
}

enum AgencyAlertSeverity { high, medium, low }

class AgencyAlert {
  const AgencyAlert({
    required this.title,
    required this.message,
    this.severity = AgencyAlertSeverity.medium,
  });

  final String title;
  final String message;
  final AgencyAlertSeverity severity;
}

class AgencySquadSnapshot {
  const AgencySquadSnapshot({
    required this.name,
    required this.focus,
    required this.healthLabel,
    required this.healthScore,
    required this.activeEngagements,
  });

  final String name;
  final String focus;
  final String healthLabel;
  final double healthScore;
  final int activeEngagements;
}

class AgencyBenchMember {
  const AgencyBenchMember({
    required this.name,
    required this.discipline,
    required this.availability,
  });

  final String name;
  final String discipline;
  final String availability;
}

class AgencyPipelineItem {
  const AgencyPipelineItem({
    required this.client,
    required this.value,
    required this.stage,
    required this.nextAction,
  });

  final String client;
  final int value;
  final String stage;
  final DateTime nextAction;
}

class AgencyDashboardSnapshot {
  const AgencyDashboardSnapshot({
    required this.generatedAt,
    required this.lookbackWindowDays,
    required this.metrics,
    required this.alerts,
    required this.squads,
    required this.bench,
    required this.pipeline,
    required this.recommendedActions,
    this.fromCache = false,
  });

  final DateTime generatedAt;
  final int lookbackWindowDays;
  final List<AgencyMetricCard> metrics;
  final List<AgencyAlert> alerts;
  final List<AgencySquadSnapshot> squads;
  final List<AgencyBenchMember> bench;
  final List<AgencyPipelineItem> pipeline;
  final List<String> recommendedActions;
  final bool fromCache;

  AgencyDashboardSnapshot copyWith({
    DateTime? generatedAt,
    bool? fromCache,
    List<AgencyMetricCard>? metrics,
    List<AgencyAlert>? alerts,
    List<AgencySquadSnapshot>? squads,
    List<AgencyBenchMember>? bench,
    List<AgencyPipelineItem>? pipeline,
    List<String>? recommendedActions,
  }) {
    return AgencyDashboardSnapshot(
      generatedAt: generatedAt ?? this.generatedAt,
      lookbackWindowDays: lookbackWindowDays,
      metrics: metrics ?? this.metrics,
      alerts: alerts ?? this.alerts,
      squads: squads ?? this.squads,
      bench: bench ?? this.bench,
      pipeline: pipeline ?? this.pipeline,
      recommendedActions: recommendedActions ?? this.recommendedActions,
      fromCache: fromCache ?? this.fromCache,
    );
  }
}
