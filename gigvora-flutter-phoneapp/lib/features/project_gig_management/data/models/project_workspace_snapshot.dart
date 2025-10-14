import 'package:collection/collection.dart';

class ProjectWorkspaceSnapshot {
  const ProjectWorkspaceSnapshot({
    required this.projectId,
    required this.projectTitle,
    required this.workspace,
    required this.metrics,
    this.status,
    this.brief,
    this.whiteboards = const <ProjectWorkspaceWhiteboard>[],
    this.files = const <ProjectWorkspaceFile>[],
    this.conversations = const <ProjectWorkspaceConversation>[],
    this.approvals = const <ProjectWorkspaceApproval>[],
  });

  factory ProjectWorkspaceSnapshot.fromJson(Map<String, dynamic> json) {
    final project = _ensureMap(json['project']);
    final workspaceJson = _ensureMap(json['workspace']);
    final metricsJson = _ensureMap(json['metrics']);

    return ProjectWorkspaceSnapshot(
      projectId: _parseInt(project['id']) ?? _parseInt(json['projectId']) ?? 0,
      projectTitle: _string(project['title']) ?? 'Project workspace',
      workspace: ProjectWorkspaceCore.fromJson(workspaceJson),
      metrics: ProjectWorkspaceMetrics.fromJson(metricsJson, workspaceJson),
      status: _string(workspaceJson['status']) ?? _string(json['status']) ?? 'planning',
      brief: json['brief'] is Map<String, dynamic>
          ? ProjectWorkspaceBrief.fromJson(Map<String, dynamic>.from(json['brief'] as Map))
          : null,
      whiteboards: _mapList(json['whiteboards'])
          .map(ProjectWorkspaceWhiteboard.fromJson)
          .toList(growable: false),
      files: _mapList(json['files']).map(ProjectWorkspaceFile.fromJson).toList(growable: false),
      conversations: _mapList(json['conversations'])
          .map(ProjectWorkspaceConversation.fromJson)
          .toList(growable: false),
      approvals: _mapList(json['approvals']).map(ProjectWorkspaceApproval.fromJson).toList(growable: false),
    );
  }

  final int projectId;
  final String projectTitle;
  final ProjectWorkspaceCore workspace;
  final ProjectWorkspaceMetrics metrics;
  final String? status;
  final ProjectWorkspaceBrief? brief;
  final List<ProjectWorkspaceWhiteboard> whiteboards;
  final List<ProjectWorkspaceFile> files;
  final List<ProjectWorkspaceConversation> conversations;
  final List<ProjectWorkspaceApproval> approvals;
}

class ProjectWorkspaceCore {
  const ProjectWorkspaceCore({
    required this.progressPercent,
    this.healthScore,
    this.velocityScore,
    this.riskLevel,
    this.clientSatisfaction,
    this.automationCoverage,
    this.billingStatus,
    this.nextMilestone,
    this.nextMilestoneDueAt,
    this.lastActivityAt,
  });

  factory ProjectWorkspaceCore.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceCore(
      progressPercent: _parseDouble(json['progressPercent']) ?? 0,
      healthScore: _parseDouble(json['healthScore']),
      velocityScore: _parseDouble(json['velocityScore']),
      riskLevel: _string(json['riskLevel']),
      clientSatisfaction: _parseDouble(json['clientSatisfaction']),
      automationCoverage: _parseDouble(json['automationCoverage']),
      billingStatus: _string(json['billingStatus']),
      nextMilestone: _string(json['nextMilestone']),
      nextMilestoneDueAt: _parseDate(json['nextMilestoneDueAt']),
      lastActivityAt: _parseDate(json['lastActivityAt']),
    );
  }

  final double progressPercent;
  final double? healthScore;
  final double? velocityScore;
  final String? riskLevel;
  final double? clientSatisfaction;
  final double? automationCoverage;
  final String? billingStatus;
  final String? nextMilestone;
  final DateTime? nextMilestoneDueAt;
  final DateTime? lastActivityAt;
}

class ProjectWorkspaceMetrics {
  const ProjectWorkspaceMetrics({
    required this.progressPercent,
    this.healthScore,
    this.velocityScore,
    this.riskLevel,
    this.clientSatisfaction,
    this.automationCoverage,
    this.pendingApprovals = 0,
    this.overdueApprovals = 0,
    this.unreadMessages = 0,
    this.totalAssets = 0,
    this.totalAssetsSizeBytes,
    this.automationRuns,
    this.activeStreams,
    this.deliverablesInProgress,
    this.teamUtilization,
  });

  factory ProjectWorkspaceMetrics.fromJson(
    Map<String, dynamic> json,
    Map<String, dynamic> workspaceJson,
  ) {
    final snapshot = _ensureMap(workspaceJson['metricsSnapshot']);
    return ProjectWorkspaceMetrics(
      progressPercent: _parseDouble(json['progressPercent']) ?? _parseDouble(workspaceJson['progressPercent']) ?? 0,
      healthScore: _parseDouble(json['healthScore']) ?? _parseDouble(workspaceJson['healthScore']),
      velocityScore: _parseDouble(json['velocityScore']) ?? _parseDouble(workspaceJson['velocityScore']),
      riskLevel: _string(json['riskLevel']) ?? _string(workspaceJson['riskLevel']),
      clientSatisfaction: _parseDouble(json['clientSatisfaction']) ?? _parseDouble(workspaceJson['clientSatisfaction']),
      automationCoverage: _parseDouble(json['automationCoverage']) ?? _parseDouble(workspaceJson['automationCoverage']),
      pendingApprovals: _parseInt(json['pendingApprovals']) ?? 0,
      overdueApprovals: _parseInt(json['overdueApprovals']) ?? 0,
      unreadMessages: _parseInt(json['unreadMessages']) ?? 0,
      totalAssets: _parseInt(json['totalAssets']) ?? 0,
      totalAssetsSizeBytes: _parseDouble(json['totalAssetsSizeBytes']),
      automationRuns: _parseInt(json['automationRuns'] ?? snapshot['automationRuns']),
      activeStreams: _parseInt(json['activeStreams'] ?? snapshot['activeStreams']),
      deliverablesInProgress: _parseInt(json['deliverablesInProgress'] ?? snapshot['deliverablesInProgress']),
      teamUtilization: _parseDouble(json['teamUtilization'] ?? snapshot['teamUtilization']),
    );
  }

  final double progressPercent;
  final double? healthScore;
  final double? velocityScore;
  final String? riskLevel;
  final double? clientSatisfaction;
  final double? automationCoverage;
  final int pendingApprovals;
  final int overdueApprovals;
  final int unreadMessages;
  final int totalAssets;
  final double? totalAssetsSizeBytes;
  final int? automationRuns;
  final int? activeStreams;
  final int? deliverablesInProgress;
  final double? teamUtilization;
}

class ProjectWorkspaceBrief {
  const ProjectWorkspaceBrief({
    required this.title,
    this.summary,
    this.objectives = const <String>[],
    this.deliverables = const <String>[],
    this.successMetrics = const <String>[],
    this.clientStakeholders = const <String>[],
    this.updatedAt,
  });

  factory ProjectWorkspaceBrief.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceBrief(
      title: _string(json['title']) ?? 'Workspace brief',
      summary: _string(json['summary']),
      objectives: _stringList(json['objectives']),
      deliverables: _stringList(json['deliverables']),
      successMetrics: _stringList(json['successMetrics']),
      clientStakeholders: _stringList(json['clientStakeholders']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  final String title;
  final String? summary;
  final List<String> objectives;
  final List<String> deliverables;
  final List<String> successMetrics;
  final List<String> clientStakeholders;
  final DateTime? updatedAt;
}

class ProjectWorkspaceWhiteboard {
  const ProjectWorkspaceWhiteboard({
    required this.id,
    required this.title,
    this.status,
    this.ownerName,
    this.activeCollaborators = const <String>[],
    this.tags = const <String>[],
    this.lastEditedAt,
  });

  factory ProjectWorkspaceWhiteboard.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceWhiteboard(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Workspace board',
      status: _string(json['status']),
      ownerName: _string(json['ownerName']),
      activeCollaborators: _stringList(json['activeCollaborators']),
      tags: _stringList(json['tags']),
      lastEditedAt: _parseDate(json['lastEditedAt'] ?? json['updatedAt']),
    );
  }

  final int id;
  final String title;
  final String? status;
  final String? ownerName;
  final List<String> activeCollaborators;
  final List<String> tags;
  final DateTime? lastEditedAt;
}

class ProjectWorkspaceConversation {
  const ProjectWorkspaceConversation({
    required this.id,
    required this.topic,
    this.channelType,
    this.priority,
    this.unreadCount = 0,
    this.lastMessagePreview,
    this.lastMessageAt,
    this.lastReadAt,
    this.externalLink,
    this.participants = const <String>[],
  });

  factory ProjectWorkspaceConversation.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceConversation(
      id: _parseInt(json['id']) ?? 0,
      topic: _string(json['topic']) ?? 'Workspace conversation',
      channelType: _string(json['channelType']),
      priority: _string(json['priority']),
      unreadCount: _parseInt(json['unreadCount']) ?? 0,
      lastMessagePreview: _string(json['lastMessagePreview']),
      lastMessageAt: _parseDate(json['lastMessageAt']),
      lastReadAt: _parseDate(json['lastReadAt']),
      externalLink: _string(json['externalLink']),
      participants: _stringList(json['participants']),
    );
  }

  final int id;
  final String topic;
  final String? channelType;
  final String? priority;
  final int unreadCount;
  final String? lastMessagePreview;
  final DateTime? lastMessageAt;
  final DateTime? lastReadAt;
  final String? externalLink;
  final List<String> participants;
}

class ProjectWorkspaceApproval {
  const ProjectWorkspaceApproval({
    required this.id,
    required this.title,
    this.stage,
    this.status,
    this.ownerName,
    this.approverEmail,
    this.dueAt,
    this.submittedAt,
    this.decidedAt,
    this.decisionNotes,
  });

  factory ProjectWorkspaceApproval.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceApproval(
      id: _parseInt(json['id']) ?? 0,
      title: _string(json['title']) ?? 'Approval',
      stage: _string(json['stage']),
      status: _string(json['status']),
      ownerName: _string(json['ownerName']),
      approverEmail: _string(json['approverEmail']),
      dueAt: _parseDate(json['dueAt']),
      submittedAt: _parseDate(json['submittedAt']),
      decidedAt: _parseDate(json['decidedAt']),
      decisionNotes: _string(json['decisionNotes']),
    );
  }

  final int id;
  final String title;
  final String? stage;
  final String? status;
  final String? ownerName;
  final String? approverEmail;
  final DateTime? dueAt;
  final DateTime? submittedAt;
  final DateTime? decidedAt;
  final String? decisionNotes;
}

class ProjectWorkspaceFile {
  const ProjectWorkspaceFile({
    required this.id,
    required this.name,
    this.category,
    this.fileType,
    this.storageProvider,
    this.storagePath,
    this.version,
    this.sizeBytes,
    this.tags = const <String>[],
    this.permissions,
    this.watermarkSettings,
    this.uploadedAt,
    this.updatedAt,
  });

  factory ProjectWorkspaceFile.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceFile(
      id: _parseInt(json['id']) ?? 0,
      name: _string(json['name']) ?? 'Workspace asset',
      category: _string(json['category']),
      fileType: _string(json['fileType']),
      storageProvider: _string(json['storageProvider']),
      storagePath: _string(json['storagePath']),
      version: _string(json['version']),
      sizeBytes: _parseDouble(json['sizeBytes']),
      tags: _stringList(json['tags']),
      permissions: json['permissions'] is Map<String, dynamic>
          ? ProjectWorkspaceFilePermissions.fromJson(Map<String, dynamic>.from(json['permissions'] as Map))
          : null,
      watermarkSettings: json['watermarkSettings'] is Map<String, dynamic>
          ? ProjectWorkspaceWatermarkSettings.fromJson(Map<String, dynamic>.from(json['watermarkSettings'] as Map))
          : null,
      uploadedAt: _parseDate(json['uploadedAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  final int id;
  final String name;
  final String? category;
  final String? fileType;
  final String? storageProvider;
  final String? storagePath;
  final String? version;
  final double? sizeBytes;
  final List<String> tags;
  final ProjectWorkspaceFilePermissions? permissions;
  final ProjectWorkspaceWatermarkSettings? watermarkSettings;
  final DateTime? uploadedAt;
  final DateTime? updatedAt;
}

class ProjectWorkspaceFilePermissions {
  const ProjectWorkspaceFilePermissions({
    this.visibility,
    this.allowedRoles = const <String>[],
    this.allowDownload,
    this.shareableLink,
  });

  factory ProjectWorkspaceFilePermissions.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceFilePermissions(
      visibility: _string(json['visibility']),
      allowedRoles: _stringList(json['allowedRoles']),
      allowDownload: json['allowDownload'] == true,
      shareableLink: json['shareableLink'] == true,
    );
  }

  final String? visibility;
  final List<String> allowedRoles;
  final bool? allowDownload;
  final bool? shareableLink;
}

class ProjectWorkspaceWatermarkSettings {
  const ProjectWorkspaceWatermarkSettings({
    this.enabled,
    this.pattern,
    this.label,
    this.appliedAt,
  });

  factory ProjectWorkspaceWatermarkSettings.fromJson(Map<String, dynamic> json) {
    return ProjectWorkspaceWatermarkSettings(
      enabled: json['enabled'] == true,
      pattern: _string(json['pattern']),
      label: _string(json['label']),
      appliedAt: _parseDate(json['appliedAt']),
    );
  }

  final bool? enabled;
  final String? pattern;
  final String? label;
  final DateTime? appliedAt;
}

List<Map<String, dynamic>> _mapList(dynamic input) {
  if (input is List) {
    return input
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }
  return const <Map<String, dynamic>>[];
}

Map<String, dynamic> _ensureMap(dynamic input) {
  if (input is Map) {
    return Map<String, dynamic>.from(input as Map);
  }
  return const <String, dynamic>{};
}

String? _string(dynamic value) {
  if (value == null) return null;
  final resolved = value.toString().trim();
  return resolved.isEmpty ? null : resolved;
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  return double.tryParse('$value');
}

int? _parseInt(dynamic value) {
  if (value == null) return null;
  return int.tryParse('$value');
}

DateTime? _parseDate(dynamic value) {
  if (value == null || (value is String && value.trim().isEmpty)) {
    return null;
  }
  if (value is DateTime) {
    return value;
  }
  return DateTime.tryParse('$value');
}

List<String> _stringList(dynamic value) {
  if (value is List) {
    return value.map(_string).whereNotNull().toList(growable: false);
  }
  if (value is String) {
    return value
        .split(RegExp(r'[\n,]'))
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }
  return const <String>[];
}
