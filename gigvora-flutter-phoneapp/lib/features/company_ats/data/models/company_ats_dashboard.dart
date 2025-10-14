class AtsMetric {
  const AtsMetric({
    required this.label,
    required this.value,
    this.caption,
  });

  final String label;
  final String value;
  final String? caption;

  factory AtsMetric.fromJson(Map<String, dynamic> json) {
    return AtsMetric(
      label: json['label'] as String? ?? 'Metric',
      value: json['value'] as String? ?? '—',
      caption: json['caption'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'value': value,
      'caption': caption,
    };
  }
}

class AtsAction {
  const AtsAction({
    required this.label,
    required this.description,
    this.impact,
    this.category,
  });

  final String label;
  final String description;
  final String? impact;
  final String? category;

  factory AtsAction.fromJson(Map<String, dynamic> json) {
    return AtsAction(
      label: json['label'] as String? ?? json['title'] as String? ?? 'Action',
      description: json['description'] as String? ?? '',
      impact: json['impact'] as String?,
      category: json['category'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'description': description,
      'impact': impact,
      'category': category,
    };
  }
}

class AtsReadiness {
  const AtsReadiness({
    required this.maturityScore,
    required this.tier,
    required this.status,
    required this.scoreConfidence,
    required this.dataFreshnessHours,
    required this.measuredSignals,
    required this.expectedSignals,
    this.highlights = const <String>[],
    this.watchouts = const <String>[],
    this.actions = const <AtsAction>[],
  });

  final double? maturityScore;
  final String tier;
  final String status;
  final double? scoreConfidence;
  final double? dataFreshnessHours;
  final int? measuredSignals;
  final int? expectedSignals;
  final List<String> highlights;
  final List<String> watchouts;
  final List<AtsAction> actions;

  factory AtsReadiness.fromJson(Map<String, dynamic> json) {
    return AtsReadiness(
      maturityScore: (json['maturityScore'] as num?)?.toDouble(),
      tier: json['tier'] as String? ?? json['readinessTier'] as String? ?? 'monitoring',
      status: json['status'] as String? ?? 'monitoring',
      scoreConfidence: (json['scoreConfidence'] as num?)?.toDouble(),
      dataFreshnessHours: (json['dataFreshnessHours'] as num?)?.toDouble(),
      measuredSignals: json['measuredSignals'] as int?,
      expectedSignals: json['expectedSignals'] as int?,
      highlights: (json['highlights'] as List?)?.map((e) => '$e').where((e) => e.isNotEmpty).toList(growable: false) ??
          const <String>[],
      watchouts: (json['watchouts'] as List?)?.map((e) => '$e').where((e) => e.isNotEmpty).toList(growable: false) ??
          const <String>[],
      actions: (json['actions'] as List?)
              ?.map((item) => AtsAction.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsAction>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'maturityScore': maturityScore,
      'tier': tier,
      'status': status,
      'scoreConfidence': scoreConfidence,
      'dataFreshnessHours': dataFreshnessHours,
      'measuredSignals': measuredSignals,
      'expectedSignals': expectedSignals,
      'highlights': highlights,
      'watchouts': watchouts,
      'actions': actions.map((action) => action.toJson()).toList(),
    };
  }
}

class AtsStagePerformance {
  const AtsStagePerformance({
    required this.name,
    required this.slaHours,
    required this.averageDurationHours,
    required this.advanceRate,
    required this.pendingReviews,
    required this.rejectionRate,
    required this.holdRate,
  });

  final String name;
  final double? slaHours;
  final double? averageDurationHours;
  final double advanceRate;
  final int pendingReviews;
  final double rejectionRate;
  final double holdRate;

  factory AtsStagePerformance.fromJson(Map<String, dynamic> json) {
    return AtsStagePerformance(
      name: json['name'] as String? ?? 'Stage',
      slaHours: (json['slaHours'] as num?)?.toDouble(),
      averageDurationHours: (json['averageDurationHours'] as num?)?.toDouble(),
      advanceRate: (json['advanceRate'] as num?)?.toDouble() ?? 0,
      pendingReviews: json['pendingReviews'] as int? ?? 0,
      rejectionRate: (json['rejectionRate'] as num?)?.toDouble() ?? 0,
      holdRate: (json['holdRate'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'slaHours': slaHours,
      'averageDurationHours': averageDurationHours,
      'advanceRate': advanceRate,
      'pendingReviews': pendingReviews,
      'rejectionRate': rejectionRate,
      'holdRate': holdRate,
    };
  }
}

class AtsApprovalItem {
  const AtsApprovalItem({
    required this.approverRole,
    required this.status,
    required this.waitingHours,
    this.dueAt,
    this.isOverdue = false,
  });

  final String approverRole;
  final String status;
  final double? waitingHours;
  final DateTime? dueAt;
  final bool isOverdue;

  factory AtsApprovalItem.fromJson(Map<String, dynamic> json) {
    return AtsApprovalItem(
      approverRole: json['approverRole'] as String? ?? 'Approver',
      status: json['status'] as String? ?? 'pending',
      waitingHours: (json['waitingHours'] as num?)?.toDouble(),
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
      isOverdue: json['isOverdue'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'approverRole': approverRole,
      'status': status,
      'waitingHours': waitingHours,
      'dueAt': dueAt?.toIso8601String(),
      'isOverdue': isOverdue,
    };
  }
}

class AtsApprovalQueue {
  const AtsApprovalQueue({
    required this.total,
    required this.overdue,
    required this.items,
  });

  final int total;
  final int overdue;
  final List<AtsApprovalItem> items;

  factory AtsApprovalQueue.fromJson(Map<String, dynamic> json) {
    return AtsApprovalQueue(
      total: json['total'] as int? ?? 0,
      overdue: json['overdue'] as int? ?? 0,
      items: (json['items'] as List?)
              ?.map((item) => AtsApprovalItem.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsApprovalItem>[],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'overdue': overdue,
      'items': items.map((item) => item.toJson()).toList(),
    };
  }
}

class AtsCampaignInsight {
  const AtsCampaignInsight({
    required this.channel,
    required this.applications,
    required this.hires,
    required this.conversionRate,
    required this.spend,
    this.costPerApplication,
  });

  final String channel;
  final int applications;
  final int hires;
  final double conversionRate;
  final double spend;
  final double? costPerApplication;

  factory AtsCampaignInsight.fromJson(Map<String, dynamic> json) {
    return AtsCampaignInsight(
      channel: json['channel'] as String? ?? 'Channel',
      applications: json['applications'] as int? ?? 0,
      hires: json['hires'] as int? ?? 0,
      conversionRate: (json['conversionRate'] as num?)?.toDouble() ?? 0,
      spend: (json['spend'] as num?)?.toDouble() ?? 0,
      costPerApplication: (json['costPerApplication'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'channel': channel,
      'applications': applications,
      'hires': hires,
      'conversionRate': conversionRate,
      'spend': spend,
      'costPerApplication': costPerApplication,
    };
  }
}

class AtsFunnelStage {
  const AtsFunnelStage({
    required this.label,
    required this.count,
    required this.conversionFromPrevious,
    required this.cumulativeConversion,
  });

  final String label;
  final int count;
  final double conversionFromPrevious;
  final double cumulativeConversion;

  factory AtsFunnelStage.fromJson(Map<String, dynamic> json) {
    return AtsFunnelStage(
      label: json['label'] as String? ?? json['status'] as String? ?? 'Stage',
      count: json['count'] as int? ?? 0,
      conversionFromPrevious: (json['conversionFromPrevious'] as num?)?.toDouble() ?? 0,
      cumulativeConversion: (json['cumulativeConversion'] as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'count': count,
      'conversionFromPrevious': conversionFromPrevious,
      'cumulativeConversion': cumulativeConversion,
    };
  }
}

class AtsActivitySummary {
  const AtsActivitySummary({
    required this.approvalsCompleted,
    required this.campaignsTracked,
    required this.interviewsScheduled,
  });

  final int approvalsCompleted;
  final int campaignsTracked;
  final int interviewsScheduled;

  factory AtsActivitySummary.fromJson(Map<String, dynamic> json) {
    return AtsActivitySummary(
      approvalsCompleted: json['approvalsCompleted'] as int? ?? 0,
      campaignsTracked: json['campaignsTracked'] as int? ?? 0,
      interviewsScheduled: json['interviewsScheduled'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'approvalsCompleted': approvalsCompleted,
      'campaignsTracked': campaignsTracked,
      'interviewsScheduled': interviewsScheduled,
    };
  }
}

class AtsInterviewOperations {
  const AtsInterviewOperations({
    required this.upcomingCount,
    this.averageLeadTimeHours,
    this.averageDurationMinutes,
    this.rescheduleRate,
  });

  final int upcomingCount;
  final double? averageLeadTimeHours;
  final double? averageDurationMinutes;
  final double? rescheduleRate;

  factory AtsInterviewOperations.fromJson(Map<String, dynamic> json) {
    return AtsInterviewOperations(
      upcomingCount: json['upcomingCount'] as int? ?? 0,
      averageLeadTimeHours: (json['averageLeadTimeHours'] as num?)?.toDouble(),
      averageDurationMinutes: (json['averageDurationMinutes'] as num?)?.toDouble(),
      rescheduleRate: (json['rescheduleRate'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'upcomingCount': upcomingCount,
      'averageLeadTimeHours': averageLeadTimeHours,
      'averageDurationMinutes': averageDurationMinutes,
      'rescheduleRate': rescheduleRate,
    };
  }
}

class AtsCandidateExperience {
  const AtsCandidateExperience({
    this.nps,
    this.averageScore,
    this.responseCount,
    this.followUpsPending,
  });

  final double? nps;
  final double? averageScore;
  final int? responseCount;
  final int? followUpsPending;

  factory AtsCandidateExperience.fromJson(Map<String, dynamic> json) {
    return AtsCandidateExperience(
      nps: (json['nps'] as num?)?.toDouble(),
      averageScore: (json['averageScore'] as num?)?.toDouble(),
      responseCount: json['responseCount'] as int?,
      followUpsPending: json['followUpsPending'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nps': nps,
      'averageScore': averageScore,
      'responseCount': responseCount,
      'followUpsPending': followUpsPending,
    };
  }
}

class AtsCandidateCare {
  const AtsCandidateCare({
    this.openTickets,
    this.averageResponseMinutes,
    this.escalations,
  });

  final int? openTickets;
  final double? averageResponseMinutes;
  final int? escalations;

  factory AtsCandidateCare.fromJson(Map<String, dynamic> json) {
    return AtsCandidateCare(
      openTickets: json['openTickets'] as int?,
      averageResponseMinutes: (json['averageResponseMinutes'] as num?)?.toDouble(),
      escalations: json['escalations'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'openTickets': openTickets,
      'averageResponseMinutes': averageResponseMinutes,
      'escalations': escalations,
    };
  }
}

class CompanyAtsDashboard {
  const CompanyAtsDashboard({
    required this.metrics,
    required this.readiness,
    required this.stages,
    required this.approvals,
    required this.campaigns,
    required this.funnel,
    required this.activity,
    required this.interviewOperations,
    required this.candidateExperience,
    required this.candidateCare,
  });

  final List<AtsMetric> metrics;
  final AtsReadiness readiness;
  final List<AtsStagePerformance> stages;
  final AtsApprovalQueue approvals;
  final List<AtsCampaignInsight> campaigns;
  final List<AtsFunnelStage> funnel;
  final AtsActivitySummary activity;
  final AtsInterviewOperations interviewOperations;
  final AtsCandidateExperience candidateExperience;
  final AtsCandidateCare candidateCare;

  factory CompanyAtsDashboard.fromJson(Map<String, dynamic> json) {
    return CompanyAtsDashboard(
      metrics: (json['metrics'] as List?)
              ?.map((item) => AtsMetric.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsMetric>[],
      readiness: AtsReadiness.fromJson(Map<String, dynamic>.from(json['readiness'] as Map? ?? const {})),
      stages: (json['stages'] as List?)
              ?.map((item) => AtsStagePerformance.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsStagePerformance>[],
      approvals: AtsApprovalQueue.fromJson(Map<String, dynamic>.from(json['approvals'] as Map? ?? const {})),
      campaigns: (json['campaigns'] as List?)
              ?.map((item) => AtsCampaignInsight.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsCampaignInsight>[],
      funnel: (json['funnel'] as List?)
              ?.map((item) => AtsFunnelStage.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList(growable: false) ??
          const <AtsFunnelStage>[],
      activity: AtsActivitySummary.fromJson(Map<String, dynamic>.from(json['activity'] as Map? ?? const {})),
      interviewOperations:
          AtsInterviewOperations.fromJson(Map<String, dynamic>.from(json['interviewOperations'] as Map? ?? const {})),
      candidateExperience:
          AtsCandidateExperience.fromJson(Map<String, dynamic>.from(json['candidateExperience'] as Map? ?? const {})),
      candidateCare: AtsCandidateCare.fromJson(Map<String, dynamic>.from(json['candidateCare'] as Map? ?? const {})),
    );
  }

  factory CompanyAtsDashboard.empty() {
    return CompanyAtsDashboard(
      metrics: const <AtsMetric>[],
      readiness: const AtsReadiness(
        maturityScore: null,
        tier: 'monitoring',
        status: 'monitoring',
        scoreConfidence: null,
        dataFreshnessHours: null,
        measuredSignals: null,
        expectedSignals: null,
      ),
      stages: const <AtsStagePerformance>[],
      approvals: const AtsApprovalQueue(total: 0, overdue: 0, items: <AtsApprovalItem>[]),
      campaigns: const <AtsCampaignInsight>[],
      funnel: const <AtsFunnelStage>[],
      activity: const AtsActivitySummary(
        approvalsCompleted: 0,
        campaignsTracked: 0,
        interviewsScheduled: 0,
      ),
      interviewOperations: const AtsInterviewOperations(upcomingCount: 0),
      candidateExperience: const AtsCandidateExperience(),
      candidateCare: const AtsCandidateCare(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'metrics': metrics.map((metric) => metric.toJson()).toList(),
      'readiness': readiness.toJson(),
      'stages': stages.map((stage) => stage.toJson()).toList(),
      'approvals': approvals.toJson(),
      'campaigns': campaigns.map((campaign) => campaign.toJson()).toList(),
      'funnel': funnel.map((stage) => stage.toJson()).toList(),
      'activity': activity.toJson(),
      'interviewOperations': interviewOperations.toJson(),
      'candidateExperience': candidateExperience.toJson(),
      'candidateCare': candidateCare.toJson(),
    };
  }
}
