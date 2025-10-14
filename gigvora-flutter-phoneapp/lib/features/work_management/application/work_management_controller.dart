import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/work_management_overview.dart';
import '../data/work_management_repository.dart';

class WorkManagementController extends StateNotifier<ResourceState<WorkManagementOverview>> {
  WorkManagementController(
    this._repository,
    this._analytics, {
    required this.projectId,
  }) : super(ResourceState<WorkManagementOverview>.loading()) {
    load();
  }

  final WorkManagementRepository _repository;
  final AnalyticsService _analytics;
  final int projectId;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(projectId, forceRefresh: forceRefresh);
      state = ResourceState<WorkManagementOverview>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked) {
        _viewTracked = true;
        unawaited(
          _analytics.track(
            'mobile_work_management_viewed',
            context: {
              'projectId': projectId,
              'sprintCount': result.data.sprints.length,
              'backlogCount': result.data.backlog.length,
              'fromCache': result.fromCache,
            },
            metadata: const {'surface': 'mobile_app'},
          ),
        );
      }

      if (result.error != null) {
        unawaited(
          _analytics.track(
            'mobile_work_management_partial',
            context: {
              'projectId': projectId,
              'reason': '${result.error}',
              'fromCache': result.fromCache,
            },
            metadata: const {'surface': 'mobile_app'},
          ),
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      unawaited(
        _analytics.track(
          'mobile_work_management_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> createSprint(WorkSprintDraft draft) async {
    try {
      await _repository.createSprint(projectId, draft);
      await _analytics.track(
        'mobile_work_management_create_sprint',
        context: {
          'projectId': projectId,
          'hasGoal': draft.goal?.isNotEmpty == true,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_create_sprint_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createTask(WorkTaskDraft draft) async {
    try {
      await _repository.createTask(projectId, draft);
      await _analytics.track(
        'mobile_work_management_create_task',
        context: {
          'projectId': projectId,
          'sprintId': draft.sprintId,
          'priority': draft.priority,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_create_task_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> logTime(int taskId, WorkTimeEntryDraft draft) async {
    try {
      await _repository.logTime(projectId, taskId, draft);
      await _analytics.track(
        'mobile_work_management_log_time',
        context: {
          'projectId': projectId,
          'taskId': taskId,
          'billable': draft.billable,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_log_time_failed',
          context: {
            'projectId': projectId,
            'taskId': taskId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createRisk(WorkRiskDraft draft) async {
    try {
      await _repository.createRisk(projectId, draft);
      await _analytics.track(
        'mobile_work_management_create_risk',
        context: {
          'projectId': projectId,
          'impact': draft.impact,
          'status': draft.status,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_create_risk_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createChangeRequest(WorkChangeRequestDraft draft) async {
    try {
      await _repository.createChangeRequest(projectId, draft);
      await _analytics.track(
        'mobile_work_management_create_change_request',
        context: {
          'projectId': projectId,
          'sprintId': draft.sprintId,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_create_change_request_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> approveChangeRequest(int changeRequestId, {Map<String, dynamic>? payload}) async {
    try {
      await _repository.approveChangeRequest(projectId, changeRequestId, payload: payload);
      await _analytics.track(
        'mobile_work_management_approve_change_request',
        context: {
          'projectId': projectId,
          'changeRequestId': changeRequestId,
        },
        metadata: const {'surface': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_work_management_approve_change_request_failed',
          context: {
            'projectId': projectId,
            'changeRequestId': changeRequestId,
            'reason': '$error',
          },
          metadata: const {'surface': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }
}

final workManagementRepositoryProvider = Provider<WorkManagementRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return WorkManagementRepository(apiClient, cache);
});

final workManagementControllerProvider = StateNotifierProvider.autoDispose
    .family<WorkManagementController, ResourceState<WorkManagementOverview>, int>((ref, projectId) {
  final repository = ref.watch(workManagementRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return WorkManagementController(
    repository,
    analytics,
    projectId: projectId,
  );
});
