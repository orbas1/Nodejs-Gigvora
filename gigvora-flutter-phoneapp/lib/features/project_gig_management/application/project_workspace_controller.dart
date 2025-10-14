import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/project_workspace_snapshot.dart';
import '../data/project_workspace_repository.dart';

class ProjectWorkspaceController
    extends StateNotifier<ResourceState<ProjectWorkspaceSnapshot>> {
  ProjectWorkspaceController(
    this._repository,
    this._analytics, {
    required this.projectId,
  }) : super(ResourceState<ProjectWorkspaceSnapshot>.loading()) {
    load();
  }

  final ProjectWorkspaceRepository _repository;
  final AnalyticsService _analytics;
  final int projectId;

  bool _viewTracked = false;

  Future<void> load({bool forceRefresh = false}) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final result = await _repository.fetchWorkspace(projectId, forceRefresh: forceRefresh);
      state = ResourceState<ProjectWorkspaceSnapshot>(
        data: result.data,
        loading: false,
        error: result.error,
        fromCache: result.fromCache,
        lastUpdated: result.lastUpdated,
      );

      if (!_viewTracked && result.data != null) {
        _viewTracked = true;
        unawaited(
          _analytics.track(
            'mobile_project_workspace_viewed',
            context: {
              'projectId': projectId,
              'fromCache': result.fromCache,
              'conversationCount': result.data?.conversations.length,
              'approvalCount': result.data?.approvals.length,
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }

      if (result.error != null) {
        unawaited(
          _analytics.track(
            'mobile_project_workspace_partial',
            context: {
              'projectId': projectId,
              'reason': '${result.error}',
            },
            metadata: const {'source': 'mobile_app'},
          ),
        );
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error);
      unawaited(
        _analytics.track(
          'mobile_project_workspace_failed',
          context: {
            'projectId': projectId,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    }
  }

  Future<void> refresh() => load(forceRefresh: true);

  Future<void> acknowledgeConversation(int conversationId) async {
    try {
      state = state.copyWith(error: null);
      final snapshot = await _repository.acknowledgeConversation(projectId, conversationId);
      state = state.copyWith(
        data: snapshot,
        loading: false,
        fromCache: false,
        lastUpdated: DateTime.now(),
      );
      unawaited(
        _analytics.track(
          'mobile_project_workspace_conversation_acknowledged',
          context: {
            'projectId': projectId,
            'conversationId': conversationId,
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
    } catch (error) {
      state = state.copyWith(error: error);
      unawaited(
        _analytics.track(
          'mobile_project_workspace_conversation_failed',
          context: {
            'projectId': projectId,
            'conversationId': conversationId,
            'reason': '$error',
          },
          metadata: const {'source': 'mobile_app'},
        ),
      );
      rethrow;
    }
  }
}

final projectWorkspaceRepositoryProvider = Provider<ProjectWorkspaceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final cache = ref.watch(offlineCacheProvider);
  return ProjectWorkspaceRepository(apiClient, cache);
});

final projectWorkspaceControllerProvider =
    StateNotifierProvider.autoDispose.family<ProjectWorkspaceController, ResourceState<ProjectWorkspaceSnapshot>, int>(
  (ref, projectId) {
    final repository = ref.watch(projectWorkspaceRepositoryProvider);
    final analytics = ref.watch(analyticsServiceProvider);
    return ProjectWorkspaceController(repository, analytics, projectId: projectId);
  },
);
