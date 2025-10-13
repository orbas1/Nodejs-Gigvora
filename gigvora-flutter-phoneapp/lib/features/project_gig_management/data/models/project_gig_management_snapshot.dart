import 'package:collection/collection.dart';

class ProjectGigManagementSnapshot {
  const ProjectGigManagementSnapshot({
    required this.summary,
    required this.projects,
    required this.templates,
    required this.assetSummary,
    required this.board,
    required this.orders,
    required this.reminders,
    required this.vendorStats,
    required this.storytelling,
  });

  factory ProjectGigManagementSnapshot.fromJson(Map<String, dynamic> json) {
    final projectCreation = _ensureMap(json['projectCreation']);
    final purchasedGigs = _ensureMap(json['purchasedGigs']);

    return ProjectGigManagementSnapshot(
      summary: ProjectGigSummary.fromJson(_ensureMap(json['summary'])),
      projects: _mapList(projectCreation['projects'])
          .map(ProjectGigRecord.fromJson)
          .toList(growable: false),
      templates: _mapList(projectCreation['templates'])
          .map(ProjectTemplate.fromJson)
          .toList(growable: false),
      assetSummary: AssetSummary.fromJson(_ensureMap(_ensureMap(json['assets'])['summary'])),
      board: ManagementBoardSnapshot.fromJson(_ensureMap(json['managementBoard'])),
      orders: _mapList(purchasedGigs['orders'])
          .map(GigOrderInfo.fromJson)
          .toList(growable: false),
      reminders: _mapList(purchasedGigs['reminders'])
          .map(GigReminder.fromJson)
          .toList(growable: false),
      vendorStats: VendorStats.fromJson(_ensureMap(purchasedGigs['stats'])),
      storytelling: StorytellingSnapshot.fromJson(_ensureMap(json['storytelling'])),
    );
  }

  final ProjectGigSummary summary;
  final List<ProjectGigRecord> projects;
  final List<ProjectTemplate> templates;
  final AssetSummary assetSummary;
  final ManagementBoardSnapshot board;
  final List<GigOrderInfo> orders;
  final List<GigReminder> reminders;
  final VendorStats vendorStats;
  final StorytellingSnapshot storytelling;
}

class ProjectGigSummary {
  const ProjectGigSummary({
    required this.totalProjects,
    required this.activeProjects,
    required this.budgetInPlay,
    required this.gigsInDelivery,
    required this.templatesAvailable,
    required this.assetsSecured,
  });

  factory ProjectGigSummary.fromJson(Map<String, dynamic> json) {
    return ProjectGigSummary(
      totalProjects: _parseInt(json['totalProjects']) ?? 0,
      activeProjects: _parseInt(json['activeProjects']) ?? 0,
      budgetInPlay: _parseDouble(json['budgetInPlay']) ?? 0,
      gigsInDelivery: _parseInt(json['gigsInDelivery']) ?? 0,
      templatesAvailable: _parseInt(json['templatesAvailable']) ?? 0,
      assetsSecured: _parseInt(json['assetsSecured']) ?? 0,
    );
  }

  final int totalProjects;
  final int activeProjects;
  final double budgetInPlay;
  final int gigsInDelivery;
  final int templatesAvailable;
  final int assetsSecured;
}

class AssetSummary {
  const AssetSummary({
    required this.total,
    required this.restricted,
    required this.watermarkCoverage,
    required this.storageBytes,
  });

  factory AssetSummary.fromJson(Map<String, dynamic> json) {
    return AssetSummary(
      total: _parseInt(json['total']) ?? 0,
      restricted: _parseInt(json['restricted']) ?? 0,
      watermarkCoverage: _parseDouble(json['watermarkCoverage']) ?? 0,
      storageBytes: _parseDouble(json['storageBytes']) ?? 0,
    );
  }

  final int total;
  final int restricted;
  final double watermarkCoverage;
  final double storageBytes;
}

class ProjectTemplate {
  const ProjectTemplate({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.summary,
    required this.durationWeeks,
    required this.recommendedBudgetMin,
    required this.recommendedBudgetMax,
    required this.toolkit,
    required this.prompts,
    required this.isFeatured,
  });

  factory ProjectTemplate.fromJson(Map<String, dynamic> json) {
    return ProjectTemplate(
      id: _parseInt(json['id']),
      name: _string(json['name']) ?? 'Template',
      category: _string(json['category']),
      description: _string(json['description']),
      summary: _string(json['summary']),
      durationWeeks: _parseInt(json['durationWeeks']),
      recommendedBudgetMin: _parseDouble(json['recommendedBudgetMin']),
      recommendedBudgetMax: _parseDouble(json['recommendedBudgetMax']),
      toolkit: _stringList(json['toolkit']),
      prompts: _stringList(json['prompts']),
      isFeatured: json['isFeatured'] == true,
    );
  }

  final int? id;
  final String name;
  final String? category;
  final String? description;
  final String? summary;
  final int? durationWeeks;
  final double? recommendedBudgetMin;
  final double? recommendedBudgetMax;
  final List<String> toolkit;
  final List<String> prompts;
  final bool isFeatured;
}

class ProjectGigRecord {
  const ProjectGigRecord({
    required this.id,
    required this.title,
    required this.status,
    required this.workspaceStatus,
    required this.progressPercent,
    required this.riskLevel,
    required this.nextMilestone,
    required this.nextMilestoneDueAt,
    required this.budget,
    required this.collaboratorCount,
    required this.invitedCollaborators,
    required this.milestones,
    required this.updatedAt,
  });

  factory ProjectGigRecord.fromJson(Map<String, dynamic> json) {
    final workspace = _ensureMap(json['workspace']);
    final collaborators = json['collaborators'] is List
        ? (json['collaborators'] as List)
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList()
        : const <Map<String, dynamic>>[];
    final invited = collaborators.where((item) => (item['status'] ?? '').toString().toLowerCase() == 'invited').length;

    return ProjectGigRecord(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Project',
      status: _string(json['status']) ?? 'planning',
      workspaceStatus: _string(workspace['status']) ?? _string(json['status']) ?? 'planning',
      progressPercent: _parseDouble(workspace['progressPercent']) ?? 0,
      riskLevel: _string(workspace['riskLevel']) ?? 'low',
      nextMilestone: _string(workspace['nextMilestone']) ?? _string(json['nextMilestone']),
      nextMilestoneDueAt: _parseDate(workspace['nextMilestoneDueAt'] ?? json['dueDate']),
      budget: BudgetSnapshot.fromJson(_ensureMap(json['budget'])),
      collaboratorCount: collaborators.length,
      invitedCollaborators: invited,
      milestones: _mapList(json['milestones'])
          .map(ProjectMilestoneSummary.fromJson)
          .toList(growable: false),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  final int id;
  final String title;
  final String status;
  final String workspaceStatus;
  final double progressPercent;
  final String riskLevel;
  final String? nextMilestone;
  final DateTime? nextMilestoneDueAt;
  final BudgetSnapshot budget;
  final int collaboratorCount;
  final int invitedCollaborators;
  final List<ProjectMilestoneSummary> milestones;
  final DateTime? updatedAt;
}

class BudgetSnapshot {
  const BudgetSnapshot({
    required this.currency,
    required this.allocated,
    required this.spent,
    required this.remaining,
    required this.burnRatePercent,
  });

  factory BudgetSnapshot.fromJson(Map<String, dynamic> json) {
    return BudgetSnapshot(
      currency: _string(json['currency']) ?? 'USD',
      allocated: _parseDouble(json['allocated']) ?? 0,
      spent: _parseDouble(json['spent']) ?? 0,
      remaining: _parseDouble(json['remaining']) ?? 0,
      burnRatePercent: _parseDouble(json['burnRatePercent']) ?? 0,
    );
  }

  final String currency;
  final double allocated;
  final double spent;
  final double remaining;
  final double burnRatePercent;
}

class ProjectMilestoneSummary {
  const ProjectMilestoneSummary({
    required this.id,
    required this.title,
    required this.status,
    required this.dueDate,
  });

  factory ProjectMilestoneSummary.fromJson(Map<String, dynamic> json) {
    return ProjectMilestoneSummary(
      id: _parseInt(json['id']),
      title: _string(json['title']) ?? 'Milestone',
      status: _string(json['status']) ?? 'planned',
      dueDate: _parseDate(json['dueDate']),
    );
  }

  final int? id;
  final String title;
  final String status;
  final DateTime? dueDate;
}

class ManagementBoardSnapshot {
  const ManagementBoardSnapshot({
    required this.metrics,
    required this.lanes,
    required this.retrospectives,
    required this.integrations,
  });

  factory ManagementBoardSnapshot.fromJson(Map<String, dynamic> json) {
    return ManagementBoardSnapshot(
      metrics: BoardMetrics.fromJson(_ensureMap(json['metrics'])),
      lanes: _mapList(json['lanes']).map(BoardLane.fromJson).toList(growable: false),
      retrospectives: _mapList(json['retrospectives'])
          .map(BoardRetrospective.fromJson)
          .toList(growable: false),
      integrations: _mapList(json['integrations'])
          .map(BoardIntegrationSummary.fromJson)
          .toList(growable: false),
    );
  }

  final BoardMetrics metrics;
  final List<BoardLane> lanes;
  final List<BoardRetrospective> retrospectives;
  final List<BoardIntegrationSummary> integrations;
}

class BoardMetrics {
  const BoardMetrics({
    required this.averageProgress,
    required this.atRisk,
    required this.completed,
    required this.activeProjects,
  });

  factory BoardMetrics.fromJson(Map<String, dynamic> json) {
    return BoardMetrics(
      averageProgress: _parseDouble(json['averageProgress']) ?? 0,
      atRisk: _parseInt(json['atRisk']) ?? 0,
      completed: _parseInt(json['completed']) ?? 0,
      activeProjects: _parseInt(json['activeProjects']) ?? 0,
    );
  }

  final double averageProgress;
  final int atRisk;
  final int completed;
  final int activeProjects;
}

class BoardLane {
  const BoardLane({
    required this.status,
    required this.label,
    required this.projects,
  });

  factory BoardLane.fromJson(Map<String, dynamic> json) {
    return BoardLane(
      status: _string(json['status']) ?? 'unknown',
      label: _string(json['label']) ?? (_string(json['status']) ?? 'Lane'),
      projects: _mapList(json['projects'])
          .map(BoardLaneProject.fromJson)
          .toList(growable: false),
    );
  }

  final String status;
  final String label;
  final List<BoardLaneProject> projects;
}

class BoardLaneProject {
  const BoardLaneProject({
    required this.id,
    required this.title,
    required this.progress,
    required this.riskLevel,
    required this.dueAt,
  });

  factory BoardLaneProject.fromJson(Map<String, dynamic> json) {
    return BoardLaneProject(
      id: _parseInt(json['id']),
      title: _string(json['title']) ?? 'Project',
      progress: _parseDouble(json['progress']) ?? 0,
      riskLevel: _string(json['riskLevel']) ?? 'low',
      dueAt: _parseDate(json['dueAt']),
    );
  }

  final int? id;
  final String title;
  final double progress;
  final String riskLevel;
  final DateTime? dueAt;
}

class BoardRetrospective {
  const BoardRetrospective({
    required this.id,
    required this.projectId,
    required this.projectTitle,
    required this.summary,
    required this.generatedAt,
  });

  factory BoardRetrospective.fromJson(Map<String, dynamic> json) {
    return BoardRetrospective(
      id: _parseInt(json['id']),
      projectId: _parseInt(json['projectId']),
      projectTitle: _string(json['projectTitle']),
      summary: _string(json['summary']) ?? _string(json['insights']),
      generatedAt: _parseDate(json['generatedAt']),
    );
  }

  final int? id;
  final int? projectId;
  final String? projectTitle;
  final String? summary;
  final DateTime? generatedAt;
}

class BoardIntegrationSummary {
  const BoardIntegrationSummary({
    required this.status,
    required this.integrations,
  });

  factory BoardIntegrationSummary.fromJson(Map<String, dynamic> json) {
    return BoardIntegrationSummary(
      status: _string(json['status']) ?? 'planning',
      integrations: _stringList(json['integrations']),
    );
  }

  final String status;
  final List<String> integrations;
}

class GigOrderInfo {
  const GigOrderInfo({
    required this.id,
    required this.orderNumber,
    required this.vendorName,
    required this.serviceName,
    required this.status,
    required this.progressPercent,
    required this.amount,
    required this.currency,
    required this.dueAt,
    required this.requirements,
    required this.revisions,
    required this.scorecard,
    required this.metadata,
  });

  factory GigOrderInfo.fromJson(Map<String, dynamic> json) {
    return GigOrderInfo(
      id: _parseInt(json['id']) ?? 0,
      orderNumber: _string(json['orderNumber']) ?? 'ORD-${_parseInt(json['id']) ?? 0}',
      vendorName: _string(json['vendorName']) ?? 'Vendor',
      serviceName: _string(json['serviceName']) ?? 'Service',
      status: _string(json['status']) ?? 'requirements',
      progressPercent: _parseDouble(json['progressPercent']) ?? 0,
      amount: _parseDouble(json['amount']) ?? 0,
      currency: _string(json['currency']) ?? 'USD',
      dueAt: _parseDate(json['dueAt']),
      requirements: _mapList(json['requirements'])
          .map(GigRequirementSummary.fromJson)
          .toList(growable: false),
      revisions: _mapList(json['revisions'])
          .map(GigRevisionSummary.fromJson)
          .toList(growable: false),
      scorecard: json['scorecard'] is Map
          ? GigVendorScorecard.fromJson(
              Map<String, dynamic>.from(json['scorecard'] as Map),
            )
          : null,
      metadata: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : const <String, dynamic>{},
    );
  }

  final int id;
  final String orderNumber;
  final String vendorName;
  final String serviceName;
  final String status;
  final double progressPercent;
  final double amount;
  final String currency;
  final DateTime? dueAt;
  final List<GigRequirementSummary> requirements;
  final List<GigRevisionSummary> revisions;
  final GigVendorScorecard? scorecard;
  final Map<String, dynamic> metadata;
}

class GigRequirementSummary {
  const GigRequirementSummary({
    required this.id,
    required this.title,
    required this.status,
    required this.dueAt,
  });

  factory GigRequirementSummary.fromJson(Map<String, dynamic> json) {
    return GigRequirementSummary(
      id: _parseInt(json['id']),
      title: _string(json['title']) ?? 'Requirement',
      status: _string(json['status']) ?? 'pending',
      dueAt: _parseDate(json['dueAt']),
    );
  }

  final int? id;
  final String title;
  final String status;
  final DateTime? dueAt;
}

class GigRevisionSummary {
  const GigRevisionSummary({
    required this.id,
    required this.roundNumber,
    required this.status,
    required this.requestedAt,
    required this.submittedAt,
    required this.approvedAt,
  });

  factory GigRevisionSummary.fromJson(Map<String, dynamic> json) {
    return GigRevisionSummary(
      id: _parseInt(json['id']),
      roundNumber: _parseInt(json['roundNumber']),
      status: _string(json['status']) ?? 'requested',
      requestedAt: _parseDate(json['requestedAt']),
      submittedAt: _parseDate(json['submittedAt']),
      approvedAt: _parseDate(json['approvedAt']),
    );
  }

  final int? id;
  final int? roundNumber;
  final String status;
  final DateTime? requestedAt;
  final DateTime? submittedAt;
  final DateTime? approvedAt;
}

class GigVendorScorecard {
  const GigVendorScorecard({
    required this.overallScore,
    required this.qualityScore,
    required this.communicationScore,
    required this.reliabilityScore,
    required this.notes,
  });

  factory GigVendorScorecard.fromJson(Map<String, dynamic> json) {
    return GigVendorScorecard(
      overallScore: _parseDouble(json['overallScore']),
      qualityScore: _parseDouble(json['qualityScore']),
      communicationScore: _parseDouble(json['communicationScore']),
      reliabilityScore: _parseDouble(json['reliabilityScore']),
      notes: _string(json['notes']),
    );
  }

  final double? overallScore;
  final double? qualityScore;
  final double? communicationScore;
  final double? reliabilityScore;
  final String? notes;
}

class VendorStats {
  const VendorStats({
    required this.totalOrders,
    required this.active,
    required this.completed,
    required this.averageProgress,
    required this.averageScores,
  });

  factory VendorStats.fromJson(Map<String, dynamic> json) {
    final averages = _ensureMap(json['averages']);
    return VendorStats(
      totalOrders: _parseInt(json['totalOrders']) ?? 0,
      active: _parseInt(json['active']) ?? 0,
      completed: _parseInt(json['completed']) ?? 0,
      averageProgress: _parseDouble(json['averageProgress']) ?? 0,
      averageScores: VendorAverageScores(
        overall: _parseDouble(averages['overall']),
        quality: _parseDouble(averages['quality']),
        communication: _parseDouble(averages['communication']),
        reliability: _parseDouble(averages['reliability']),
      ),
    );
  }

  final int totalOrders;
  final int active;
  final int completed;
  final double averageProgress;
  final VendorAverageScores averageScores;
}

class VendorAverageScores {
  const VendorAverageScores({
    required this.overall,
    required this.quality,
    required this.communication,
    required this.reliability,
  });

  final double? overall;
  final double? quality;
  final double? communication;
  final double? reliability;
}

class GigReminder {
  const GigReminder({
    required this.orderId,
    required this.orderNumber,
    required this.type,
    required this.title,
    required this.dueAt,
    required this.overdue,
    required this.status,
  });

  factory GigReminder.fromJson(Map<String, dynamic> json) {
    return GigReminder(
      orderId: _parseInt(json['orderId']),
      orderNumber: _string(json['orderNumber']),
      type: _string(json['type']) ?? 'reminder',
      title: _string(json['title']) ?? _string(json['type']) ?? 'Reminder',
      dueAt: _parseDate(json['dueAt']),
      overdue: json['overdue'] == true,
      status: _string(json['status']),
    );
  }

  final int? orderId;
  final String? orderNumber;
  final String type;
  final String title;
  final DateTime? dueAt;
  final bool overdue;
  final String? status;
}

class StorytellingSnapshot {
  const StorytellingSnapshot({
    required this.achievements,
    required this.quickExports,
    required this.prompts,
  });

  factory StorytellingSnapshot.fromJson(Map<String, dynamic> json) {
    return StorytellingSnapshot(
      achievements: _mapList(json['achievements'])
          .map(StoryAchievement.fromJson)
          .toList(growable: false),
      quickExports: StoryQuickExports.fromJson(_ensureMap(json['quickExports'])),
      prompts: _stringList(json['prompts']),
    );
  }

  final List<StoryAchievement> achievements;
  final StoryQuickExports quickExports;
  final List<String> prompts;
}

class StoryAchievement {
  const StoryAchievement({
    required this.type,
    required this.title,
    required this.bullet,
  });

  factory StoryAchievement.fromJson(Map<String, dynamic> json) {
    return StoryAchievement(
      type: _string(json['type']) ?? 'achievement',
      title: _string(json['title']) ?? 'Achievement',
      bullet: _string(json['bullet']) ?? '',
    );
  }

  final String type;
  final String title;
  final String bullet;
}

class StoryQuickExports {
  const StoryQuickExports({
    required this.resume,
    required this.linkedin,
    required this.coverLetter,
  });

  factory StoryQuickExports.fromJson(Map<String, dynamic> json) {
    return StoryQuickExports(
      resume: _stringList(json['resume']),
      linkedin: _stringList(json['linkedin']),
      coverLetter: _stringList(json['coverLetter']),
    );
  }

  final List<String> resume;
  final List<String> linkedin;
  final List<String> coverLetter;
}

class ProjectDraft {
  const ProjectDraft({
    required this.title,
    required this.description,
    required this.budgetCurrency,
    required this.budgetAllocated,
    this.dueDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'budgetCurrency': budgetCurrency,
      'budgetAllocated': budgetAllocated,
      if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
      'workspace': {
        'status': 'planning',
        'progressPercent': 5,
        'nextMilestone': 'Kickoff workshop',
        'nextMilestoneDueAt': dueDate?.toIso8601String(),
      },
      'milestones': [
        {
          'title': 'Kickoff workshop',
          'ordinal': 1,
          'status': 'planned',
          'dueDate': dueDate?.toIso8601String(),
        },
        {
          'title': 'Delivery sprint',
          'ordinal': 2,
          'status': 'planned',
          'dueDate': dueDate?.toIso8601String(),
        },
      ],
      'collaborators': const [],
      'integrations': const [
        {'provider': 'notion'},
      ],
    };
  }

  final String title;
  final String description;
  final String budgetCurrency;
  final double budgetAllocated;
  final DateTime? dueDate;
}

class GigOrderDraft {
  const GigOrderDraft({
    required this.vendorName,
    required this.serviceName,
    required this.amount,
    required this.currency,
    this.dueAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'vendorName': vendorName,
      'serviceName': serviceName,
      'amount': amount,
      'currency': currency,
      if (dueAt != null) 'dueAt': dueAt!.toIso8601String(),
      'requirements': [
        {
          'title': 'Provide baseline materials',
          'dueAt': dueAt?.toIso8601String(),
        },
      ],
    };
  }

  final String vendorName;
  final String serviceName;
  final double amount;
  final String currency;
  final DateTime? dueAt;
}

class GigBlueprintDraft {
  const GigBlueprintDraft({
    required this.title,
    required this.description,
    required this.packageName,
    required this.packagePrice,
    required this.currency,
    required this.deliveryDays,
    required this.revisionLimit,
    required this.leadTimeDays,
    required this.timezone,
    this.category,
    this.tagline,
    this.packageDescription,
    this.highlights,
  });

  Map<String, dynamic> toJson(int ownerId) {
    return {
      'ownerId': ownerId,
      'title': title,
      'tagline': tagline,
      'description': description,
      if (category != null && category!.isNotEmpty) 'category': category,
      'status': 'draft',
      'visibility': 'private',
      'packages': [
        {
          'name': packageName,
          'priceAmount': packagePrice,
          'priceCurrency': currency,
          'deliveryDays': deliveryDays,
          'revisionLimit': revisionLimit,
          if (packageDescription != null && packageDescription!.isNotEmpty)
            'description': packageDescription,
          if (highlights != null && highlights!.isNotEmpty)
            'highlights': highlights!,
        },
      ],
      'addOns': const [],
      'availability': {
        'timezone': timezone,
        'leadTimeDays': leadTimeDays,
        'slots': const [],
      },
    };
  }

  final String title;
  final String description;
  final String? tagline;
  final String? category;
  final String packageName;
  final double packagePrice;
  final String currency;
  final int deliveryDays;
  final int revisionLimit;
  final int leadTimeDays;
  final String timezone;
  final String? packageDescription;
  final List<String>? highlights;
}

Map<String, dynamic> _ensureMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  return <String, dynamic>{};
}

List<Map<String, dynamic>> _mapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

String? _string(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is String) {
    return value;
  }
  return value.toString();
}

int? _parseInt(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value);
  }
  return null;
}

double? _parseDouble(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value);
  }
  return null;
}

DateTime? _parseDate(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is DateTime) {
    return value;
  }
  if (value is int) {
    // assume milliseconds since epoch when value is large, otherwise seconds
    if (value > 1000000000000) {
      return DateTime.fromMillisecondsSinceEpoch(value, isUtc: true).toLocal();
    }
    if (value > 1000000000) {
      return DateTime.fromMillisecondsSinceEpoch(value * 1000, isUtc: true).toLocal();
    }
    return DateTime.fromMillisecondsSinceEpoch(value, isUtc: true).toLocal();
  }
  if (value is String) {
    if (value.isEmpty) {
      return null;
    }
    final parsed = DateTime.tryParse(value);
    if (parsed != null) {
      return parsed.toLocal();
    }
  }
  return null;
}

List<String> _stringList(dynamic value) {
  if (value is List) {
    return value
        .map((item) => _string(item))
        .whereNotNull()
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
  if (value is String) {
    if (value.trim().isEmpty) {
      return const <String>[];
    }
    return value
        .split(RegExp(r'[\n\r]+'))
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
  return const <String>[];
}
