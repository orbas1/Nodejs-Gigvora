import 'dart:async';

import 'package:gigvora_foundation/gigvora_foundation.dart';

import 'models/work_management_overview.dart';
import 'work_management_sample.dart';

class WorkManagementRepository {
  WorkManagementRepository(this._apiClient, this._cache);

  final ApiClient _apiClient;
  final OfflineCache _cache;

  static const _ttl = Duration(minutes: 2);

  String _cacheKey(int projectId) => 'work_management:project:$projectId';

  Future<RepositoryResult<WorkManagementOverview>> fetchOverview(
    int projectId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = _cacheKey(projectId);
    CacheEntry<WorkManagementOverview>? cached;
    if (!forceRefresh) {
      try {
        cached = _cache.read<WorkManagementOverview>(cacheKey, (raw) {
          if (raw is Map<String, dynamic>) {
            return WorkManagementOverview.fromJson(raw);
          }
          if (raw is Map) {
            return WorkManagementOverview.fromJson(Map<String, dynamic>.from(raw as Map));
          }
          return WorkManagementOverview.empty();
        });
      } catch (_) {
        cached = null;
      }
      if (cached != null) {
        return RepositoryResult(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
        );
      }
    }

    try {
      final response = await _apiClient.get('/projects/$projectId/work-management');
      if (response is! Map<String, dynamic>) {
        throw const FormatException('Unexpected payload when fetching work management overview');
      }
      final overview = WorkManagementOverview.fromJson(response);
      unawaited(_cache.write(cacheKey, overview.toJson(), ttl: _ttl));
      return RepositoryResult(
        data: overview,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
    } catch (error) {
      if (cached != null) {
        return RepositoryResult(
          data: cached.value,
          fromCache: true,
          lastUpdated: cached.storedAt,
          error: error,
        );
      }

      final fallback = WorkManagementOverview.fromJson(workManagementSample);
      unawaited(_cache.write(cacheKey, fallback.toJson(), ttl: _ttl));
      return RepositoryResult(
        data: fallback,
        fromCache: true,
        lastUpdated: DateTime.now(),
        error: error,
      );
    }
  }

  Future<void> createSprint(int projectId, WorkSprintDraft draft) {
    return _apiClient.post(
      '/projects/$projectId/work-management/sprints',
      body: draft.toJson(),
    );
  }

  Future<void> createTask(int projectId, WorkTaskDraft draft) {
    if (draft.sprintId != null) {
      return _apiClient.post(
        '/projects/$projectId/work-management/sprints/${draft.sprintId}/tasks',
        body: draft.toJson(),
      );
    }
    return _apiClient.post(
      '/projects/$projectId/work-management/tasks',
      body: draft.toJson(),
    );
  }

  Future<void> logTime(int projectId, int taskId, WorkTimeEntryDraft draft) {
    return _apiClient.post(
      '/projects/$projectId/work-management/tasks/$taskId/time-entries',
      body: draft.toJson(),
    );
  }

  Future<void> createRisk(int projectId, WorkRiskDraft draft) {
    return _apiClient.post(
      '/projects/$projectId/work-management/risks',
      body: draft.toJson(),
    );
  }

  Future<void> createChangeRequest(int projectId, WorkChangeRequestDraft draft) {
    return _apiClient.post(
      '/projects/$projectId/work-management/change-requests',
      body: draft.toJson(),
    );
  }

  Future<void> approveChangeRequest(int projectId, int changeRequestId, {Map<String, dynamic>? payload}) {
    final body = payload == null || payload.isEmpty
        ? const {
            'status': 'approved',
            'approvalMetadata': {'source': 'mobile_app'},
          }
        : payload;
    return _apiClient.patch(
      '/projects/$projectId/work-management/change-requests/$changeRequestId/approve',
      body: body,
    );
  }
}

class WorkSprintDraft {
  WorkSprintDraft({
    required this.name,
    this.goal,
    this.startDate,
    this.endDate,
    this.velocityTarget,
  });

  final String name;
  final String? goal;
  final DateTime? startDate;
  final DateTime? endDate;
  final double? velocityTarget;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (goal != null && goal!.trim().isNotEmpty) 'goal': goal,
        if (startDate != null) 'startDate': startDate!.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        if (velocityTarget != null) 'velocityTarget': velocityTarget,
      };
}

class WorkTaskDraft {
  WorkTaskDraft({
    required this.title,
    this.sprintId,
    this.status = 'backlog',
    this.priority = 'medium',
    this.storyPoints,
    this.dueDate,
    this.assigneeId,
    this.metadata,
  });

  final String title;
  final int? sprintId;
  final String status;
  final String priority;
  final double? storyPoints;
  final DateTime? dueDate;
  final int? assigneeId;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> toJson() => {
        'title': title,
        if (sprintId != null) 'sprintId': sprintId,
        'status': status,
        'priority': priority,
        if (storyPoints != null) 'storyPoints': storyPoints,
        if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
        if (assigneeId != null) 'assigneeId': assigneeId,
        if (metadata != null && metadata!.isNotEmpty) 'metadata': metadata,
      };
}

class WorkTimeEntryDraft {
  WorkTimeEntryDraft({
    required this.userId,
    this.minutesSpent,
    this.billable = true,
    this.hourlyRate,
    this.notes,
  });

  final int userId;
  final int? minutesSpent;
  final bool billable;
  final double? hourlyRate;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'userId': userId,
        if (minutesSpent != null) 'minutesSpent': minutesSpent,
        'billable': billable,
        if (hourlyRate != null) 'hourlyRate': hourlyRate,
        if (notes != null && notes!.trim().isNotEmpty) 'notes': notes,
      };
}

class WorkRiskDraft {
  WorkRiskDraft({
    required this.title,
    this.sprintId,
    this.taskId,
    this.impact = 'medium',
    this.probability,
    this.severityScore,
    this.status = 'open',
    this.mitigationPlan,
    this.ownerId,
  });

  final String title;
  final int? sprintId;
  final int? taskId;
  final String impact;
  final double? probability;
  final double? severityScore;
  final String status;
  final String? mitigationPlan;
  final int? ownerId;

  Map<String, dynamic> toJson() => {
        'title': title,
        if (sprintId != null) 'sprintId': sprintId,
        if (taskId != null) 'taskId': taskId,
        'impact': impact,
        if (probability != null) 'probability': probability,
        if (severityScore != null) 'severityScore': severityScore,
        'status': status,
        if (mitigationPlan != null && mitigationPlan!.trim().isNotEmpty) 'mitigationPlan': mitigationPlan,
        if (ownerId != null) 'ownerId': ownerId,
      };
}

class WorkChangeRequestDraft {
  WorkChangeRequestDraft({
    required this.title,
    this.sprintId,
    this.description,
    this.requestedById,
    this.eSignDocumentUrl,
    this.changeImpact,
  });

  final String title;
  final int? sprintId;
  final String? description;
  final int? requestedById;
  final String? eSignDocumentUrl;
  final Map<String, dynamic>? changeImpact;

  Map<String, dynamic> toJson() => {
        'title': title,
        if (sprintId != null) 'sprintId': sprintId,
        if (description != null && description!.trim().isNotEmpty) 'description': description,
        if (requestedById != null) 'requestedById': requestedById,
        if (eSignDocumentUrl != null && eSignDocumentUrl!.trim().isNotEmpty) 'eSignDocumentUrl': eSignDocumentUrl,
        if (changeImpact != null && changeImpact!.isNotEmpty) 'changeImpact': changeImpact,
      };
}
