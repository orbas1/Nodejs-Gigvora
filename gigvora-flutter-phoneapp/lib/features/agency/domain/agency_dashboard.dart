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

enum AgencyHrAlertSeverity { critical, warning, info }

class AgencyHrAlert {
  const AgencyHrAlert({
    required this.message,
    this.type,
    this.nextAction,
    this.severity = AgencyHrAlertSeverity.warning,
  });

  final String message;
  final String? type;
  final String? nextAction;
  final AgencyHrAlertSeverity severity;
}

class AgencyHrPolicy {
  const AgencyHrPolicy({
    required this.title,
    required this.outstanding,
    this.reviewCycleDays,
    this.effectiveDate,
  });

  final String title;
  final int outstanding;
  final int? reviewCycleDays;
  final DateTime? effectiveDate;
}

class AgencyHrRoleCoverage {
  const AgencyHrRoleCoverage({
    required this.role,
    required this.active,
    required this.hiring,
    required this.bench,
    required this.utilizationRate,
    this.needsAttention = false,
  });

  final String role;
  final int active;
  final int hiring;
  final int bench;
  final double utilizationRate;
  final bool needsAttention;
}

class AgencyHrOnboardingCandidate {
  const AgencyHrOnboardingCandidate({
    required this.name,
    required this.role,
    required this.status,
    this.startDate,
  });

  final String name;
  final String role;
  final String status;
  final DateTime? startDate;
}

class AgencyStaffingSummary {
  const AgencyStaffingSummary({
    required this.totalCapacityHours,
    required this.committedHours,
    required this.benchMembers,
    required this.benchRate,
    required this.summary,
    this.recommendedAction,
  });

  final int totalCapacityHours;
  final int committedHours;
  final int benchMembers;
  final double benchRate;
  final String summary;
  final String? recommendedAction;
}

class AgencyHrSnapshot {
  const AgencyHrSnapshot({
    required this.headcount,
    required this.contractors,
    required this.complianceOutstanding,
    required this.benchHours,
    required this.benchHealthLabel,
    required this.utilizationRate,
    required this.alerts,
    required this.policies,
    required this.roleCoverage,
    required this.staffing,
    required this.onboarding,
  });

  final int headcount;
  final int contractors;
  final int complianceOutstanding;
  final int benchHours;
  final String benchHealthLabel;
  final double utilizationRate;
  final List<AgencyHrAlert> alerts;
  final List<AgencyHrPolicy> policies;
  final List<AgencyHrRoleCoverage> roleCoverage;
  final AgencyStaffingSummary staffing;
  final List<AgencyHrOnboardingCandidate> onboarding;
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
    required this.hr,
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
  final AgencyHrSnapshot hr;
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
    AgencyHrSnapshot? hr,
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
      hr: hr ?? this.hr,
      fromCache: fromCache ?? this.fromCache,
    );
  }
}
