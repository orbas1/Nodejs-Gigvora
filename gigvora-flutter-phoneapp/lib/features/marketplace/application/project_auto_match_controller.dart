import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gigvora_foundation/gigvora_foundation.dart';

import '../../../core/providers.dart';
import '../data/project_auto_match_repository.dart';

const Map<String, double> kDefaultAutoMatchWeights = <String, double>{
  'recency': 24,
  'rating': 18,
  'completionRecency': 16,
  'completionQuality': 20,
  'earningsBalance': 12,
  'inclusion': 10,
};

class ProjectAutoMatchConfig {
  const ProjectAutoMatchConfig({
    this.limit = 6,
    this.expiresInMinutes = 240,
    this.projectValue,
    this.fairnessMaxAssignments = 3,
    this.ensureNewcomer = true,
  });

  final int limit;
  final int expiresInMinutes;
  final double? projectValue;
  final int fairnessMaxAssignments;
  final bool ensureNewcomer;

  ProjectAutoMatchConfig copyWith({
    int? limit,
    int? expiresInMinutes,
    double? projectValue,
    bool projectValueNull = false,
    int? fairnessMaxAssignments,
    bool? ensureNewcomer,
  }) {
    return ProjectAutoMatchConfig(
      limit: limit ?? this.limit,
      expiresInMinutes: expiresInMinutes ?? this.expiresInMinutes,
      projectValue: projectValueNull ? null : projectValue ?? this.projectValue,
      fairnessMaxAssignments: fairnessMaxAssignments ?? this.fairnessMaxAssignments,
      ensureNewcomer: ensureNewcomer ?? this.ensureNewcomer,
    );
  }
}

class ProjectAutoMatchState {
  const ProjectAutoMatchState({
    this.loading = false,
    this.snapshot,
    this.error,
    this.feedback,
    Map<String, double>? weights,
    ProjectAutoMatchConfig? config,
  })  : weights = weights ?? kDefaultAutoMatchWeights,
        config = config ?? const ProjectAutoMatchConfig();

  final bool loading;
  final ProjectAutoMatchSnapshot? snapshot;
  final String? error;
  final String? feedback;
  final Map<String, double> weights;
  final ProjectAutoMatchConfig config;

  ProjectAutoMatchState copyWith({
    bool? loading,
    ProjectAutoMatchSnapshot? snapshot,
    bool snapshotNull = false,
    String? error,
    bool errorNull = false,
    String? feedback,
    bool feedbackNull = false,
    Map<String, double>? weights,
    ProjectAutoMatchConfig? config,
  }) {
    return ProjectAutoMatchState(
      loading: loading ?? this.loading,
      snapshot: snapshotNull ? null : snapshot ?? this.snapshot,
      error: errorNull ? null : error ?? this.error,
      feedback: feedbackNull ? null : feedback ?? this.feedback,
      weights: weights ?? this.weights,
      config: config ?? this.config,
    );
  }
}

class ProjectAutoMatchController extends StateNotifier<ProjectAutoMatchState> {
  ProjectAutoMatchController(this._repository)
      : super(const ProjectAutoMatchState(loading: true));

  final ProjectAutoMatchRepository _repository;

  Future<void> load(int projectId) async {
    state = state.copyWith(loading: true, errorNull: true, feedbackNull: true);
    try {
      final snapshot = await _repository.fetchSnapshot(projectId);
      state = state.copyWith(
        loading: false,
        snapshot: snapshot,
        errorNull: true,
      );
    } on ApiException catch (error) {
      state = state.copyWith(
        loading: false,
        error: error.message,
      );
    } catch (error) {
      state = state.copyWith(
        loading: false,
        error: '$error',
      );
    }
  }

  Future<void> refresh(int projectId) async {
    try {
      final snapshot = await _repository.fetchSnapshot(projectId);
      state = state.copyWith(
        snapshot: snapshot,
        errorNull: true,
      );
    } catch (error) {
      state = state.copyWith(error: '$error');
    }
  }

  void updateLimit(int value) {
    state = state.copyWith(config: state.config.copyWith(limit: value));
  }

  void updateExpires(int value) {
    state = state.copyWith(config: state.config.copyWith(expiresInMinutes: value));
  }

  void updateProjectValue(double? value) {
    state = state.copyWith(
      config: state.config.copyWith(projectValue: value, projectValueNull: value == null),
    );
  }

  void updateFairnessCap(int value) {
    state = state.copyWith(config: state.config.copyWith(fairnessMaxAssignments: value));
  }

  void toggleEnsureNewcomer(bool value) {
    state = state.copyWith(config: state.config.copyWith(ensureNewcomer: value));
  }

  void updateWeight(String key, double value) {
    final next = Map<String, double>.from(state.weights);
    next[key] = value;
    state = state.copyWith(weights: next);
  }

  Map<String, double> _normalizeWeights() {
    final total = state.weights.values.fold<double>(0, (sum, value) => sum + value);
    if (total <= 0) {
      return Map<String, double>.fromEntries(
        state.weights.entries.map((entry) => MapEntry(entry.key, 1 / state.weights.length)),
      );
    }
    return state.weights.map((key, value) => MapEntry(key, value / total));
  }

  Future<void> regenerate(int projectId) async {
    state = state.copyWith(loading: true, feedbackNull: true);
    try {
      await _repository.regenerateQueue(
        projectId,
        ProjectAutoMatchCommand(
          limit: state.config.limit,
          expiresInMinutes: state.config.expiresInMinutes,
          projectValue: state.config.projectValue,
          ensureNewcomer: state.config.ensureNewcomer,
          maxAssignments: state.config.fairnessMaxAssignments,
          weights: _normalizeWeights(),
        ),
      );
      final snapshot = await _repository.fetchSnapshot(projectId);
      state = state.copyWith(
        loading: false,
        snapshot: snapshot,
        feedback: 'Queue regenerated successfully.',
      );
    } on ApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: '$error');
    }
  }
}

final projectAutoMatchRepositoryProvider = Provider<ProjectAutoMatchRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProjectAutoMatchRepository(apiClient);
});

final projectAutoMatchControllerProvider =
    StateNotifierProvider.autoDispose.family<ProjectAutoMatchController, ProjectAutoMatchState, int>((ref, projectId) {
  final repository = ref.watch(projectAutoMatchRepositoryProvider);
  final controller = ProjectAutoMatchController(repository);
  controller.load(projectId);
  return controller;
});
