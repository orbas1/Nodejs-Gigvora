class WorkManagementOverview {
  const WorkManagementOverview({
    required this.project,
    required this.summary,
    required this.sprints,
    required this.backlog,
    required this.backlogSummary,
    required this.risks,
    required this.changeRequests,
  });

  factory WorkManagementOverview.empty() {
    return const WorkManagementOverview(
      project: null,
      summary: WorkSummary.empty(),
      sprints: <WorkSprint>[],
      backlog: <WorkTask>[],
      backlogSummary: WorkBacklogSummary.empty(),
      risks: <WorkRisk>[],
      changeRequests: <WorkChangeRequest>[],
    );
  }

  factory WorkManagementOverview.fromJson(Map<String, dynamic> json) {
    return WorkManagementOverview(
      project: json['project'] is Map
          ? WorkProjectSummary.fromJson(Map<String, dynamic>.from(json['project'] as Map))
          : null,
      summary: WorkSummary.fromJson(_ensureMap(json['summary'])),
      sprints: _mapList(json['sprints']).map(WorkSprint.fromJson).toList(growable: false),
      backlog: _mapList(json['backlog']).map(WorkTask.fromJson).toList(growable: false),
      backlogSummary: WorkBacklogSummary.fromJson(_ensureMap(json['backlogSummary'])),
      risks: _mapList(json['risks']).map(WorkRisk.fromJson).toList(growable: false),
      changeRequests: _mapList(json['changeRequests']).map(WorkChangeRequest.fromJson).toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        if (project != null) 'project': project!.toJson(),
        'summary': summary.toJson(),
        'sprints': sprints.map((sprint) => sprint.toJson()).toList(growable: false),
        'backlog': backlog.map((task) => task.toJson()).toList(growable: false),
        'backlogSummary': backlogSummary.toJson(),
        'risks': risks.map((risk) => risk.toJson()).toList(growable: false),
        'changeRequests': changeRequests.map((change) => change.toJson()).toList(growable: false),
      };

  final WorkProjectSummary? project;
  final WorkSummary summary;
  final List<WorkSprint> sprints;
  final List<WorkTask> backlog;
  final WorkBacklogSummary backlogSummary;
  final List<WorkRisk> risks;
  final List<WorkChangeRequest> changeRequests;

  bool get isEmpty =>
      sprints.isEmpty && backlog.isEmpty && risks.isEmpty && changeRequests.isEmpty && backlogSummary.totalTasks == 0;
}

class WorkProjectSummary {
  const WorkProjectSummary({
    required this.id,
    required this.name,
    required this.status,
    this.clientName,
    this.updatedAt,
  });

  factory WorkProjectSummary.fromJson(Map<String, dynamic> json) {
    return WorkProjectSummary(
      id: _parseInt(json['id']),
      name: _string(json['name']) ?? 'Project',
      status: _string(json['status']) ?? 'active',
      clientName: _string(json['clientName']) ?? _string(json['client']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        'name': name,
        'status': status,
        if (clientName != null) 'clientName': clientName,
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };

  final int? id;
  final String name;
  final String status;
  final String? clientName;
  final DateTime? updatedAt;
}

class WorkSummary {
  const WorkSummary({
    required this.totalSprints,
    required this.activeSprints,
    required this.openRisks,
    required this.pendingApprovals,
    required this.backlogReady,
  });

  factory WorkSummary.empty() {
    return const WorkSummary(
      totalSprints: 0,
      activeSprints: 0,
      openRisks: 0,
      pendingApprovals: 0,
      backlogReady: 0,
    );
  }

  factory WorkSummary.fromJson(Map<String, dynamic> json) {
    return WorkSummary(
      totalSprints: _parseInt(json['totalSprints']) ?? 0,
      activeSprints: _parseInt(json['activeSprints']) ?? 0,
      openRisks: _parseInt(json['openRisks']) ?? 0,
      pendingApprovals: _parseInt(json['pendingApprovals']) ?? 0,
      backlogReady: _parseInt(json['backlogReady']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'totalSprints': totalSprints,
        'activeSprints': activeSprints,
        'openRisks': openRisks,
        'pendingApprovals': pendingApprovals,
        'backlogReady': backlogReady,
      };

  final int totalSprints;
  final int activeSprints;
  final int openRisks;
  final int pendingApprovals;
  final int backlogReady;
}

class WorkBacklogSummary {
  const WorkBacklogSummary({
    required this.totalTasks,
    required this.readyForPlanning,
    required this.totalStoryPoints,
  });

  factory WorkBacklogSummary.empty() {
    return const WorkBacklogSummary(totalTasks: 0, readyForPlanning: 0, totalStoryPoints: 0);
  }

  factory WorkBacklogSummary.fromJson(Map<String, dynamic> json) {
    return WorkBacklogSummary(
      totalTasks: _parseInt(json['totalTasks']) ?? 0,
      readyForPlanning: _parseInt(json['readyForPlanning']) ?? 0,
      totalStoryPoints: _parseDouble(json['totalStoryPoints']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'totalTasks': totalTasks,
        'readyForPlanning': readyForPlanning,
        'totalStoryPoints': totalStoryPoints,
      };

  final int totalTasks;
  final int readyForPlanning;
  final double totalStoryPoints;
}

class WorkSprint {
  const WorkSprint({
    required this.id,
    required this.name,
    required this.status,
    this.goal,
    this.startDate,
    this.endDate,
    required this.metrics,
    required this.tasks,
    required this.risks,
    required this.changeRequests,
    this.burndown,
    this.timeline,
    this.kanban,
  });

  factory WorkSprint.fromJson(Map<String, dynamic> json) {
    return WorkSprint(
      id: _parseInt(json['id']) ?? 0,
      name: _string(json['name']) ?? 'Sprint',
      status: _string(json['status']) ?? 'planning',
      goal: _string(json['goal']),
      startDate: _parseDate(json['startDate']),
      endDate: _parseDate(json['endDate']),
      metrics: WorkSprintMetrics.fromJson(_ensureMap(json['metrics'])),
      tasks: _mapList(json['tasks']).map(WorkTask.fromJson).toList(growable: false),
      risks: _mapList(json['risks']).map(WorkRisk.fromJson).toList(growable: false),
      changeRequests:
          _mapList(json['changeRequests']).map(WorkChangeRequest.fromJson).toList(growable: false),
      burndown: json['burndown'] is Map
          ? WorkBurndown.fromJson(Map<String, dynamic>.from(json['burndown'] as Map))
          : null,
      timeline: _mapList(json['timeline']).map(WorkTimelineEntry.fromJson).toList(growable: false),
      kanban: json['kanban'] is Map
          ? Map<String, dynamic>.from(json['kanban'] as Map)
          : const <String, dynamic>{},
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'status': status,
        if (goal != null) 'goal': goal,
        if (startDate != null) 'startDate': startDate!.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        'metrics': metrics.toJson(),
        'tasks': tasks.map((task) => task.toJson()).toList(growable: false),
        'risks': risks.map((risk) => risk.toJson()).toList(growable: false),
        'changeRequests': changeRequests.map((change) => change.toJson()).toList(growable: false),
        if (burndown != null) 'burndown': burndown!.toJson(),
        'timeline': timeline.map((entry) => entry.toJson()).toList(growable: false),
        if (kanban != null) 'kanban': kanban,
      };

  final int id;
  final String name;
  final String status;
  final String? goal;
  final DateTime? startDate;
  final DateTime? endDate;
  final WorkSprintMetrics metrics;
  final List<WorkTask> tasks;
  final List<WorkRisk> risks;
  final List<WorkChangeRequest> changeRequests;
  final WorkBurndown? burndown;
  final List<WorkTimelineEntry> timeline;
  final Map<String, dynamic>? kanban;
}

class WorkSprintMetrics {
  const WorkSprintMetrics({
    required this.totalTasks,
    required this.completedTasks,
    required this.totalStoryPoints,
    required this.completedStoryPoints,
    required this.openRisks,
    required this.pendingChangeRequests,
    required this.timeSummary,
  });

  factory WorkSprintMetrics.fromJson(Map<String, dynamic> json) {
    return WorkSprintMetrics(
      totalTasks: _parseInt(json['totalTasks']) ?? 0,
      completedTasks: _parseInt(json['completedTasks']) ?? 0,
      totalStoryPoints: _parseDouble(json['totalStoryPoints']) ?? 0,
      completedStoryPoints: _parseDouble(json['completedStoryPoints']) ?? 0,
      openRisks: _parseInt(json['openRisks']) ?? 0,
      pendingChangeRequests: _parseInt(json['pendingChangeRequests']) ?? 0,
      timeSummary: WorkTimeSummary.fromJson(_ensureMap(json['timeSummary'])),
    );
  }

  Map<String, dynamic> toJson() => {
        'totalTasks': totalTasks,
        'completedTasks': completedTasks,
        'totalStoryPoints': totalStoryPoints,
        'completedStoryPoints': completedStoryPoints,
        'openRisks': openRisks,
        'pendingChangeRequests': pendingChangeRequests,
        'timeSummary': timeSummary.toJson(),
      };

  final int totalTasks;
  final int completedTasks;
  final double totalStoryPoints;
  final double completedStoryPoints;
  final int openRisks;
  final int pendingChangeRequests;
  final WorkTimeSummary timeSummary;
}

class WorkTimeSummary {
  const WorkTimeSummary({
    required this.totalMinutes,
    required this.billableMinutes,
    required this.nonBillableMinutes,
    required this.totalHours,
    required this.billableHours,
    required this.nonBillableHours,
    required this.billableAmount,
  });

  factory WorkTimeSummary.fromJson(Map<String, dynamic> json) {
    return WorkTimeSummary(
      totalMinutes: _parseDouble(json['totalMinutes']) ?? 0,
      billableMinutes: _parseDouble(json['billableMinutes']) ?? 0,
      nonBillableMinutes: _parseDouble(json['nonBillableMinutes']) ?? 0,
      totalHours: _parseDouble(json['totalHours']) ?? 0,
      billableHours: _parseDouble(json['billableHours']) ?? 0,
      nonBillableHours: _parseDouble(json['nonBillableHours']) ?? 0,
      billableAmount: _parseDouble(json['billableAmount']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'totalMinutes': totalMinutes,
        'billableMinutes': billableMinutes,
        'nonBillableMinutes': nonBillableMinutes,
        'totalHours': totalHours,
        'billableHours': billableHours,
        'nonBillableHours': nonBillableHours,
        'billableAmount': billableAmount,
      };

  final double totalMinutes;
  final double billableMinutes;
  final double nonBillableMinutes;
  final double totalHours;
  final double billableHours;
  final double nonBillableHours;
  final double billableAmount;
}

class WorkTask {
  const WorkTask({
    required this.id,
    required this.title,
    required this.status,
    required this.priority,
    this.storyPoints,
    this.dueDate,
    this.assigneeId,
    this.reporterId,
    this.timeSummary,
    this.metadata,
    this.dependencies = const <WorkTaskDependency>[],
    this.dependents = const <WorkTaskDependency>[],
  });

  factory WorkTask.fromJson(Map<String, dynamic> json) {
    return WorkTask(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Task',
      status: _string(json['status']) ?? 'backlog',
      priority: _string(json['priority']) ?? 'medium',
      storyPoints: _parseDouble(json['storyPoints']),
      dueDate: _parseDate(json['dueDate']),
      assigneeId: _parseInt(json['assigneeId']),
      reporterId: _parseInt(json['reporterId']),
      timeSummary: json['timeSummary'] is Map
          ? WorkTimeSummary.fromJson(Map<String, dynamic>.from(json['timeSummary'] as Map))
          : null,
      metadata: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : const <String, dynamic>{},
      dependencies:
          _mapList(json['dependencies']).map(WorkTaskDependency.fromJson).toList(growable: false),
      dependents: _mapList(json['dependents']).map(WorkTaskDependency.fromJson).toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'status': status,
        'priority': priority,
        if (storyPoints != null) 'storyPoints': storyPoints,
        if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
        if (assigneeId != null) 'assigneeId': assigneeId,
        if (reporterId != null) 'reporterId': reporterId,
        if (timeSummary != null) 'timeSummary': timeSummary!.toJson(),
        if (metadata != null) 'metadata': metadata,
        'dependencies': dependencies.map((dep) => dep.toJson()).toList(growable: false),
        'dependents': dependents.map((dep) => dep.toJson()).toList(growable: false),
      };

  final int id;
  final String title;
  final String status;
  final String priority;
  final double? storyPoints;
  final DateTime? dueDate;
  final int? assigneeId;
  final int? reporterId;
  final WorkTimeSummary? timeSummary;
  final Map<String, dynamic>? metadata;
  final List<WorkTaskDependency> dependencies;
  final List<WorkTaskDependency> dependents;
}

class WorkTaskDependency {
  const WorkTaskDependency({
    required this.taskId,
    required this.dependsOnTaskId,
  });

  factory WorkTaskDependency.fromJson(Map<String, dynamic> json) {
    return WorkTaskDependency(
      taskId: _parseInt(json['taskId']) ?? 0,
      dependsOnTaskId: _parseInt(json['dependsOnTaskId']) ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'taskId': taskId,
        'dependsOnTaskId': dependsOnTaskId,
      };

  final int taskId;
  final int dependsOnTaskId;
}

class WorkTimelineEntry {
  const WorkTimelineEntry({
    required this.stage,
    this.startedAt,
    this.completedAt,
  });

  factory WorkTimelineEntry.fromJson(Map<String, dynamic> json) {
    return WorkTimelineEntry(
      stage: _string(json['stage']) ?? _string(json['status']) ?? 'stage',
      startedAt: _parseDate(json['startedAt'] ?? json['startDate']),
      completedAt: _parseDate(json['completedAt'] ?? json['endDate']),
    );
  }

  Map<String, dynamic> toJson() => {
        'stage': stage,
        if (startedAt != null) 'startedAt': startedAt!.toIso8601String(),
        if (completedAt != null) 'completedAt': completedAt!.toIso8601String(),
      };

  final String stage;
  final DateTime? startedAt;
  final DateTime? completedAt;
}

class WorkBurndown {
  const WorkBurndown({
    required this.totalPoints,
    required this.usesStoryPoints,
    required this.entries,
  });

  factory WorkBurndown.fromJson(Map<String, dynamic> json) {
    return WorkBurndown(
      totalPoints: _parseDouble(json['totalPoints']) ?? 0,
      usesStoryPoints: json['usesStoryPoints'] == true,
      entries: _mapList(json['entries']).map(WorkBurndownEntry.fromJson).toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() => {
        'totalPoints': totalPoints,
        'usesStoryPoints': usesStoryPoints,
        'entries': entries.map((entry) => entry.toJson()).toList(growable: false),
      };

  final double totalPoints;
  final bool usesStoryPoints;
  final List<WorkBurndownEntry> entries;
}

class WorkBurndownEntry {
  const WorkBurndownEntry({
    required this.date,
    this.remainingPoints,
    this.idealRemaining,
  });

  factory WorkBurndownEntry.fromJson(Map<String, dynamic> json) {
    return WorkBurndownEntry(
      date: _string(json['date']) ?? '',
      remainingPoints: _parseDouble(json['remainingPoints']),
      idealRemaining: _parseDouble(json['idealRemaining']),
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date,
        if (remainingPoints != null) 'remainingPoints': remainingPoints,
        if (idealRemaining != null) 'idealRemaining': idealRemaining,
      };

  final String date;
  final double? remainingPoints;
  final double? idealRemaining;
}

class WorkRisk {
  const WorkRisk({
    required this.id,
    required this.title,
    required this.status,
    this.impact,
    this.probability,
    this.severityScore,
    this.owner,
    this.sprint,
    this.task,
    this.mitigationPlan,
  });

  factory WorkRisk.fromJson(Map<String, dynamic> json) {
    return WorkRisk(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Risk',
      status: _string(json['status']) ?? 'open',
      impact: _string(json['impact']),
      probability: _parseDouble(json['probability']),
      severityScore: _parseDouble(json['severityScore']),
      owner: json['owner'] is Map
          ? WorkRiskActor.fromJson(Map<String, dynamic>.from(json['owner'] as Map))
          : null,
      sprint: json['sprint'] is Map
          ? WorkRiskSprintSummary.fromJson(Map<String, dynamic>.from(json['sprint'] as Map))
          : null,
      task: json['task'] is Map
          ? WorkRiskTaskSummary.fromJson(Map<String, dynamic>.from(json['task'] as Map))
          : null,
      mitigationPlan: _string(json['mitigationPlan']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'status': status,
        if (impact != null) 'impact': impact,
        if (probability != null) 'probability': probability,
        if (severityScore != null) 'severityScore': severityScore,
        if (owner != null) 'owner': owner!.toJson(),
        if (sprint != null) 'sprint': sprint!.toJson(),
        if (task != null) 'task': task!.toJson(),
        if (mitigationPlan != null) 'mitigationPlan': mitigationPlan,
      };

  final int id;
  final String title;
  final String status;
  final String? impact;
  final double? probability;
  final double? severityScore;
  final WorkRiskActor? owner;
  final WorkRiskSprintSummary? sprint;
  final WorkRiskTaskSummary? task;
  final String? mitigationPlan;
}

class WorkRiskActor {
  const WorkRiskActor({this.id, this.firstName, this.lastName});

  factory WorkRiskActor.fromJson(Map<String, dynamic> json) {
    return WorkRiskActor(
      id: _parseInt(json['id']),
      firstName: _string(json['firstName']),
      lastName: _string(json['lastName']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
      };

  final int? id;
  final String? firstName;
  final String? lastName;
}

class WorkRiskSprintSummary {
  const WorkRiskSprintSummary({this.id, this.name, this.status});

  factory WorkRiskSprintSummary.fromJson(Map<String, dynamic> json) {
    return WorkRiskSprintSummary(
      id: _parseInt(json['id']),
      name: _string(json['name']),
      status: _string(json['status']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (name != null) 'name': name,
        if (status != null) 'status': status,
      };

  final int? id;
  final String? name;
  final String? status;
}

class WorkRiskTaskSummary {
  const WorkRiskTaskSummary({this.id, this.title, this.status});

  factory WorkRiskTaskSummary.fromJson(Map<String, dynamic> json) {
    return WorkRiskTaskSummary(
      id: _parseInt(json['id']),
      title: _string(json['title']),
      status: _string(json['status']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id != null) 'id': id,
        if (title != null) 'title': title,
        if (status != null) 'status': status,
      };

  final int? id;
  final String? title;
  final String? status;
}

class WorkChangeRequest {
  const WorkChangeRequest({
    required this.id,
    required this.title,
    required this.status,
    this.description,
    this.sprint,
    this.requestedBy,
    this.approvedBy,
    this.eSignDocumentUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory WorkChangeRequest.fromJson(Map<String, dynamic> json) {
    return WorkChangeRequest(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Change request',
      status: _string(json['status']) ?? 'pending_approval',
      description: _string(json['description']) ?? _string(json['rationale']),
      sprint: json['sprint'] is Map
          ? WorkRiskSprintSummary.fromJson(Map<String, dynamic>.from(json['sprint'] as Map))
          : null,
      requestedBy: json['requestedBy'] is Map
          ? WorkRiskActor.fromJson(Map<String, dynamic>.from(json['requestedBy'] as Map))
          : null,
      approvedBy: json['approvedBy'] is Map
          ? WorkRiskActor.fromJson(Map<String, dynamic>.from(json['approvedBy'] as Map))
          : null,
      eSignDocumentUrl: _string(json['eSignDocumentUrl']) ?? _string(json['esignDocumentUrl']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'status': status,
        if (description != null) 'description': description,
        if (sprint != null) 'sprint': sprint!.toJson(),
        if (requestedBy != null) 'requestedBy': requestedBy!.toJson(),
        if (approvedBy != null) 'approvedBy': approvedBy!.toJson(),
        if (eSignDocumentUrl != null) 'eSignDocumentUrl': eSignDocumentUrl,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };

  final int id;
  final String title;
  final String status;
  final String? description;
  final WorkRiskSprintSummary? sprint;
  final WorkRiskActor? requestedBy;
  final WorkRiskActor? approvedBy;
  final String? eSignDocumentUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}

int? _parseInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse('$value');
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse('$value');
}

String? _string(dynamic value) {
  if (value == null) return null;
  if (value is String) {
    final trimmed = value.trim();
    return trimmed.isEmpty ? null : trimmed;
  }
  return '$value';
}

DateTime? _parseDate(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value * (value < 10000000000 ? 1000 : 1));
  }
  final parsed = DateTime.tryParse('$value');
  return parsed;
}

Map<String, dynamic> _ensureMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return Map<String, dynamic>.from(value as Map);
  }
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _mapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item as Map))
        .toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}
