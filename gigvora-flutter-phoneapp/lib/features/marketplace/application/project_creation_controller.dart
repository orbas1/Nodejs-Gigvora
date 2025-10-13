import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/models/project_creation_request.dart';
import '../data/project_repository.dart';

class ProjectCreationState {
  const ProjectCreationState({
    this.submitting = false,
    this.success = false,
    this.error,
    this.response,
  });

  final bool submitting;
  final bool success;
  final String? error;
  final Map<String, dynamic>? response;
}

class ProjectCreationController extends StateNotifier<ProjectCreationState> {
  ProjectCreationController(this._repository, this._analytics)
      : super(const ProjectCreationState());

  final ProjectRepository _repository;
  final AnalyticsService _analytics;

  Future<void> submit(ProjectCreationRequest request) async {
    state = const ProjectCreationState(submitting: true);
    try {
      final result = await _repository.createProject(request);
      state = ProjectCreationState(success: true, response: result);
      await _analytics.track(
        'mobile_project_created',
        context: {
          'status': request.status,
          'autoAssignEnabled': request.autoAssignEnabled,
          'queueLimit': request.limit,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } on ApiException catch (error) {
      state = ProjectCreationState(error: error.message);
      await _analytics.track(
        'mobile_project_create_failed',
        context: {
          'status': request.status,
          'autoAssignEnabled': request.autoAssignEnabled,
          'reason': error.message,
        },
        metadata: const {'source': 'mobile_app'},
      );
    } catch (error) {
      state = ProjectCreationState(error: 'Unable to create project. Please try again.');
      await _analytics.track(
        'mobile_project_create_failed',
        context: {
          'status': request.status,
          'autoAssignEnabled': request.autoAssignEnabled,
          'reason': '$error',
        },
        metadata: const {'source': 'mobile_app'},
      );
    }
  }

  void reset() {
    state = const ProjectCreationState();
  }
}

final projectRepositoryProvider = Provider<ProjectRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProjectRepository(apiClient);
});

final projectCreationControllerProvider =
    StateNotifierProvider<ProjectCreationController, ProjectCreationState>((ref) {
  final repository = ref.watch(projectRepositoryProvider);
  final analytics = ref.watch(analyticsServiceProvider);
  return ProjectCreationController(repository, analytics);
});
