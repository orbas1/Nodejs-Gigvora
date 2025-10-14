import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/project_gig_management_snapshot.dart';
import '../data/project_gig_management_repository.dart';

class ProjectGigManagementController
    extends StateNotifier<ResourceState<ProjectGigManagementSnapshot>> {
  ProjectGigManagementController(
    this._repository,
    this._analytics, {
    required this.userId,
  }) : super(ResourceState<ProjectGigManagementSnapshot>.loading()) {
    load();
  }

  final ProjectGigManagementRepository _repository;
  final AnalyticsService _analytics;
  final int userId;
  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchOverview(userId, forceRefresh: forceRefresh);
      state = ResourceState<ProjectGigManagementSnapshot>(
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
            'mobile_gig_management_viewed',
            context: {
              'userId': userId,
              'fromCache': result.fromCache,
              'projectCount': result.data?.projects.length,
              'orderCount': result.data?.orders.length,
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }

      if (result.error != null) {
        unawaited(
          _analytics.track(
            'mobile_gig_management_partial',
            context: {
              'userId': userId,
              'reason': '${result.error}',
              'fromCache': result.fromCache,
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      unawaited(
        _analytics.track(
          'mobile_gig_management_failed',
          context: {
            'userId': userId,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> createProject(ProjectDraft draft) async {
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Project creation is restricted for your role.');
      }
      await _repository.createProject(userId, draft);
      await _analytics.track(
        'mobile_gig_project_created',
        context: {
          'userId': userId,
          'budget': draft.budgetAllocated,
          'currency': draft.budgetCurrency,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_gig_project_failed',
          context: {
            'userId': userId,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createGigOrder(GigOrderDraft draft) async {
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Gig purchasing is restricted for your role.');
      }
      await _repository.createGigOrder(userId, draft);
      await _analytics.track(
        'mobile_gig_order_created',
        context: {
          'userId': userId,
          'vendor': draft.vendorName,
          'amount': draft.amount,
          'currency': draft.currency,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_gig_order_failed',
          context: {
            'userId': userId,
            'vendor': draft.vendorName,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createGigBlueprint(GigBlueprintDraft draft) async {
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Gig publishing is restricted for your role.');
      }
      await _repository.createGigBlueprint(userId, draft);
      await _analytics.track(
        'mobile_gig_blueprint_created',
        context: {
          'userId': userId,
          'title': draft.title,
          'price': draft.packagePrice,
          'currency': draft.currency,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_gig_blueprint_failed',
          context: {
            'userId': userId,
            'title': draft.title,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> createProjectTask(ProjectTaskDraft draft) async {
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Project task management is restricted for your role.');
      }
      await _repository.createProjectTask(draft);
      await _analytics.track(
        'mobile_project_task_created',
        context: {
          'userId': userId,
          'projectId': draft.projectId,
          'lane': draft.lane,
          'status': draft.status,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_project_task_failed',
          context: {
            'userId': userId,
            'projectId': draft.projectId,
            'action': 'create',
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> updateProjectTask(ProjectTaskRecord task, ProjectTaskMutation mutation) async {
    final payload = mutation.toJson();
    if (payload.isEmpty) {
      return;
    }
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Project task management is restricted for your role.');
      }
      await _repository.updateProjectTask(task.projectId, task.id, mutation);
      await _analytics.track(
        'mobile_project_task_updated',
        context: {
          'userId': userId,
          'projectId': task.projectId,
          'taskId': task.id,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_project_task_failed',
          context: {
            'userId': userId,
            'projectId': task.projectId,
            'taskId': task.id,
            'action': 'update',
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }

  Future<void> deleteProjectTask(ProjectTaskRecord task) async {
    try {
      if (state.data?.access.canManage == false) {
        throw StateError('Project task management is restricted for your role.');
      }
      await _repository.deleteProjectTask(task.projectId, task.id);
      await _analytics.track(
        'mobile_project_task_deleted',
        context: {
          'userId': userId,
          'projectId': task.projectId,
          'taskId': task.id,
        },
        metadata: const {'source': 'mobile_app'},
      );
      await load(forceRefresh: true);
    } catch (error) {
      unawaited(
        _analytics.track(
          'mobile_project_task_failed',
          context: {
            'userId': userId,
            'projectId': task.projectId,
            'taskId': task.id,
            'action': 'delete',
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }
}

final projectGigManagementRepositoryProvider = Provider<ProjectGigManagementRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return ProjectGigManagementRepository(apiClient, cache);
});

final projectGigManagementControllerProvider =
    StateNotifierProvider.autoDispose.family<ProjectGigManagementController,
        ResourceState<ProjectGigManagementSnapshot>, int>((ref, userId) {
  final repository = ref.watch(projectGigManagementRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return ProjectGigManagementController(
    repository,
    analytics,
    userId: userId,
  );
});
